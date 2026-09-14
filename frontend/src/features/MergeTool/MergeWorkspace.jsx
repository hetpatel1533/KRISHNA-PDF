import React, { useState } from 'react';
import { 
  GitMerge, 
  Upload, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  FileText, 
  Sparkles, 
  Download, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { FileUploadZone } from '../../components/FileUploadZone';
import { apiClient } from '../../utils/apiClient';

export function MergeWorkspace({ onBack }) {
  const [files, setFiles] = useState([]);
  const [isMerging, setIsMerging] = useState(false);
  const [mergedResult, setMergedResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFilesSelected = (newFiles) => {
    const fileArray = Array.isArray(newFiles) ? newFiles : Array.from(newFiles);
    const pdfFiles = fileArray.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    
    if (pdfFiles.length === 0 && fileArray.length > 0) {
      setError('Please select valid PDF documents.');
      return;
    }

    setError(null);
    setFiles(prev => [...prev, ...pdfFiles.map((file, idx) => ({
      id: `${Date.now()}-${idx}-${file.name}`,
      file,
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
    }))]);
  };

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const moveFile = (index, direction) => {
    const newFiles = [...files];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newFiles.length) return;
    
    const temp = newFiles[index];
    newFiles[index] = newFiles[targetIndex];
    newFiles[targetIndex] = temp;
    
    setFiles(newFiles);
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setError('Please select at least 2 PDF files to merge.');
      return;
    }

    setIsMerging(true);
    setError(null);
    setMergedResult(null);

    try {
      const formData = new FormData();
      files.forEach(f => {
        formData.append('files', f.file);
      });

      const responseBlob = await apiClient.postFormData('/merge', formData);

      const blob = new Blob([responseBlob], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      setMergedResult({
        url,
        filename: `merged_document_${Date.now()}.pdf`,
        size: (blob.size / (1024 * 1024)).toFixed(2) + ' MB'
      });
    } catch (err) {
      console.error('Merge failed:', err);
      setError(err.message || 'Failed to merge PDF files. Please verify the documents and try again.');
    } finally {
      setIsMerging(false);
    }
  };

  const resetWorkspace = () => {
    setFiles([]);
    setMergedResult(null);
    setError(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-xl border border-slate-200/80 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
            <GitMerge className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Merge PDF Documents</h1>
            <p className="text-sm text-slate-500">Combine multiple PDF files into a single, structured sequence instantly.</p>
          </div>
        </div>
        
        {files.length > 0 && !mergedResult && (
          <button
            onClick={handleMerge}
            disabled={isMerging || files.length < 2}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-medium rounded-xl shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isMerging ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Merging PDFs...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Merge {files.length} PDFs Now</span>
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Main Content Area */}
      {!mergedResult ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Upload Zone */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-600" />
                Add More Files
              </h2>
              <FileUploadZone 
                onFilesSelected={handleFilesSelected}
                multiple={true}
                title="Drop PDF files here"
                subtitle="Select multiple PDFs to combine"
              />
            </div>
          </div>

          {/* Right: File Queue & Reordering */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="font-semibold text-slate-800">Files to Merge ({files.length})</h2>
                  <p className="text-xs text-slate-500">Drag or use arrows to reorder merge sequence</p>
                </div>
                {files.length > 0 && (
                  <button
                    onClick={resetWorkspace}
                    className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear All
                  </button>
                )}
              </div>

              {files.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium">No PDF files added yet</p>
                  <p className="text-xs text-slate-400 mt-1">Upload files using the box on the left to get started.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {files.map((fileItem, index) => (
                    <div 
                      key={fileItem.id}
                      className="flex items-center justify-between p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl hover:border-slate-300 transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex items-center justify-center w-7 h-7 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold border border-indigo-100 shrink-0">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{fileItem.name}</p>
                          <p className="text-xs text-slate-400">{fileItem.size}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => moveFile(index, 'up')}
                          disabled={index === 0}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                          title="Move Up"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveFile(index, 'down')}
                          disabled={index === files.length - 1}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                          title="Move Down"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeFile(fileItem.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-all ml-2"
                          title="Remove File"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Success Result View */
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-xl p-8 text-center space-y-6 max-w-2xl mx-auto animate-fade-in">
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto shadow-inner">
            <Sparkles className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">PDFs Merged Successfully!</h2>
            <p className="text-sm text-slate-500">
              Your documents have been combined into <span className="font-semibold text-slate-700">{mergedResult.filename}</span> ({mergedResult.size}).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a
              href={mergedResult.url}
              download={mergedResult.filename}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-medium rounded-xl shadow-lg shadow-indigo-200 transition-all"
            >
              <Download className="w-5 h-5" />
              <span>Download Merged PDF</span>
            </a>

            <button
              onClick={resetWorkspace}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 font-medium rounded-xl transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Merge Another Set</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}