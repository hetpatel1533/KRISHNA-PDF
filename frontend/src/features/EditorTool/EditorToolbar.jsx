import React from 'react';
import { 
  MousePointer, 
  Type, 
  FileText, 
  Trash2,
  PenTool,
  Undo,
  Highlighter
} from 'lucide-react';

export function EditorToolbar({ 
  activeTool, 
  setActiveTool, 
  strokeColor, 
  setStrokeColor, 
  fontSize, 
  setFontSize,
  onClearAnnotations,
  onOpenSignatureModal,
  onUndo,
  undoDisabled
}) {
  const tools = [
    { id: 'select', name: 'Select / Move Element', icon: MousePointer },
    { id: 'true-text', name: 'Form Filler & True Text Edit', icon: FileText },
    { id: 'text', name: 'Add Live Text Box', icon: Type },
    { id: 'highlight', name: 'Text Highlighter', icon: Highlighter },
  ];

  const colors = ['#2563EB', '#E11D48', '#16A34A', '#D97706', '#9333EA', '#0F172A'];
  const fontSizes = [10, 12, 14, 16, 18, 24, 32, 48];

  return (
    <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex flex-wrap items-center justify-between gap-4 border border-slate-800 animate-fadeIn">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                title={tool.name}
                className={`p-2.5 rounded-lg transition-all flex items-center justify-center ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>

        <div className="h-6 w-px bg-slate-800 hidden sm:block" />

        <button
          onClick={onOpenSignatureModal}
          className="flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all active:scale-95"
          title="Add Digital Signature"
        >
          <PenTool className="w-4 h-4" />
          <span>Add Signature</span>
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium hidden lg:inline">Color:</span>
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setStrokeColor(color)}
                style={{ backgroundColor: color }}
                aria-label={`Select color ${color}`}
                className={`w-5 h-5 rounded-full transition-all ${
                  strokeColor === color 
                    ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900 scale-110' 
                    : 'hover:scale-105 border border-slate-600'
                }`}
              />
            ))}
          </div>
        </div>

        {activeTool === 'text' && (
          <div className="flex items-center gap-2">
            <label htmlFor="font-size-select" className="text-xs text-slate-400 font-medium hidden lg:inline">Size:</label>
            <select
              id="font-size-select"
              name="fontSize"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {fontSizes.map((size) => (
                <option key={size} value={size}>{size} px</option>
              ))}
            </select>
          </div>
        )}

        <div className="h-6 w-px bg-slate-800" />

        <div className="flex items-center gap-2">
          <button
            onClick={onUndo}
            disabled={undoDisabled}
            title="Undo Last Action (CTRL + Z)"
            className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-35 disabled:cursor-not-allowed transition-all border border-slate-700 flex items-center justify-center"
          >
            <Undo className="w-4 h-4" />
          </button>

          <button
            onClick={onClearAnnotations}
            title="Clear All Changes on Page"
            aria-label="Clear Annotations"
            className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-all border border-slate-700 flex items-center justify-center"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
