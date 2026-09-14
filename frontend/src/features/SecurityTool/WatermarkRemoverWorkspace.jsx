import React, { useState, useRef, useEffect } from 'react';
import {
  Eraser,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Eye,
  FileText
} from 'lucide-react';
import { FileUploadZone } from '../../components/FileUploadZone';
import { apiClient } from '../../utils/apiClient';
import { loadPdfDocument, renderPageToCanvas } from '../../utils/pdfWorker';

export function WatermarkRemoverWorkspace({ onBack }) {
  const [file, setFile] = useState(null);
  const [keyword, setKeyword] = useState('CONFIDENTIAL');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  
  const [unwatermarkedBlob, setUnwatermarkedBlob] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.1);
  const [renderingPage, setRenderingPage] = useState(false);
  const [isTextResult, setIsTextResult] = useState(false);
  const [textPreview, setTextPreview] = useState('');
  
  const canvasRef = useRef(null);

  const handleRemoveWatermark = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setUnwatermarkedBlob(null);
    setPdfDoc(null);
    setIsTextResult(false);
    setTextPreview('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (keyword.trim()) {
        formData.append('keyword', keyword.trim());
      }

      const res = await apiClient.postFormData('/security/remove-watermark', formData);
      const fileNameLower = (file.name || '').toLowerCase();
      const fileType = (file.type || '').toLowerCase();
      const isTextOrDocxOrImg = fileNameLower.endsWith('.xml') || fileNameLower.endsWith('.doc') || fileNameLower.endsWith('.docx') || fileNameLower.endsWith('.txt') || fileNameLower.endsWith('.png') || fileNameLower.endsWith('.jpg') || fileNameLower.endsWith('.jpeg') || fileType.includes('image/');

      if (isTextOrDocxOrImg && !fileNameLower.endsWith('.pdf')) {
        if (fileType.includes('image/') || fileNameLower.endsWith('.png') || fileNameLower.endsWith('.jpg') || fileNameLower.endsWith('.jpeg')) {
          const blob = new Blob([res], { type: file.type || 'image/png' });
          setUnwatermarkedBlob(blob);
          setIsTextResult(false);
        } else {
          const text = await new Response(res).text();
          setTextPreview(text);
          setIsTextResult(true);
          const blob = new Blob([text], { type: 'text/plain' });
          setUnwatermarkedBlob(blob);
        }
      } else {
        const blob = new Blob([res], { type: 'application/pdf' });
        setUnwatermarkedBlob(blob);

        const arrayBuffer = await blob.arrayBuffer();
        const doc = await loadPdfDocument(arrayBuffer);
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
      }
    } catch (err) {
      setError(err.message || 'Failed to remove watermark.');
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
        console.error('Error rendering page:', err);
      } finally {
        if (isMounted) setRenderingPage(false);
      }
    }

    render();
    return () => { isMounted = false; };
  }, [pdfDoc, currentPage, scale]);

  const handleDownload = () => {
    if (unwatermarkedBlob) {
      const fileNameLower = (file?.name || '').toLowerCase();
      const fileType = (file?.type || '').toLowerCase();
      const ext = fileNameLower.endsWith('.xml') ? 'xml' : (fileNameLower.endsWith('.docx') ? 'docx' : (fileNameLower.endsWith('.txt') ? 'txt' : (fileType.includes('image/') || fileNameLower.endsWith('.png') || fileNameLower.endsWith('.jpg') ? (fileNameLower.split('.').pop() || 'png') : 'pdf')));
      apiClient.downloadBlob(unwatermarkedBlob, `clean_${file.name.replace(/\.[^/.]+$/, '')}.${ext}`);
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
              <Eraser className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Universal Watermark Remover</h2>
            <p className="text-slate-600 mt-2 max-w-lg mx-auto">
              Automatically scan and remove text or image watermarks from PDF, Word (.docx), Image (PNG/JPG), and XML documents with live inspection preview.
            </p>
          </div>
          <FileUploadZone 
            onFilesSelected={(f) => setFile(Array.isArray(f) ? f[0] : f)} 
            multiple={false} 
            accept=".pdf,.xml,.doc,.docx,.txt,.png,.jpg,.jpeg,application/pdf,application/xml,application/msword,image/*"
            title="Upload PDF, Word, Image, or XML Document"
            subtitle="Supports PDF, Word, Images (PNG/JPG), XML, and Text files"
          />
        </div>
      </div>
    );
  }

  const isImageFile = (file?.type || '').includes('image/') || (file?.name || '').match(/\.(png|jpg|jpeg)$/i);

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xl">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"><ChevronLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Eraser className="w-5 h-5 text-rose-600" />
              Remove Watermark &mdash; {file.name}
            </h1>
            <p className="text-xs text-slate-500">Universal document watermark scrubber active</p>
          </div>
        </div>
        <button onClick={() => { setFile(null); setUnwatermarkedBlob(null); setPdfDoc(null); setIsTextResult(false); }} className="px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
          Change File
        </button>
      </div>

      {error && <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 flex items-center gap-3"><AlertCircle className="w-5 h-5" /><span>{error}</span></div>}

      {!unwatermarkedBlob ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 space-y-8 shadow-xl">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Watermark Keyword / Text to Remove</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g. CONFIDENTIAL, DRAFT, SAMPLE"
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
            <p className="text-xs text-slate-500">Enter the exact text string of the watermark stamp or notice you wish to redact from your document.</p>
          </div>

          <button
            onClick={handleRemoveWatermark}
            disabled={processing}
            className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-base rounded-2xl shadow-xl shadow-rose-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {processing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Eraser className="w-5 h-5" />}
            <span>Remove Watermark & Preview</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fadeIn">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xl space-y-6">
              <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm border-b pb-4 border-slate-100">
                <CheckCircle2 className="w-5 h-5" />
                <span>Watermark Removed!</span>
              </div>
              
              <button
                onClick={handleDownload}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Clean Document</span>
              </button>

              <button
                onClick={() => { setUnwatermarkedBlob(null); setPdfDoc(null); setIsTextResult(false); }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-all"
              >
                Try Another Keyword
              </button>
            </div>
          </div>

          <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 p-8 shadow-xl flex flex-col items-center relative">
            <div className="flex items-center justify-between w-full border-b border-slate-100 pb-4 mb-6">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Eye className="w-4 h-4 text-rose-600" />
                <span>Live Inspection Previewer</span>
              </h3>

              {!isTextResult && !isImageFile && (
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button onClick={() => setScale(s => Math.max(0.6, s - 0.15))} className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-all"><ZoomOut className="w-4 h-4" /></button>
                  <span className="text-xs font-bold text-slate-800 px-1">{Math.round(scale * 100)}%</span>
                  <button onClick={() => setScale(s => Math.min(2.2, s + 0.15))} className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-all"><ZoomIn className="w-4 h-4" /></button>
                </div>
              )}
            </div>

            {isTextResult ? (
              <textarea
                readOnly
                value={textPreview}
                className="w-full h-[500px] p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs text-slate-800 focus:outline-none resize-none leading-relaxed"
              />
            ) : isImageFile ? (
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200 w-full">
                <img 
                  src={URL.createObjectURL(unwatermarkedBlob)} 
                  alt="Cleaned Watermark"
                  className="max-h-[500px] object-contain rounded-xl shadow-md"
                />
                <p className="text-xs text-slate-500 mt-4">Image watermark processed and cleaned successfully.</p>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
