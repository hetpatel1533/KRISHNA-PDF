import React, { useState } from 'react';
import { 
  Minimize2, 
  FileText, 
  Download, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Zap, 
  Gauge, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { FileUploadZone } from '../../components/FileUploadZone';
import { apiClient } from '../../utils/apiClient';

export function CompressWorkspace({ onBack }) {
  const [file, setFile] = useState(null);
  const [preset, setPreset] = useState('recommended');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelected = (selectedFiles) => {
    const uploaded = Array.isArray(selectedFiles) ? selectedFiles[0] : selectedFiles;
    if (uploaded) {
      setFile(uploaded);
      setResult(null);
      setError(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleCompress = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('preset', preset);

      const responseBlob = await apiClient.postFormData('/compress', formData);

      const compressedBlob = new Blob([responseBlob], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(compressedBlob);
      
      const originalSize = file.size;
      const compressedSize = compressedBlob.size;
      const savings = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100));

      setResult({
        blob: compressedBlob,
        url: downloadUrl,
        originalSize,
        compressedSize,
        savings,
      });
    } catch (err) {
      console.error('Compression error:', err);
      setError(err?.message || 'Failed to compress PDF. Please verify the document format and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const presets = [
    {
      id: 'extreme',
      name: 'Extreme Compression',
      badge: 'Smallest Size',
      desc: 'Maximum compression with lower image resolution. Ideal for archiving or when file size is strictly limited.',
      reduction: '~70-90% smaller',
      color: 'border-rose-200 bg-rose-50/50 text-rose-700',
    },
    {
      id: 'recommended',
      name: 'Recommended Compression',
      badge: 'Balanced Quality',
      desc: 'Good quality and reduction. Optimal balance between readable document fidelity and compact storage size.',
      reduction: '~40-60% smaller',
      color: 'border-indigo-200 bg-indigo-50/50 text-indigo-700',
    },
    {
      id: 'low',
      name: 'Low Compression',
      badge: 'High Quality',
      desc: 'Minimal image recompression preserving near-original visual fidelity while stripping redundant object streams.',
      reduction: '~15-30% smaller',
      color: 'border-slate-200 bg-slate-50 text-slate-700',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex items-center justify-between mb-8 bg-white/80 backdrop-blur-xl border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200">
            <Minimize2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">PDF Compression Suite</h1>
            <p className="text-sm text-slate-500">Reduce file weight intelligently while preserving critical document text and layout integrity.</p>
          </div>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
        >
          Back to Dashboard
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-3 text-rose-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {!file ? (
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl p-8 shadow-sm">
          <FileUploadZone
            multiple={false}
            accept=".pdf,application/pdf"
            title="Upload PDF for Compression"
            subtitle="Select a PDF document to optimize its file size"
            onFilesSelected={handleFileSelected}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-slate-100 text-indigo-600 rounded-xl">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 truncate max-w-md">{file.name}</h3>
                    <p className="text-xs text-slate-500">Original Size: {formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setResult(null);
                  }}
                  className="text-sm text-rose-600 hover:text-rose-700 font-medium px-3 py-1.5 hover:bg-rose-50 rounded-lg transition-all"
                >
                  Change File
                </button>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                  <Gauge className="w-4 h-4 text-indigo-600" />
                  <span>Select Compression Level</span>
                </h4>

                <div className="grid grid-cols-1 gap-4">
                  {presets.map((p) => {
                    const isSelected = preset === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setPreset(p.id)}
                        className={`cursor-pointer border rounded-2xl p-5 transition-all duration-150 ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/30 ring-2 ring-indigo-600/20 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <input
                              type="radio"
                              name="compressionPreset"
                              checked={isSelected}
                              onChange={() => setPreset(p.id)}
                              className="text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                            />
                            <span className="font-semibold text-slate-900">{p.name}</span>
                          </div>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${p.color}`}>
                            {p.reduction}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 ml-7">{p.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center space-x-2">
                <Zap className="w-5 h-5 text-indigo-600" />
                <span>Optimization Engine</span>
              </h3>

              <p className="text-sm text-slate-600 mb-6">
                Agent Krishna will re-encode image streams, eliminate redundant object references, and compress structure trees offline.
              </p>

              {!result ? (
                <button
                  onClick={handleCompress}
                  disabled={isProcessing}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 transition-all duration-150 flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Optimizing PDF...</span>
                    </>
                  ) : (
                    <>
                      <span>Compress PDF Now</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-6 animate-fadeIn">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="flex items-center space-x-3 mb-3">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-emerald-900">Compression Successful!</h4>
                        <p className="text-xs text-emerald-700">Reduced by {result.savings}%</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600 border-t border-emerald-200/60 pt-3">
                      <div className="flex justify-between">
                        <span>Original Size:</span>
                        <span className="font-semibold">{formatFileSize(result.originalSize)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Compressed Size:</span>
                        <span className="font-semibold text-emerald-700">{formatFileSize(result.compressedSize)}</span>
                      </div>
                    </div>
                  </div>

                  <a
                    href={result.url}
                    download={`compressed_${file.name}`}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold rounded-xl shadow-lg shadow-emerald-200 transition-all duration-150 flex items-center justify-center space-x-2"
                  >
                    <Download className="w-5 h-5" />
                    <span>Download Compressed PDF</span>
                  </a>

                  <button
                    onClick={() => setResult(null)}
                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all text-sm"
                  >
                    Compress Again with Different Settings
                  </button>
                </div>
              )}
            </div>

            <div className="bg-indigo-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10">
                <ShieldCheck className="w-40 h-40" />
              </div>
              <h4 className="font-bold text-base mb-2 flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <span>100% Offline & Secure</span>
              </h4>
              <p className="text-xs text-indigo-200 leading-relaxed">
                Your document bytes never leave your local environment. All compression tasks execute securely inside your dedicated backend pipeline.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
