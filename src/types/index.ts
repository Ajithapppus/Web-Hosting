export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  company?: string;
  createdAt: string;
  updatedAt: string;
}

export type DeploymentStatus = 'ready' | 'building' | 'failed' | 'queued' | 'canceled';
export type FrameworkType = 'nextjs' | 'react' | 'vue' | 'astro' | 'static' | 'nodejs';

export interface EnvVariable {
  id: string;
  key: string;
  value: string;
  target: 'production' | 'preview' | 'all';
}

export interface DeploymentRecord {
  id: string;
  projectId: string;
  commitHash: string;
  commitMessage: string;
  branch: string;
  author: string;
  status: DeploymentStatus;
  durationSec: number;
  previewUrl: string;
  productionUrl: string;
  buildLogs: string[];
  createdAt: string;
}

export interface HostedProject {
  id: string;
  userId: string;
  name: string;
  slug: string;
  subdomain: string;
  customDomain?: string;
  customDomainVerified?: boolean;
  framework: FrameworkType;
  gitRepo?: string;
  branch: string;
  buildCommand: string;
  outputDir: string;
  status: DeploymentStatus;
  latestDeployment: DeploymentRecord;
  envVars: EnvVariable[];
  analytics: {
    bandwidthGB: number;
    requests24h: number;
    avgLatencyMs: number;
  };
  sslStatus: 'active' | 'provisioning' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface HostingStats {
  totalProjects: number;
  maxProjects: number;
  availableSlots: number;
  currentPlan: string;
  planId?: string;
  isLimitReached: boolean;
  bandwidthUsedGB: number;
  bandwidthLimitGB: number;
}

export interface HostingPlan {
  id: 'starter' | 'pro' | 'business' | 'enterprise';
  name: string;
  tagline: string;
  maxProjects: number;
  bandwidthLimitGB: number;
  maxRequestsDaily: number;
  priceMonthly: number;
  priceAnnual: number;
  features: string[];
  isPopular?: boolean;
  isActive: boolean;
}

export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'expired';
export type BillingCycle = 'monthly' | 'annual';

export interface UserSubscription {
  id: string;
  userId: string;
  planId: 'starter' | 'pro' | 'business' | 'enterprise';
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  paymentProvider: 'stripe' | 'razorpay' | 'manual';
  subscriptionId?: string;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  subscriptionId: string;
  planId: string;
  amount: number;
  currency: string;
  billingCycle: BillingCycle;
  status: 'succeeded' | 'pending' | 'failed';
  paymentMethod: string;
  provider: 'stripe' | 'razorpay';
  transactionId: string;
  receiptUrl?: string;
  createdAt: string;
  userName?: string;
  userEmail?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: 'PROJECT_DEPLOYED' | 'PROJECT_DELETED' | 'PROJECT_REDEPLOYED' | 'DOMAIN_ATTACHED' | 'ENV_UPDATED' | 'PLAN_UPGRADED' | 'PLAN_DOWNGRADED' | 'USER_SUSPENDED' | 'USER_LOGIN';
  details: string;
  createdAt: string;
}
