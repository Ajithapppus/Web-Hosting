import React, { useState } from 'react';
import {
  X,
  Rocket,
  Github,
  Layers,
  Sparkles,
  Check,
  AlertCircle,
  Terminal,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  Code2,
} from 'lucide-react';
import { HostingStats, FrameworkType } from '../types';

interface DeployProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeploy: (data: {
    name: string;
    framework: string;
    gitRepo?: string;
    branch?: string;
    buildCommand?: string;
    outputDir?: string;
    envVars?: { key: string; value: string; target?: string }[];
  }) => Promise<any>;
  onUpgradeClick: () => void;
  stats: HostingStats | null;
  onSuccess: (message: string) => void;
}

const TEMPLATES = [
  {
    id: 'nextjs-shop',
    name: 'Next.js E-Commerce Store',
    framework: 'nextjs',
    desc: 'Full-stack storefront with App Router and server-rendered catalog',
    repo: 'github.com/storvia-templates/nextjs-commerce',
    buildCmd: 'npm run build',
    outputDir: '.next',
  },
  {
    id: 'react-dashboard',
    name: 'Vite React SaaS Console',
    framework: 'react',
    desc: 'High-speed single page app with Tailwind CSS and charting',
    repo: 'github.com/storvia-templates/vite-react-saas',
    buildCmd: 'npm run build',
    outputDir: 'dist',
  },
  {
    id: 'astro-docs',
    name: 'Astro Content & Docs Hub',
    framework: 'astro',
    desc: 'Ultra-fast static documentation site with zero-JS baseline',
    repo: 'github.com/storvia-templates/astro-docs-hub',
    buildCmd: 'astro build',
    outputDir: 'dist',
  },
  {
    id: 'nodejs-api',
    name: 'Node.js Express Edge API',
    framework: 'nodejs',
    desc: 'Serverless REST API gateway with JSON endpoints and rate-limiting',
    repo: 'github.com/storvia-templates/express-edge-api',
    buildCmd: 'npm run build',
    outputDir: 'dist',
  },
];

