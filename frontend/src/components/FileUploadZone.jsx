import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, AlertCircle, X, CheckCircle2 } from 'lucide-react';

export function FileUploadZone({ 
  onFilesSelected, 
  multiple = false, 
  maxSizeMB = 50, 
  accept = ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  title = "Drop your PDF or Word files here",
  subtitle = "or click to browse from your computer"
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const validateAndAddFiles = (fileList) => {
    setError(null);
    const filesArray = Array.from(fileList);
    const validFiles = [];

    const acceptLower = accept.toLowerCase();
    const isWordOnly = acceptLower.includes('.doc') && !acceptLower.includes('.pdf');
    const isPdfOnly = acceptLower.includes('.pdf') && !acceptLower.includes('.doc') && !acceptLower.includes('image');
    const isImageOnly = acceptLower.includes('image') || acceptLower.includes('.png') || acceptLower.includes('.jpg');

    for (const file of filesArray) {
      const fileNameLower = file.name.toLowerCase();
      const isPdf = file.type === 'application/pdf' || fileNameLower.endsWith('.pdf');
      const isWord = file.type.includes('word') || fileNameLower.endsWith('.doc') || fileNameLower.endsWith('.docx');
      const isImage = file.type.startsWith('image/') || fileNameLower.endsWith('.jpg') || fileNameLower.endsWith('.png') || fileNameLower.endsWith('.jpeg');

      if (isWordOnly && !isWord) {
        setError(`"${file.name}" is not a valid Word document (.doc / .docx). This menu only accepts Word files.`);
        continue;
      }
      if (isPdfOnly && !isPdf) {
        setError(`"${file.name}" is not a valid PDF document. This menu only accepts PDF files.`);
        continue;
      }
      if (isImageOnly && !isImage) {
        setError(`"${file.name}" is not a valid image file. This menu only accepts images.`);
        continue;
      }

      if (!isPdf && !isWord && !isImage) {
        setError(`"${file.name}" is not a valid supported file format.`);
        continue;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`"${file.name}" exceeds the maximum size limit of ${maxSizeMB}MB.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      const newFiles = multiple ? [...selectedFiles, ...validFiles] : validFiles;
      setSelectedFiles(newFiles);
      if (onFilesSelected) {
        onFilesSelected(multiple ? newFiles : newFiles[0]);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer && e.dataTransfer.files) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      validateAndAddFiles(e.target.files);
    }
  };

  const removeFile = (index, e) => {
    e.stopPropagation();
    const updated = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updated);
    if (onFilesSelected) {
      onFilesSelected(multiple ? updated : (updated[0] || null));
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative group cursor-pointer flex flex-col items-center justify-center p-8 md:p-12 border-2 border-dashed rounded-3xl transition-all duration-200 backdrop-blur-xl ${
          isDragging 
            ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]' 
            : 'border-slate-200 hover:border-indigo-400 bg-white/80 hover:bg-white shadow-xl shadow-slate-100/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform duration-200 shadow-inner">
          <UploadCloud className="w-8 h-8" />
        </div>

        <h3 className="text-lg font-semibold text-slate-800 mb-1">
          {title}
        </h3>
        <p className="text-sm text-slate-500 mb-4 text-center">
          {subtitle}
        </p>

        <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> 100% Offline & Private
          </span>
          <span>&bull;</span>
          <span>Max file size: {maxSizeMB}MB</span>
          {multiple && (
            <>
              <span>&bull;</span>
              <span>Multi-select enabled</span>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm animate-shake">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {selectedFiles.length > 0 && multiple && (
        <div className="flex flex-col gap-2 mt-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Selected Files ({selectedFiles.length})
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {selectedFiles.map((file, index) => (
              <div 
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 shadow-sm"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
                    <p className="text-xs text-slate-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => removeFile(index, e)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
