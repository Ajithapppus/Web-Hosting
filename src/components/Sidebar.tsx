import React from 'react';
import {
  Rocket,
  CreditCard,
  Settings,
  Shield,
  Layers,
  Activity,
  HardDrive,
  ExternalLink,
} from 'lucide-react';
import { User, HostingStats } from '../types';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  user: User | null;
  stats: HostingStats | null;
  onUpgradeClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  user,
  stats,
  onUpgradeClick,
}) => {
  const isAdmin = user?.role === 'admin';

  const navItems = [
    {
      id: 'dashboard',
      label: 'Hosted Websites',
      icon: Rocket,
      badge: stats ? `${stats.totalProjects}/${stats.maxProjects}` : undefined,
    },
    {
      id: 'billing',
      label: 'Plan & Bandwidth',
      icon: CreditCard,
      badge: stats?.currentPlan,
    },
    {
      id: 'settings',
      label: 'Account & Security',
      icon: Settings,
    },
  ];

  if (isAdmin) {
    navItems.push({
      id: 'admin',
      label: 'Edge Infrastructure',
      icon: Shield,
      badge: 'Admin',
    });
  }

  const projectUsagePercent = stats
    ? Math.min(100, Math.round((stats.totalProjects / stats.maxProjects) * 100))
    : 0;

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)] sticky top-16 border-r border-slate-800">
      <div className="p-4 space-y-6">
        <div>
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Cloud Workspace
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                        isActive
                          ? 'bg-indigo-700/80 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div>
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Network & Edge
          </div>
          <div className="space-y-1 text-xs">
            <div className="px-3 py-2 rounded-lg text-slate-400 flex items-center justify-between bg-slate-800/40">
              <span className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-emerald-400" /> Edge Network
              </span>
              <span className="font-mono text-emerald-400 font-bold text-[10px]">32 POFs</span>
            </div>
            <button
              onClick={() => onNavigate('landing')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>Public Cloud Portal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Resource Quota Meter */}
      {stats && (
        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800/60 rounded-xl p-3.5 border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">{stats.currentPlan}</span>
              <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                {stats.totalProjects} / {stats.maxProjects} sites
              </span>
            </div>

            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  projectUsagePercent >= 100 ? 'bg-rose-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${projectUsagePercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1">
              <span className="text-slate-400 font-mono">
                {stats.bandwidthUsedGB} GB / {stats.bandwidthLimitGB} GB
              </span>
              <button
                type="button"
                onClick={onUpgradeClick}
                className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline"
              >
                Upgrade &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
