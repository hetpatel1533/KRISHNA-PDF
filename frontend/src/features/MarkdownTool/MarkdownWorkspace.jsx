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
  Copy,
  Check
} from 'lucide-react';
import { FileUploadZone } from '../../components/FileUploadZone';
import { apiClient } from '../../utils/apiClient';
import { loadPdfDocument, renderPageToCanvas } from '../../utils/pdfWorker';

export function MarkdownWorkspace({ onBack }) {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [markdownText, setMarkdownText] = useState('');
  const [markdownBlob, setMarkdownBlob] = useState(null);
  const [copied, setCopied] = useState(false);

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
    setMarkdownText('');
    setMarkdownBlob(null);
    setPdfDoc(null);

    try {
      const arrayBuffer = await uploaded.arrayBuffer();
      const doc = await loadPdfDocument(arrayBuffer.slice(0));
      setPdfDoc(doc);
      setNumPages(doc.numPages);
      setCurrentPage(1);
    } catch (err) {
      console.error('Failed to load PDF for preview:', err);
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
        console.error('Error rendering markdown preview page:', err);
      } finally {
        if (isMounted) setRenderingPage(false);
      }
    }

    render();
    return () => { isMounted = false; };
  }, [pdfDoc, currentPage, scale]);

  const handleConvertToMarkdown = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await apiClient.postFormData('/convert-to-markdown', formData);
      const text = await new Response(res).text();
      setMarkdownText(text);

      const blob = new Blob([text], { type: 'text/markdown' });
      setMarkdownBlob(blob);
      apiClient.downloadBlob(blob, `${file.name.replace(/\.[^/.]+$/, '')}.md`);
    } catch (err) {
      setError(err.message || 'Failed to convert PDF to Markdown.');
    } finally {
      setProcessing(false);
    }
  };

  const copyMarkdown = () => {
    navigator.clipboard.writeText(markdownText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!file) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-6">
        <button onClick={onBack} className="mb-6 flex items-center text-sm font-medium text-slate-600 hover:text-indigo-600">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </button>
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-10">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-50 border border-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <FileText className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Convert PDF to Markdown</h2>
            <p className="text-slate-600 mt-2 max-w-lg mx-auto">
              Turn PDF into a clean .md file in seconds with live document previewing. Headings, tables, and lists stay intact.
            </p>
          </div>
          <FileUploadZone onFilesSelected={handleFileSelected} multiple={false} accept=".pdf,application/pdf" title="Upload PDF to Convert to Markdown" />
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
              PDF to Markdown &mdash; {file.name}
            </h1>
            <p className="text-xs text-slate-500">Clean structure and heading parser ready</p>
          </div>
        </div>
        <button onClick={() => { setFile(null); setMarkdownText(''); setPdfDoc(null); }} className="px-4 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
          Change File
        </button>
      </div>

      {error && <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 flex items-center gap-3"><AlertCircle className="w-5 h-5" /><span>{error}</span></div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Live PDF Previewer */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl flex flex-col items-center relative">
          <div className="flex items-center justify-between w-full border-b border-slate-100 pb-4 mb-6">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-600" />
              <span>Live PDF Document Preview</span>
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

        {/* Right Column: Conversion & Markdown Output */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Markdown Output (.md)</span>
              </h3>
              {markdownText && (
                <div className="flex items-center gap-2">
                  <button onClick={copyMarkdown} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-all">
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  {markdownBlob && (
                    <button
                      onClick={() => apiClient.downloadBlob(markdownBlob, `${file.name.replace(/\.[^/.]+$/, '')}.md`)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {markdownText ? (
              <textarea
                readOnly
                value={markdownText}
                className="w-full h-[400px] p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs text-slate-800 focus:outline-none resize-none leading-relaxed"
              />
            ) : (
              <div className="h-[400px] flex flex-col items-center justify-center text-center text-slate-400 space-y-3">
                <FileText className="w-12 h-12 text-slate-200" />
                <p className="text-sm font-medium">Click &quot;Convert to Markdown&quot; below to generate structure.</p>
              </div>
            )}
          </div>

          <button
            onClick={handleConvertToMarkdown}
            disabled={processing}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base rounded-2xl shadow-xl shadow-blue-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {processing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
            <span>Convert PDF to Markdown (.md)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
