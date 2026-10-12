import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  DatabaseSchema,
  User,
  HostingPlan,
  UserSubscription,
  HostedProject,
  DeploymentRecord,
  PaymentRecord,
  ActivityLog,
  PlatformSettings,
} from './types';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'storvia-hosting-db.json');

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, combinedHash: string): boolean {
  try {
    const [salt, key] = combinedHash.split(':');
    if (!salt || !key) return false;
    const testHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(testHash, 'hex'));
  } catch {
    return false;
  }
}

export const sessionStore = new Map<string, { userId: string; expiresAt: number }>();

export function createSessionToken(userId: string): string {
  const token = 'stk_' + crypto.randomBytes(32).toString('hex');
  sessionStore.set(token, {
    userId,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
  });
  return token;
}

export function validateSessionToken(token: string): string | null {
  if (!token) return null;
  const session = sessionStore.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessionStore.delete(token);
    return null;
  }
  return session.userId;
}

const defaultPlans: HostingPlan[] = [
  {
    id: 'starter',
    name: 'Starter Hosting',
    tagline: 'Ideal for personal web projects, portfolios, and static websites.',
    maxProjects: 3,
    bandwidthLimitGB: 100,
    maxRequestsDaily: 50000,
    priceMonthly: 0,
    priceAnnual: 0,
    features: [
      'Up to 3 active hosted projects',
      '100 GB Global Edge CDN bandwidth/mo',
      'Automatic SSL/TLS encryption (*.storvia.app)',
      'Instant Git repository deployments',
      'Environment variables management',
      'Build logs & deployment rollback',
      'Community developer support',
    ],
    isActive: true,
  },
  {
    id: 'pro',
    name: 'Pro Hosting',
    tagline: 'High-performance cloud hosting for web applications, SaaS, and client projects.',
    maxProjects: 15,
    bandwidthLimitGB: 1000,
    maxRequestsDaily: 500000,
    priceMonthly: 29,
    priceAnnual: 290,
    features: [
      'Up to 15 active hosted projects',
      '1 TB High-Speed Edge bandwidth/mo',
      'Custom domains with automatic zero-config SSL',
      'Unlimited preview branches & rollback history',
      'Advanced DDoS mitigation & Web Application Firewall',
      'Real-time serverless build logs & metrics',
      'Priority 24/7 technical support',
    ],
    isPopular: true,
    isActive: true,
  },
  {
    id: 'business',
    name: 'Scale & Enterprise',
    tagline: 'Dedicated cloud infrastructure for high-traffic agencies and enterprise portfolios.',
    maxProjects: 50,
    bandwidthLimitGB: 5000,
    maxRequestsDaily: 2500000,
    priceMonthly: 79,
    priceAnnual: 790,
    features: [
      'Up to 50 active hosted projects',
      '5 TB Dedicated multi-region Edge bandwidth/mo',
      '99.99% Uptime Service Level Agreement',
      'Custom enterprise domain routing & wildcard SSL',
      'Multi-seat team member permissions',
      'Dedicated infrastructure engineering manager',
      'SOC2 and compliance audit logging',
    ],
    isActive: true,
  },
];

const defaultSettings: PlatformSettings = {
  allowNewRegistrations: true,
  edgeRegion: 'Global (32 Edge POFs)',
  maintenanceMode: false,
  supportEmail: 'hosting@storvia.io',
};

