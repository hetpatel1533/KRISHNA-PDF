import React, { useState } from 'react';
import {
  Sparkles,
  FileText,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  FileCode
} from 'lucide-react';
import { FileUploadZone } from '../../components/FileUploadZone';
import { apiClient } from '../../utils/apiClient';

export function CustomFeatureWorkspace({ toolId, toolName, onBack }) {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [outputBlob, setOutputBlob] = useState(null);

  // Detect semantic feature type from toolName or toolId
  const isWordToPdf = toolName.toLowerCase().includes('word') || toolName.toLowerCase().includes('doc');
  const isImageToPdf = toolName.toLowerCase().includes('image') || toolName.toLowerCase().includes('jpg') || toolName.toLowerCase().includes('png');
  
  const acceptTypes = isWordToPdf 
    ? ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    : (isImageToPdf ? "image/*" : ".pdf,application/pdf");
    
  const uploadTitle = isWordToPdf 
    ? "Upload Word (.doc, .docx) file here" 
    : (isImageToPdf ? "Upload image files here" : "Drop your PDF files here");

  const handleProcess = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tool_id', toolId);
      formData.append('tool_name', toolName);

      let endpoint = '/compress';
      if (isWordToPdf) {
        endpoint = '/convert-word-to-pdf';
      } else if (isImageToPdf) {
        endpoint = '/convert-image-to-pdf';
      }

      const res = await apiClient.postFormData(endpoint, formData);
      const blob = new Blob([res], { type: 'application/pdf' });
      setOutputBlob(blob);
      setSuccess(true);
      
      const outName = isWordToPdf ? `${file.name.replace(/\.[^/.]+$/, '')}.pdf` : `processed_${file.name}`;
      apiClient.downloadBlob(blob, outName);
    } catch (err) {
      setError(err.message || 'Autonomous feature processing failed.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xl">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              {toolName}
            </h1>
            <p className="text-xs text-slate-500">Autonomous AI Generated Feature Workspace &bull; Semantic Intelligent Pipeline</p>
          </div>
        </div>
        {file && (
          <button onClick={() => { setFile(null); setOutputBlob(null); setSuccess(false); }} className="px-4 py-2 text-xs font-semibold text-purple-600 hover:bg-purple-50 rounded-xl transition-all">
            Change File
          </button>
        )}
      </div>

      {error && <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 flex items-center gap-3"><AlertCircle className="w-5 h-5" /><span>{error}</span></div>}
      {success && <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 flex items-center gap-3"><CheckCircle2 className="w-5 h-5" /><span>Custom AI tool processed document successfully!</span></div>}

      {!file ? (
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-10">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-purple-50 border border-purple-100 text-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Sparkles className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{toolName}</h2>
            <p className="text-slate-600 mt-2 max-w-lg mx-auto">
              Semantic AI Agent has automatically configured this workspace for <span className="font-bold text-slate-900">{isWordToPdf ? 'Word (.doc/.docx)' : (isImageToPdf ? 'Images' : 'PDF documents')}</span>.
            </p>
          </div>
          <FileUploadZone 
            onFilesSelected={(f) => setFile(Array.isArray(f) ? f[0] : f)} 
            multiple={false} 
            accept={acceptTypes}
            maxSizeMB={50}
            title={uploadTitle}
            subtitle={isWordToPdf ? "Select .doc or .docx file from your computer" : "Click or drag to browse"}
          />
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 space-y-8 shadow-xl">
          <div className="flex items-center space-x-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <FileCode className="w-8 h-8 text-purple-600" />
            <div>
              <h4 className="font-bold text-sm text-slate-800">{file.name}</h4>
              <p className="text-xs text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB &bull; Semantic Pipeline Ready</p>
            </div>
          </div>

          <button
            onClick={handleProcess}
            disabled={processing}
            className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-base rounded-2xl shadow-xl shadow-purple-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {processing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            <span>Execute {toolName}</span>
          </button>

          {outputBlob && (
            <button
              onClick={() => apiClient.downloadBlob(outputBlob, `converted_${file.name.replace(/\.[^/.]+$/, '')}.pdf`)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download Converted PDF</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
