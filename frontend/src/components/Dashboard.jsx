import React from 'react';
import { 
  GitMerge, 
  Scissors, 
  Minimize2, 
  PenTool, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  FileCheck2,
  Layers,
  Lock,
  FileCode,
  Hash,
  Unlock,
  Image as ImageIcon,
  Edit3,
  ShieldAlert,
  Eraser,
  ScanText,
  EyeOff,
  Wrench,
  FileText
} from 'lucide-react';

export function Dashboard({ onSelectTool, currentUser }) {
  const isAdmin = currentUser && (currentUser.email === 'hetpatel1533@gmail.com' || currentUser.isAdmin);

  const customTools = (() => {
    try {
      return JSON.parse(localStorage.getItem('agent_krishna_custom_tools') || '[]');
    } catch (e) {
      return [];
    }
  })();

  const deletedMenus = (() => {
    try {
      return JSON.parse(localStorage.getItem('agent_krishna_deleted_menus') || '[]');
    } catch (e) {
      return [];
    }
  })();

  const defaultTools = [
    {
      id: 'repair',
      name: 'Repair PDF',
      description: 'Upload a corrupt PDF and we will try to fix it. Recover partial or complete document streams successfully.',
      icon: Wrench,
      color: 'from-amber-600 to-orange-600',
      badge: 'Recovery',
      lightBg: 'bg-amber-50 text-amber-700 border-amber-100',
      accentColor: '#D97706'
    },
    {
      id: 'pdf-to-markdown',
      name: 'PDF to Markdown',
      description: 'Turn PDF into clean .md file in seconds. Headings, tables, and lists stay intact for LLMs.',
      icon: FileText,
      color: 'from-blue-600 to-teal-600',
      badge: 'Converter',
      lightBg: 'bg-blue-50 text-blue-700 border-blue-100',
      accentColor: '#2563EB'
    },
    {
      id: 'ocr-pdf',
      name: 'OCR PDF',
      description: 'Convert non-selectable PDF files into selectable and searchable PDF with high accuracy.',
      icon: ScanText,
      color: 'from-blue-500 to-cyan-600',
      badge: 'OCR Pro',
      lightBg: 'bg-blue-50 text-blue-700 border-blue-100',
      accentColor: '#3B82F6'
    },
    {
      id: 'redact-pdf',
      name: 'Redact PDF',
      description: 'Permanently remove sensitive content and confidential information from PDFs.',
      icon: EyeOff,
      color: 'from-rose-600 to-red-700',
      badge: 'Security',
      lightBg: 'bg-rose-50 text-rose-700 border-rose-100',
      accentColor: '#E11D48'
    },
    {
      id: 'watermark-remover',
      name: 'Remove Watermark',
      description: 'Automatically scan and remove text or image watermarks from PDF, Word, Image, and XML pages.',
      icon: Eraser,
      color: 'from-rose-500 to-orange-600',
      badge: 'Security',
      lightBg: 'bg-rose-50 text-rose-600 border-rose-100',
      accentColor: '#F43F5E'
    },
    {
      id: 'organizer',
      name: 'Page Organizer',
      description: 'Visual drag-and-drop grid preview to rotate, reorder, and delete individual PDF pages instantly.',
      icon: Layers,
      color: 'from-indigo-500 to-indigo-600',
      badge: 'Interactive',
      lightBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      accentColor: '#6366F1'
    },
    {
      id: 'editor',
      name: 'PDF Editor',
      description: 'Edit PDF by adding text, shapes, comments and highlights. ILovePDF-grade visual PDF editor.',
      icon: Edit3,
      color: 'from-blue-600 to-indigo-600',
      badge: 'Interactive',
      lightBg: 'bg-blue-50 text-blue-600 border-blue-100',
      accentColor: '#2563EB'
    },
    {
      id: 'unlock',
      name: 'Unlock PDF',
      description: 'Remove security passwords and encryption from your PDF documents instantly with zero restrictions.',
      icon: Unlock,
      color: 'from-amber-500 to-amber-600',
      badge: 'Security',
      lightBg: 'bg-amber-50 text-amber-600 border-amber-100',
      accentColor: '#F59E0B'
    },
    {
      id: 'page-numbers',
      name: 'Add Page Numbers',
      description: 'Insert professional page numbers anywhere on your PDF pages with custom formatting and position control.',
      icon: Hash,
      color: 'from-blue-500 to-indigo-600',
      badge: 'Popular',
      lightBg: 'bg-blue-50 text-blue-600 border-blue-100',
      accentColor: '#3B82F6'
    },
    {
      id: 'pdf-to-jpg',
      name: 'PDF to JPG',
      description: 'Convert every PDF page into high-resolution JPG or PNG image files packaged into a convenient ZIP archive.',
      icon: ImageIcon,
      color: 'from-emerald-500 to-teal-600',
      badge: 'Converter',
      lightBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      accentColor: '#10B981'
    },
    {
      id: 'security',
      name: 'Security & Watermark',
      description: 'Add owner/user passwords, encryption, and custom text or image watermarks with full transparency control.',
      icon: Lock,
      color: 'from-rose-500 to-rose-600',
      badge: 'Protected',
      lightBg: 'bg-rose-50 text-rose-600 border-rose-100',
      accentColor: '#E11D48'
    },
    {
      id: 'converter',
      name: 'Format Converter',
      description: 'Convert your PDF into Word (.docx), high-resolution images (.png/.jpg), or plain text (.txt).',
      icon: FileCode,
      color: 'from-purple-500 to-purple-600',
      badge: 'Versatile',
      lightBg: 'bg-purple-50 text-purple-600 border-purple-100',
      accentColor: '#8B5CF6'
    },
    {
      id: 'merge',
      name: 'Merge PDF',
      description: 'Combine multiple PDF files into a single, high-performance document in your preferred order.',
      icon: GitMerge,
      color: 'from-blue-500 to-blue-600',
      badge: 'Popular',
      lightBg: 'bg-blue-50 text-blue-600 border-blue-100',
      accentColor: '#3B82F6'
    },
    {
      id: 'split',
      name: 'Split PDF',
      description: 'Extract specific page ranges, split individual pages, or generate multi-part ZIP archives effortlessly.',
      icon: Scissors,
      color: 'from-teal-500 to-teal-600',
      badge: 'Precise',
      lightBg: 'bg-teal-50 text-teal-600 border-teal-100',
      accentColor: '#14B8A6'
    },
    {
      id: 'compress',
      name: 'Compress PDF',
      description: 'Optimize file size intelligently using PyMuPDF stream recompression and image quantization presets.',
      icon: Minimize2,
      color: 'from-emerald-500 to-emerald-600',
      badge: 'High Savings',
      lightBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      accentColor: '#10B981'
    },
    {
      id: 'sign',
      name: 'Digital Signer',
      description: 'Draw, type, or upload your electronic signature and stamp it securely onto any page of your PDF document.',
      icon: PenTool,
      color: 'from-violet-500 to-purple-600',
      badge: 'Sign',
      lightBg: 'bg-violet-50 text-violet-600 border-violet-100',
      accentColor: '#8B5CF6'
    }
  ];

  const adminToolItem = isAdmin ? [{
    id: 'admin',
    name: 'Admin Deployment Panel',
    description: 'Exclusive Admin console for system settings, role security, menu management, and cloud server deployment.',
    icon: ShieldAlert,
    color: 'from-rose-600 to-purple-700',
    badge: 'Admin Only',
    lightBg: 'bg-rose-50 text-rose-700 border-rose-200',
    accentColor: '#E11D48'
  }] : [];

  const mappedCustomTools = customTools
    .filter(t => !deletedMenus.includes(t.id))
    .map(t => ({
      id: t.id,
      name: t.name,
      description: t.description || 'Custom AI generated feature workspace.',
      icon: Sparkles,
      color: 'from-purple-600 to-indigo-600',
      badge: t.badge || 'AI Custom',
      lightBg: 'bg-purple-50 text-purple-700 border-purple-200',
      accentColor: '#9333EA'
    }));

  const filteredDefaultTools = defaultTools.filter(t => !deletedMenus.includes(t.id));

  const tools = [
    ...adminToolItem,
    ...mappedCustomTools,
    ...filteredDefaultTools
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-12 shadow-2xl mb-12 border border-slate-800">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
            <span>KRISHNA Autonomous Offline PDF Suite &bull; ILovePDF Edition</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
            Professional PDF Tools, <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-400 via-rose-300 to-indigo-200 bg-clip-text text-transparent">
              100% Client-Side & Secure
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg mb-8 leading-relaxed">
            Execute high-performance document manipulation powered by Python FastAPI & PyMuPDF engines. No file uploads to external servers&mdash;complete data privacy guaranteed.
          </p>

          <div className="flex flex-wrap items-center gap-6 text-xs sm:text-sm text-slate-400 font-medium">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Zero Server Logging</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Lightning Fast Processing</span>
            </div>
            <div className="flex items-center space-x-2">
              <FileCheck2 className="w-4 h-4 text-indigo-400" />
              <span>Vector Preservation</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Select a PDF Workspace
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Choose from our complete suite of professional document management utilities.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => {
          const IconComponent = tool.icon;
          return (
            <div
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              className="group relative bg-white rounded-2xl border border-slate-200/90 p-6 shadow-lg shadow-slate-100 hover:shadow-2xl hover:border-indigo-300 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden active:scale-[0.99]"
            >
              <div 
                className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ backgroundImage: `linear-gradient(to right, ${tool.accentColor}, #6366F1)` }}
              />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${tool.lightBg}`}>
                    {tool.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-2 flex items-center">
                  {tool.name}
                </h3>

                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  {tool.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform">
                <span>Launch Workspace</span>
                <span className="text-slate-400 group-hover:text-indigo-600 transition-colors">&rarr;</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
