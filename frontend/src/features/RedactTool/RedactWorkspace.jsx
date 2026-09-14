import React, { useState, useRef, useEffect } from 'react';
import {
  EyeOff,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Eye
} from 'lucide-react';
import { FileUploadZone } from '../../components/FileUploadZone';
import { apiClient } from '../../utils/apiClient';
import { loadPdfDocument, renderPageToCanvas } from '../../utils/pdfWorker';

export function RedactWorkspace({ onBack }) {
  const [file, setFile] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  
  const [redactedBlob, setRedactedBlob] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.1);
  const [renderingPage, setRenderingPage] = useState(false);
  
  const canvasRef = useRef(null);

  const handleRedact = async () => {
    if (!file) return;
    if (!keyword.trim()) {
      setError('Please enter a keyword, SSN, or confidential text string to redact.');
      return;
    }

    setProcessing(true);
    setError(null);
    setRedactedBlob(null);
    setPdfDoc(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('keyword', keyword.trim());

      const res = await apiClient.postFormData('/redact', formData);
      const blob = new Blob([res], { type: 'application/pdf' });
      setRedactedBlob(blob);

      const arrayBuffer = await blob.arrayBuffer();
      const doc = await loadPdfDocument(arrayBuffer);
      setPdfDoc(doc);
      setNumPages(doc.numPages);
      setCurrentPage(1);
    } catch (err) {
      setError(err.message || 'Failed to redact PDF.');
    } finally {
      setProcessing(false);
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
        console.error('Error rendering redacted page:', err);
      } finally {
        if (isMounted) setRenderingPage(false);
      }
    }

    render();
    return () => { isMounted = false; };
  }, [pdfDoc, currentPage, scale]);

  const handleDownload = () => {
    if (redactedBlob && file) {
      apiClient.downloadBlob(redactedBlob, `redacted_${file.name}`);
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
            <div className="w-20 h-20 bg-rose-50 border border-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <EyeOff className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Redact PDF Document</h2>
            <p className="text-slate-600 mt-2 max-w-lg mx-auto">
              Permanently remove sensitive content, confidential numbers, and private info from your PDF documents.
            </p>
          </div>
          <FileUploadZone onFilesSelected={(f) => setFile(Array.isArray(f) ? f[0] : f)} multiple={false} accept=".pdf,application/pdf" title="Upload PDF to Redact" subtitle="Permanently Black Out Sensitive Content" />
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
              <EyeOff className="w-5 h-5 text-rose-600" />
              Redact PDF &mdash; {file.name}
            </h1>
            <p className="text-xs text-slate-500">Permanent redaction & blackout engine</p>
          </div>
        </div>
        <button onClick={() => { setFile(null); setRedactedBlob(null); setPdfDoc(null); }} className="px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
          Change File
        </button>
      </div>

      {error && <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 flex items-center gap-3"><AlertCircle className="w-5 h-5" /><span>{error}</span></div>}

      {!redactedBlob ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 space-y-6 shadow-xl">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Keyword / Sensitive Text to Redact</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g. Confidential, SSN, Secret, Account Number"
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
            <p className="text-xs text-slate-500">Any occurrence of this text string will be permanently blacked out and scrubbed from the document.</p>
          </div>

          <button
            onClick={handleRedact}
            disabled={processing || !keyword.trim()}
            className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-base rounded-2xl shadow-xl shadow-rose-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {processing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <EyeOff className="w-5 h-5" />}
            <span>Apply Redaction & Preview</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fadeIn">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xl space-y-6">
              <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm border-b pb-4 border-slate-100">
                <CheckCircle2 className="w-5 h-5" />
                <span>Redaction Complete!</span>
              </div>
              
              <button
                onClick={handleDownload}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Redacted PDF</span>
              </button>

              <button
                onClick={() => { setRedactedBlob(null); setPdfDoc(null); }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-all"
              >
                Redact Another Keyword
              </button>
            </div>
          </div>

          <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 p-8 shadow-xl flex flex-col items-center relative">
            <div className="flex items-center justify-between w-full border-b border-slate-100 pb-4 mb-6">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Eye className="w-4 h-4 text-rose-600" />
                <span>Live Redacted Previewer</span>
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
                  <RefreshCw className="w-8 h-8 text-rose-600 animate-spin" />
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
