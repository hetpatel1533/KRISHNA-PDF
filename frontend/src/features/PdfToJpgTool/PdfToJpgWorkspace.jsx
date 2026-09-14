import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  FileText,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Eye
} from 'lucide-react';
import { FileUploadZone } from '../../components/FileUploadZone';
import { apiClient } from '../../utils/apiClient';
import { loadPdfDocument, renderPageThumbnail } from '../../utils/pdfWorker';

export function PdfToJpgWorkspace({ onBack }) {
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState('jpg');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // visual gallery state
  const [pages, setPages] = useState([]);
  const [loadingThumbnails, setLoadingThumbnails] = useState(false);

  useEffect(() => {
    if (!file) {
      setPages([]);
      return;
    }
    
    let isMounted = true;
    setLoadingThumbnails(true);
    
    async function loadPreviews() {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await loadPdfDocument(arrayBuffer);
        const list = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const dataUrl = await renderPageThumbnail(pdf, i, 1.2);
          list.push({ pageNum: i, dataUrl });
        }
        if (isMounted) {
          setPages(list);
        }
      } catch (err) {
        console.error('Failed to generate local image views:', err);
      } finally {
        if (isMounted) {
          setLoadingThumbnails(false);
        }
      }
    }
    
    loadPreviews();
    return () => { isMounted = false; };
  }, [file]);

  const handleConvertZip = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setSuccess(false);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('target_format', format);

      const res = await apiClient.postFormData('/convert', formData);
      apiClient.downloadBlob(res, `pdf_to_${format}_images.zip`);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to package images ZIP on backend.');
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
            <div className="w-20 h-20 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <ImageIcon className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">PDF to JPG / PNG Converter</h2>
            <p className="text-slate-600 mt-2 max-w-lg mx-auto">
              Extract high-resolution visual copies of every page directly in your browser. Previews are generated securely offline.
            </p>
          </div>
          <FileUploadZone onFilesSelected={(f) => setFile(Array.isArray(f) ? f[0] : f)} multiple={false} title="Upload PDF to Convert to Images" />
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
              <ImageIcon className="w-5 h-5 text-emerald-600" />
              PDF to Images &mdash; {file.name}
            </h1>
            <p className="text-xs text-slate-500">Generate high-resolution PNG or JPG image archives</p>
          </div>
        </div>
        <button onClick={() => { setFile(null); setPages([]); }} className="px-4 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
          Change File
        </button>
      </div>

      {error && <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 flex items-center gap-3"><AlertCircle className="w-5 h-5" /><span>{error}</span></div>}
      {success && <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 flex items-center gap-3"><CheckCircle2 className="w-5 h-5" /><span>All pages successfully packaged & downloaded!</span></div>}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-6 shadow-xl h-fit">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Image Options</h3>
          
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Output Format</label>
            <div className="grid grid-cols-2 gap-2">
              {['jpg', 'png'].map(fmt => (
                <button
                  key={fmt}
                  onClick={() => setFormat(fmt)}
                  className={`py-2 text-xs font-semibold uppercase rounded-xl border transition-all ${
                    format === fmt ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleConvertZip}
            disabled={processing}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2"
          >
            {processing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>Download ZIP Archive</span>
          </button>
        </div>

        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 p-8 shadow-xl flex flex-col">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-6">
            <Eye className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-800 text-sm">Page Images View & Direct Download</h3>
          </div>

          {loadingThumbnails ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-20">
              <RefreshCw className="w-10 h-10 animate-spin text-emerald-600" />
              <p className="text-sm font-semibold text-slate-600">Rendering high-resolution layouts...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {pages.map((p) => (
                <div key={p.pageNum} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col items-center relative group shadow-sm">
                  <div className="w-full h-44 bg-white border border-slate-200 rounded-xl flex items-center justify-center overflow-hidden">
                    <img src={p.dataUrl} alt={`Page ${p.pageNum}`} className="max-h-full object-contain pointer-events-none" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 mt-3">Page {p.pageNum}</span>
                  
                  <a
                    href={p.dataUrl}
                    download={`page_${p.pageNum}.${format}`}
                    className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 rounded-lg text-xs font-semibold text-slate-700 transition-all"
                    title="Download individual page image"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Save Image</span>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}