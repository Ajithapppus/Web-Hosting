/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { api, getStoredToken } from './lib/api';
import { User, HostedProject, HostingStats, HostingPlan } from './types';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { HostingDashboardView } from './components/HostingDashboardView';
import { HostingBillingView } from './components/HostingBillingView';
import { SettingsView } from './components/SettingsView';
import { HostingAdminView } from './components/HostingAdminView';
import { HostingLandingView } from './components/HostingLandingView';
import { DeployProjectModal } from './components/DeployProjectModal';
import { ProjectDetailModal } from './components/ProjectDetailModal';
import { UpgradePlanModal } from './components/UpgradePlanModal';
import { AuthModal } from './components/AuthModal';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [stats, setStats] = useState<HostingStats | null>(null);
  const [projects, setProjects] = useState<HostedProject[]>([]);
  const [allPlans, setAllPlans] = useState<HostingPlan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFramework, setSelectedFramework] = useState('');

  // Modals
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [inspectingProject, setInspectingProject] = useState<HostedProject | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Notifications
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const loadPlans = async () => {
    try {
      const res = await api.getPlans();
      setAllPlans(res.plans);
    } catch {
      // fallback
    }
  };

  const loadHostingData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [meRes, projectsRes] = await Promise.all([
        api.getMe(),
        api.getProjects({
          q: searchQuery,
          framework: selectedFramework,
        }),
      ]);

      setUser(meRes.user);
      setStats(projectsRes.stats);
      setProjects(projectsRes.projects);
    } catch (err: any) {
      if (err.status === 401) {
        setUser(null);
        setCurrentView('landing');
      }
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedFramework]);

  useEffect(() => {
    const initApp = async () => {
      await loadPlans();
      const existingToken = getStoredToken();
      if (existingToken) {
        try {
          await loadHostingData();
          return;
        } catch {
          // fallback
        }
      }

      // Initialize default session as Alex Miller
      try {
        const demoRes = await api.demoSwitch('user');
        setUser(demoRes.user);
        setStats(demoRes.limits);
        setCurrentView('dashboard');
        const projRes = await api.getProjects();
        setProjects(projRes.projects);
        setStats(projRes.stats);
      } catch {
        setCurrentView('landing');
      } finally {
        setIsLoading(false);
      }
    };

    initApp();
  }, []);

  useEffect(() => {
    if (user && currentView === 'dashboard') {
      const timer = setTimeout(() => {
        loadHostingData();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, selectedFramework, currentView, user]);

  const handleDeployProject = async (data: any) => {
    const res = await api.deployProject(data);
    setStats(res.stats);
    showToast(`Deployed ${res.project.name} to https://${res.project.subdomain}!`);
    await loadHostingData();
    return res;
  };

  const handleRedeploy = async (id: string) => {
    const res = await api.redeployProject(id);
    showToast(`Rebuilt and deployed ${res.project.name}`);
    await loadHostingData();
    if (inspectingProject?.id === id) {
      setInspectingProject(res.project);
    }
    return res;
  };

  const handleDeleteProject = async (id: string, name: string) => {
    const res = await api.deleteProject(id);
    setStats(res.stats);
    showToast(`Removed hosted site "${name}"`);
    await loadHostingData();
    return res;
  };

  const handleQuickRoleSwitch = async (role: 'user' | 'admin') => {
    try {
      setIsLoading(true);
      const res = await api.demoSwitch(role);
      setUser(res.user);
      setStats(res.limits);
      setSearchQuery('');
      setSelectedFramework('');
      showToast(`Switched account: ${res.user.name} (${res.user.role.toUpperCase()})`);

      if (role === 'admin') {
        setCurrentView('admin');
      } else {
        setCurrentView('dashboard');
      }
      await loadHostingData();
    } catch (err: any) {
      showToast(err.message || 'Failed to switch user.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setCurrentView('landing');
    showToast('Signed out of Storvia Cloud');
  };

  const handleAuthSuccess = (authedUser: User) => {
    setUser(authedUser);
    setCurrentView('dashboard');
    showToast(`Welcome to Storvia Cloud, ${authedUser.name}!`);
    loadHostingData();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200 text-xs">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span className="font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        user={user}
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        onOpenDeployModal={() => setIsDeployModalOpen(true)}
        onOpenAuthModal={(mode) => {
          setAuthMode(mode);
          setIsAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        onQuickRoleSwitch={handleQuickRoleSwitch}
        stats={stats}
        onUpgradeClick={() => setIsUpgradeModalOpen(true)}
      />

      {/* Main Content */}
      {currentView === 'landing' || !user ? (
        <HostingLandingView
          onGetStarted={() => {
            if (user) {
              setCurrentView('dashboard');
            } else {
              setAuthMode('register');
              setIsAuthModalOpen(true);
            }
          }}
          onSignIn={() => {
            setAuthMode('login');
            setIsAuthModalOpen(true);
          }}
        />
      ) : (
        <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
          {/* Sidebar */}
          <Sidebar
            currentView={currentView}
            onNavigate={(view) => setCurrentView(view)}
            user={user}
            stats={stats}
            onUpgradeClick={() => setIsUpgradeModalOpen(true)}
          />

          {/* Main Viewport */}
          <main className="flex-1 p-6 md:p-8 overflow-y-auto">
            {currentView === 'dashboard' && (
              <HostingDashboardView
                projects={projects}
                stats={stats}
                onOpenDeployModal={() => setIsDeployModalOpen(true)}
                onOpenProjectDetail={(p) => setInspectingProject(p)}
                onRedeploy={handleRedeploy}
                onUpgradeClick={() => setIsUpgradeModalOpen(true)}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedFramework={selectedFramework}
                setSelectedFramework={setSelectedFramework}
                isLoading={isLoading}
              />
            )}

            {currentView === 'billing' && (
              <HostingBillingView
                stats={stats}
                onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
                onRefresh={loadHostingData}
              />
            )}

            {currentView === 'settings' && (
              <SettingsView
                user={user}
                stats={stats as any}
                onUserUpdated={(updated) => setUser(updated)}
              />
            )}

            {currentView === 'admin' && user.role === 'admin' && (
              <HostingAdminView />
            )}
          </main>
        </div>
      )}

      {/* Modals */}
      <DeployProjectModal
        isOpen={isDeployModalOpen}
        onClose={() => setIsDeployModalOpen(false)}
        onDeploy={handleDeployProject}
        onUpgradeClick={() => setIsUpgradeModalOpen(true)}
        stats={stats}
        onSuccess={(msg) => showToast(msg)}
      />

      <ProjectDetailModal
        isOpen={!!inspectingProject}
        project={inspectingProject}
        onClose={() => setInspectingProject(null)}
        onRedeploy={handleRedeploy}
        onDelete={handleDeleteProject}
        onSuccess={(msg) => showToast(msg)}
      />

      <UpgradePlanModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        plans={allPlans}
        currentStats={stats}
        onSuccess={(msg) => {
          showToast(msg);
          loadHostingData();
        }}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authMode}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
