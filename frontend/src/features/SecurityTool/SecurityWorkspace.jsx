import React, { useState } from 'react';
import { Lock, FileText, Download, RefreshCw, AlertCircle, CheckCircle2, ChevronLeft, ShieldCheck, KeyRound, Stamp } from 'lucide-react';
import { FileUploadZone } from '../../components/FileUploadZone';
import { apiClient } from '../../utils/apiClient';

export function SecurityWorkspace({ onBack }) {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [watermarkText, setWatermarkText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSecure = async () => {
    if (!file) return;
    if (password && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setProcessing(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (password) formData.append('password', password);
      if (watermarkText) formData.append('watermark', watermarkText);

      const res = await apiClient.postFormData('/security/watermark', formData);
      apiClient.downloadBlob(res, `secured_adobe_${file.name}`);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to secure document.');
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
            <div className="w-20 h-20 bg-rose-50 border border-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Lock className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Adobe Security & Watermark Suite</h2>
            <p className="text-slate-600 mt-2 max-w-lg mx-auto">
              Apply military-grade 256-bit AES encryption passwords and professional customizable watermarks instantly.
            </p>
          </div>
          <FileUploadZone onFilesSelected={(f) => setFile(Array.isArray(f) ? f[0] : f)} multiple={false} title="Upload PDF to Secure & Watermark" />
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
              <ShieldCheck className="w-5 h-5 text-rose-600" />
              Adobe Security & Watermark &mdash; {file.name}
            </h1>
            <p className="text-xs text-slate-500">Configure cryptographic encryption and transparent watermarks</p>
          </div>
        </div>
        <button onClick={() => setFile(null)} className="px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
          Change File
        </button>
      </div>

      {error && <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 flex items-center gap-3"><AlertCircle className="w-5 h-5" /><span>{error}</span></div>}
      {success && <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 flex items-center gap-3"><CheckCircle2 className="w-5 h-5" /><span>PDF successfully secured & downloaded!</span></div>}

      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 space-y-8 shadow-xl">
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-indigo-600" />
            Password Encryption (256-bit AES)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Set Owner/User Password</label>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter strong password"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Confirm Password</label>
              <input 
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Stamp className="w-5 h-5 text-indigo-600" />
            Professional Watermark Stamp
          </h3>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Watermark Text (e.g. CONFIDENTIAL / DRAFT)</label>
            <input 
              type="text"
              value={watermarkText}
              onChange={(e) => setWatermarkText(e.target.value)}
              placeholder="Enter watermark text"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm"
            />
          </div>
        </div>

        <button
          onClick={handleSecure}
          disabled={processing || (!password && !watermarkText)}
          className="w-full py-4 bg-gradient-to-r from-rose-600 to-indigo-600 hover:opacity-95 text-white font-bold text-base rounded-2xl shadow-xl shadow-rose-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {processing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
          <span>Apply Adobe Security & Download</span>
        </button>
      </div>
    </div>
  );
}