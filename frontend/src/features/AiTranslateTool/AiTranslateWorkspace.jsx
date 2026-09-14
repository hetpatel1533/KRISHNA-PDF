import React, { useState, useRef, useEffect } from 'react';
import {
  Globe,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Eye,
  FileText,
  KeyRound,
  ExternalLink
} from 'lucide-react';
import { FileUploadZone } from '../../components/FileUploadZone';
import { apiClient } from '../../utils/apiClient';
import { loadPdfDocument, renderPageToCanvas } from '../../utils/pdfWorker';

export function AiTranslateWorkspace({ currentUser, onRequireAuth, onBack }) {
  const [apiKey, setApiKey] = useState('');
  const [file, setFile] = useState(null);
  const [language, setLanguage] = useState('hi');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  
  const [translatedBlob, setTranslatedBlob] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.1);
  const [renderingPage, setRenderingPage] = useState(false);
  
  const canvasRef = useRef(null);

  useEffect(() => {
    if (currentUser && currentUser.geminiApiKey) {
      setApiKey(currentUser.geminiApiKey);
    }
  }, [currentUser]);

  const languages = [
    { id: 'hi', name: 'Hindi (हिंदी)' },
    { id: 'gu', name: 'Gujarati (ગુજરાતી)' },
    { id: 'mr', name: 'Marathi (मराठी)' },
    { id: 'bn', name: 'Bengali (বাংলা)' },
    { id: 'te', name: 'Telugu (తెలుగు)' },
    { id: 'ta', name: 'Tamil (தமிழ்)' },
    { id: 'kn', name: 'Kannada (ಕನ್ನಡ)' },
    { id: 'ml', name: 'Malayalam (മലയാളം)' },
    { id: 'pa', name: 'Punjabi (ਪੰਜਾਬੀ)' },
    { id: 'ur', name: 'Urdu (اردو)' },
    { id: 'or', name: 'Odia (ଓଡିଆ)' }
  ];

  const handleTranslate = async () => {
    if (!file) return;
    const currentKey = currentUser?.geminiApiKey || apiKey;
    if (!currentKey || (!currentKey.startsWith('AQ') && !currentKey.startsWith('AIza'))) {
      setError('A valid Google Gemini API Key (starting with AQ... or AIza...) is strictly required in your profile vault for AI Translation.');
      return;
    }

    setProcessing(true);
    setError(null);
    setTranslatedBlob(null);
    setPdfDoc(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('target_language', language);
      formData.append('gemini_api_key', currentKey.trim());

      const res = await apiClient.postFormData('/ai/translate', formData);
      const blob = new Blob([res], { type: 'application/pdf' });
      setTranslatedBlob(blob);

      const arrayBuffer = await blob.arrayBuffer();
      const doc = await loadPdfDocument(arrayBuffer);
      setPdfDoc(doc);
      setNumPages(doc.numPages);
      setCurrentPage(1);
    } catch (err) {
      setError(err.message || 'Failed to translate PDF.');
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    if (!pdfDoc) return;
    let isMounted = true;
    setRenderingPage(true);

    async function render() {
      try {
        if (!isMounted || !canvasRef.current) return;
        await renderPageToCanvas(pdfDoc, currentPage, canvasRef.current, scale);
      } catch (err) {
        console.error('Error rendering translation page:', err);
      } finally {
        if (isMounted) setRenderingPage(false);
      }
    }

    render();
    return () => { isMounted = false; };
  }, [pdfDoc, currentPage, scale]);

  const handleDownload = () => {
    if (translatedBlob && file) {
      const cleanName = (file.name || 'document').replace(/\.[^/.]+$/, '');
      apiClient.downloadBlob(translatedBlob, `translated_${language}_${cleanName}.pdf`);
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-6 text-center space-y-6">
        <button onClick={onBack} className="mb-6 flex items-center text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </button>
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-10 space-y-4">
          <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto">
            <Globe className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Authentication Required</h2>
          <p className="text-slate-600 text-sm max-w-md mx-auto">
            Please sign in or create an account to access the AI Translator and secure your Gemini API key vault.
          </p>
          <button
            onClick={onRequireAuth}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg transition-all"
          >
            Sign In / Register Now
          </button>
        </div>
      </div>
    );
  }

  const effectiveApiKey = currentUser?.geminiApiKey || apiKey;
  if (!effectiveApiKey || (!effectiveApiKey.startsWith('AQ') && !effectiveApiKey.startsWith('AIza'))) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-6">
        <button onClick={onBack} className="mb-6 flex items-center text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </button>
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <KeyRound className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">Google Gemini API Key Required</h2>
            <p className="text-xs text-slate-500 max-w-lg mx-auto">
              A valid Gemini API key starting with 'AQ' or 'AIza' is required in your profile vault before accessing AI Translator.
            </p>
          </div>

          <div className="space-y-3">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your Gemini API Key (AQ... or AIza...)"
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
            <button
              type="button"
              onClick={() => {
                if (apiKey.trim() && (apiKey.startsWith('AQ') || apiKey.startsWith('AIza'))) {
                  const updated = { ...currentUser, geminiApiKey: apiKey.trim() };
                  const usersDb = JSON.parse(localStorage.getItem('agent_krishna_users_db') || '{}');
                  if (usersDb[currentUser.email]) {
                    usersDb[currentUser.email] = updated;
                    localStorage.setItem('agent_krishna_users_db', JSON.stringify(usersDb));
                  }
                  window.location.reload();
                } else {
                  alert('Please enter a valid Gemini API key starting with AQ or AIza.');
                }
              }}
              disabled={!apiKey.trim()}
              className="w-full py-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg transition-all"
            >
              Save Key & Proceed to AI Translator
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-6">
        <button onClick={onBack} className="mb-6 flex items-center text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </button>
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-10">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-teal-50 border border-teal-100 text-teal-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Globe className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">AI Indian Language Translator</h2>
            <p className="text-slate-600 mt-2 max-w-lg mx-auto">
              Translate any PDF document (Urdu, English, Spanish, etc.) into Gujarati, Hindi, Marathi, Bengali, Tamil, Telugu, and other Indian languages instantly using Gemini LLM while preserving layout structure.
            </p>
          </div>
          <FileUploadZone onFilesSelected={(f) => setFile(Array.isArray(f) ? f[0] : f)} multiple={false} title="Upload PDF to Translate" subtitle="Gemini LLM Document Translator" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xl">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"><ChevronLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-teal-600" />
              Translate PDF &mdash; {file.name}
            </h1>
            <p className="text-xs text-slate-500">Gemini LLM target-script dictionary mapping</p>
          </div>
        </div>
        <button onClick={() => { setFile(null); setTranslatedBlob(null); setPdfDoc(null); }} className="px-4 py-2 text-xs font-semibold text-teal-600 hover:bg-teal-50 rounded-xl transition-all">
          Change File
        </button>
      </div>

      {error && <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 flex items-center gap-3"><AlertCircle className="w-5 h-5" /><span>{error}</span></div>}

      {!translatedBlob ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 space-y-8 shadow-xl">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">Select Target Indian / Regional Language</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {languages.map(lang => (
                <button
                  key={lang.id}
                  onClick={() => setLanguage(lang.id)}
                  className={`p-5 rounded-2xl border text-sm font-bold transition-all text-center ${
                    language === lang.id ? 'bg-teal-600 text-white border-teal-600 shadow-lg shadow-teal-600/20 scale-[1.02]' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleTranslate}
            disabled={processing}
            className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-base rounded-2xl shadow-xl shadow-teal-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {processing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Globe className="w-5 h-5" />}
            <span>Translate Document via Gemini LLM</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fadeIn">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xl space-y-6">
              <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm border-b pb-4 border-slate-100">
                <CheckCircle2 className="w-5 h-5" />
                <span>Translation Complete!</span>
              </div>
              
              <button
                onClick={handleDownload}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Translated PDF</span>
              </button>

              <button
                onClick={() => { setTranslatedBlob(null); setPdfDoc(null); }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-all"
              >
                Back to Language Select
              </button>
            </div>
          </div>

          <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 p-8 shadow-xl flex flex-col items-center relative">
            <div className="flex items-center justify-between w-full border-b border-slate-100 pb-4 mb-6">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Eye className="w-4 h-4 text-teal-600" />
                <span>Visual Document Previewer</span>
              </h3>

              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button onClick={() => setScale(s => Math.max(0.6, s - 0.15))} className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-all"><ZoomOut className="w-4 h-4" /></button>
                <span className="text-xs font-bold text-slate-800 px-1">{Math.round(scale * 100)}%</span>
                <button onClick={() => setScale(s => Math.min(2.2, s + 0.15))} className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-all"><ZoomIn className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="relative border border-slate-200 rounded-2xl shadow-inner bg-slate-100 overflow-auto p-4 max-h-[600px] w-full flex justify-center">
              {renderingPage && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-10">
                  <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
                </div>
              )}
              <canvas ref={canvasRef} className="bg-white shadow-lg rounded-xl block" />
            </div>

            <div className="flex items-center space-x-4 bg-slate-50 border border-slate-200 px-6 py-2.5 rounded-2xl shadow-sm mt-6">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1} className="p-1.5 text-slate-600 disabled:opacity-30 hover:bg-slate-100 rounded-lg transition-all"><ChevronLeft className="w-5 h-5" /></button>
              <span className="text-xs font-semibold text-slate-700">Page {currentPage} of {numPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))} disabled={currentPage >= numPages} className="p-1.5 text-slate-600 disabled:opacity-30 hover:bg-slate-100 rounded-lg transition-all"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
