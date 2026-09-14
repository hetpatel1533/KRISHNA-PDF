import React, { useState } from 'react';
import { Hash, FileText, Download, RefreshCw, AlertCircle, CheckCircle2, ChevronLeft } from 'lucide-react';
import { FileUploadZone } from '../../components/FileUploadZone';
import { apiClient } from '../../utils/apiClient';

export function PageNumbersWorkspace({ onBack }) {
  const [file, setFile] = useState(null);
  const [position, setPosition] = useState('bottom-center');
  const [fontSize, setFontSize] = useState(10);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleAddPageNumbers = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('position', position);
      formData.append('font_size', fontSize.toString());

      const res = await apiClient.postFormData('/page-numbers', formData);
      apiClient.downloadBlob(res, `numbered_${file.name}`);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to add page numbers.');
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
            <div className="w-20 h-20 bg-blue-50 border border-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Hash className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Add Page Numbers</h2>
            <p className="text-slate-600 mt-2 max-w-lg mx-auto">
              Stamp professional page numbers onto your PDF document with exact position and formatting control.
            </p>
          </div>
          <FileUploadZone onFilesSelected={(f) => setFile(Array.isArray(f) ? f[0] : f)} multiple={false} title="Upload PDF to Add Page Numbers" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xl">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"><ChevronLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Hash className="w-5 h-5 text-blue-600" />
              Add Page Numbers &mdash; {file.name}
            </h1>
            <p className="text-xs text-slate-500">Configure position and font size for page numbers</p>
          </div>
        </div>
        <button onClick={() => setFile(null)} className="px-4 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
          Change File
        </button>
      </div>

      {error && <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 flex items-center gap-3"><AlertCircle className="w-5 h-5" /><span>{error}</span></div>}
      {success && <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 flex items-center gap-3"><CheckCircle2 className="w-5 h-5" /><span>Page numbers added successfully!</span></div>}

      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 space-y-8 shadow-xl">
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900">Position on Page</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { id: 'top-left', name: 'Top Left' },
              { id: 'top-center', name: 'Top Center' },
              { id: 'top-right', name: 'Top Right' },
              { id: 'bottom-left', name: 'Bottom Left' },
              { id: 'bottom-center', name: 'Bottom Center' },
              { id: 'bottom-right', name: 'Bottom Right' }
            ].map(pos => (
              <button
                key={pos.id}
                onClick={() => setPosition(pos.id)}
                className={`p-4 rounded-xl border text-sm font-semibold transition-all ${
                  position === pos.id ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {pos.name}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleAddPageNumbers}
          disabled={processing}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base rounded-2xl shadow-xl shadow-blue-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {processing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Hash className="w-5 h-5" />}
          <span>Add Page Numbers & Download</span>
        </button>
      </div>
    </div>
  );
}