function generateInitialSeed(): DatabaseSchema {
  const now = new Date();
  const past30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const next30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const alexUser: User = {
    id: 'usr_alex_001',
    name: 'Alex Miller',
    email: 'alex@example.com',
    passwordHash: hashPassword('Password123!'),
    role: 'user',
    status: 'active',
    avatarUrl: '/src/assets/images/user_avatar_alex_1791801534928.jpg',
    company: 'Stellar Labs',
    createdAt: past30Days,
    updatedAt: past30Days,
  };

  const adminUser: User = {
    id: 'usr_admin_001',
    name: 'Sarah Vance',
    email: 'admin@storvia.io',
    passwordHash: hashPassword('AdminPass123!'),
    role: 'admin',
    status: 'active',
    avatarUrl: '/src/assets/images/user_avatar_admin_1791801546443.jpg',
    company: 'Storvia Cloud Infrastructure',
    createdAt: past30Days,
    updatedAt: past30Days,
  };

  const alexSub: UserSubscription = {
    id: 'sub_alex_001',
    userId: alexUser.id,
    planId: 'starter',
    billingCycle: 'monthly',
    status: 'active',
    currentPeriodStart: past30Days,
    currentPeriodEnd: next30Days,
    cancelAtPeriodEnd: false,
    paymentProvider: 'manual',
    subscriptionId: 'sub_free_alex',
  };

  const adminSub: UserSubscription = {
    id: 'sub_admin_001',
    userId: adminUser.id,
    planId: 'business',
    billingCycle: 'annual',
    status: 'active',
    currentPeriodStart: past30Days,
    currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    cancelAtPeriodEnd: false,
    paymentProvider: 'manual',
    subscriptionId: 'sub_sys_admin',
  };

  // Seed 2 hosted projects for Alex (2 of 3 used on Starter plan, 1 available slot)
  const dep1: DeploymentRecord = {
    id: 'dep_stellar_prod_01',
    projectId: 'proj_stellar_shop',
    commitHash: '8f4b21c',
    commitMessage: 'feat: add Stripe checkout integration and product catalogue',
    branch: 'main',
    author: 'Alex Miller',
    status: 'ready',
    durationSec: 32,
    previewUrl: 'https://stellar-shop.storvia.app',
    productionUrl: 'https://stellar-shop.storvia.app',
    buildLogs: [
      '[storvia-builder] Cloning git repository: github.com/alexmiller/stellar-shop',
      '[storvia-builder] Detected framework preset: Next.js (App Router)',
      '[storvia-builder] Node version: v20.11.0, npm version: 10.2.4',
      '[storvia-builder] Running build command: npm run build',
      '[next-build] ✓ Compiled / (Static)',
      '[next-build] ✓ Compiled /products/[id] (SSG)',
      '[next-build] ✓ Generated 14 static pages',
      '[storvia-builder] Optimizing 24 static assets for Edge CDN distribution',
      '[storvia-builder] Provisioning SSL certificate for stellar-shop.storvia.app',
      '[storvia-builder] Deployment complete! Live at https://stellar-shop.storvia.app',
    ],
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  };

  const project1: HostedProject = {
    id: 'proj_stellar_shop',
    userId: alexUser.id,
    name: 'Stellar Shop',
    slug: 'stellar-shop',
    subdomain: 'stellar-shop.storvia.app',
    customDomain: 'shop.stellarlabs.dev',
    customDomainVerified: true,
    framework: 'nextjs',
    gitRepo: 'github.com/alexmiller/stellar-shop',
    branch: 'main',
    buildCommand: 'npm run build',
    outputDir: '.next',
    status: 'ready',
    latestDeployment: dep1,
    envVars: [
      { id: 'env_1', key: 'NEXT_PUBLIC_API_URL', value: 'https://api.stellarlabs.dev', target: 'all' },
      { id: 'env_2', key: 'DATABASE_URL', value: 'postgresql://postgres:secret@db.internal:5432/main', target: 'production' },
    ],
    analytics: {
      bandwidthGB: 34.2,
      requests24h: 18420,
      avgLatencyMs: 38,
    },
    sslStatus: 'active',
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  };

  const dep2: DeploymentRecord = {
    id: 'dep_docs_prod_01',
    projectId: 'proj_developer_docs',
    commitHash: '3e91a0f',
    commitMessage: 'docs: update deployment troubleshooting guide and API reference',
    branch: 'main',
    author: 'Alex Miller',
    status: 'ready',
    durationSec: 18,
    previewUrl: 'https://developer-docs.storvia.app',
    productionUrl: 'https://developer-docs.storvia.app',
    buildLogs: [
      '[storvia-builder] Cloning git repository: github.com/alexmiller/developer-docs',
      '[storvia-builder] Detected framework preset: Astro Documentation',
      '[storvia-builder] Running build command: astro build',
      '[astro-build] Generated 42 HTML pages in 4.12s',
      '[storvia-builder] Deployed bundle to global edge locations',
      '[storvia-builder] Live at https://developer-docs.storvia.app',
    ],
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  };

  const project2: HostedProject = {
    id: 'proj_developer_docs',
    userId: alexUser.id,
    name: 'Developer Documentation',
    slug: 'developer-docs',
    subdomain: 'developer-docs.storvia.app',
    framework: 'astro',
    gitRepo: 'github.com/alexmiller/developer-docs',
    branch: 'main',
    buildCommand: 'astro build',
    outputDir: 'dist',
    status: 'ready',
    latestDeployment: dep2,
    envVars: [
      { id: 'env_3', key: 'SITE_TITLE', value: 'Developer Docs Hub', target: 'all' },
    ],
    analytics: {
      bandwidthGB: 12.8,
      requests24h: 6240,
      avgLatencyMs: 24,
    },
    sslStatus: 'active',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  };

  // Seed project for Admin
  const depAdmin: DeploymentRecord = {
    id: 'dep_admin_edge_01',
    projectId: 'proj_edge_control',
    commitHash: 'f1a92bc',
    commitMessage: 'sys: scale edge gateway routing tables',
    branch: 'production',
    author: 'Sarah Vance',
    status: 'ready',
    durationSec: 22,
    previewUrl: 'https://edge-control.storvia.app',
    productionUrl: 'https://edge-control.storvia.app',
    buildLogs: [
      '[storvia-builder] Building React edge control console',
      '[storvia-builder] Successfully published to 32 Edge POFs',
    ],
    createdAt: past30Days,
  };

  const projectAdmin: HostedProject = {
    id: 'proj_edge_control',
    userId: adminUser.id,
    name: 'Edge Control Gateway',
    slug: 'edge-control',
    subdomain: 'edge-control.storvia.app',
    framework: 'react',
    gitRepo: 'github.com/storvia/edge-control',
    branch: 'production',
    buildCommand: 'npm run build',
    outputDir: 'dist',
    status: 'ready',
    latestDeployment: depAdmin,
    envVars: [],
    analytics: {
      bandwidthGB: 182.4,
      requests24h: 94000,
      avgLatencyMs: 16,
    },
    sslStatus: 'active',
    createdAt: past30Days,
    updatedAt: past30Days,
  };

  const payments: PaymentRecord[] = [
    {
      id: 'pay_001',
      userId: alexUser.id,
      subscriptionId: alexSub.id,
      planId: 'starter',
      amount: 0,
      currency: 'USD',
      billingCycle: 'monthly',
      status: 'succeeded',
      paymentMethod: 'Free Tier',
      provider: 'stripe',
      transactionId: 'txn_init_free',
      createdAt: past30Days,
    },
  ];

  const activityLogs: ActivityLog[] = [
    {
      id: 'act_001',
      userId: alexUser.id,
      userName: alexUser.name,
      action: 'PROJECT_DEPLOYED',
      details: 'Deployed Next.js website: stellar-shop.storvia.app (commit 8f4b21c)',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'act_002',
      userId: alexUser.id,
      userName: alexUser.name,
      action: 'PROJECT_DEPLOYED',
      details: 'Deployed Astro documentation: developer-docs.storvia.app',
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
  ];

  return {
    users: [alexUser, adminUser],
    plans: defaultPlans,
    subscriptions: [alexSub, adminSub],
    projects: [project1, project2, projectAdmin],
    deployments: [dep1, dep2, depAdmin],
    payments,
    activityLogs,
    settings: defaultSettings,
  };
}

class HostingDatabase {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.projects && parsed.plans) {
          return {
            users: parsed.users || [],
            plans: parsed.plans || defaultPlans,
            subscriptions: parsed.subscriptions || [],
            projects: parsed.projects || [],
            deployments: parsed.deployments || [],
            payments: parsed.payments || [],
            activityLogs: parsed.activityLogs || [],
            settings: parsed.settings || defaultSettings,
          };
        }
      }
    } catch (err) {
      console.warn('Initializing new hosting database:', err);
    }

    const seed = generateInitialSeed();
    this.saveData(seed);
    return seed;
  }

  private saveData(dataToSave: DatabaseSchema = this.data) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write hosting database:', err);
    }
  }

  // Users
  getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  }

  getAllUsers(): User[] {
    return this.data.users;
  }

  createUser(user: User): User {
    this.data.users.push(user);
    this.saveData();
    return user;
  }

  updateUser(id: string, updates: Partial<User>): User | null {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = { ...this.data.users[idx], ...updates, updatedAt: new Date().toISOString() };
    this.saveData();
    return this.data.users[idx];
  }

  // Plans & Subscriptions
  getPlans(): HostingPlan[] {
    return this.data.plans;
  }

  getPlanById(id: string): HostingPlan | undefined {
    return this.data.plans.find((p) => p.id === id);
  }

  updatePlan(planId: string, updates: Partial<HostingPlan>): HostingPlan | null {
    const idx = this.data.plans.findIndex((p) => p.id === planId);
    if (idx === -1) return null;
    this.data.plans[idx] = { ...this.data.plans[idx], ...updates };
    this.saveData();
    return this.data.plans[idx];
  }

  getUserSubscription(userId: string): UserSubscription | undefined {
    return this.data.subscriptions.find((s) => s.userId === userId && s.status === 'active') ||
      this.data.subscriptions.find((s) => s.userId === userId);
  }

  setUserSubscription(sub: UserSubscription): UserSubscription {
    const idx = this.data.subscriptions.findIndex((s) => s.userId === sub.userId);
    if (idx !== -1) {
      this.data.subscriptions[idx] = sub;
    } else {
      this.data.subscriptions.push(sub);
    }
    this.saveData();
    return sub;
  }

  // Hosted Projects
  getProjectsByUserId(userId: string): HostedProject[] {
    return this.data.projects.filter((p) => p.userId === userId);
  }

  getProjectById(id: string): HostedProject | undefined {
    return this.data.projects.find((p) => p.id === id);
  }

  getProjectBySubdomain(subdomain: string): HostedProject | undefined {
    return this.data.projects.find((p) => p.subdomain.toLowerCase() === subdomain.toLowerCase());
  }

  createProject(project: HostedProject): HostedProject {
    this.data.projects.unshift(project);
    this.saveData();
    return project;
  }

  updateProject(id: string, updates: Partial<HostedProject>): HostedProject | null {
    const idx = this.data.projects.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    this.data.projects[idx] = {
      ...this.data.projects[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveData();
    return this.data.projects[idx];
  }

  deleteProject(id: string): boolean {
    const idx = this.data.projects.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    this.data.projects.splice(idx, 1);
    this.saveData();
    return true;
  }

  getAllProjects(): HostedProject[] {
    return this.data.projects;
  }

  // Deployments
  addDeployment(deployment: DeploymentRecord): DeploymentRecord {
    this.data.deployments.unshift(deployment);
    this.saveData();
    return deployment;
  }

  getDeploymentsByProjectId(projectId: string): DeploymentRecord[] {
    return this.data.deployments.filter((d) => d.projectId === projectId);
  }

  // Payments
  getPaymentsByUserId(userId: string): PaymentRecord[] {
    return this.data.payments
      .filter((p) => p.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getAllPayments(): PaymentRecord[] {
    return [...this.data.payments].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  createPayment(payment: PaymentRecord): PaymentRecord {
    this.data.payments.unshift(payment);
    this.saveData();
    return payment;
  }

  // Activity Logs
  logActivity(userId: string, userName: string, action: ActivityLog['action'], details: string) {
    const log: ActivityLog = {
      id: 'act_' + crypto.randomUUID().slice(0, 8),
      userId,
      userName,
      action,
      details,
      createdAt: new Date().toISOString(),
    };
    this.data.activityLogs.unshift(log);
    if (this.data.activityLogs.length > 200) {
      this.data.activityLogs.pop();
    }
    this.saveData();
    return log;
  }

  getActivityLogs(limit = 50): ActivityLog[] {
    return this.data.activityLogs.slice(0, limit);
  }

  getSettings(): PlatformSettings {
    return this.data.settings;
  }

  updateSettings(updates: Partial<PlatformSettings>): PlatformSettings {
    this.data.settings = { ...this.data.settings, ...updates };
    this.saveData();
    return this.data.settings;
  }

  resetToDefaults(): void {
    this.data = generateInitialSeed();
    this.saveData();
  }
}

export const db = new HostingDatabase();
