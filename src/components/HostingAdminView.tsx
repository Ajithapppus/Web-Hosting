import React, { useState, useEffect } from 'react';
import {
  Shield,
  Rocket,
  Activity,
  HardDrive,
  Users,
  Settings,
  AlertCircle,
  RotateCcw,
  Edit,
  Save,
  CheckCircle2,
  Server,
} from 'lucide-react';
import { api } from '../lib/api';
import { HostingPlan, ActivityLog } from '../types';

export const HostingAdminView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'infrastructure' | 'users' | 'plans' | 'audit'>('infrastructure');
  const [adminData, setAdminData] = useState<any>(null);
  const [plans, setPlans] = useState<HostingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [maxProjectsInput, setMaxProjectsInput] = useState<number>(3);
  const [bandwidthInput, setBandwidthInput] = useState<number>(100);
  const [priceMonthlyInput, setPriceMonthlyInput] = useState<number>(0);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      setIsLoading(true);
      const res = await api.getAdminStats();
      setAdminData(res);
      setPlans(res.plans || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load administrator data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleSuspendUser = async (userId: string, currentStatus: string) => {
    const next = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await api.setAdminUserStatus(userId, next as any);
      setStatusMsg(res.message);
      await fetchAdminData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to modify user status.');
    }
  };

  const handleStartEditPlan = (p: HostingPlan) => {
    setEditingPlanId(p.id);
    setMaxProjectsInput(p.maxProjects);
    setBandwidthInput(p.bandwidthLimitGB);
    setPriceMonthlyInput(p.priceMonthly);
  };

  const handleSavePlan = async (planId: string) => {
    try {
      const res = await api.updateAdminPlan(planId, {
        maxProjects: Number(maxProjectsInput),
        bandwidthLimitGB: Number(bandwidthInput),
        priceMonthly: Number(priceMonthlyInput),
      });
      setStatusMsg(res.message);
      setEditingPlanId(null);
      await fetchAdminData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save plan changes.');
    }
  };

  const handleResetDemoData = async () => {
    if (confirm('Reset hosting platform to initial seed state?')) {
      await api.resetDemoData();
      setStatusMsg('Hosting platform database reset to defaults.');
      await fetchAdminData();
    }
  };

  if (isLoading && !adminData) {
    return (
      <div className="p-12 text-center text-xs text-slate-500">
        Loading edge infrastructure metrics & admin controls...
      </div>
    );
  }

  const stats = adminData?.stats;
  const users = adminData?.users || [];
  const activityLogs: ActivityLog[] = adminData?.activityLogs || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900">Edge Infrastructure Ops</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Global management of hosted web applications, resource quotas, and edge nodes.
          </p>
        </div>
        <button
          type="button"
          onClick={handleResetDemoData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Demo DB</span>
        </button>
      </div>

      {statusMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded-xl flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg(null)} className="font-bold">&times;</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Hosted Websites
          </span>
          <div className="mt-2 text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
            {stats?.totalProjects || 3}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Deployed on edge network
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Edge Traffic
          </span>
          <div className="mt-2 text-3xl font-extrabold text-emerald-700 font-mono tabular-nums">
            {stats?.totalBandwidthGB || 229.4} GB
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Across 32 global edge POFs
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Registered Developers
          </span>
          <div className="mt-2 text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
            {stats?.totalUsers || 2}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Active hosting tenants
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Edge Health Status
          </span>
          <div className="mt-2 text-base font-bold text-emerald-700 flex items-center gap-1.5">
            <Server className="w-4 h-4" />
            <span>All Nodes Nominal</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Average response time: 26ms
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('infrastructure')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'infrastructure' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Server Nodes & Telemetry
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'users' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Developers & Quotas ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'plans' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Hosting Tiers & Quotas ({plans.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'audit' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Deployment Audit Log ({activityLogs.length})
        </button>
      </div>

      {/* TAB 1: SERVER NODES */}
      {activeTab === 'infrastructure' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(stats?.serverNodes || [
            { name: 'us-east-1 (N. Virginia)', status: 'healthy', load: '34%' },
            { name: 'eu-west-1 (Frankfurt)', status: 'healthy', load: '41%' },
            { name: 'ap-southeast-1 (Singapore)', status: 'healthy', load: '28%' },
          ]).map((node: any, idx: number) => (
            <div key={idx} className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="font-bold text-slate-900 text-sm">{node.name}</h4>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase">
                  {node.status}
                </span>
              </div>
              <div className="mt-3 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">CPU Load:</span>
                  <strong className="font-mono">{node.load}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Edge Uptime:</span>
                  <strong className="font-mono text-emerald-700">99.99%</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">TLS Certificates:</span>
                  <span className="text-slate-700">Automated</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: DEVELOPERS */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Hosting Tier</th>
                <th className="py-3 px-4 font-mono">Websites Hosted</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u: any) => (
                <tr key={u.id}>
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900">{u.name}</p>
                    <p className="text-[11px] font-mono text-slate-500">{u.email}</p>
                  </td>
                  <td className="py-3 px-4 font-mono uppercase text-slate-600">{u.role}</td>
                  <td className="py-3 px-4 font-semibold text-indigo-700">{u.planName}</td>
                  <td className="py-3 px-4 font-mono tabular-nums">
                    <strong>{u.projectCount}</strong> / {u.maxProjects} sites
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {u.role !== 'admin' && (
                      <button
                        type="button"
                        onClick={() => handleToggleSuspendUser(u.id, u.status)}
                        className="px-2.5 py-1 text-xs font-semibold rounded text-rose-700 bg-rose-50 hover:bg-rose-100"
                      >
                        {u.status === 'active' ? 'Suspend' : 'Reactivate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: PLANS & LIMITS */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((p) => {
            const isEditing = editingPlanId === p.id;
            return (
              <div key={p.id} className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h4 className="font-bold text-slate-900">{p.name}</h4>
                  <span className="font-mono text-[11px] text-slate-400 uppercase">{p.id}</span>
                </div>
                {isEditing ? (
                  <div className="mt-3 space-y-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Max Hosted Projects</label>
                      <input
                        type="number"
                        value={maxProjectsInput}
                        onChange={(e) => setMaxProjectsInput(parseInt(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 border rounded-md font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Bandwidth Limit (GB)</label>
                      <input
                        type="number"
                        value={bandwidthInput}
                        onChange={(e) => setBandwidthInput(parseInt(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 border rounded-md font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Price Monthly ($)</label>
                      <input
                        type="number"
                        value={priceMonthlyInput}
                        onChange={(e) => setPriceMonthlyInput(parseInt(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 border rounded-md font-mono"
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleSavePlan(p.id)}
                        className="w-full py-1.5 bg-indigo-600 text-white font-semibold rounded-md flex items-center justify-center gap-1"
                      >
                        <Save className="w-3.5 h-3.5" /> Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingPlanId(null)}
                        className="w-full py-1.5 bg-slate-100 text-slate-700 rounded-md font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Max Hosted Websites:</span>
                      <strong className="font-mono text-indigo-700">{p.maxProjects} projects</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Bandwidth:</span>
                      <strong className="font-mono">{p.bandwidthLimitGB} GB/mo</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Price:</span>
                      <strong className="font-mono">${p.priceMonthly}/mo</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleStartEditPlan(p)}
                      className="mt-3 w-full py-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit Hosting Limits
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 4: AUDIT */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 shadow-xs">
          {activityLogs.map((log) => (
            <div key={log.id} className="p-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <Rocket className="w-4 h-4 text-indigo-600 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900">{log.details}</p>
                  <p className="text-[11px] text-slate-500">
                    By {log.userName} · <span className="font-mono">{log.action}</span>
                  </p>
                </div>
              </div>
              <span className="font-mono text-slate-400 text-[11px]">
                {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
