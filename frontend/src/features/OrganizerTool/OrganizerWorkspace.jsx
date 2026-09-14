import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  RotateCw, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Download, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  ChevronLeft 
} from 'lucide-react';
import { FileUploadZone } from '../../components/FileUploadZone';
import { apiClient } from '../../utils/apiClient';
import { loadPdfDocument, renderPageThumbnail } from '../../utils/pdfWorker';

export function OrganizerWorkspace({ onBack }) {
  const [file, setFile] = useState(null);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleFileSelected = async (selectedFiles) => {
    const uploaded = Array.isArray(selectedFiles) ? selectedFiles[0] : selectedFiles;
    if (!uploaded) return;
    setFile(uploaded);
    setLoading(true);
    setError(null);
    try {
      const buffer = await uploaded.arrayBuffer();
      const pdfDoc = await loadPdfDocument(buffer.slice(0));
      const total = pdfDoc.numPages;
      const initialPages = [];
      for (let i = 1; i <= total; i++) {
        const thumb = await renderPageThumbnail(pdfDoc, i, 0.3);
        initialPages.push({
          id: `${i}-${Math.random()}`,
          originalIndex: i - 1,
          rotation: 0,
          thumbnail: thumb
        });
      }
      setPages(initialPages);
    } catch (err) {
      setError('Failed to parse PDF pages.');
    } finally {
      setLoading(false);
    }
  };

  const rotatePage = (index) => {
    setPages(prev => prev.map((p, idx) => idx === index ? { ...p, rotation: (p.rotation + 90) % 360 } : p));
  };

  const removePage = (index) => {
    setPages(prev => prev.filter((_, idx) => idx !== index));
  };

  const movePage = (index, direction) => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= pages.length) return;
    const updated = [...pages];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    setPages(updated);
  };

  const handleExport = async () => {
    if (!file || pages.length === 0) return;
    setProcessing(true);
    setError(null);
    try {
      const operations = pages.map(p => ({
        page_index: p.originalIndex,
        rotation: p.rotation
      }));

      const formData = new FormData();
      formData.append('file', file);
      formData.append('operations', JSON.stringify(operations));

      const responseBlob = await apiClient.postFormData('/organize', formData);
      apiClient.downloadBlob(responseBlob, `organized_${file.name}`);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to organize PDF.');
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
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Layers className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Page Organizer</h2>
            <p className="text-slate-600 mt-1">Rotate, reorder, and delete individual PDF pages visually.</p>
          </div>
          <FileUploadZone onFilesSelected={handleFileSelected} multiple={false} title="Upload PDF to Organize" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl"><ChevronLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Page Organizer &mdash; {file.name}</h1>
            <p className="text-xs text-slate-500">{pages.length} pages ready for reordering</p>
          </div>
        </div>
        <button
          onClick={handleExport}
          disabled={processing || pages.length === 0}
          className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg"
        >
          {processing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
          <span>Export Organized PDF</span>
        </button>
      </div>

      {error && <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2"><AlertCircle className="w-5 h-5" /><span>{error}</span></div>}
      {success && <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /><span>PDF successfully exported!</span></div>}

      {loading ? (
        <div className="text-center py-20">
          <RefreshCw className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading page thumbnails...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {pages.map((p, index) => (
            <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col items-center space-y-3 relative group">
              <div className="absolute top-3 left-3 bg-indigo-600 text-white w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold">
                {index + 1}
              </div>
              <div className="w-full h-48 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center overflow-hidden">
                {p.thumbnail ? (
                  <img 
                    src={p.thumbnail} 
                    alt={`Page ${index + 1}`} 
                    style={{ transform: `rotate(${p.rotation}deg)` }} 
                    className="max-h-full max-w-full object-contain transition-transform"
                  />
                ) : (
                  <span>Loading...</span>
                )}
              </div>
              <div className="flex items-center justify-between w-full pt-2 border-t border-slate-100">
                <button onClick={() => movePage(index, 'up')} disabled={index === 0} className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
                <button onClick={() => movePage(index, 'down')} disabled={index === pages.length - 1} className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
                <button onClick={() => rotatePage(index)} className="p-2 hover:bg-slate-100 rounded-lg text-indigo-600"><RotateCw className="w-4 h-4" /></button>
                <button onClick={() => removePage(index)} className="p-2 hover:bg-rose-50 rounded-lg text-rose-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}