import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Zap,
  Check,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Activity,
  Download,
  Rocket,
} from 'lucide-react';
import { HostingPlan, HostingStats, PaymentRecord, UserSubscription } from '../types';
import { api } from '../lib/api';

interface HostingBillingViewProps {
  onOpenUpgradeModal: () => void;
  stats: HostingStats | null;
  onRefresh: () => void;
}

export const HostingBillingView: React.FC<HostingBillingViewProps> = ({
  onOpenUpgradeModal,
  stats,
  onRefresh,
}) => {
  const [billingData, setBillingData] = useState<{
    currentPlan: HostingPlan;
    subscription: UserSubscription;
    stats: HostingStats;
    payments: PaymentRecord[];
    allPlans: HostingPlan[];
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBilling = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getBillingCurrent();
      setBillingData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load hosting plan details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBilling();
  }, []);

  if (isLoading && !billingData) {
    return (
      <div className="p-12 text-center text-xs text-slate-500">
        Loading cloud hosting plan & resource usage...
      </div>
    );
  }

  const currentPlan = billingData?.currentPlan;
  const sub = billingData?.subscription;
  const payments = billingData?.payments || [];

  const projectUsagePercent = stats
    ? Math.min(100, Math.round((stats.totalProjects / stats.maxProjects) * 100))
    : 0;

  const bandwidthUsagePercent = stats
    ? Math.min(100, Math.round((stats.bandwidthUsedGB / stats.bandwidthLimitGB) * 100))
    : 0;

  return (
    <div className="space-y-6 max-w-5xl">
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-xs text-rose-800 rounded-xl">
          {error}
        </div>
      )}

      {/* Subscription Card */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Rocket className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{currentPlan?.name || 'Starter Hosting'}</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-emerald-100 text-emerald-800 font-mono">
                  {sub?.status || 'Active'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{currentPlan?.tagline}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenUpgradeModal}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Upgrade Hosting Plan</span>
          </button>
        </div>

        {/* Resource Usage Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
              <span className="font-semibold text-slate-700">Hosted Websites Quota</span>
              <span className="font-mono tabular-nums text-slate-900 font-bold">
                {stats?.totalProjects} / {stats?.maxProjects} sites
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full transition-all duration-300 ${
                  projectUsagePercent >= 100 ? 'bg-rose-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${projectUsagePercent}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              {stats?.availableSlots} available project deployment slots.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
              <span className="font-semibold text-slate-700">Monthly Edge Bandwidth</span>
              <span className="font-mono tabular-nums text-slate-900 font-bold">
                {stats?.bandwidthUsedGB} / {stats?.bandwidthLimitGB} GB
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${bandwidthUsagePercent}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Edge CDN traffic cached globally.
            </p>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-700 block mb-1">Billing Cadence</span>
            <div className="text-sm font-bold text-slate-900 capitalize">
              {sub?.billingCycle || 'Monthly'} Cycle
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-mono">
              Provider: <span className="capitalize">{sub?.paymentProvider || 'System'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Hosting Tiers Comparison */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Hosting Tiers & Resources</h3>
            <p className="text-xs text-slate-500">Scale your cloud infrastructure as your projects grow</p>
          </div>
          <button
            type="button"
            onClick={onOpenUpgradeModal}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Open Plan Selector &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {billingData?.allPlans.map((plan) => (
            <div
              key={plan.id}
              className={`p-4 rounded-xl border ${
                plan.id === currentPlan?.id
                  ? 'border-indigo-600 bg-indigo-50/20'
                  : 'border-slate-200 bg-slate-50/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{plan.name}</span>
                {plan.id === currentPlan?.id && (
                  <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-full">
                    Current
                  </span>
                )}
              </div>
              <div className="mt-2 text-xl font-mono font-extrabold text-slate-900">
                ${plan.priceMonthly}<span className="text-xs font-normal text-slate-500">/mo</span>
              </div>
              <div className="mt-1 text-xs font-semibold text-indigo-700">
                Capacity: {plan.maxProjects} hosted websites · {plan.bandwidthLimitGB} GB
              </div>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
                {plan.features.slice(0, 3).map((f, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Invoices */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-3">Billing History</h3>
        {payments.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
            No paid invoice transactions recorded.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-4 font-mono">Date</th>
                  <th className="py-2.5 px-4">Plan</th>
                  <th className="py-2.5 px-4">Gateway</th>
                  <th className="py-2.5 px-4 font-mono">Amount</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-slate-900 font-semibold capitalize">
                      {p.planId} Hosting
                    </td>
                    <td className="py-3 px-4 text-slate-600 capitalize">
                      {p.provider} · {p.paymentMethod}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      ${p.amount} {p.currency}
                    </td>
                    <td className="py-3 px-4 text-emerald-700 font-medium">
                      Succeeded
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
