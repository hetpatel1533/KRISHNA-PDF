import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export function AuthModal({ isOpen, onClose, onLogin, initialTab = 'user' }) {
  const [isRegister, setIsRegister] = useState(false);
  const [isAdminLogin, setIsAdminLogin] = useState(initialTab === 'admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (isAdminLogin) {
      if (email.trim() === 'hetpatel1533@gmail.com' && password === 'H@gp1533') {
        const adminUser = {
          uid: 'usr_master_admin',
          email: 'hetpatel1533@gmail.com',
          name: 'Master Administrator',
          isAdmin: true,
          authProvider: 'admin',
          geminiApiKey: '',
          createdAt: new Date().toISOString()
        };
        onLogin(adminUser);
        onClose();
        return;
      } else {
        setError('Invalid Admin credentials. Please enter your authorized Admin email and password.');
        return;
      }
    }

    const usersDb = JSON.parse(localStorage.getItem('agent_krishna_users_db') || '{}');

    if (isRegister) {
      if (usersDb[email]) {
        setError('An account with this email already exists. Please log in.');
        return;
      }

      const uid = `usr_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
      const newUser = {
        uid,
        email,
        password,
        name: name || email.split('@')[0],
        authProvider: 'manual',
        geminiApiKey: '',
        createdAt: new Date().toISOString()
      };

      usersDb[email] = newUser;
      localStorage.setItem('agent_krishna_users_db', JSON.stringify(usersDb));
      onLogin(newUser);
      onClose();
    } else {
      const user = usersDb[email];

      if (!user || user.password !== password) {
        setError('Invalid email or password.');
        return;
      }

      onLogin(user);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${isAdminLogin ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isAdminLogin ? 'Admin Portal Login' : (isRegister ? 'Create Account' : 'Welcome Back')}
              </h3>
              <p className="text-xs text-slate-500">
                {isAdminLogin ? 'Restricted Master Administrator Access' : 'Access AI Suite & Secure API Key Vault'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && !isAdminLogin && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">{isAdminLogin ? 'Admin Email ID' : 'Email Address'}</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              className={`w-full py-3.5 text-white font-bold text-sm rounded-xl shadow-lg transition-all ${
                isAdminLogin ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
              }`}
            >
              {isAdminLogin ? 'Sign In as Master Admin' : (isRegister ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <div className="text-center pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => { setIsAdminLogin(!isAdminLogin); setError(''); }}
              className="text-xs font-bold text-rose-600 hover:underline"
            >
              {isAdminLogin ? 'Switch to Standard User Login' : 'Switch to Master Admin Login'} 
            </button>

            {!isAdminLogin && (
              <button
                type="button"
                onClick={() => { setIsRegister(!isRegister); setError(''); }}
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
