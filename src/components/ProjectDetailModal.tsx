import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Terminal,
  Globe,
  Key,
  Settings,
  RotateCcw,
  Trash2,
  Check,
  Copy,
  ShieldCheck,
  AlertCircle,
  Code2,
  Clock,
  Layers,
} from 'lucide-react';
import { HostedProject, DeploymentRecord } from '../types';
import { api } from '../lib/api';

interface ProjectDetailModalProps {
  isOpen: boolean;
  project: HostedProject | null;
  onClose: () => void;
  onRedeploy: (id: string) => Promise<any>;
  onDelete: (id: string, name: string) => Promise<any>;
  onSuccess: (message: string) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  isOpen,
  project,
  onClose,
  onRedeploy,
  onDelete,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'domains' | 'env' | 'settings'>('overview');
  const [customDomainInput, setCustomDomainInput] = useState('');
  const [isAttachingDomain, setIsAttachingDomain] = useState(false);
  const [isRedeploying, setIsRedeploying] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newVal, setNewVal] = useState('');
  const [envVarsList, setEnvVarsList] = useState(project?.envVars || []);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !project) return null;

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleAttachDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDomainInput.trim()) return;
    try {
      setIsAttachingDomain(true);
      setErrorMsg(null);
      const res = await api.attachCustomDomain(project.id, customDomainInput.trim());
      setStatusMsg(res.message);
      project.customDomain = res.project.customDomain;
      project.customDomainVerified = true;
      setCustomDomainInput('');
      onSuccess(`Domain ${res.project.customDomain} attached!`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not attach custom domain.');
    } finally {
      setIsAttachingDomain(false);
    }
  };

  const handleTriggerRedeploy = async () => {
    try {
      setIsRedeploying(true);
      setErrorMsg(null);
      await onRedeploy(project.id);
      setStatusMsg('New deployment successfully triggered and live.');
      onSuccess(`Redeployed ${project.name}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Redeploy failed.');
    } finally {
      setIsRedeploying(false);
    }
  };

  const handleSaveEnv = async () => {
    if (newKey && newVal) {
      const updated = [...envVarsList, { id: 'env_' + Date.now(), key: newKey.toUpperCase(), value: newVal, target: 'all' as any }];
      setEnvVarsList(updated);
      setNewKey('');
      setNewVal('');
      try {
        await api.updateProjectEnv(project.id, updated);
        setStatusMsg('Environment variables saved.');
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to update env vars.');
      }
    }
  };

  const handleDeleteEnv = async (id: string) => {
    const updated = envVarsList.filter((e) => e.id !== id);
    setEnvVarsList(updated);
    try {
      await api.updateProjectEnv(project.id, updated);
    } catch {
      // ignore
    }
  };

  const handleDeleteProject = async () => {
    if (confirm(`Are you sure you want to delete and take down "${project.name}" (${project.subdomain})?`)) {
      await onDelete(project.id, project.name);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase">
              {project.framework.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">{project.name}</h2>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Production
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">https://{project.subdomain}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isRedeploying}
              onClick={handleTriggerRedeploy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRedeploying ? 'animate-spin text-indigo-600' : ''}`} />
              <span>{isRedeploying ? 'Deploying...' : 'Redeploy'}</span>
            </button>
            <a
              href={`https://${project.subdomain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
            >
              <span>Visit Live</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 border-b border-slate-200 bg-white text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-2 border-b-2 font-semibold transition-colors ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Project Overview
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-3 px-2 border-b-2 font-semibold transition-colors ${
              activeTab === 'logs'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Build Logs
          </button>
          <button
            onClick={() => setActiveTab('domains')}
            className={`py-3 px-2 border-b-2 font-semibold transition-colors ${
              activeTab === 'domains'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Custom Domains
          </button>
          <button
            onClick={() => setActiveTab('env')}
            className={`py-3 px-2 border-b-2 font-semibold transition-colors ${
              activeTab === 'env'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Environment Variables
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-2 border-b-2 font-semibold transition-colors ${
              activeTab === 'settings'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Settings
          </button>
        </div>

        {/* Messages */}
        {statusMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded-lg flex items-center justify-between">
            <span>{statusMsg}</span>
            <button onClick={() => setStatusMsg(null)} className="font-bold">&times;</button>
          </div>
        )}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-xs text-rose-800 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="p-6 md:p-8 space-y-6">
            {/* Live Card */}
            <div className="p-5 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">
                  Global Edge Production URL
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <h3 className="text-lg font-mono font-bold tracking-tight text-white truncate">
                    https://{project.subdomain}
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleCopy(`https://${project.subdomain}`)}
                    className="p-1 text-slate-400 hover:text-white"
                    title="Copy URL"
                  >
                    {copiedUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" /> SSL Certificate Active
                  </span>
                  <span>·</span>
                  <span>Edge Routing: 32 POFs</span>
                </div>
              </div>

              <a
                href={`https://${project.subdomain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 shrink-0"
              >
                <span>Open in Browser</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Metrics & Git Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 font-semibold block">Bandwidth Usage</span>
                <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900">
                  {project.analytics.bandwidthGB} GB
                </div>
                <span className="text-[11px] text-slate-400">Current monthly billing period</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 font-semibold block">24h Requests</span>
                <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900">
                  {project.analytics.requests24h.toLocaleString()}
                </div>
                <span className="text-[11px] text-slate-400">Avg edge latency: {project.analytics.avgLatencyMs}ms</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 font-semibold block">Framework & Engine</span>
                <div className="mt-1 text-base font-bold text-slate-900 uppercase">
                  {project.framework}
                </div>
                <span className="text-[11px] text-slate-400">Branch: {project.branch}</span>
              </div>
            </div>

            {/* Latest Deployment Summary */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs">
              <h4 className="font-bold text-slate-900 mb-2">Latest Production Build</h4>
              <div className="space-y-1 font-mono text-slate-600">
                <div>Commit: <strong className="text-slate-900">{project.latestDeployment.commitHash}</strong> ({project.latestDeployment.commitMessage})</div>
                <div>Author: {project.latestDeployment.author}</div>
                <div>Build Duration: {project.latestDeployment.durationSec}s</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BUILD LOGS */}
        {activeTab === 'logs' && (
          <div className="p-6 md:p-8 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Terminal logs from latest production deployment:</span>
              <button
                type="button"
                onClick={handleTriggerRedeploy}
                className="font-semibold text-indigo-600 hover:underline"
              >
                Trigger Fresh Build
              </button>
            </div>
            <div className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-xs h-72 overflow-y-auto space-y-1.5 border border-slate-800">
              {project.latestDeployment.buildLogs.map((log, i) => (
                <div key={i} className="leading-relaxed">
                  {log.includes('✓') || log.includes('complete') ? (
                    <span className="text-emerald-400">{log}</span>
                  ) : (
                    <span className="text-slate-300">{log}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CUSTOM DOMAINS */}
        {activeTab === 'domains' && (
          <div className="p-6 md:p-8 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Custom Domains Configuration</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Point your custom domain (e.g. app.mycompany.com) to Storvia's global edge network.
              </p>
            </div>

            {project.customDomain ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-950 text-sm">
                      {project.customDomain}
                    </span>
                    <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-full uppercase">
                      SSL Active
                    </span>
                  </div>
                  <p className="text-xs text-emerald-700 mt-1">
                    DNS CNAME verified and routing through edge nodes.
                  </p>
                </div>
                <a
                  href={`https://${project.customDomain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs font-semibold bg-white border border-emerald-300 text-emerald-800 rounded-lg shadow-xs hover:bg-emerald-50 flex items-center gap-1"
                >
                  <span>Open Domain</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ) : (
              <form onSubmit={handleAttachDomain} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Add Custom Domain
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={customDomainInput}
                      onChange={(e) => setCustomDomainInput(e.target.value)}
                      placeholder="e.g. shop.stellarlabs.dev"
                      className="flex-1 px-3.5 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                    <button
                      type="submit"
                      disabled={isAttachingDomain}
                      className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs disabled:opacity-50"
                    >
                      {isAttachingDomain ? 'Verifying...' : 'Attach Domain'}
                    </button>
                  </div>
                </div>

                {/* DNS Instructions */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                  <p className="font-bold text-slate-800">Required DNS Records:</p>
                  <div className="font-mono bg-white p-3 rounded-lg border border-slate-200 text-[11px] space-y-1">
                    <div>Type: <strong className="text-slate-900">CNAME</strong></div>
                    <div>Host: <strong className="text-slate-900">@ or subdomain</strong></div>
                    <div>Value: <strong className="text-indigo-600">cname.storvia.app</strong></div>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 4: ENVIRONMENT VARIABLES */}
        {activeTab === 'env' && (
          <div className="p-6 md:p-8 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Environment Variables</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Encrypted configuration keys injected during production builds and runtime.
              </p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="VARIABLE_NAME"
                className="w-1/2 px-3 py-2 text-xs font-mono uppercase bg-white border border-slate-300 rounded-lg"
              />
              <input
                type="text"
                value={newVal}
                onChange={(e) => setNewVal(e.target.value)}
                placeholder="secret-token-value"
                className="w-1/2 px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg"
              />
              <button
                type="button"
                onClick={handleSaveEnv}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shrink-0"
              >
                Add Key
              </button>
            </div>

            <div className="space-y-2">
              {envVarsList.map((e) => (
                <div key={e.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-slate-900">{e.key}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">••••••••••••••••</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteEnv(e.id)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: SETTINGS & DANGER ZONE */}
        {activeTab === 'settings' && (
          <div className="p-6 md:p-8 space-y-6">
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900">Danger Zone</h4>
              <p className="text-xs text-rose-700">
                Deleting this hosted website will immediately terminate all edge routing, remove the SSL certificate, and release <strong>{project.subdomain}</strong>.
              </p>
              <button
                type="button"
                onClick={handleDeleteProject}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Hosted Project</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
