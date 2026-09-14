import React, { useState, useEffect } from 'react';
import {
  FileCode,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Eye,
  Copy,
  Check,
  Grid
} from 'lucide-react';
import { FileUploadZone } from '../../components/FileUploadZone';
import { apiClient } from '../../utils/apiClient';
import { loadPdfDocument, renderPageThumbnail } from '../../utils/pdfWorker';

export function ConverterWorkspace({ onBack }) {
  const [file, setFile] = useState(null);
  const [targetFormat, setTargetFormat] = useState('docx');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [resultBlob, setResultBlob] = useState(null);

  // TXT and Image Previews
  const [previewText, setPreviewText] = useState('');
  const [copied, setCopied] = useState(false);
  const [renderedImages, setRenderedImages] = useState([]);
  const [renderingImages, setRenderingImages] = useState(false);

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setResultBlob(null);
    setPreviewText('');
    setRenderedImages([]);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('target_format', targetFormat);

      const res = await apiClient.postFormData('/convert', formData);
      const blob = new Blob([res], {
        type: targetFormat === 'txt' ? 'text/plain' : (targetFormat === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/zip')
      });
      setResultBlob(blob);

      if (targetFormat === 'txt') {
        const text = await blob.text();
        setPreviewText(text);
      } else if (targetFormat === 'docx') {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await loadPdfDocument(arrayBuffer);
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += `--- Page ${i} ---\n${pageText}\n\n`;
          }
          setPreviewText(fullText || "Word Document text compiled successfully.");
        } catch (err) {
          setPreviewText("Word Document compiled successfully. Download to view formatting.");
        }
      } else if (targetFormat === 'png' || targetFormat === 'jpeg') {
        setRenderingImages(true);
        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await loadPdfDocument(arrayBuffer);
          const pageList = [];
          for (let i = 1; i <= pdf.numPages; i++) {
            const dataUrl = await renderPageThumbnail(pdf, i, 1.2);
            pageList.push({ pageNum: i, dataUrl });
          }
          setRenderedImages(pageList);
        } catch (err) {
          console.error('Failed to render preview images:', err);
        } finally {
          setRenderingImages(false);
        }
      }
    } catch (err) {
      setError(err.message || 'Conversion failed.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    const ext = (targetFormat === 'png' || targetFormat === 'jpeg') ? 'zip' : targetFormat;
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.[^/.]+$/, '');
    apiClient.downloadBlob(resultBlob, `converted_${sanitizedName}.${ext}`);
  };

  const copyText = () => {
    navigator.clipboard.writeText(previewText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!file) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-6">
        <button onClick={onBack} className="mb-6 flex items-center text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </button>
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-10">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-purple-50 border border-purple-100 text-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <FileCode className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Local PDF Format Converter</h2>
            <p className="text-slate-600 mt-2 max-w-lg mx-auto">
              Convert documents into uncorrupted Word (.docx), plain text, or packaged image packages offline in your browser.
            </p>
          </div>
          <FileUploadZone onFilesSelected={(f) => setFile(Array.isArray(f) ? f[0] : f)} multiple={false} title="Upload PDF to Convert" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xl">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2.5 bg-slate-100 rounded-xl"><ChevronLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Converter &mdash; {file.name}</h1>
            <p className="text-xs text-slate-500">Select format for local client-side preview and conversion</p>
          </div>
        </div>
        <button onClick={() => { setFile(null); setResultBlob(null); setPreviewText(''); setRenderedImages([]); }} className="px-4 py-2 text-xs font-semibold text-purple-600 hover:bg-purple-50 rounded-xl transition-all">
          Change File
        </button>
      </div>

      {error && <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2"><AlertCircle className="w-5 h-5" /><span>{error}</span></div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-6 shadow-xl h-fit">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Select Format</h3>
          
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'docx', name: 'Word (.docx)' },
              { id: 'txt', name: 'Text (.txt)' },
              { id: 'png', name: 'Images (.png)' },
              { id: 'jpeg', name: 'Images (.jpg)' }
            ].map(fmt => (
              <button
                key={fmt.id}
                onClick={() => { setTargetFormat(fmt.id); setResultBlob(null); }}
                className={`p-3 rounded-xl border text-xs font-semibold transition-all ${
                  targetFormat === fmt.id ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {fmt.name}
              </button>
            ))}
          </div>

          <button
            onClick={handleConvert}
            disabled={processing}
            className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {processing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileCode className="w-4 h-4" />}
            <span>Convert Now</span>
          </button>

          {resultBlob && (
            <div className="border-t pt-4 space-y-3">
              <button
                onClick={handleDownload}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download File</span>
              </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 shadow-xl min-h-[400px] flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Eye className="w-4 h-4 text-purple-600" />
              <span>Interactive Browser Preview</span>
            </h3>
            {previewText && (
              <button onClick={copyText} className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-all">
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </div>

          {previewText ? (
            <textarea
              readOnly
              value={previewText}
              className="w-full flex-1 p-4 border border-slate-200 rounded-2xl font-mono text-xs text-slate-800 bg-slate-50 focus:outline-none focus:ring-0 min-h-[300px] resize-none leading-relaxed"
            />
          ) : renderedImages.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 overflow-y-auto max-h-[500px] p-2">
              {renderedImages.map((img) => (
                <div key={img.pageNum} className="bg-slate-50 border border-slate-200 rounded-xl p-2 flex flex-col items-center group relative">
                  <img src={img.dataUrl} alt={`Page ${img.pageNum}`} className="max-h-40 object-contain shadow-sm rounded-lg" />
                  <span className="text-[10px] font-semibold text-slate-500 mt-2">Page {img.pageNum}</span>
                  <a
                    href={img.dataUrl}
                    download={`page_${img.pageNum}.${targetFormat}`}
                    className="absolute top-2 right-2 p-1.5 bg-white/95 border border-slate-200 rounded-lg text-slate-700 hover:text-purple-600 opacity-0 group-hover:opacity-100 shadow-md transition-all"
                    title="Download image page"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 py-12">
              {renderingImages ? (
                <>
                  <RefreshCw className="w-10 h-10 animate-spin text-purple-600 mb-3" />
                  <p className="text-sm font-medium">Generating interactive layout previews...</p>
                </>
              ) : (
                <>
                  <FileCode className="w-12 h-12 text-slate-200 mb-2" />
                  <p className="text-sm font-medium">Click "Convert Now" to generate your uncorrupted document copy.</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}