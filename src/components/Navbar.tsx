import React from 'react';
import { Rocket, Plus, LogOut, Zap } from 'lucide-react';
import { User, HostingStats } from '../types';

interface NavbarProps {
  user: User | null;
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenDeployModal: () => void;
  onOpenAuthModal: (mode: 'login' | 'register') => void;
  onLogout: () => void;
  onQuickRoleSwitch: (role: 'user' | 'admin') => void;
  stats: HostingStats | null;
  onUpgradeClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  currentView,
  onNavigate,
  onOpenDeployModal,
  onOpenAuthModal,
  onLogout,
  onQuickRoleSwitch,
  stats,
  onUpgradeClick,
}) => {
  if (!user && currentView === 'landing') {
    return (
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 group focus:outline-hidden"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-800 flex items-center justify-center text-white shadow-xs">
              <Rocket className="w-4 h-4" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
              Storvia Cloud
            </span>
          </button>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
              Features
            </a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
              Hosting Plans
            </a>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onOpenAuthModal('login')}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
            >
              Sign In
            </button>
            <button
              onClick={() => onOpenAuthModal('register')}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-xs"
            >
              Start Hosting Free
            </button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 font-bold text-slate-900 hover:text-indigo-600 transition-colors shrink-0"
          >
            <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center text-white text-xs">
              <Rocket className="w-4 h-4" />
            </div>
            <span className="text-base font-bold tracking-tight">Storvia Cloud</span>
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-semibold text-slate-600 capitalize">
            {currentView === 'dashboard' && 'Hosted Websites'}
            {currentView === 'billing' && 'Hosting Plans & Bandwidth'}
            {currentView === 'settings' && 'Account Settings'}
            {currentView === 'admin' && 'Edge Infrastructure'}
            {currentView === 'landing' && 'Platform Overview'}
          </span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => onQuickRoleSwitch('user')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                user?.role === 'user' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              User Demo (2/3 sites)
            </button>
            <button
              type="button"
              onClick={() => onQuickRoleSwitch('admin')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                user?.role === 'admin' ? 'bg-white text-indigo-700 shadow-xs font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Admin Demo
            </button>
          </div>

          {stats && (
            <button
              type="button"
              onClick={onUpgradeClick}
              className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                stats.isLimitReached
                  ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 animate-pulse'
                  : 'bg-indigo-50/60 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{stats.isLimitReached ? 'Limit Reached · Upgrade' : `Upgrade (${stats.currentPlan})`}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenDeployModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Deploy Website</span>
          </button>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <button
              onClick={() => onNavigate('settings')}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              title="Account Settings"
            >
              <img
                src={user?.avatarUrl || '/src/assets/images/user_avatar_alex_1791801534928.jpg'}
                alt={user?.name || 'User'}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200"
                referrerPolicy="no-referrer"
              />
              <span className="hidden lg:inline text-xs font-semibold text-slate-800 max-w-[100px] truncate">
                {user?.name}
              </span>
            </button>

            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
