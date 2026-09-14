import React from 'react';
import { Shield, Cpu, Wifi, FileText, ArrowLeft, User, LogOut, ShieldAlert } from 'lucide-react';

export function Header({ activeTool, onSelectTool, currentUser, onOpenAuth, onOpenAccount, onLogout, onOpenAdminAuth }) {
  const isAdmin = currentUser && (currentUser.email === 'hetpatel1533@gmail.com' || currentUser.isAdmin);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200/80 px-4 sm:px-6 py-4 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        <div className="flex items-center space-x-2 sm:space-x-4">
          {activeTool !== null && (
            <button
              onClick={() => onSelectTool(null)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all active:scale-95 flex items-center space-x-1 text-sm font-medium"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
          )}

          <div 
            onClick={() => onSelectTool(null)}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-slate-900 to-indigo-950 bg-clip-text text-transparent tracking-tight">
                KRISHNA PDF
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                <span>Autonomous Suite 2026</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-xs font-medium">
            <Wifi className="w-3.5 h-3.5" />
            <span>100% Offline Ready</span>
          </div>

          {isAdmin && activeTool !== 'admin' && (
            <button
              onClick={() => onSelectTool('admin')}
              className="hidden sm:flex items-center space-x-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-full border border-rose-200 text-xs font-bold transition-all shadow-sm"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </button>
          )}

          {!currentUser && (
            <button
              onClick={onOpenAdminAuth}
              className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all flex items-center gap-1.5"
            >
              <ShieldAlert className="w-3.5 h-3.5" /> Admin Login
            </button>
          )}

          {currentUser ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={onOpenAccount}
                className="flex items-center space-x-2 px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-full border border-indigo-200 text-xs font-semibold transition-all shadow-sm"
              >
                <User className="w-3.5 h-3.5" />
                <span className="max-w-[90px] sm:max-w-[120px] truncate">{currentUser.name || currentUser.email}</span>
              </button>
              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
            >
              Sign In / Register
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
