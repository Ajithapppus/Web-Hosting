import React from 'react';
import {
  Rocket,
  Globe,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Check,
  ExternalLink,
  Layers,
  Terminal,
  Cpu,
  Lock,
} from 'lucide-react';

interface HostingLandingViewProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export const HostingLandingView: React.FC<HostingLandingViewProps> = ({
  onGetStarted,
  onSignIn,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Hero */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 overflow-hidden border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700 mb-6">
            <Zap className="w-3.5 h-3.5" />
            <span>Next-Generation Global Edge Web Hosting</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-950 tracking-tight leading-[1.1] max-w-4xl mx-auto text-balance">
            Deploy websites and web apps with instant global edge hosting.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Storvia Cloud provides zero-config web hosting with automatic SSL, Git integration, custom domains, and edge caching across 32 worldwide points of presence.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onGetStarted}
              className="w-full sm:w-auto px-6 py-3.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
            >
              <Rocket className="w-4 h-4" />
              <span>Launch Hosting Console</span>
            </button>
            <button
              type="button"
              onClick={onSignIn}
              className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors shadow-xs"
            >
              Sign In to Console
            </button>
          </div>

          {/* Generated Cloud Platform Showcase */}
          <div className="mt-14 max-w-5xl mx-auto rounded-2xl overflow-hidden border border-slate-200 shadow-2xl bg-slate-900">
            <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-xs font-mono text-slate-400">cloud.storvia.io/projects</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">32 EDGE POFS ONLINE</span>
            </div>
            <img
              src="/src/assets/images/cloud_hosting_preview_1791802738636.jpg"
              alt="Storvia Cloud Web Hosting Platform Console"
              className="w-full object-cover max-h-[520px]"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      {/* Feature Pillar Grid */}
      <section id="features" className="py-20 max-w-6xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Built for Modern Web Frameworks & Production Scale
          </h2>
          <p className="mt-3 text-sm text-slate-600">
            Deploy Next.js, Vite React, Astro, Node.js, and static websites in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Rocket className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Instant Continuous Deployment</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Push code to GitHub or deploy starter templates. Storvia automatically installs packages, runs build scripts, and activates atomic zero-downtime rollouts.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Zero-Config Custom Domains</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Attach any custom domain with automated Let's Encrypt SSL certificates. Point a simple CNAME to <code className="text-indigo-600 font-mono">cname.storvia.app</code> and go live.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <Terminal className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Live Build Logs & Rollbacks</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Watch builds stream in real-time. Instantly roll back to any previous deployment with zero delay if an issue is detected in production.
            </p>
          </div>
        </div>
      </section>

      {/* Hosting Tiers */}
      <section id="pricing" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Transparent Hosting Plans
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Select the hosting capacity your web applications require.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Starter Hosting</h3>
                <p className="text-xs text-slate-500 mt-1">For personal sites & prototypes</p>
                <div className="mt-4 pb-4 border-b border-slate-200">
                  <span className="text-3xl font-extrabold font-mono text-slate-900">$0</span>
                  <span className="text-xs text-slate-500 font-medium">/month</span>
                  <div className="mt-2 text-xs font-semibold text-indigo-700">
                    Host up to 3 active websites
                  </div>
                </div>
                <ul className="mt-4 space-y-2 text-xs text-slate-600">
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> 100 GB Edge CDN bandwidth/mo</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Automatic SSL (*.storvia.app)</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Continuous Git deployment</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Environment variables</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={onGetStarted}
                className="mt-6 w-full py-2.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl"
              >
                Start Free with 3 Sites
              </button>
            </div>

            {/* Pro */}
            <div className="p-6 rounded-2xl border-2 border-indigo-600 bg-white shadow-xl flex flex-col justify-between relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-indigo-600 text-white text-[10px] font-bold uppercase rounded-full tracking-wider">
                Most Popular
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Pro Hosting</h3>
                <p className="text-xs text-slate-500 mt-1">For web agencies & production apps</p>
                <div className="mt-4 pb-4 border-b border-slate-100">
                  <span className="text-3xl font-extrabold font-mono text-slate-900">$29</span>
                  <span className="text-xs text-slate-500 font-medium">/month</span>
                  <div className="mt-2 text-xs font-semibold text-indigo-700">
                    Host up to 15 active websites
                  </div>
                </div>
                <ul className="mt-4 space-y-2 text-xs text-slate-600">
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> 1 TB High-speed edge bandwidth</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Custom domains with zero-config SSL</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Instant rollback & preview branches</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Priority 24/7 technical support</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={onGetStarted}
                className="mt-6 w-full py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
              >
                Deploy Pro Tier
              </button>
            </div>

            {/* Scale */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Scale & Enterprise</h3>
                <p className="text-xs text-slate-500 mt-1">For multi-tenant portfolios</p>
                <div className="mt-4 pb-4 border-b border-slate-200">
                  <span className="text-3xl font-extrabold font-mono text-slate-900">$79</span>
                  <span className="text-xs text-slate-500 font-medium">/month</span>
                  <div className="mt-2 text-xs font-semibold text-indigo-700">
                    Host up to 50 active websites
                  </div>
                </div>
                <ul className="mt-4 space-y-2 text-xs text-slate-600">
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> 5 TB Dedicated Edge bandwidth</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> 99.99% Uptime SLA guarantee</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Team access & collaboration</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Dedicated DevOps architect</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={onGetStarted}
                className="mt-6 w-full py-2.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl"
              >
                Scale with Enterprise
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Rocket className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-white">Storvia Cloud</span>
            <span>·</span>
            <span>Edge Web Hosting & Deployment Platform</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>© 2026 Storvia Cloud Inc. All rights reserved.</span>
            <span>·</span>
            <button onClick={onSignIn} className="hover:text-white transition-colors">
              Developer Login
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
