import React, { useState, useEffect } from 'react';
import { 
  Scissors, 
  FileText, 
  Download, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Layers, 
  Trash2,
  CheckSquare,
  Square
} from 'lucide-react';
import { FileUploadZone } from '../../components/FileUploadZone';
import { apiClient } from '../../utils/apiClient';
import { loadPdfDocument, renderPageThumbnail } from '../../utils/pdfWorker';

export function SplitWorkspace({ onBack }) {
  const [file, setFile] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [thumbnails, setThumbnails] = useState({});
  const [loadingThumbnails, setLoadingThumbnails] = useState(false);
  const [splitMode, setSplitMode] = useState('ranges'); // 'ranges' | 'extract' | 'fixed'
  const [rangeStr, setRangeStr] = useState('');
  const [selectedPages, setSelectedPages] = useState(new Set());
  const [fixedEveryN, setFixedEveryN] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (!file) {
      setNumPages(0);
      setThumbnails({});
      setSelectedPages(new Set());
      return;
    }

    let isMounted = true;
    const processFile = async () => {
      try {
        setLoadingThumbnails(true);
        setErrorMessage(null);
        const buffer = await file.arrayBuffer();
        const pdfDoc = await loadPdfDocument(buffer.slice(0));
        const total = pdfDoc.numPages;

        if (!isMounted) return;
        setNumPages(total);

        const thumbs = {};
        for (let i = 1; i <= total; i++) {
          try {
            const dataUrl = await renderPageThumbnail(pdfDoc, i, 0.3);
            thumbs[i] = dataUrl;
          } catch (err) {
            console.error(`Failed to render thumbnail for page ${i}:`, err);
          }
        }

        if (isMounted) {
          setThumbnails(thumbs);
        }
      } catch (err) {
        console.error("Failed to load PDF for split view:", err);
        if (isMounted) {
          setErrorMessage("Failed to parse PDF document. Please verify the file is not password protected.");
        }
      } finally {
        if (isMounted) {
          setLoadingThumbnails(false);
        }
      }
    };

    processFile();

    return () => {
      isMounted = false;
    };
  }, [file]);

  const handleFilesSelected = (selectedFiles) => {
    const uploaded = Array.isArray(selectedFiles) ? selectedFiles[0] : selectedFiles;
    if (uploaded) {
      setFile(uploaded);
    }
  };

  const togglePageSelection = (pageNum) => {
    const updated = new Set(selectedPages);
    if (updated.has(pageNum)) {
      updated.delete(pageNum);
    } else {
      updated.add(pageNum);
    }
    setSelectedPages(updated);
  };

  const selectAllPages = () => {
    const all = new Set();
    for (let i = 1; i <= numPages; i++) {
      all.add(i);
    }
    setSelectedPages(all);
  };

  const clearSelectedPages = () => {
    setSelectedPages(new Set());
  };

  const handleSplit = async () => {
    if (!file) return;

    setIsProcessing(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', splitMode);

    if (splitMode === 'ranges') {
      if (!rangeStr.trim()) {
        setErrorMessage("Please enter valid page ranges (e.g., 1-3, 5, 8-10).");
        setIsProcessing(false);
        return;
      }
      formData.append('range_str', rangeStr);
    } else if (splitMode === 'extract') {
      if (selectedPages.size === 0) {
        setErrorMessage("Please select at least one page to extract.");
        setIsProcessing(false);
        return;
      }
      const sortedPages = Array.from(selectedPages).sort((a, b) => a - b);
      formData.append('range_str', sortedPages.join(','));
    } else if (splitMode === 'fixed') {
      formData.append('every_n', fixedEveryN.toString());
    }

    try {
      const responseBlob = await apiClient.postFormData('/split', formData);

      const isZip = splitMode === 'ranges' || splitMode === 'fixed' || selectedPages.size > 1;
      const extension = isZip ? 'zip' : 'pdf';
      const filename = `${file.name.replace(/\.[^/.]+$/, '')}_split.${extension}`;

      apiClient.downloadBlob(responseBlob, filename);
    } catch (err) {
      console.error("Split operation failed:", err);
      setErrorMessage(err.message || "Failed to split PDF document. Please check your range syntax.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-inner">
            <Scissors className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Split PDF Document</h1>
            <p className="text-sm text-slate-500">Extract specific pages, divide by ranges, or burst into individual files.</p>
          </div>
        </div>
        {file && (
          <button
            onClick={() => {
              setFile(null);
              setRangeStr('');
              setSelectedPages(new Set());
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Choose Different File
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl animate-shake">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span className="text-sm font-medium">{errorMessage}</span>
        </div>
      )}

      {!file ? (
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl border border-slate-200/80 shadow-xl">
          <FileUploadZone 
            onFilesSelected={handleFilesSelected} 
            multiple={false}
            title="Upload PDF to Split"
            subtitle="Drag & drop your PDF file here or browse"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel: Configuration & Mode Selection */}
          <div className="space-y-6">
            <div className="bg-white/90 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/80 shadow-xl space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <FileText className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-semibold text-slate-900 truncate max-w-[220px]">{file.name}</h3>
                  <p className="text-xs text-slate-500">{numPages} total pages</p>
                </div>
              </div>

              {/* Mode Selector */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Split Strategy</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSplitMode('ranges')}
                    className={`px-3 py-2.5 text-xs font-semibold rounded-xl border transition-all ${
                      splitMode === 'ranges'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Ranges
                  </button>
                  <button
                    onClick={() => setSplitMode('extract')}
                    className={`px-3 py-2.5 text-xs font-semibold rounded-xl border transition-all ${
                      splitMode === 'extract'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Visual Select
                  </button>
                  <button
                    onClick={() => setSplitMode('fixed')}
                    className={`px-3 py-2.5 text-xs font-semibold rounded-xl border transition-all ${
                      splitMode === 'fixed'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Fixed Burst
                  </button>
                </div>
              </div>

              {/* Mode Specific Inputs */}
              {splitMode === 'ranges' && (
                <div className="space-y-2 animate-fadeIn">
                  <label className="text-sm font-medium text-slate-700">Page Ranges</label>
                  <input
                    type="text"
                    placeholder="e.g. 1-3, 5, 8-10"
                    value={rangeStr}
                    onChange={(e) => setRangeStr(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-mono"
                  />
                  <p className="text-xs text-slate-500">
                    Specify intervals separated by commas. Each range will be extracted into its own document.
                  </p>
                </div>
              )}

              {splitMode === 'extract' && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      Selected: <strong className="text-indigo-600">{selectedPages.size}</strong> of {numPages} pages
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={selectAllPages}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold px-2 py-1 bg-indigo-50 rounded-lg"
                      >
                        All
                      </button>
                      <button
                        onClick={clearSelectedPages}
                        className="text-xs text-slate-600 hover:text-slate-700 font-semibold px-2 py-1 bg-slate-100 rounded-lg"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    Click thumbnails in the grid on the right to select individual pages for extraction.
                  </p>
                </div>
              )}

              {splitMode === 'fixed' && (
                <div className="space-y-2 animate-fadeIn">
                  <label className="text-sm font-medium text-slate-700">Pages per Document (N)</label>
                  <input
                    type="number"
                    min="1"
                    max={numPages}
                    value={fixedEveryN}
                    onChange={(e) => setFixedEveryN(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                  />
                  <p className="text-xs text-slate-500">
                    Splits the PDF into multiple files containing exactly N pages each.
                  </p>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleSplit}
                disabled={isProcessing || (splitMode === 'extract' && selectedPages.size === 0)}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-gradient-to-r from-indigo-600 to-rose-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Processing Split...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>Split & Download PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Panel: Interactive Page Grid */}
          <div className="lg:col-span-2 bg-white/90 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/80 shadow-xl flex flex-col h-[700px]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <h3 className="font-semibold text-slate-900">Document Page Grid</h3>
              </div>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                {numPages} Pages Available
              </span>
            </div>

            {loadingThumbnails ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-sm font-medium text-slate-600">Rendering high-res page thumbnails...</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => {
                  const isSelected = selectedPages.has(pageNum);
                  const thumb = thumbnails[pageNum];

                  return (
                    <div
                      key={pageNum}
                      onClick={() => splitMode === 'extract' && togglePageSelection(pageNum)}
                      className={`relative group bg-slate-50 rounded-xl border-2 transition-all overflow-hidden flex flex-col items-center p-3 ${
                        splitMode === 'extract' ? 'cursor-pointer hover:border-indigo-400' : ''
                      } ${
                        isSelected && splitMode === 'extract'
                          ? 'border-indigo-600 bg-indigo-50/30 shadow-md shadow-indigo-100'
                          : 'border-slate-200'
                      }`}
                    >
                      {splitMode === 'extract' && (
                        <div className="absolute top-3 right-3 z-10">
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-indigo-600 fill-indigo-50" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-400 group-hover:text-indigo-400" />
                          )}
                        </div>
                      )}

                      <div className="w-full h-40 bg-white rounded-lg shadow-sm border border-slate-200 flex items-center justify-center overflow-hidden mb-2">
                        {thumb ? (
                          <img 
                            src={thumb} 
                            alt={`Page ${pageNum}`} 
                            className="w-full h-full object-contain pointer-events-none"
                          />
                        ) : (
                          <div className="text-xs text-slate-400">Loading...</div>
                        )}
                      </div>

                      <span className="text-xs font-semibold text-slate-700">
                        Page {pageNum}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}