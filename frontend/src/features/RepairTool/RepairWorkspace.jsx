import React, { useState, useRef, useEffect } from 'react';
import {
  Wrench,
  FileText,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Eye,
  ShieldCheck
} from 'lucide-react';
import { FileUploadZone } from '../../components/FileUploadZone';
import { apiClient } from '../../utils/apiClient';
import { loadPdfDocument, renderPageToCanvas } from '../../utils/pdfWorker';

export function RepairWorkspace({ onBack }) {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [repairedBlob, setRepairedBlob] = useState(null);

  // Interactive Preview State
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.1);
  const [renderingPage, setRenderingPage] = useState(false);

  const canvasRef = useRef(null);

  const handleFileSelected = async (selectedFiles) => {
    const uploaded = Array.isArray(selectedFiles) ? selectedFiles[0] : selectedFiles;
    if (!uploaded) return;
    
    setFile(uploaded);
    setError(null);
    setSuccess(false);
    setRepairedBlob(null);
    setPdfDoc(null);

    try {
      const arrayBuffer = await uploaded.arrayBuffer();
      const doc = await loadPdfDocument(arrayBuffer.slice(0));
      setPdfDoc(doc);
      setNumPages(doc.numPages);
      setCurrentPage(1);
    } catch (err) {
      console.error('Failed to load corrupt PDF for preview:', err);
    }
  };

  useEffect(() => {
    if (!pdfDoc) return;
    let isMounted = true;
    setRenderingPage(true);

    async function render() {
      try {
        if (!isMounted || !canvasRef.current) return;
        await renderPageToCanvas(pdfDoc, currentPage, canvasRef.current, scale);
      } catch (err) {
        console.error('Error rendering repair preview page:', err);
      } finally {
        if (isMounted) setRenderingPage(false);
      }
    }

    render();
    return () => { isMounted = false; };
  }, [pdfDoc, currentPage, scale]);

  const handleRepair = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await apiClient.postFormData('/repair', formData);
      const blob = new Blob([res], { type: 'application/pdf' });
      setRepairedBlob(blob);

      // Load repaired PDF into previewer
      const arrayBuffer = await blob.arrayBuffer();
      const doc = await loadPdfDocument(arrayBuffer.slice(0));
      setPdfDoc(doc);
      setNumPages(doc.numPages);
      setCurrentPage(1);

      apiClient.downloadBlob(blob, `repaired_${file.name}`);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to repair PDF document.');
    } finally {
      setProcessing(false);
    }
  };

  if (!file) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-6">
        <button onClick={onBack} className="mb-6 flex items-center text-sm font-medium text-slate-600 hover:text-indigo-600">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </button>
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-10">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-amber-50 border border-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Wrench className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Repair Corrupted PDF</h2>
            <p className="text-slate-600 mt-2 max-w-lg mx-auto">
              Upload a corrupt or damaged PDF with live previewing. We will attempt to fix cross-reference tables and recover readable streams.
            </p>
          </div>
          <FileUploadZone onFilesSelected={handleFileSelected} multiple={false} accept=".pdf,application/pdf" title="Upload Corrupt PDF to Repair" subtitle="Select a damaged PDF document" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xl">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"><ChevronLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-amber-600" />
              Repair PDF &mdash; {file.name}
            </h1>
            <p className="text-xs text-slate-500">Deep stream recovery & cross-reference repair pipeline</p>
          </div>
        </div>
        <button onClick={() => { setFile(null); setRepairedBlob(null); setPdfDoc(null); }} className="px-4 py-2 text-xs font-semibold text-amber-600 hover:bg-amber-50 rounded-xl transition-all">
          Change File
        </button>
      </div>

      {error && <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 flex items-center gap-3"><AlertCircle className="w-5 h-5" /><span>{error}</span></div>}
      {success && <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 flex items-center gap-3"><CheckCircle2 className="w-5 h-5" /><span>PDF successfully repaired & downloaded!</span></div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-6 shadow-xl h-fit">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Recovery Actions</h3>
          
          <div className="space-y-3">
            <p className="text-xs text-slate-600 leading-relaxed">
              Our repair engine scans object streams, repairs xref table mismatches, and extracts usable page blocks.
            </p>
          </div>

          <button
            onClick={handleRepair}
            disabled={processing}
            className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-amber-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {processing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" />}
            <span>Repair PDF & Download</span>
          </button>

          {repairedBlob && (
            <button
              onClick={() => apiClient.downloadBlob(repairedBlob, `repaired_${file.name}`)}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download Repaired PDF Again</span>
            </button>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 shadow-xl flex flex-col items-center relative">
          <div className="flex items-center justify-between w-full border-b border-slate-100 pb-4 mb-6">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-600" />
              <span>Live Document Previewer</span>
            </h3>

            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button onClick={() => setScale(s => Math.max(0.6, s - 0.15))} className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-all"><ZoomOut className="w-4 h-4" /></button>
              <span className="text-xs font-bold text-slate-800 px-1">{Math.round(scale * 100)}%</span>
              <button onClick={() => setScale(s => Math.min(2.2, s + 0.15))} className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-all"><ZoomIn className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="relative border border-slate-200 rounded-2xl shadow-inner bg-slate-100 overflow-auto p-4 max-h-[500px] w-full flex justify-center">
            {renderingPage && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-10">
                <RefreshCw className="w-8 h-8 text-amber-600 animate-spin" />
              </div>
            )}
            <canvas ref={canvasRef} className="bg-white shadow-lg rounded-xl block" />
          </div>

          <div className="flex items-center space-x-4 bg-slate-50 border border-slate-200 px-6 py-2.5 rounded-2xl shadow-sm mt-6">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1} className="p-1.5 text-slate-600 disabled:opacity-30 hover:bg-slate-100 rounded-lg transition-all"><ChevronLeft className="w-5 h-5" /></button>
            <span className="text-xs font-semibold text-slate-700">Page {currentPage} of {numPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))} disabled={currentPage >= numPages} className="p-1.5 text-slate-600 disabled:opacity-30 hover:bg-slate-100 rounded-lg transition-all"><ChevronRight className="w-5 h-5" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
