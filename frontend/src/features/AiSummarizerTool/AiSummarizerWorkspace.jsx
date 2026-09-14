import React, { useState, useEffect } from 'react';
import { Sparkles, Download, RefreshCw, AlertCircle, ChevronLeft, Copy, Check, FileText, Clock, BookOpen, KeyRound, ExternalLink } from 'lucide-react';
import { FileUploadZone } from '../../components/FileUploadZone';
import { apiClient } from '../../utils/apiClient';

export function AiSummarizerWorkspace({ currentUser, onRequireAuth, onBack }) {
  const [apiKey, setApiKey] = useState('');
  const [file, setFile] = useState(null);
  const [length, setLength] = useState('medium');
  const [focus, setFocus] = useState('general');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (currentUser && currentUser.geminiApiKey) {
      setApiKey(currentUser.geminiApiKey);
    }
  }, [currentUser]);

  const handleSummarize = async () => {
    if (!file) return;
    const currentKey = currentUser?.geminiApiKey || apiKey;
    if (!currentKey || (!currentKey.startsWith('AQ') && !currentKey.startsWith('AIza'))) {
      setError('A valid Google Gemini API Key (starting with AQ... or AIza...) is required in your profile vault for AI Summarization.');
      return;
    }

    setProcessing(true);
    setError(null);
    setSummaryData(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('length', length);
      formData.append('summary_length', length);
      formData.append('focus', focus);
      formData.append('gemini_api_key', currentKey.trim());
      formData.append('gemini_key', currentKey.trim());

      const res = await apiClient.postFormData('/ai/summarize', formData);
      const text = await new Response(res).text();
      const parsed = JSON.parse(text);
      setSummaryData(parsed);
    } catch (err) {
      setError(err.message || 'Failed to summarize PDF.');
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = () => {
    if (!summaryData) return;
    navigator.clipboard.writeText(summaryData.summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-6 text-center space-y-6">
        <button onClick={onBack} className="mb-6 flex items-center text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </button>
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-10 space-y-4">
          <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Authentication Required</h2>
          <p className="text-slate-600 text-sm max-w-md mx-auto">
            Please sign in or create an account to access the AI Summarizer and secure your Gemini API key vault.
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
            <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <KeyRound className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">Google Gemini API Key Required</h2>
            <p className="text-xs text-slate-500 max-w-lg mx-auto">
              A valid Gemini API key starting with 'AQ' or 'AIza' is required in your profile vault before accessing AI Summarizer.
            </p>
          </div>

          <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-5 space-y-3 text-xs text-slate-700">
            <h4 className="font-bold text-purple-900">How to get your Gemini API key:</h4>
            <ol className="list-decimal list-inside space-y-1.5">
              <li>
                Go to Google AI Studio:{' '}
                <a 
                  href="https://aistudio.google.com/prompts/new_chat" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-purple-600 font-semibold underline inline-flex items-center gap-0.5"
                >
                  https://aistudio.google.com/prompts/new_chat <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>Create an account or sign in with your Google credentials.</li>
              <li>Click on the <strong>API Key</strong> section and create a new key.</li>
              <li>Paste your key below to unlock the AI Summarizer.</li>
            </ol>
          </div>

          <div className="space-y-3">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your Gemini API Key (AQ... or AIza...)"
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
            <button
              type="button"
              onClick={() => {
                if (apiKey.trim() && (apiKey.startsWith('AQ') || apiKey.startsWith('AIza'))) {
                  const updated = { ...currentUser, geminiApiKey: apiKey.trim() };
                  const usersDb = JSON.parse(localStorage.getItem('agent_krishna_users_db') || '{}');
                  usersDb[currentUser.email] = updated;
                  localStorage.setItem('agent_krishna_users_db', JSON.stringify(usersDb));
                  localStorage.setItem('agent_krishna_user', JSON.stringify(updated));
                  window.location.reload();
                } else {
                  alert('Please enter a valid Gemini API key starting with AQ or AIza.');
                }
              }}
              disabled={!apiKey.trim()}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg transition-all"
            >
              Save Key & Proceed to AI Summarizer
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
            <div className="w-20 h-20 bg-purple-50 border border-purple-100 text-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Sparkles className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">AI PDF Summarizer & Insights</h2>
            <p className="text-slate-600 mt-2 max-w-lg mx-auto">
              Extract key executive takeaways, statistics, and summaries instantly with high-performance document intelligence powered by Gemini LLM.
            </p>
          </div>
          <FileUploadZone 
            onFilesSelected={(f) => setFile(Array.isArray(f) ? f[0] : f)} 
            multiple={false} 
            accept=".pdf,application/pdf"
            title="Upload PDF to Summarize"
            subtitle="Intelligent Document Summarizer (PDF files only)"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xl">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"><ChevronLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Summarizer &mdash; {file.name}
            </h1>
            <p className="text-xs text-slate-500">Generate structured executive takeaways & insights</p>
          </div>
        </div>
        <button onClick={() => setFile(null)} className="px-4 py-2 text-xs font-semibold text-purple-600 hover:bg-purple-50 rounded-xl transition-all">
          Change File
        </button>
      </div>

      {error && <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 flex items-center gap-3"><AlertCircle className="w-5 h-5" /><span>{error}</span></div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-6 shadow-xl h-fit">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Summary Options</h3>
          
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600">Length</label>
            <div className="grid grid-cols-3 gap-2">
              {['brief', 'medium', 'detailed'].map(l => (
                <button
                  key={l}
                  onClick={() => setLength(l)}
                  className={`py-2 text-xs font-semibold capitalize rounded-xl border transition-all ${
                    length === l ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600">Focus Area</label>
            <select
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="general">General Executive Brief</option>
              <option value="financial">Financials & Transactions</option>
              <option value="legal">Legal & Policy Clauses</option>
              <option value="technical">Technical Specifications</option>
            </select>
          </div>

          <button
            onClick={handleSummarize}
            disabled={processing}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {processing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Generate Summary</span>
          </button>
        </div>

        <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xl min-h-[400px]">
          {summaryData ? (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-4 text-xs font-medium text-slate-500">
                  <span className="flex items-center gap-1"><FileText className="w-4 h-4 text-purple-600" /> {summaryData.word_count} words</span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-purple-600" /> ~{summaryData.reading_time_mins} min read</span>
                  <span className="flex items-center gap-1"><BookOpen className="w-4 h-4 text-purple-600" /> {summaryData.pages} pages</span>
                </div>
                <button onClick={copyToClipboard} className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Executive Summary</h3>
                <p className="text-slate-700 text-sm leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 whitespace-pre-line">
                  {summaryData.summary}
                </p>
              </div>

              {summaryData.highlights?.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-3">Key Takeaways</h4>
                  <ul className="space-y-2">
                    {summaryData.highlights.map((h, i) => (
                      <li key={i} className="text-xs text-slate-700 flex items-start gap-2 bg-purple-50/50 p-3 rounded-xl border border-purple-100/50">
                        <span className="text-purple-600 font-bold">&bull;</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-3 py-12">
              <Sparkles className="w-12 h-12 text-slate-300" />
              <p className="text-sm font-medium">Click &quot;Generate Summary&quot; to extract real-time document insights via Gemini LLM.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
