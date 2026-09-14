import React, { useState } from 'react';
import { X, KeyRound, ShieldCheck, Mail, Lock, CheckCircle2, AlertCircle, Eye, EyeOff, Trash2, User, Edit3 } from 'lucide-react';

export function AccountSettingsModal({ isOpen, onClose, currentUser, onUpdateUser, onDeleteAccount }) {
  const [apiKey, setApiKey] = useState(currentUser.geminiApiKey || '');
  const [name, setName] = useState(currentUser.name || '');
  const [password, setPassword] = useState(currentUser.password || '');
  const [showKey, setShowKey] = useState(false);
  const [isEditingKey, setIsEditingKey] = useState(!currentUser.geminiApiKey);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [emailNotification, setEmailNotification] = useState(null);

  if (!isOpen) return null;

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const updated = { 
      ...currentUser, 
      name: name.trim() || currentUser.name,
      password: password || currentUser.password,
      geminiApiKey: apiKey.trim() 
    };
    onUpdateUser(updated);
    
    const usersDb = JSON.parse(localStorage.getItem('agent_krishna_users_db') || '{}');
    const cleanEmail = (currentUser.email || '').toLowerCase();
    if (usersDb[cleanEmail]) {
      usersDb[cleanEmail] = updated;
      localStorage.setItem('agent_krishna_users_db', JSON.stringify(usersDb));
    } else {
      usersDb[cleanEmail] = updated;
      localStorage.setItem('agent_krishna_users_db', JSON.stringify(usersDb));
    }

    localStorage.setItem('agent_krishna_user', JSON.stringify(updated));

    setIsEditingKey(false);
    setSuccessMsg('Profile and API Key vault updated successfully.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const triggerOtpVerification = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setOtpError('');
    setOtpCode('');
    setIsOtpModalOpen(true);
    
    setEmailNotification({
      subject: 'Security Verification Code — Agent Krishna PDF Suite',
      sentAt: new Date().toLocaleTimeString(),
      body: `Hello ${currentUser.name || 'Valued User'},

You requested to reveal your Gemini API Key in your Agent Krishna PDF Autonomous Suite Vault.

Your official 6-digit security verification code is:

[ ${code} ]

If you did not request this verification, please secure your account immediately.

Best regards,
Agent Krishna Security Team`
    });
  };

  const verifyOtpAndReveal = (e) => {
    e.preventDefault();
    if (otpCode === generatedOtp) {
      setShowKey(true);
      setIsOtpModalOpen(false);
      setOtpCode('');
      setEmailNotification(null);
    } else {
      setOtpError('Invalid OTP code. Please check the simulated email notification and try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Account & API Vault</h3>
              <p className="text-xs text-slate-500 font-mono">UID: {currentUser.uid || 'usr_local_001'} &bull; {currentUser.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Gemini API Key (Masked Vault)</span>
                <div className="flex items-center gap-2">
                  {currentUser.geminiApiKey && !showKey && (
                    <button
                      type="button"
                      onClick={triggerOtpVerification}
                      className="text-indigo-600 hover:underline text-[11px] font-bold"
                    >
                      Verify Email OTP to Reveal
                    </button>
                  )}
                  {currentUser.geminiApiKey && !isEditingKey && (
                    <button
                      type="button"
                      onClick={() => setIsEditingKey(true)}
                      className="text-indigo-600 hover:underline text-[11px] font-bold"
                    >
                      Change API Key
                    </button>
                  )}
                </div>
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  readOnly={!isEditingKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AQ... or AIzaSy..."
                  className={`w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono ${
                    !isEditingKey ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-slate-50 text-slate-900'
                  }`}
                />
                {currentUser.geminiApiKey && showKey && (
                  <button
                    type="button"
                    onClick={() => setShowKey(false)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                  >
                    <EyeOff className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                {isEditingKey 
                  ? "Enter your new Gemini API key starting with 'AQ' or 'AIza'."
                  : "API key is securely stored and locked. Click 'Verify Email OTP to Reveal' to view."}
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
            >
              Update Profile & API Key Vault
            </button>
          </form>

          <div className="border-t border-slate-100 pt-6 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-rose-600">Delete Account</h4>
              <p className="text-[11px] text-slate-500">Permanently delete your account and stored vault data.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                  const usersDb = JSON.parse(localStorage.getItem('agent_krishna_users_db') || '{}');
                  const cleanEmail = (currentUser.email || '').toLowerCase();
                  delete usersDb[cleanEmail];
                  localStorage.setItem('agent_krishna_users_db', JSON.stringify(usersDb));
                  onDeleteAccount();
                  onClose();
                }
              }}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>
      </div>

      {isOtpModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-indigo-900 text-white">
              <div className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-indigo-300" />
                <h4 className="font-bold text-sm">Official Email Verification Sent</h4>
              </div>
              <button onClick={() => setIsOtpModalOpen(false)} className="text-indigo-200 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                An official verification email has been sent to <span className="font-bold text-slate-900">{currentUser.email}</span>. Please review the simulated incoming email below and enter your 6-digit code.
              </p>

              {emailNotification && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs font-mono">
                  <div className="text-[10px] text-slate-400 border-b border-slate-200 pb-1 flex justify-between">
                    <span>INBOX &bull; SECURE NOTIFICATION</span>
                    <span>{emailNotification.sentAt}</span>
                  </div>
                  <p className="font-bold text-indigo-900">Subject: {emailNotification.subject}</p>
                  <pre className="whitespace-pre-wrap text-[11px] text-slate-700 font-sans bg-white p-3 rounded-xl border border-slate-100">
                    {emailNotification.body}
                  </pre>
                </div>
              )}

              {otpError && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl flex items-center gap-2 border border-rose-200">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {otpError}
                </div>
              )}

              <form onSubmit={verifyOtpAndReveal} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Enter 6-Digit OTP Code</label>
                  <input
                    type="text"
                    maxLength="6"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xl tracking-widest font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
                >
                  Verify Code & Reveal API Key Vault
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