export const DeployProjectModal: React.FC<DeployProjectModalProps> = ({
  isOpen,
  onClose,
  onDeploy,
  onUpgradeClick,
  stats,
  onSuccess,
}) => {
  const [sourceType, setSourceType] = useState<'template' | 'custom'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0].id);
  const [projectName, setProjectName] = useState('stellar-web-app');
  const [framework, setFramework] = useState<FrameworkType>('nextjs');
  const [gitRepo, setGitRepo] = useState('github.com/developer/my-web-app');
  const [branch, setBranch] = useState('main');
  const [buildCommand, setBuildCommand] = useState('npm run build');
  const [outputDir, setOutputDir] = useState('.next');

  // Env vars
  const [envKey, setEnvKey] = useState('');
  const [envVal, setEnvVal] = useState('');
  const [envVars, setEnvVars] = useState<{ key: string; value: string; target: string }[]>([]);

  // Deployment build animation state
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildLogs, setBuildLogs] = useState<string[]>([]);
  const [completedDeployment, setCompletedDeployment] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isLimitReached = stats?.isLimitReached || false;
  const slug = projectName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const previewSubdomain = `${slug || 'your-project'}.storvia.app`;

  const handleSelectTemplate = (tmpl: typeof TEMPLATES[0]) => {
    setSelectedTemplate(tmpl.id);
    setFramework(tmpl.framework as FrameworkType);
    setBuildCommand(tmpl.buildCmd);
    setOutputDir(tmpl.outputDir);
    setGitRepo(tmpl.repo);
    setProjectName(tmpl.id);
  };

  const handleAddEnv = () => {
    if (envKey.trim() && envVal.trim()) {
      setEnvVars([...envVars, { key: envKey.trim().toUpperCase(), value: envVal.trim(), target: 'all' }]);
      setEnvKey('');
      setEnvVal('');
    }
  };

  const handleStartDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLimitReached) {
      setError(`Hosting limit reached (${stats?.totalProjects}/${stats?.maxProjects} projects). Upgrade your plan to host more sites.`);
      return;
    }

    try {
      setIsBuilding(true);
      setError(null);
      setBuildLogs([
        `[storvia-orchestrator] Allocating container runtime for ${slug}...`,
        `[storvia-git] Pulling code from ${gitRepo} (branch: ${branch})...`,
      ]);

      // Trigger backend deployment
      const res = await onDeploy({
        name: projectName,
        framework,
        gitRepo,
        branch,
        buildCommand,
        outputDir,
        envVars,
      });

      // Stream logs in terminal effect
      setTimeout(() => {
        setBuildLogs((prev) => [
          ...prev,
          `[builder] Detected ${framework.toUpperCase()} configuration`,
          `[builder] Running: ${buildCommand}`,
          `[builder] Output directory: /${outputDir}`,
          `[edge-cdn] Generating edge route tables...`,
          `[tls-engine] Provisioned automatic SSL for https://${res.project.subdomain}`,
          `[status] Deployment complete! Live globally.`,
        ]);
        setCompletedDeployment(res);
        setIsBuilding(false);
        onSuccess(`Deployed ${res.project.name} to https://${res.project.subdomain}`);
      }, 1200);
    } catch (err: any) {
      setIsBuilding(false);
      setError(err.message || 'Deployment build failed.');
    }
  };

  const handleResetAndClose = () => {
    setCompletedDeployment(null);
    setBuildLogs([]);
    setIsBuilding(false);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Deploy New Website</h2>
              <p className="text-xs text-slate-500">Host your web app on Storvia's global edge infrastructure</p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Limit Reached Warning */}
        {isLimitReached && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-amber-900">Hosting Project Limit Reached</p>
                <p className="text-amber-700 mt-0.5">
                  You are hosting <strong>{stats?.totalProjects}</strong> of <strong>{stats?.maxProjects}</strong> websites allowed on the {stats?.currentPlan}.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onUpgradeClick();
              }}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline whitespace-nowrap"
            >
              Upgrade &rarr;
            </button>
          </div>
        )}

        {/* State 1: Active Deployment / Completed View */}
        {completedDeployment ? (
          <div className="p-6 md:p-8 space-y-5 text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Website Live on Global Edge</h3>
              <p className="text-xs text-slate-500 mt-1">
                Your web project has been built, assigned zero-config SSL, and cached at 32 global edge locations.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left font-mono text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Live URL:</span>
                <a
                  href={`https://${completedDeployment.project.subdomain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 font-bold hover:underline flex items-center gap-1"
                >
                  <span>https://{completedDeployment.project.subdomain}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Framework:</span>
                <span className="text-slate-900 uppercase font-bold">{completedDeployment.project.framework}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Branch:</span>
                <span className="text-slate-900">{completedDeployment.project.branch}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">SSL Certificate:</span>
                <span className="text-emerald-700 font-semibold">Active & Verified</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Close & Return to Dashboard
              </button>
              <a
                href={`https://${completedDeployment.project.subdomain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs flex items-center gap-1.5"
              >
                <span>Visit Live Website</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ) : isBuilding ? (
          /* State 2: Live Building Terminal Screen */
          <div className="p-6 md:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Terminal className="w-4 h-4 text-indigo-600" />
                <span>Building & Deploying to Edge CDN...</span>
              </div>
              <span className="text-[11px] font-mono text-indigo-600 animate-pulse">Running build</span>
            </div>

            <div className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-xs h-64 overflow-y-auto space-y-1.5 border border-slate-800">
              {buildLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed">
                  {log.includes('✓') || log.includes('complete') ? (
                    <span className="text-emerald-400">{log}</span>
                  ) : log.includes('error') ? (
                    <span className="text-rose-400">{log}</span>
                  ) : (
                    <span className="text-slate-300">{log}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* State 3: Deployment Configuration Form */
          <form onSubmit={handleStartDeploy} className="p-6 md:p-8 space-y-5">
            {error && (
              <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Source Type Switcher */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Choose Deployment Source
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSourceType('template')}
                  className={`p-3 rounded-xl border text-left transition-colors flex items-center gap-2.5 ${
                    sourceType === 'template'
                      ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Framework Starter</p>
                    <p className="text-[11px] text-slate-500">Next.js, Vite, Astro presets</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setSourceType('custom')}
                  className={`p-3 rounded-xl border text-left transition-colors flex items-center gap-2.5 ${
                    sourceType === 'custom'
                      ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Github className="w-4 h-4 text-slate-800 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Git Repository</p>
                    <p className="text-[11px] text-slate-500">Connect GitHub or GitLab</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Template Selector */}
            {sourceType === 'template' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Starter Template
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => handleSelectTemplate(tmpl)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedTemplate === tmpl.id
                          ? 'border-indigo-600 bg-indigo-50/30 ring-1 ring-indigo-600'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{tmpl.name}</span>
                        <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          {tmpl.framework}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{tmpl.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Project Name & Subdomain */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Project Name & Subdomain
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. my-ecommerce-site"
                  className="px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
                <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono text-slate-600 flex items-center truncate">
                  <span className="text-indigo-600 font-bold truncate">https://{previewSubdomain}</span>
                </div>
              </div>
            </div>

            {/* Build Settings in 2 Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Framework
                </label>
                <select
                  value={framework}
                  onChange={(e) => setFramework(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900"
                >
                  <option value="nextjs">Next.js</option>
                  <option value="react">React (Vite)</option>
                  <option value="astro">Astro</option>
                  <option value="vue">Vue / Nuxt</option>
                  <option value="nodejs">Node.js</option>
                  <option value="static">Static HTML</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Build Command
                </label>
                <input
                  type="text"
                  value={buildCommand}
                  onChange={(e) => setBuildCommand(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Output Directory
                </label>
                <input
                  type="text"
                  value={outputDir}
                  onChange={(e) => setOutputDir(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
            </div>

            {/* Environment Variables */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Environment Variables <span className="text-slate-400 font-normal lowercase">(optional)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={envKey}
                  onChange={(e) => setEnvKey(e.target.value)}
                  placeholder="KEY (e.g. DATABASE_URL)"
                  className="w-1/2 px-3 py-1.5 text-xs font-mono uppercase bg-white border border-slate-300 rounded-lg"
                />
                <input
                  type="text"
                  value={envVal}
                  onChange={(e) => setEnvVal(e.target.value)}
                  placeholder="VALUE"
                  className="w-1/2 px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleAddEnv}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Add
                </button>
              </div>

              {envVars.length > 0 && (
                <div className="mt-2 space-y-1">
                  {envVars.map((v, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px] font-mono bg-slate-50 p-2 rounded-md border border-slate-200">
                      <span>{v.key}=••••••••</span>
                      <button
                        type="button"
                        onClick={() => setEnvVars(envVars.filter((_, idx) => idx !== i))}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                Slot: <strong className="font-mono text-slate-800">{stats?.totalProjects ?? 2} / {stats?.maxProjects ?? 3}</strong> used
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLimitReached || !projectName.trim()}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <Rocket className="w-3.5 h-3.5" />
                  <span>Deploy to Cloud</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
