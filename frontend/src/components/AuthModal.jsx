import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck, Globe, CheckCircle2, AlertCircle, ArrowRight, Check } from 'lucide-react';

export function AuthModal({ isOpen, onClose, onLogin, initialTab = 'user' }) {
  const [isRegister, setIsRegister] = useState(false);
  const [isAdminLogin, setIsAdminLogin] = useState(initialTab === 'admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  
  const [oauthStep, setOauthStep] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [successSignedScreen, setSuccessSignedScreen] = useState(false);

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

  const handleOAuthInit = (provider) => {
    setOauthStep(provider);
    setSelectedAccount(null);
    setSuccessSignedScreen(false);
  };

  const handleAccountSelect = (account) => {
    setSelectedAccount(account);
    setOauthStep('google_consent');
  };

  const handleConsentComplete = () => {
    const account = selectedAccount || {
      name: 'Het Patel',
      email: 'hetpatel1533@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
    };

    const usersDb = JSON.parse(localStorage.getItem('agent_krishna_users_db') || '{}');
    let user = usersDb[account.email];

    if (!user) {
      const uid = `oauth_google_${Math.random().toString(36).substring(2, 9)}`;
      user = {
        uid,
        email: account.email,
        password: 'oauth_secure_password_2026',
        name: account.name,
        avatar: account.avatar,
        authProvider: 'google',
        geminiApiKey: '',
        createdAt: new Date().toISOString()
      };
      usersDb[account.email] = user;
      localStorage.setItem('agent_krishna_users_db', JSON.stringify(usersDb));
    }

    setSuccessSignedScreen(true);
    setTimeout(() => {
      onLogin(user);
      setOauthStep(null);
      setSuccessSignedScreen(false);
      onClose();
    }, 1500);
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

          {!isAdminLogin && (
            <>
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-4 text-slate-400 text-xs uppercase tracking-wider font-semibold">Or continue with</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => handleOAuthInit('google')}
                  className="flex items-center justify-center py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-all"
                >
                  <Globe className="w-4 h-4 text-rose-500 mr-2" /> Continue with Google
                </button>
              </div>
            </>
          )}

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

      {oauthStep && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-800 w-full max-w-xl overflow-hidden flex flex-col">
            
            {successSignedScreen ? (
              <div className="p-12 text-center space-y-6 bg-white text-slate-900 rounded-3xl animate-fadeIn">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <Check className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">Signed in via Google</h2>
                  <p className="text-xs text-slate-500">You may now close this page and return to the app</p>
                </div>
              </div>
            ) : (
              <>
                <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Globe className="w-6 h-6 text-rose-500" />
                    <span className="font-bold text-sm">Sign in with Google</span>
                  </div>
                  <button onClick={() => setOauthStep(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                </div>

                {oauthStep === 'google' && (
                  <div className="p-8 space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight mb-2">Choose an account</h2>
                      <p className="text-xs text-slate-400">to continue to <span className="font-mono text-indigo-300">krishna.app</span></p>
                    </div>

                    <div className="space-y-3">
                      <div
                        onClick={() => handleAccountSelect({
                          name: 'Het Patel',
                          email: 'hetpatel1533@gmail.com',
                          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                        })}
                        className="flex items-center justify-between p-4 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-2xl cursor-pointer transition-all group"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-lg shadow-md">
                            HP
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors">Het Patel</h4>
                            <p className="text-xs text-slate-400">hetpatel1533@gmail.com</p>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
                      </div>

                      <div
                        onClick={() => {
                          const customEmail = prompt('Enter your Google email address:', 'user@gmail.com');
                          if (customEmail) {
                            const customName = prompt('Enter your Display Name:', customEmail.split('@')[0]);
                            handleAccountSelect({
                              name: customName || 'Google User',
                              email: customEmail,
                              avatar: ''
                            });
                          }
                        }}
                        className="flex items-center space-x-4 p-4 bg-slate-800/40 hover:bg-slate-800/70 border border-dashed border-slate-700 rounded-2xl cursor-pointer transition-all text-slate-300"
                      >
                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">Use another account</h4>
                          <p className="text-xs text-slate-400">Sign in with a different email</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 text-center">
                      English (United States) &bull; Privacy &bull; Terms
                    </div>
                  </div>
                )}

                {oauthStep === 'google_consent' && (
                  <div className="p-8 space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight mb-2">Sign in to krishna.app</h2>
                      <p className="text-xs text-slate-400">Google will allow krishna.app to access this info about you</p>
                    </div>

                    <div className="bg-slate-800/50 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm">
                        {selectedAccount?.name?.[0] || 'H'}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-white">{selectedAccount?.name || 'Het Patel'}</h4>
                        <p className="text-[11px] text-slate-400">{selectedAccount?.email || 'hetpatel1533@gmail.com'}</p>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs text-slate-300">
                      <div className="flex items-start space-x-3">
                        <User className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold">Name and profile picture</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Mail className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold">Email address</p>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Review krishna.app&apos;s Privacy Policy and Terms of Service to understand how your data is protected.
                    </p>

                    <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setOauthStep('google')}
                        className="px-6 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold hover:bg-slate-800 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleConsentComplete}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-lg transition-all"
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
