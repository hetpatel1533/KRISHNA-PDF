import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut,
  Layers,
  Edit3,
  Trash2
} from 'lucide-react';
import { FileUploadZone } from '../../components/FileUploadZone';
import { EditorToolbar } from './EditorToolbar';
import { SignatureModal } from '../SignTool/SignatureModal';
import { apiClient } from '../../utils/apiClient';
import { loadPdfDocument, renderPageToCanvas } from '../../utils/pdfWorker';

export function EditorWorkspace({ onBack }) {
  const [file, setFile] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.25);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [activeTool, setActiveTool] = useState('select');
  const [strokeColor, setStrokeColor] = useState('#2563EB');
  const [fontSize, setFontSize] = useState(16);

  // Unified live interactive elements
  const [elements, setElements] = useState([]);
  const [textEdits, setTextEdits] = useState([]);
  const [textBlocks, setTextBlocks] = useState({});
  
  // Undo history state stack
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);

  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Drag & Resize state management
  const [activeDragId, setActiveDragId] = useState(null);
  const [activeResizeId, setActiveResizeId] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 });

  const canvasContainerRef = useRef(null);
  const pdfCanvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);

  const handleFileNormalized = async (selectedFile) => {
    if (!selectedFile) return;
    let targetFile = selectedFile;
    const fileName = (targetFile.name || 'document.pdf').toLowerCase();
    const fileType = (targetFile.type || '').toLowerCase();
    
    if (fileName.endsWith('.doc') || fileName.endsWith('.docx') || fileType.includes('word')) {
      setError('PDF Editor only accepts PDF documents. Please use the Word to PDF menu for Word documents.');
      return;
    }
    setFile(targetFile);
  };

  // Synchronize dynamic text values back to target structural edits representation before commit
  const syncTextEdits = (nextElements, currentEdits) => {
    return currentEdits.map(edit => {
      const matchingEl = nextElements.find(el => 
        el.isTrueText && 
        el.page === edit.page_index + 1 && 
        el.originalBbox && 
        el.originalBbox.toString() === edit.bbox.toString()
      );
      if (matchingEl) {
        return { ...edit, new_text: matchingEl.text };
      }
      return edit;
    });
  };

  // Function to register elements & push to undo stack with synchronized edit states
  const updateElementsAndHistory = (nextElements, nextTextEdits = textEdits) => {
    const syncedEdits = syncTextEdits(nextElements, nextTextEdits);
    setElements(nextElements);
    setTextEdits(syncedEdits);

    const slicedHistory = history.slice(0, historyStep + 1);
    const newEntry = {
      elements: JSON.parse(JSON.stringify(nextElements)),
      textEdits: JSON.parse(JSON.stringify(syncedEdits)),
    };
    
    setHistory([...slicedHistory, newEntry]);
    setHistoryStep(slicedHistory.length);
  };

  // Auto-select standard yellow highlight color for bright contrasting readability
  useEffect(() => {
    if (activeTool === 'highlight') {
      setStrokeColor('#FACC15');
    }
  }, [activeTool]);

  // CTRL+Z Handler
  const handleUndo = () => {
    if (historyStep > 0) {
      const prevStep = historyStep - 1;
      setHistoryStep(prevStep);
      setElements(JSON.parse(JSON.stringify(history[prevStep].elements)));
      setTextEdits(JSON.parse(JSON.stringify(history[prevStep].textEdits)));
    } else if (historyStep === 0) {
      setHistoryStep(-1);
      setElements([]);
      setTextEdits([]);
    }
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [history, historyStep]);

  useEffect(() => {
    if (!file) return;
    let isMounted = true;

    async function loadPdf() {
      setLoading(true);
      setError(null);
      try {
        const buffer = await file.arrayBuffer();
        const doc = await loadPdfDocument(buffer.slice(0));
        if (!isMounted) return;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
        setElements([]);
        setTextEdits([]);
        setHistory([]);
        setHistoryStep(-1);

        // Load true text blocks from API
        const formData = new FormData();
        formData.append('file', file);
        const blocksRes = await apiClient.postFormData('/extract-text-blocks', formData);
        const blocksText = await new Response(blocksRes).text();
        const blocksJson = JSON.parse(blocksText);
        const blocksMap = {};
        blocksJson.forEach(item => {
          blocksMap[item.page_index + 1] = item.blocks;
        });
        if (isMounted) setTextBlocks(blocksMap);
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load PDF document.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadPdf();
    return () => { isMounted = false; };
  }, [file]);

  useEffect(() => {
    if (!pdfDoc) return;
    let isMounted = true;

    async function renderPage() {
      try {
        if (!isMounted || !pdfCanvasRef.current) return;
        await renderPageToCanvas(pdfDoc, currentPage, pdfCanvasRef.current, scale);
        renderOverlay();
      } catch (err) {
        console.error('Error rendering page:', err);
      }
    }

    renderPage();
    return () => { isMounted = false; };
  }, [pdfDoc, currentPage, scale, textEdits]);

  const renderOverlay = () => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (pdfCanvasRef.current) {
      canvas.width = pdfCanvasRef.current.width;
      canvas.height = pdfCanvasRef.current.height;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render White-out blocks directly over covered original PDF texts for seamless visual feedback
    const pageEdits = textEdits.filter(e => e.page_index === currentPage - 1);
    pageEdits.forEach(edit => {
      if (edit.bbox) {
        const [x0, y0, x1, y1] = edit.bbox;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(
          x0 * scale,
          y0 * scale,
          (x1 - x0) * scale,
          (y1 - y0) * scale
        );
      }
    });
  };

  const handleCanvasClick = (e) => {
    if (!overlayCanvasRef.current) return;
    const rect = overlayCanvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    if (activeTool === 'text') {
      const newEl = {
        id: `text-${Date.now()}`,
        type: 'text',
        page: currentPage,
        x,
        y: y - 8,
        width: 140,
        height: 25,
        text: 'Live text annotation',
        fontSize: fontSize,
        color: strokeColor
      };
      updateElementsAndHistory([...elements, newEl]);
      setEditingId(newEl.id);
      setActiveTool('select');
    } else if (activeTool === 'highlight') {
      const newEl = {
        id: `highlight-${Date.now()}`,
        type: 'highlight',
        page: currentPage,
        x: x - 60,
        y: y - 10,
        width: 120,
        height: 20,
        color: strokeColor === '#0F172A' ? '#FACC15' : strokeColor,
        opacity: 0.35
      };
      updateElementsAndHistory([...elements, newEl]);
    }
  };

  const handleTrueTextBlockClick = (block) => {
    const editItem = {
      page_index: currentPage - 1,
      bbox: block.bbox,
      old_text: block.text,
      new_text: block.text,
      font_size: block.size,
      is_widget: block.is_widget || false,
      field_name: block.field_name || ''
    };

    const newEl = {
      id: `truetext-${Date.now()}`,
      type: 'text',
      page: currentPage,
      x: block.bbox[0],
      y: block.bbox[1],
      width: Math.max(block.bbox[2] - block.bbox[0], 150),
      height: block.bbox[3] - block.bbox[1],
      text: block.text,
      fontSize: block.size || 12,
      color: '#0F172A',
      isTrueText: true,
      originalBbox: block.bbox
    };

    const nextEdits = [
      ...textEdits.filter(e => !(e.page_index === currentPage - 1 && e.bbox.toString() === block.bbox.toString())),
      editItem
    ];
    const nextElements = [...elements, newEl];

    updateElementsAndHistory(nextElements, nextEdits);
    setEditingId(newEl.id);
    setActiveTool('select');
  };

  const handleElementMouseDown = (e, el) => {
    if (activeTool !== 'select') return;
    e.stopPropagation();
    setActiveDragId(el.id);
    const rect = canvasContainerRef.current.getBoundingClientRect();
    setDragStart({
      x: (e.clientX - rect.left) / scale - el.x,
      y: (e.clientY - rect.top) / scale - el.y
    });
  };

  const handleResizeMouseDown = (e, el) => {
    e.stopPropagation();
    setActiveResizeId(el.id);
    setDragStart({
      x: e.clientX,
      y: e.clientY
    });
    setInitialSize({
      width: el.width || 120,
      height: el.height || 24
    });
  };

  const handleContainerMouseMove = (e) => {
    if (activeDragId) {
      const rect = canvasContainerRef.current.getBoundingClientRect();
      const curX = (e.clientX - rect.left) / scale - dragStart.x;
      const curY = (e.clientY - rect.top) / scale - dragStart.y;
      
      setElements(prev => prev.map(el => {
        if (el.id === activeDragId) {
          return { ...el, x: Math.max(0, curX), y: Math.max(0, curY) };
        }
        return el; 
      }));
    } else if (activeResizeId) {
      const dx = (e.clientX - dragStart.x) / scale;
      const dy = (e.clientY - dragStart.y) / scale;
      
      setElements(prev => prev.map(el => {
        if (el.id === activeResizeId) {
          return {
            ...el,
            width: Math.max(20, initialSize.width + dx),
            height: Math.max(15, initialSize.height + dy)
          };
        }
        return el;
      }));
    }
  };

  const handleContainerMouseUp = () => {
    if (activeDragId || activeResizeId) {
      setActiveDragId(null);
      setActiveResizeId(null);
      updateElementsAndHistory([...elements]);
    }
  };

  const handleExport = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    try {
      let currentFile = file;
      const finalEdits = syncTextEdits(elements, textEdits);

      if (finalEdits.length > 0) {
        const textFormData = new FormData();
        textFormData.append('file', currentFile);
        textFormData.append('edits', JSON.stringify(finalEdits));
        const textRes = await apiClient.postFormData('/apply-text-edits', textFormData);
        currentFile = new File([textRes], file.name, { type: 'application/pdf' });
      }

      const formattedAnnotations = [];
      elements.forEach(el => {
        if (el.type === 'text' || el.type === 'highlight') {
          formattedAnnotations.push({
            page_index: el.page - 1,
            type: el.type,
            x: el.x,
            y: el.y,
            width: el.width || 120,
            height: el.height || 24,
            text: el.text || '',
            content: el.text || '',
            color: el.color || '#000000',
            font_size: el.fontSize || 14,
            opacity: el.type === 'highlight' ? 0.35 : 1.0
          });
        }
      });

      if (formattedAnnotations.length > 0) {
        const formData = new FormData();
        formData.append('file', currentFile);
        formData.append('annotations', JSON.stringify(formattedAnnotations));
        const responseBlob = await apiClient.postFormData('/edit/export', formData);
        currentFile = new File([responseBlob], file.name, { type: 'application/pdf' });
      }

      const sigElements = elements.filter(el => el.type === 'signature');
      if (sigElements.length > 0) {
        const sigFormData = new FormData();
        sigFormData.append('file', currentFile);
        const formattedSignatures = sigElements.map(sig => ({
          page_index: sig.page - 1,
          x: sig.x,
          y: sig.y,
          width: sig.width,
          height: sig.height,
          image_data: sig.dataUrl
        }));
        sigFormData.append('signatures', JSON.stringify(formattedSignatures));
        const sigRes = await apiClient.postFormData('/sign/flatten', sigFormData);
        currentFile = new File([sigRes], file.name, { type: 'application/pdf' });
      }

      apiClient.downloadBlob(currentFile, `edited_${file.name}`);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to export document.');
    } finally {
      setProcessing(false);
    }
  };

  if (!file) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-6">
        <button onClick={onBack} className="mb-6 flex items-center text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </button>
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/85 p-10">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-rose-50 border border-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Edit3 className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">PDF Editor & Form Filler</h2>
            <p className="text-slate-600 mt-2 max-w-lg mx-auto">
              Fill out forms, edit true text blocks, add text annotations, and place movable signatures anywhere in your PDF document.
            </p>
          </div>
          <FileUploadZone 
            onFilesSelected={(f) => handleFileNormalized(Array.isArray(f) ? f[0] : f)}
            multiple={false}
            accept=".pdf,application/pdf"
            title="Upload PDF to Edit"
            subtitle="Drag & drop your PDF document here (PDF only)"
          />
        </div>
      </div>
    );
  }

  const pageBlocks = textBlocks[currentPage] || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-lg sticky top-0 z-45">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white font-bold shadow-md">
              Ed
            </div>
            <div>
              <h2 className="font-bold text-white text-sm flex items-center truncate max-w-sm">
                {file.name}
              </h2>
              <p className="text-xs text-slate-400">PDF Editor &bull; {numPages} Pages</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button onClick={() => setFile(null)} className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all">
            Change File
          </button>
          <button
            onClick={handleExport}
            disabled={processing}
            className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all disabled:opacity-50"
          >
            {processing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>Save & Download PDF</span>
          </button>
        </div>
      </header>

      {error && <div className="bg-rose-950 border border-rose-800 text-rose-200 px-6 py-3 text-sm flex items-center gap-2"><AlertCircle className="w-5 h-5" /><span>{error}</span></div>}
      {success && <div className="bg-emerald-950 border border-emerald-800 text-emerald-200 px-6 py-3 text-sm flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /><span>Document exported successfully!</span></div>}

      <div className="flex-1 flex flex-col lg:flex-row">
        <div className="w-full lg:w-72 bg-slate-900 border-r border-slate-800 p-4 overflow-y-auto flex flex-col space-y-3 max-h-[calc(100vh-80px)]">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Page Navigator</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          {Array.from({ length: numPages }).map((_, idx) => {
            const pageNum = idx + 1;
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between border ${
                  currentPage === pageNum 
                    ? 'bg-indigo-600/20 border-indigo-500 text-white font-semibold shadow-md' 
                    : 'bg-slate-800/50 border-slate-800 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <span className="text-xs">Page {pageNum}</span>
                <span className="text-[10px] text-slate-400">PDF</span>
              </button>
            );
          })} 
        </div>

        <div className="flex-1 bg-slate-950 p-6 flex flex-col items-center relative overflow-hidden">
          <div className="mb-6 w-full max-w-4xl">
            <EditorToolbar 
              activeTool={activeTool}
              setActiveTool={setActiveTool}
              strokeColor={strokeColor}
              setStrokeColor={setStrokeColor}
              fontSize={fontSize}
              setFontSize={setFontSize}
              onClearAnnotations={() => updateElementsAndHistory([], [])}
              onOpenSignatureModal={() => setIsSignModalOpen(true)}
              onUndo={handleUndo}
              undoDisabled={historyStep < 0}
            />
          </div>

          <div className="absolute top-24 right-8 z-30 flex items-center space-x-2 bg-slate-900/90 border border-slate-800 p-1.5 rounded-xl shadow-2xl backdrop-blur-md">
            <button onClick={() => setScale(s => Math.max(0.6, s - 0.2))} className="p-2 text-slate-300 hover:text-white"><ZoomOut className="w-4 h-4" /></button>
            <span className="text-xs font-semibold text-slate-200 px-2">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.min(2.5, s + 0.2))} className="p-2 text-slate-300 hover:text-white"><ZoomIn className="w-4 h-4" /></button>
          </div>

          <div 
            ref={canvasContainerRef} 
            onMouseMove={handleContainerMouseMove}
            onMouseUp={handleContainerMouseUp}
            onMouseLeave={handleContainerMouseUp}
            className="relative shadow-2xl rounded-2xl overflow-auto border border-slate-800 bg-white max-h-[70vh] select-none"
          >
            <canvas ref={pdfCanvasRef} className="block shadow-xl" />
            <canvas 
              ref={overlayCanvasRef} 
              onClick={handleCanvasClick}
              className={`absolute top-0 left-0 z-20 ${
                (activeTool === 'text' || activeTool === 'highlight') ? 'cursor-crosshair' : 'pointer-events-none'
              }`}
            />

            {/* Visual highlight boxes on matching true PDF text blocks */}
            {(activeTool === 'true-text' || activeTool === 'highlight') && pageBlocks.map((b, i) => {
              const [x0, y0, x1, y1] = b.bbox;
              const isEdited = textEdits.some(e => e.page_index === currentPage - 1 && e.bbox.toString() === b.bbox.toString());
              if (isEdited) return null;
              
              const isHighlightMode = activeTool === 'highlight';
              return (
                <div
                  key={i}
                  onClick={() => {
                    if (isHighlightMode) {
                      const newEl = {
                        id: `highlight-${Date.now()}`,
                        type: 'highlight',
                        page: currentPage,
                        x: b.bbox[0],
                        y: b.bbox[1],
                        width: b.bbox[2] - b.bbox[0],
                        height: b.bbox[3] - b.bbox[1],
                        color: strokeColor === '#0F172A' ? '#FACC15' : strokeColor,
                        opacity: 0.35
                      };
                      updateElementsAndHistory([...elements, newEl]);
                    } else {
                      handleTrueTextBlockClick(b);
                    }
                  }}
                  style={{ 
                    left: `${x0 * scale}px`,
                    top: `${y0 * scale}px`,
                    width: `${Math.max((x1 - x0) * scale, 30)}px`,
                    height: `${Math.max((y1 - y0) * scale, 15)}px`,
                  }}
                  className={`absolute z-30 border cursor-pointer flex items-center px-1 shadow-sm transition-all ${ 
                    isHighlightMode
                      ? 'bg-yellow-400/20 hover:bg-yellow-400/40 border-yellow-400/50 hover:scale-[1.01]' 
                      : 'bg-indigo-500/20 hover:bg-indigo-500/40 border-indigo-500/60' 
                  }`}
                  title={isHighlightMode ? "Click to Highlight Text" : "Click to modify live"}
                />
              );
            })}

            {/* Interactive draggable/editable element stack (Texts, Highlights, Signatures) */}
            {elements.filter(el => el.page === currentPage).map((el) => {
              const isEditing = editingId === el.id;
              return (
                <div
                  key={el.id}
                  onMouseDown={(e) => handleElementMouseDown(e, el)}
                  onDoubleClick={() => {
                    if (el.type === 'text') {
                      setEditingId(el.id);
                    }
                  }}
                  style={{
                    left: `${el.x * scale}px`,
                    top: `${el.y * scale}px`,
                    width: el.type === 'text'
                      ? `${Math.max(el.width || 120, el.text.length * (el.fontSize || 14) * 0.6) * scale}px`
                      : `${(el.width || 120) * scale}px`,
                    height: `${(el.height || 24) * scale}px`,
                  }}
                  className={`absolute z-30 flex items-center justify-center select-none group ${
                    el.type === 'highlight'
                      ? 'hover:ring-1 hover:ring-yellow-400'
                      : el.type === 'signature'
                      ? 'border border-indigo-500 bg-indigo-50/10 hover:bg-indigo-50/20'
                      : 'border border-transparent hover:border-indigo-400 hover:bg-indigo-50/10'
                  } ${activeTool === 'select' ? 'cursor-move' : ''}`}
                >
                  {el.type === 'text' && (
                    <div className="w-full h-full flex items-center px-1 overflow-visible">
                      {isEditing ? (
                        <input
                          type="text"
                          value={el.text}
                          autoFocus
                          onChange={(e) => {
                            const val = e.target.value;
                            setElements(prev => prev.map(item => item.id === el.id ? { ...item, text: val } : item));
                          }}
                          onBlur={() => {
                            setEditingId(null);
                            updateElementsAndHistory([...elements]);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setEditingId(null);
                              updateElementsAndHistory([...elements]);
                            }
                          }}
                          className="w-full h-full bg-white text-slate-900 border border-indigo-500 rounded px-1.5 py-0.5 outline-none shadow-md font-medium"
                          style={{
                            color: el.color,
                            fontSize: `${(el.fontSize || 14) * scale}px`,
                          }}
                        />
                      ) : (
                        <span 
                          className="truncate w-full font-medium"
                          style={{ 
                            color: el.color, 
                            fontSize: `${(el.fontSize || 14) * scale}px`,
                            lineHeight: 1
                          }}
                        >
                          {el.text}
                        </span>
                      )}
                    </div>
                  )}

                  {el.type === 'highlight' && (
                    <div 
                      className="w-full h-full pointer-events-none" 
                      style={{ 
                        backgroundColor: el.color || '#FACC15', 
                        opacity: 0.35, 
                        mixBlendMode: 'multiply' 
                      }} 
                    />
                  )}

                  {el.type === 'signature' && (
                    <img src={el.dataUrl} alt="Signature" className="w-full h-full object-contain pointer-events-none" />
                  )}

                  {/* Remove Element Button */}
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => {
                      const updated = elements.filter(item => item.id !== el.id);
                      let nextEdits = textEdits;
                      if (el.isTrueText && el.originalBbox) {
                        nextEdits = textEdits.filter(e => !(e.page_index === currentPage - 1 && e.bbox.toString() === el.originalBbox.toString()));
                      }
                      updateElementsAndHistory(updated, nextEdits);
                    }}
                    className="absolute -top-3.5 -right-3.5 bg-rose-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-rose-700 z-40"
                    title="Remove change"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>

                  {/* Resize element handle (for highlighters & signatures) */}
                  {el.type !== 'text' && (
                    <div
                      onMouseDown={(e) => handleResizeMouseDown(e, el)}
                      className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-indigo-600 border border-white cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity rounded-bl shadow-md z-40"
                      title="Drag to resize"
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex items-center space-x-4 bg-slate-900 border border-slate-800 px-6 py-3 rounded-2xl shadow-xl">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1} className="p-2 text-slate-300 disabled:opacity-30 hover:text-white"><ChevronLeft className="w-5 h-5" /></button>
            <span className="text-xs font-semibold text-slate-300">Page {currentPage} of {numPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))} disabled={currentPage >= numPages} className="p-2 text-slate-300 disabled:opacity-30 hover:text-white"><ChevronRight className="w-5 h-5" /></button>
          </div>
        </div>
      </div>

      {isSignModalOpen && (
        <SignatureModal 
          isOpen={isSignModalOpen}
          onClose={() => setIsSignModalOpen(false)}
          onSave={(dataUrl) => {
            const newSig = {
              id: `sig-${Date.now()}`,
              page: currentPage,
              type: 'signature',
              x: 120,
              y: 120,
              width: 160,
              height: 65,
              dataUrl
            };
            updateElementsAndHistory([...elements, newSig]);
          }}
        />
      )}
    </div>
  );
}
