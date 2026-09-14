import React, { useState, useRef, useEffect } from 'react';
import { 
  PenTool, 
  FileText, 
  Download, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Trash2, 
  ShieldCheck 
} from 'lucide-react';
import { FileUploadZone } from '../../components/FileUploadZone';
import { SignatureModal } from './SignatureModal';
import { apiClient } from '../../utils/apiClient';
import { loadPdfDocument } from '../../utils/pdfWorker';

export function SignWorkspace({ onBack }) {
  const [file, setFile] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [isRendering, setIsRendering] = useState(false);
  
  const [signatures, setSignatures] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleFileSelected = async (selectedFiles) => {
    const uploadedFile = Array.isArray(selectedFiles) ? selectedFiles[0] : selectedFiles;
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setError(null);
    setSuccessMessage(null);
    setSignatures([]);

    try {
      const arrayBuffer = await uploadedFile.arrayBuffer();
      const pdf = await loadPdfDocument(arrayBuffer.slice(0));
      setPdfDoc(pdf);
      setNumPages(pdf.numPages);
      setCurrentPage(1);
    } catch (err) {
      console.error('Failed to load PDF for signing:', err);
      setError('Failed to parse PDF document. Please try another file.');
    }
  };

  useEffect(() => {
    if (!pdfDoc) return;

    let isMounted = true;
    setIsRendering(true);

    pdfDoc.getPage(currentPage).then(page => {
      if (!isMounted || !canvasRef.current) return;
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      page.render(renderContext).promise.then(() => {
        if (isMounted) setIsRendering(false);
      }).catch(err => {
        console.error("Page render error:", err);
        if (isMounted) setIsRendering(false);
      });
    }).catch(err => {
      console.error("Get page error:", err);
      if (isMounted) setIsRendering(false);
    });

    return () => {
      isMounted = false;
    };
  }, [pdfDoc, currentPage, scale]);

  const handleSignatureCreated = (sigDataUrl) => {
    const newSig = {
      id: Date.now(),
      page: currentPage,
      x: 50,
      y: 50,
      width: 180,
      height: 70,
      dataUrl: sigDataUrl
    };
    setSignatures(prev => [...prev, newSig]);
    setIsModalOpen(false);
  };

  const handleMouseDown = (e, index) => {
    e.stopPropagation();
    setDraggingIndex(index);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e) => {
    if (draggingIndex === null || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - containerRect.left - dragOffset.x;
    const y = e.clientY - containerRect.top - dragOffset.y;

    setSignatures(prev => prev.map((sig, idx) => {
      if (idx === draggingIndex) {
        return { ...sig, x: Math.max(0, x), y: Math.max(0, y) };
      }
      return sig;
    }));
  };

  const handleMouseUp = () => {
    setDraggingIndex(null);
  };

  const handleDeleteSignature = (id) => {
    setSignatures(prev => prev.filter(sig => sig.id !== id));
  };

  const handleFlattenSignatures = async () => {
    if (!file || signatures.length === 0) {
      setError("Please upload a PDF and place at least one signature.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const formattedSignatures = signatures.map(sig => ({
        page_index: sig.page - 1,
        x: sig.x / scale,
        y: sig.y / scale,
        width: sig.width / scale,
        height: sig.height / scale,
        image_data: sig.dataUrl
      }));

      formData.append('signatures', JSON.stringify(formattedSignatures));

      const responseBlob = await apiClient.postFormData('/sign/flatten', formData);
      apiClient.downloadBlob(responseBlob, `signed_${file.name}`);

      setSuccessMessage("Document successfully signed and flattened!");
    } catch (err) {
      console.error("Signature embedding failed:", err);
      setError(err.message || "Failed to embed signatures. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!file) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 animate-fadeIn">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition-colors"
          >
            <ChevronLeft className="w-5 h-5" /> Back to Dashboard
          </button>
          <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" /> Secure Offline Signing
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-600 shadow-inner">
              <PenTool className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Digital Document Signer</h2>
            <p className="text-slate-500 mt-1 max-w-md mx-auto">
              Draw, type, or upload your signature and securely stamp it onto any page of your PDF document.
            </p>
          </div>

          <FileUploadZone 
            onFilesSelected={handleFileSelected} 
            multiple={false}
            title="Drop your PDF to sign here"
            subtitle="Supports PDF documents up to 50MB"
          />
        </div>
      </div>
    );
  }

  const currentSignatures = signatures.filter(sig => sig.page === currentPage);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Exit
          </button>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span className="font-semibold text-slate-800 text-sm truncate max-w-xs">{file.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium text-sm transition-all shadow-md shadow-indigo-100"
          >
            <PenTool className="w-4 h-4" /> Add Signature
          </button>

          <button
            onClick={handleFlattenSignatures}
            disabled={isProcessing || signatures.length === 0}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white px-4 py-2 rounded-xl font-medium text-sm transition-all shadow-md"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Stamping...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Save & Flatten ({signatures.length})
              </>
            )}
          </button>
        </div>
      </header>

      {error && (
        <div className="max-w-4xl mx-auto mt-4 px-4 w-full">
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3 text-rose-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="max-w-4xl mx-auto mt-4 px-4 w-full">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 text-emerald-700">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center p-6 overflow-auto">
        <div className="bg-white/85 backdrop-blur-md border border-slate-200 rounded-2xl p-2 mb-6 flex items-center gap-4 shadow-sm">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-2 hover:bg-slate-100 disabled:opacity-40 rounded-lg text-slate-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-slate-700 px-3">
              Page {currentPage} of {numPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
              disabled={currentPage >= numPages}
              className="p-2 hover:bg-slate-100 disabled:opacity-40 rounded-lg text-slate-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200" />

          <div className="flex items-center gap-1">
            <button
              onClick={() => setScale(s => Math.max(0.6, s - 0.2))}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium text-slate-600 px-2">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale(s => Math.min(2.5, s + 0.2))}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div 
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="relative bg-white shadow-2xl rounded-2xl overflow-hidden border border-slate-200 mb-12"
        >
          {isRendering && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-20">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          )}

          <canvas ref={canvasRef} className="block" />

          {currentSignatures.map((sig, index) => {
            const actualIndex = signatures.findIndex(s => s.id === sig.id);
            return (
              <div
                key={sig.id}
                onMouseDown={(e) => handleMouseDown(e, actualIndex)}
                style={{
                  left: `${sig.x}px`,
                  top: `${sig.y}px`,
                  width: `${sig.width}px`,
                  height: `${sig.height}px`,
                }}
                className="absolute cursor-move border-2 border-indigo-500 bg-indigo-50/20 backdrop-blur-2xs rounded-lg shadow-lg group flex items-center justify-center p-1 select-none"
              >
                <img src={sig.dataUrl} alt="Signature" className="w-full h-full object-contain pointer-events-none" />
                
                <div className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white shadow-md border border-slate-200 rounded-full p-0.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteSignature(sig.id); }}
                    className="p-1 hover:bg-rose-50 text-rose-600 rounded-full transition-colors"
                    title="Delete Signature"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 text-[10px] bg-slate-900/70 text-white px-1.5 py-0.5 rounded">
                  Drag to move
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isModalOpen && (
        <SignatureModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSignatureCreated}
        />
      )}
    </div>
  );
}