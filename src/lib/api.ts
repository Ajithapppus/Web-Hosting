import {
  User,
  HostingPlan,
  HostedProject,
  DeploymentRecord,
  HostingStats,
  PaymentRecord,
  ActivityLog,
} from '../types';

const TOKEN_KEY = 'storvia_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || 'An unexpected error occurred.') as any;
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data as T;
}

export const api = {
  // Auth
  async register(body: { name: string; email: string; password: string; company?: string }) {
    const res = await request<{ message: string; token: string; user: User; limits: HostingStats }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    setStoredToken(res.token);
    return res;
  },

  async login(body: { email: string; password: string }) {
    const res = await request<{ message: string; token: string; user: User; limits: HostingStats }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    setStoredToken(res.token);
    return res;
  },

  async demoSwitch(role: 'user' | 'admin') {
    const res = await request<{ message: string; token: string; user: User; limits: HostingStats }>('/api/auth/demo-switch', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
    setStoredToken(res.token);
    return res;
  },

  async getMe() {
    return request<{ user: User; limits: HostingStats }>('/api/auth/me');
  },

  async forgotPassword(email: string) {
    return request<{ message: string; resetToken?: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(resetToken: string, newPassword: string) {
    return request<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ resetToken, newPassword }),
    });
  },

  async updateProfile(updates: { name?: string; company?: string; currentPassword?: string; newPassword?: string }) {
    return request<{ message: string; user: User }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  logout() {
    clearStoredToken();
  },

  // Hosted Projects
  async getProjects(params?: { q?: string; framework?: string }) {
    const query = new URLSearchParams();
    if (params?.q) query.set('q', params.q);
    if (params?.framework) query.set('framework', params.framework);
    const qs = query.toString();
    return request<{
      projects: HostedProject[];
      stats: HostingStats;
    }>(`/api/projects${qs ? `?${qs}` : ''}`);
  },

  async getProjectDetails(id: string) {
    return request<{
      project: HostedProject;
      deployments: DeploymentRecord[];
    }>(`/api/projects/${id}`);
  },

  async deployProject(data: {
    name: string;
    framework: string;
    gitRepo?: string;
    branch?: string;
    buildCommand?: string;
    outputDir?: string;
    envVars?: { key: string; value: string; target?: string }[];
  }) {
    return request<{
      message: string;
      project: HostedProject;
      deployment: DeploymentRecord;
      stats: HostingStats;
    }>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async redeployProject(id: string, commitMessage?: string) {
    return request<{
      message: string;
      deployment: DeploymentRecord;
      project: HostedProject;
    }>(`/api/projects/${id}/redeploy`, {
      method: 'POST',
      body: JSON.stringify({ commitMessage }),
    });
  },

  async attachCustomDomain(id: string, customDomain: string) {
    return request<{
      message: string;
      project: HostedProject;
      dnsInstructions: any;
    }>(`/api/projects/${id}/custom-domain`, {
      method: 'POST',
      body: JSON.stringify({ customDomain }),
    });
  },

  async updateProjectEnv(id: string, envVars: any[]) {
    return request<{
      message: string;
      project: HostedProject;
    }>(`/api/projects/${id}/env`, {
      method: 'PUT',
      body: JSON.stringify({ envVars }),
    });
  },

  async updateProjectSettings(id: string, updates: Partial<HostedProject>) {
    return request<{
      message: string;
      project: HostedProject;
    }>(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteProject(id: string) {
    return request<{
      message: string;
      stats: HostingStats;
    }>(`/api/projects/${id}`, {
      method: 'DELETE',
    });
  },

  // Plans & Billing
  async getPlans() {
    return request<{ plans: HostingPlan[] }>('/api/plans');
  },

  async getBillingCurrent() {
    return request<{
      currentPlan: HostingPlan;
      subscription: any;
      stats: HostingStats;
      payments: PaymentRecord[];
      allPlans: HostingPlan[];
    }>('/api/billing/current');
  },

  async createCheckoutSession(planId: string, billingCycle: 'monthly' | 'annual', provider: 'stripe' | 'razorpay') {
    return request<{
      sessionId: string;
      provider: string;
      planId: string;
      planName: string;
      billingCycle: string;
      amount: number;
      currency: string;
      customerEmail: string;
    }>('/api/billing/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ planId, billingCycle, provider }),
    });
  },

  async verifyPayment(payload: {
    sessionId: string;
    planId: string;
    billingCycle: 'monthly' | 'annual';
    provider: 'stripe' | 'razorpay';
    paymentMethod?: string;
    simulateFailure?: boolean;
  }) {
    return request<{
      success: boolean;
      message: string;
      payment: PaymentRecord;
      subscription: any;
      stats: HostingStats;
    }>('/api/billing/verify-payment', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Admin
  async getAdminStats() {
    return request<{
      stats: any;
      activityLogs: ActivityLog[];
      users: any[];
      plans: HostingPlan[];
      payments: PaymentRecord[];
    }>('/api/admin/stats');
  },

  async setAdminUserStatus(id: string, status: 'active' | 'suspended') {
    return request<{ message: string; user: User }>(`/api/admin/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  async updateAdminPlan(planId: string, data: Partial<HostingPlan>) {
    return request<{ message: string; plan: HostingPlan }>(`/api/admin/plans/${planId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async resetDemoData() {
    return request<{ message: string }>('/api/admin/reset-demo', {
      method: 'POST',
    });
  },
};
