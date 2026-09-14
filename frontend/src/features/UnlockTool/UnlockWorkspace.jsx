import React, { useState } from 'react';
import { Unlock, FileText, Download, RefreshCw, AlertCircle, CheckCircle2, ChevronLeft, ShieldCheck, KeyRound } from 'lucide-react';
import { FileUploadZone } from '../../components/FileUploadZone';
import { apiClient } from '../../utils/apiClient';

export function UnlockWorkspace({ onBack }) {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleUnlock = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (password) formData.append('password', password);

      const res = await apiClient.postFormData('/unlock', formData);
      apiClient.downloadBlob(res, `unlocked_${file.name}`);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to unlock PDF. Please verify the password if protected.');
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
              <Unlock className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Unlock PDF Document</h2>
            <p className="text-slate-600 mt-2 max-w-lg mx-auto">
              Remove passwords, restrictions, and encryption from your PDF files instantly with secure local processing.
            </p>
          </div>
          <FileUploadZone onFilesSelected={(f) => setFile(Array.isArray(f) ? f[0] : f)} multiple={false} title="Upload Protected PDF to Unlock" />
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
              <Unlock className="w-5 h-5 text-amber-600" />
              Unlock PDF &mdash; {file.name}
            </h1>
            <p className="text-xs text-slate-500">Remove password security and document restrictions</p>
          </div>
        </div>
        <button onClick={() => setFile(null)} className="px-4 py-2 text-xs font-semibold text-amber-600 hover:bg-amber-50 rounded-xl transition-all">
          Change File
        </button>
      </div>

      {error && <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 flex items-center gap-3"><AlertCircle className="w-5 h-5" /><span>{error}</span></div>}
      {success && <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 flex items-center gap-3"><CheckCircle2 className="w-5 h-5" /><span>PDF successfully unlocked & downloaded!</span></div>}

      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 space-y-8 shadow-xl">
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-amber-600" />
            Document Password (If required)
          </h3>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Enter PDF Password</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank if password is unknown or none"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
            />
          </div>
        </div>

        <button
          onClick={handleUnlock}
          disabled={processing}
          className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-95 text-white font-bold text-base rounded-2xl shadow-xl shadow-amber-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {processing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Unlock className="w-5 h-5" />}
          <span>Unlock PDF Now</span>
        </button>
      </div>
    </div>
  );
}