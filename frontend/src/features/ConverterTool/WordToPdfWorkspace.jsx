import React, { useState, useRef, useEffect } from 'react';
import {
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
  Sparkles
} from 'lucide-react';
import { FileUploadZone } from '../../components/FileUploadZone';
import { apiClient } from '../../utils/apiClient';
import { loadPdfDocument, renderPageToCanvas } from '../../utils/pdfWorker';

export function WordToPdfWorkspace({ onBack }) {
  const [file, setFile] = useState(null);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState(null);
  const [pdfBlob, setPdfBlob] = useState(null);
  
  // Interactive Preview State
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.15);
  const [renderingPage, setRenderingPage] = useState(false);
  
  const canvasRef = useRef(null);

  const handleFileSelected = async (selectedFiles) => {
    const uploaded = Array.isArray(selectedFiles) ? selectedFiles[0] : selectedFiles;
    if (!uploaded) return;
    
    setFile(uploaded);
    setError(null);
    setPdfBlob(null);
    setPdfDoc(null);
    setConverting(true);

    try {
      const formData = new FormData();
      formData.append('file', uploaded);

      const res = await apiClient.postFormData('/convert-word-to-pdf', formData);
      const blob = new Blob([res], { type: 'application/pdf' });
      setPdfBlob(blob);

      const arrayBuffer = await blob.arrayBuffer();
      const doc = await loadPdfDocument(arrayBuffer);
      setPdfDoc(doc);
      setNumPages(doc.numPages);
      setCurrentPage(1);
    } catch (err) {
      setError(err.message || 'Failed to convert Word document to PDF.');
    } finally {
      setConverting(false);
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
        console.error('Error rendering converted Word page:', err);
      } finally {
        if (isMounted) setRenderingPage(false);
      }
    }

    render();
    return () => { isMounted = false; };
  }, [pdfDoc, currentPage, scale]);

  const handleDownload = () => {
    if (pdfBlob && file) {
      const outName = file.name.replace(/\.[^/.]+$/, '') + '.pdf';
      apiClient.downloadBlob(pdfBlob, outName);
    }
  };

  if (!file) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-6">
        <button onClick={onBack} className="mb-6 flex items-center text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </button>
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-10">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-50 border border-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <FileText className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Word to PDF Converter</h2>
            <p className="text-slate-600 mt-2 max-w-lg mx-auto">
              Convert Word (.doc, .docx) documents into professional PDFs with live visual previewing before downloading.
            </p>
          </div>
          <FileUploadZone 
            onFilesSelected={handleFileSelected} 
            multiple={false} 
            accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            title="Upload Word Document (.doc / .docx)"
            subtitle="Drag & drop your Word file or click to browse"
          />
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
              <FileText className="w-5 h-5 text-blue-600" />
              Word to PDF &mdash; {file.name}
            </h1>
            <p className="text-xs text-slate-500">Converted successfully &bull; Live document preview active</p>
          </div>
        </div>
        <button onClick={() => { setFile(null); setPdfBlob(null); setPdfDoc(null); }} className="px-4 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
          Change File
        </button>
      </div>

      {error && <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 flex items-center gap-3"><AlertCircle className="w-5 h-5" /><span>{error}</span></div>}

      {converting ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-16 shadow-xl flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
          <h3 className="font-bold text-slate-800 text-base">Converting Word document to PDF...</h3>
          <p className="text-xs text-slate-500">Parsing paragraphs, formatting tables, and compiling layout structure.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fadeIn">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xl space-y-6">
              <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm border-b pb-4 border-slate-100">
                <CheckCircle2 className="w-5 h-5" />
                <span>Conversion Ready!</span>
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>File Name:</span>
                  <span className="font-semibold truncate max-w-[150px]">{file.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Pages:</span>
                  <span className="font-semibold">{numPages}</span>
                </div>
              </div>
              
              <button
                onClick={handleDownload}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Converted PDF</span>
              </button>

              <button
                onClick={() => { setFile(null); setPdfBlob(null); setPdfDoc(null); }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all"
              >
                Convert Another Document
              </button>
            </div>
          </div>

          <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 p-8 shadow-xl flex flex-col items-center relative">
            <div className="flex items-center justify-between w-full border-b border-slate-100 pb-4 mb-6">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                <span>Live Converted PDF Previewer</span>
              </h3>

              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button onClick={() => setScale(s => Math.max(0.6, s - 0.15))} className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-all"><ZoomOut className="w-4 h-4" /></button>
                <span className="text-xs font-bold text-slate-800 px-1">{Math.round(scale * 100)}%</span>
                <button onClick={() => setScale(s => Math.min(2.2, s + 0.15))} className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-all"><ZoomIn className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="relative border border-slate-200 rounded-2xl shadow-inner bg-slate-100 overflow-auto p-4 max-h-[600px] w-full flex justify-center">
              {renderingPage && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-10">
                  <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
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
      )}
    </div>
  );
}
