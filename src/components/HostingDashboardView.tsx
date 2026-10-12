import React, { useState } from 'react';
import {
  Rocket,
  Plus,
  Search,
  ExternalLink,
  RotateCcw,
  Globe,
  Terminal,
  Layers,
  Sparkles,
  Zap,
  ShieldCheck,
  AlertCircle,
  GitBranch,
  Activity,
  HardDrive,
  Cpu,
} from 'lucide-react';
import { HostedProject, HostingStats, FrameworkType } from '../types';

interface HostingDashboardViewProps {
  projects: HostedProject[];
  stats: HostingStats | null;
  onOpenDeployModal: () => void;
  onOpenProjectDetail: (p: HostedProject) => void;
  onRedeploy: (id: string) => Promise<any>;
  onUpgradeClick: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedFramework: string;
  setSelectedFramework: (fw: string) => void;
  isLoading: boolean;
}

export const HostingDashboardView: React.FC<HostingDashboardViewProps> = ({
  projects,
  stats,
  onOpenDeployModal,
  onOpenProjectDetail,
  onRedeploy,
  onUpgradeClick,
  searchQuery,
  setSearchQuery,
  selectedFramework,
  setSelectedFramework,
  isLoading,
}) => {
  const [redeployingId, setRedeployingId] = useState<string | null>(null);

  const handleQuickRedeploy = async (e: React.MouseEvent, project: HostedProject) => {
    e.stopPropagation();
    try {
      setRedeployingId(project.id);
      await onRedeploy(project.id);
    } finally {
      setRedeployingId(null);
    }
  };

  const isLimitReached = stats?.isLimitReached || false;
  const projectUsagePercent = stats
    ? Math.min(100, Math.round((stats.totalProjects / stats.maxProjects) * 100))
    : 0;

  const bandwidthUsagePercent = stats
    ? Math.min(100, Math.round((stats.bandwidthUsedGB / stats.bandwidthLimitGB) * 100))
    : 0;

  return (
    <div className="space-y-6">
      {/* Limit Alert Banner (when limit reached) */}
      {isLimitReached && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-950">
                Hosting Project Limit Reached
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                Your current {stats?.currentPlan} allows up to <strong>{stats?.maxProjects} hosted websites</strong> (all {stats?.totalProjects} slots in use). Upgrade to Pro for 15 projects.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onUpgradeClick}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors whitespace-nowrap shadow-xs flex items-center justify-center gap-1.5 self-start sm:self-auto"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Upgrade to Pro Plan</span>
          </button>
        </div>
      )}

      {/* Top 4 KPI Cloud Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hosted Websites */}
        <div className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Hosted Websites
            </span>
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Rocket className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
              {stats?.totalProjects ?? projects.length}
            </span>
            <span className="text-xs text-slate-400 font-medium">/ {stats?.maxProjects ?? 3} max</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isLimitReached ? 'bg-amber-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${projectUsagePercent}%` }}
            />
          </div>
        </div>

        {/* Bandwidth Usage */}
        <div className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Edge Bandwidth
            </span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
              {stats?.bandwidthUsedGB ?? 47.0}
            </span>
            <span className="text-xs text-slate-400 font-medium">/ {stats?.bandwidthLimitGB ?? 100} GB</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${bandwidthUsagePercent}%` }}
            />
          </div>
        </div>

        {/* Available Project Slots */}
        <div className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Available Slots
            </span>
            <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-3xl font-extrabold font-mono tabular-nums ${
                (stats?.availableSlots ?? 1) === 0 ? 'text-amber-600' : 'text-emerald-700'
              }`}
            >
              {stats?.availableSlots ?? 1}
            </span>
            <span className="text-xs text-slate-400 font-medium">sites available</span>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Tier: <strong className="text-slate-800">{stats?.currentPlan || 'Starter'}</strong>
          </p>
        </div>

        {/* Global Edge Status */}
        <div className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Edge CDN Status
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono">
                Nominal
              </span>
            </div>
            <div className="mt-2">
              <h4 className="text-lg font-bold text-slate-900">32 Global POFs</h4>
              <p className="text-xs text-slate-500">Zero-Config Anycast routing</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onUpgradeClick}
            className="mt-3 w-full py-1.5 px-3 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Upgrade Hosting Tier</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Search & Framework Filter */}
      <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hosted projects, subdomains, domains..."
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenDeployModal}
              disabled={isLimitReached}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-xs ${
                isLimitReached
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Deploy New Website</span>
            </button>
          </div>
        </div>

        {/* Framework Tabs */}
        <div className="flex items-center gap-1.5 pt-1 overflow-x-auto text-xs pb-1 border-t border-slate-100">
          <span className="text-slate-400 text-[11px] font-semibold uppercase shrink-0 mr-1">
            Framework:
          </span>
          {['', 'nextjs', 'react', 'astro', 'nodejs', 'static'].map((fw) => (
            <button
              key={fw}
              type="button"
              onClick={() => setSelectedFramework(fw)}
              className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors capitalize ${
                selectedFramework === fw
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {fw === '' ? 'All Frameworks' : fw}
            </button>
          ))}
        </div>
      </div>

      {/* Hosted Projects Grid */}
      {projects.length === 0 && !isLoading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Rocket className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No hosted projects found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Deploy your first web application, landing page, or documentation hub to Storvia Cloud.
          </p>
          <button
            type="button"
            onClick={onOpenDeployModal}
            disabled={isLimitReached}
            className="mt-4 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Deploy First Website</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => {
            const isRedeploying = redeployingId === project.id;
            return (
              <div
                key={project.id}
                onClick={() => onOpenProjectDetail(project)}
                className="p-5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between shadow-xs hover:shadow-sm cursor-pointer group"
              >
                <div>
                  {/* Top: Framework & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs uppercase font-mono">
                        {project.framework.slice(0, 2)}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate max-w-[180px]">
                          {project.name}
                        </h3>
                        <span className="text-[11px] text-slate-400 capitalize">
                          {project.framework} App
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Production
                    </span>
                  </div>

                  {/* Subdomain & Custom Domain */}
                  <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200/80 font-mono text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[10px]">Edge URL:</span>
                      <a
                        href={`https://${project.subdomain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-indigo-600 font-bold hover:underline flex items-center gap-1 truncate max-w-[200px]"
                      >
                        <span>{project.subdomain}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>
                    {project.customDomain && (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                        <span className="text-slate-400 text-[10px]">Domain:</span>
                        <span className="text-emerald-700 font-bold truncate max-w-[200px]">
                          {project.customDomain}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Git branch & commit info */}
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 font-mono">
                    <GitBranch className="w-3.5 h-3.5 text-slate-400" />
                    <span>{project.branch}</span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate max-w-[140px] text-slate-700 font-semibold">
                      {project.latestDeployment?.commitHash || '8f4b21c'}
                    </span>
                  </div>
                </div>

                {/* Bottom stats & quick actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="text-slate-500 font-mono tabular-nums">
                    {project.analytics.bandwidthGB} GB bandwidth
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={isRedeploying}
                      onClick={(e) => handleQuickRedeploy(e, project)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                      title="Redeploy"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${isRedeploying ? 'animate-spin text-indigo-600' : ''}`} />
                    </button>
                    <a
                      href={`https://${project.subdomain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors"
                      title="Visit Live"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
