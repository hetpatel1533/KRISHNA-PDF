import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  PenTool, 
  Type, 
  Upload as UploadIcon, 
  RotateCcw, 
  Check, 
  AlertCircle 
} from 'lucide-react';

export function SignatureModal({ isOpen, onClose, onSave }) {
  const [activeTab, setActiveTab] = useState('draw'); // 'draw', 'type', 'upload'

  // Draw state
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Type state
  const [typedText, setTypedText] = useState('');
  const [selectedFont, setSelectedFont] = useState('font-signature-1');

  // Upload state
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadError, setUploadError] = useState('');

  const handwritingFonts = [
    { id: 'font-signature-1', name: 'Caveat', className: 'font-signature' },
    { id: 'font-signature-2', name: 'Great Vibes', className: 'font-signature' },
    { id: 'font-signature-3', name: 'Sacramento', className: 'font-signature' },
    { id: 'font-signature-4', name: 'Dancing Script', className: 'font-signature' },
  ];

  useEffect(() => {
    if (activeTab === 'draw' && isOpen) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [activeTab, isOpen]);

  if (!isOpen) return null;

  // Drawing Handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    if (clientX === undefined || clientY === undefined) return;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    if (clientX === undefined || clientY === undefined) return;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // File Upload Handler
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload a valid image file (PNG, JPG, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size should be less than 5MB');
      return;
    }

    setUploadError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target?.result);
    };
    reader.readAsDataURL(file);
  };

  // Save Signature
  const handleSave = () => {
    if (activeTab === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) return;
      const dataUrl = canvas.toDataURL('image/png');
      onSave(dataUrl);
    } else if (activeTab === 'type') {
      if (!typedText.trim()) return;
      
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 150;
      const ctx = canvas.getContext('2d');
      ctx.font = '48px "Great Vibes", cursive, sans-serif';
      ctx.fillStyle = '#0F172A';
      ctx.textBaseline = 'middle';
      ctx.fillText(typedText, 20, 75);
      
      const dataUrl = canvas.toDataURL('image/png');
      onSave(dataUrl);
    } else if (activeTab === 'upload') {
      if (!uploadedImage) return;
      onSave(uploadedImage);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <PenTool className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-800 text-lg">Create Electronic Signature</h3>
          </div>
          <button 
            onClick={onClose}
            aria-label="Close Signature Modal"
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/30 px-6 pt-2 space-x-2">
          <button
            onClick={() => setActiveTab('draw')}
            className={`flex items-center space-x-2 pb-3 px-4 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'draw'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>Draw</span>
          </button>
          <button
            onClick={() => setActiveTab('type')}
            className={`flex items-center space-x-2 pb-3 px-4 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'type'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Type className="w-4 h-4" />
            <span>Type</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center space-x-2 pb-3 px-4 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'upload'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UploadIcon className="w-4 h-4" />
            <span>Upload Image</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1">
          {activeTab === 'draw' && (
            <div className="space-y-4">
              <div className="relative border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 overflow-hidden flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  width={440}
                  height={180}
                  className="cursor-crosshair touch-none bg-white rounded-lg shadow-sm m-2"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                {!hasDrawn && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-sm">
                    Sign inside the box using mouse or touch
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Use your mouse or finger to draw signature</span>
                <button
                  onClick={clearCanvas}
                  className="flex items-center space-x-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Signature</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'type' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="typed-signature-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Type Your Name / Initials
                </label>
                <input
                  id="typed-signature-input"
                  name="typedSignature"
                  type="text"
                  value={typedText}
                  onChange={(e) => setTypedText(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Select Handwriting Style
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {handwritingFonts.map((font) => (
                    <div
                      key={font.id}
                      onClick={() => setSelectedFont(font.id)}
                      className={`p-4 border rounded-xl cursor-pointer text-center text-2xl transition-all ${
                        selectedFont === font.id
                          ? 'border-indigo-600 bg-indigo-50/30 text-indigo-900 shadow-sm'
                          : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300'
                      }`}
                      style={{ fontFamily: font.name === 'Great Vibes' ? '"Great Vibes", cursive' : 'cursive' }}
                    >
                      {typedText || 'Signature'}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors relative">
                <input
                  id="signature-upload-file"
                  name="signatureFile"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  aria-label="Upload signature image file"
                />
                {uploadedImage ? (
                  <div className="space-y-3 flex flex-col items-center">
                    <img 
                      src={uploadedImage} 
                      alt="Uploaded Signature" 
                      className="max-h-28 object-contain bg-white p-2 rounded-lg border border-slate-200 shadow-sm"
                    />
                    <span className="text-xs text-indigo-600 font-medium">Click or drag to replace image</span>
                  </div>
                ) : (
                  <div className="space-y-3 flex flex-col items-center">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full">
                      <UploadIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">Click to upload signature image</p>
                      <p className="text-xs text-slate-400 mt-1">PNG, JPG with transparent background recommended (Max 5MB)</p>
                    </div>
                  </div>
                )}
              </div>
              {uploadError && (
                <div className="flex items-center space-x-2 text-xs text-rose-600 bg-rose-50 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={
              (activeTab === 'draw' && !hasDrawn) ||
              (activeTab === 'type' && !typedText.trim()) ||
              (activeTab === 'upload' && !uploadedImage)
            }
            className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Add Signature</span>
          </button>
        </div>

      </div>
    </div>
  );
}
