import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import {
  db,
  hashPassword,
  verifyPassword,
  createSessionToken,
  validateSessionToken,
} from './db';
import {
  User,
  HostedProject,
  DeploymentRecord,
  PaymentRecord,
  UserSubscription,
  FrameworkType,
} from './types';

export const apiRouter = Router();

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const token = authHeader.split(' ')[1];
  const userId = validateSessionToken(token);
  if (!userId) {
    return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
  }

  const user = db.getUserById(userId);
  if (!user) {
    return res.status(401).json({ error: 'User account not found.' });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'Your hosting account has been suspended by an administrator.' });
  }

  req.user = user;
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    }
    next();
  });
}

function getUserHostingLimits(userId: string) {
  const sub = db.getUserSubscription(userId);
  const planId = sub?.planId || 'starter';
  const plan = db.getPlanById(planId) || db.getPlans()[0];
  const projects = db.getProjectsByUserId(userId);
  const totalProjects = projects.length;
  const maxProjects = plan.maxProjects;
  const availableSlots = Math.max(0, maxProjects - totalProjects);
  const isLimitReached = totalProjects >= maxProjects;

  const bandwidthUsedGB = Number(
    projects.reduce((acc, p) => acc + (p.analytics?.bandwidthGB || 0), 0).toFixed(1)
  );

  return {
    sub,
    plan,
    totalProjects,
    maxProjects,
    availableSlots,
    isLimitReached,
    bandwidthUsedGB,
    bandwidthLimitGB: plan.bandwidthLimitGB,
  };
}

// ==========================================
// AUTHENTICATION
// ==========================================

apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { name, email, password, company } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Name is required (min 2 chars).' });
  }
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required.' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const userId = 'usr_' + crypto.randomUUID().slice(0, 8);
  const now = new Date().toISOString();
  const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString();

  const newUser: User = {
    id: userId,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: hashPassword(password),
    role: 'user',
    status: 'active',
    avatarUrl: '/src/assets/images/user_avatar_alex_1791801534928.jpg',
    company: company ? company.trim() : undefined,
    createdAt: now,
    updatedAt: now,
  };

  db.createUser(newUser);

  const sub: UserSubscription = {
    id: 'sub_' + crypto.randomUUID().slice(0, 8),
    userId: newUser.id,
    planId: 'starter',
    billingCycle: 'monthly',
    status: 'active',
    currentPeriodStart: now,
    currentPeriodEnd: nextMonth,
    cancelAtPeriodEnd: false,
    paymentProvider: 'manual',
    subscriptionId: 'sub_free_init',
  };
  db.setUserSubscription(sub);

  const token = createSessionToken(newUser.id);
  db.logActivity(newUser.id, newUser.name, 'USER_LOGIN', 'New user registered for cloud hosting');

  const { passwordHash: _, ...safeUser } = newUser;
  const limits = getUserHostingLimits(newUser.id);

  return res.status(201).json({
    message: 'Cloud hosting account created.',
    token,
    user: safeUser,
    limits,
  });
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required.' });
  }

  const user = db.getUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'Account suspended.' });
  }

  const token = createSessionToken(user.id);
  db.logActivity(user.id, user.name, 'USER_LOGIN', 'User logged in to cloud console');

  const { passwordHash: _, ...safeUser } = user;
  const limits = getUserHostingLimits(user.id);

  return res.json({
    message: 'Welcome back to Storvia Cloud!',
    token,
    user: safeUser,
    limits,
  });
});

apiRouter.post('/auth/demo-switch', (req: Request, res: Response) => {
  const { role } = req.body;
  const targetEmail = role === 'admin' ? 'admin@storvia.io' : 'alex@example.com';
  const user = db.getUserByEmail(targetEmail);
  if (!user) return res.status(404).json({ error: 'Demo user not found.' });

  const token = createSessionToken(user.id);
  const { passwordHash: _, ...safeUser } = user;
  const limits = getUserHostingLimits(user.id);

  return res.json({
    message: `Switched to ${user.name} (${user.role.toUpperCase()})`,
    token,
    user: safeUser,
    limits,
  });
});

apiRouter.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { passwordHash: _, ...safeUser } = req.user!;
  const limits = getUserHostingLimits(req.user!.id);
  return res.json({ user: safeUser, limits });
});

apiRouter.post('/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  const user = email ? db.getUserByEmail(email) : null;
  const resetToken = user ? 'rst_' + crypto.randomBytes(16).toString('hex') : null;
  if (user && resetToken) {
    db.updateUser(user.id, {
      resetPasswordToken: resetToken,
      resetPasswordExpires: new Date(Date.now() + 3600000).toISOString(),
    });
  }
  return res.json({
    message: 'If the email exists, a password reset token has been dispatched.',
    resetToken,
  });
});

apiRouter.post('/auth/reset-password', (req: Request, res: Response) => {
  const { resetToken, newPassword } = req.body;
  const users = db.getAllUsers();
  const user = users.find(
    (u) => u.resetPasswordToken === resetToken && u.resetPasswordExpires && new Date(u.resetPasswordExpires).getTime() > Date.now()
  );
  if (!user) return res.status(400).json({ error: 'Invalid or expired reset token.' });

  db.updateUser(user.id, {
    passwordHash: hashPassword(newPassword),
    resetPasswordToken: null,
    resetPasswordExpires: null,
  });
  return res.json({ message: 'Password has been reset successfully.' });
});

apiRouter.put('/auth/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { name, company, currentPassword, newPassword } = req.body;
  const updates: Partial<User> = {};
  if (name) updates.name = name.trim();
  if (company !== undefined) updates.company = company.trim();
  if (newPassword) {
    if (!currentPassword || !verifyPassword(currentPassword, user.passwordHash)) {
      return res.status(400).json({ error: 'Current password incorrect.' });
    }
    updates.passwordHash = hashPassword(newPassword);
  }
  const updated = db.updateUser(user.id, updates);
  const { passwordHash: _, ...safeUser } = updated!;
  return res.json({ message: 'Profile updated.', user: safeUser });
});

// ==========================================
// HOSTED PROJECTS & DEPLOYMENTS API
// ==========================================

apiRouter.get('/projects', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
  const framework = typeof req.query.framework === 'string' ? req.query.framework.trim() : '';

  let projects = db.getProjectsByUserId(userId);

  if (q) {
    projects = projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.subdomain.toLowerCase().includes(q) ||
        (p.customDomain && p.customDomain.toLowerCase().includes(q))
    );
  }

  if (framework) {
    projects = projects.filter((p) => p.framework === framework);
  }

  const limits = getUserHostingLimits(userId);

  return res.json({
    projects,
    stats: {
      totalProjects: limits.totalProjects,
      maxProjects: limits.maxProjects,
      availableSlots: limits.availableSlots,
      currentPlan: limits.plan.name,
      planId: limits.plan.id,
      isLimitReached: limits.isLimitReached,
      bandwidthUsedGB: limits.bandwidthUsedGB,
      bandwidthLimitGB: limits.bandwidthLimitGB,
    },
  });
});

apiRouter.get('/projects/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const project = db.getProjectById(req.params.id);
  if (!project || project.userId !== req.user!.id) {
    return res.status(404).json({ error: 'Hosted project not found.' });
  }

  const deployments = db.getDeploymentsByProjectId(project.id);
  return res.json({ project, deployments });
});

// DEPLOY A NEW WEBSITE / WEB PROJECT (SERVER ENFORCES HOSTING LIMITS)
apiRouter.post('/projects', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const limits = getUserHostingLimits(userId);

  // 1. Enforce Project Hosting Quota Limit
  if (limits.isLimitReached) {
    return res.status(403).json({
      error: `You have reached your hosting project limit (${limits.totalProjects} of ${limits.maxProjects} projects). Upgrade your plan to deploy additional websites.`,
      limitReached: true,
      currentCount: limits.totalProjects,
      maxLimit: limits.maxProjects,
      planName: limits.plan.name,
      planId: limits.plan.id,
    });
  }

  const {
    name,
    framework = 'nextjs',
    gitRepo,
    branch = 'main',
    buildCommand,
    outputDir,
    envVars = [],
  } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Project name is required (min 2 characters).' });
  }

  // Create clean slug
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const subdomain = `${slug}.storvia.app`;

  // Check unique subdomain
  const existingSub = db.getProjectBySubdomain(subdomain);
  if (existingSub) {
    return res.status(409).json({
      error: `Subdomain "${subdomain}" is already claimed. Please choose a different project name.`,
    });
  }

  const projectId = 'proj_' + crypto.randomUUID().slice(0, 8);
  const now = new Date().toISOString();
  const commitHash = crypto.randomBytes(4).toString('hex');

  const defaultBuildCmd =
    buildCommand ||
    (framework === 'nextjs'
      ? 'npm run build'
      : framework === 'astro'
      ? 'astro build'
      : framework === 'react'
      ? 'vite build'
      : 'npm run build');

  const defaultOutDir =
    outputDir ||
    (framework === 'nextjs' ? '.next' : framework === 'static' ? 'public' : 'dist');

  // Build simulated terminal deployment logs
  const buildLogs = [
    `[storvia-edge] Initializing build container for ${slug}...`,
    `[storvia-edge] Git branch: ${branch} (commit: ${commitHash})`,
    `[storvia-edge] Framework detected: ${framework.toUpperCase()}`,
    `[storvia-edge] Installing package dependencies...`,
    `[storvia-edge] Executing build command: ${defaultBuildCmd}`,
    `[compile] ✓ Code bundled and minified successfully (${defaultOutDir})`,
    `[storvia-edge] Creating Edge CDN deployment package...`,
    `[ssl-engine] Automatic TLS/SSL certificate verified for ${subdomain}`,
    `[storvia-edge] Deployed to 32 global edge points of presence.`,
    `[storvia-edge] Deployment live at https://${subdomain}`,
  ];

  const deployment: DeploymentRecord = {
    id: 'dep_' + crypto.randomUUID().slice(0, 8),
    projectId,
    commitHash,
    commitMessage: `Initial production deployment for ${name}`,
    branch,
    author: req.user!.name,
    status: 'ready',
    durationSec: Math.floor(Math.random() * 20) + 15,
    previewUrl: `https://${subdomain}`,
    productionUrl: `https://${subdomain}`,
    buildLogs,
    createdAt: now,
  };

  db.addDeployment(deployment);

  const cleanEnvVars = Array.isArray(envVars)
    ? envVars.map((v: any) => ({
        id: 'env_' + crypto.randomUUID().slice(0, 6),
        key: String(v.key).trim().toUpperCase(),
        value: String(v.value).trim(),
        target: (v.target || 'all') as any,
      }))
    : [];

  const newProject: HostedProject = {
    id: projectId,
    userId,
    name: name.trim(),
    slug,
    subdomain,
    framework: framework as FrameworkType,
    gitRepo: gitRepo ? String(gitRepo).trim() : `github.com/${req.user!.name.toLowerCase().replace(/\s+/g, '')}/${slug}`,
    branch,
    buildCommand: defaultBuildCmd,
    outputDir: defaultOutDir,
    status: 'ready',
    latestDeployment: deployment,
    envVars: cleanEnvVars,
    analytics: {
      bandwidthGB: 0.1,
      requests24h: 1,
      avgLatencyMs: 28,
    },
    sslStatus: 'active',
    createdAt: now,
    updatedAt: now,
  };

  db.createProject(newProject);
  db.logActivity(userId, req.user!.name, 'PROJECT_DEPLOYED', `Deployed new website: ${subdomain}`);

  const updatedLimits = getUserHostingLimits(userId);

  return res.status(201).json({
    message: `Website "${name}" deployed successfully to https://${subdomain}!`,
    project: newProject,
    deployment,
    stats: {
      totalProjects: updatedLimits.totalProjects,
      maxProjects: updatedLimits.maxProjects,
      availableSlots: updatedLimits.availableSlots,
      isLimitReached: updatedLimits.isLimitReached,
    },
  });
});

// REDEPLOY / TRIGGER NEW BUILD
apiRouter.post('/projects/:id/redeploy', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const project = db.getProjectById(req.params.id);
  if (!project || project.userId !== req.user!.id) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  const commitHash = crypto.randomBytes(4).toString('hex');
  const now = new Date().toISOString();

  const newDeployment: DeploymentRecord = {
    id: 'dep_' + crypto.randomUUID().slice(0, 8),
    projectId: project.id,
    commitHash,
    commitMessage: req.body.commitMessage || `Manual re-deployment trigger via web console`,
    branch: project.branch,
    author: req.user!.name,
    status: 'ready',
    durationSec: Math.floor(Math.random() * 15) + 12,
    previewUrl: `https://${project.slug}-${commitHash}.storvia.app`,
    productionUrl: `https://${project.subdomain}`,
    buildLogs: [
      `[storvia-builder] Redeploy triggered for ${project.name}`,
      `[storvia-builder] Pulling latest git commit: ${commitHash}`,
      `[storvia-builder] Running build: ${project.buildCommand}`,
      `[storvia-builder] Atomic edge switch completed with zero downtime`,
      `[storvia-builder] Active production URL: https://${project.subdomain}`,
    ],
    createdAt: now,
  };

  db.addDeployment(newDeployment);
  const updatedProject = db.updateProject(project.id, {
    latestDeployment: newDeployment,
    status: 'ready',
  });

  db.logActivity(req.user!.id, req.user!.name, 'PROJECT_REDEPLOYED', `Redeployed ${project.subdomain} (commit ${commitHash})`);

  return res.json({
    message: `Redeployment successful for ${project.name}.`,
    deployment: newDeployment,
    project: updatedProject,
  });
});

// ATTACH / VERIFY CUSTOM DOMAIN
apiRouter.post('/projects/:id/custom-domain', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const project = db.getProjectById(req.params.id);
  if (!project || project.userId !== req.user!.id) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  const { customDomain } = req.body;
  if (!customDomain || typeof customDomain !== 'string') {
    return res.status(400).json({ error: 'Custom domain is required (e.g. app.mycompany.com).' });
  }

  const cleanDomain = customDomain.trim().toLowerCase().replace(/^https?:\/\/|^www\./, '').split('/')[0];

  const updated = db.updateProject(project.id, {
    customDomain: cleanDomain,
    customDomainVerified: true,
    sslStatus: 'active',
  });

  db.logActivity(req.user!.id, req.user!.name, 'DOMAIN_ATTACHED', `Attached custom domain ${cleanDomain} to ${project.subdomain}`);

  return res.json({
    message: `Custom domain "${cleanDomain}" attached and verified with SSL.`,
    project: updated,
    dnsInstructions: {
      type: 'CNAME',
      name: cleanDomain,
      value: 'cname.storvia.app',
      status: 'verified',
    },
  });
});

// UPDATE PROJECT ENV VARIABLES
apiRouter.put('/projects/:id/env', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const project = db.getProjectById(req.params.id);
  if (!project || project.userId !== req.user!.id) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  const { envVars } = req.body;
  if (!Array.isArray(envVars)) {
    return res.status(400).json({ error: 'envVars must be an array.' });
  }

  const cleanEnvVars = envVars.map((v: any) => ({
    id: v.id || 'env_' + crypto.randomUUID().slice(0, 6),
    key: String(v.key).trim().toUpperCase(),
    value: String(v.value).trim(),
    target: (v.target || 'all') as any,
  }));

  const updated = db.updateProject(project.id, { envVars: cleanEnvVars });
  db.logActivity(req.user!.id, req.user!.name, 'ENV_UPDATED', `Updated environment variables on ${project.subdomain}`);

  return res.json({
    message: 'Environment variables updated.',
    project: updated,
  });
});

// UPDATE PROJECT GENERAL SETTINGS
apiRouter.put('/projects/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const project = db.getProjectById(req.params.id);
  if (!project || project.userId !== req.user!.id) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  const { name, buildCommand, outputDir, branch } = req.body;
  const updates: Partial<HostedProject> = {};
  if (name) updates.name = String(name).trim();
  if (buildCommand) updates.buildCommand = String(buildCommand).trim();
  if (outputDir) updates.outputDir = String(outputDir).trim();
  if (branch) updates.branch = String(branch).trim();

  const updated = db.updateProject(project.id, updates);
  return res.json({ message: 'Project settings updated.', project: updated });
});

// DELETE HOSTED PROJECT
apiRouter.delete('/projects/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const project = db.getProjectById(req.params.id);
  if (!project || project.userId !== req.user!.id) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  db.deleteProject(project.id);
  db.logActivity(req.user!.id, req.user!.name, 'PROJECT_DELETED', `Deleted hosted website: ${project.subdomain}`);

  const limits = getUserHostingLimits(req.user!.id);
  return res.json({
    message: `Hosted project "${project.name}" (${project.subdomain}) removed.`,
    stats: {
      totalProjects: limits.totalProjects,
      maxProjects: limits.maxProjects,
      availableSlots: limits.availableSlots,
      isLimitReached: limits.isLimitReached,
    },
  });
});

// ==========================================
// BILLING & SUBSCRIPTIONS
// ==========================================

apiRouter.get('/plans', (_req: Request, res: Response) => {
  return res.json({ plans: db.getPlans() });
});

apiRouter.get('/billing/current', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const limits = getUserHostingLimits(userId);
  const payments = db.getPaymentsByUserId(userId);
  return res.json({
    currentPlan: limits.plan,
    subscription: limits.sub,
    stats: {
      totalProjects: limits.totalProjects,
      maxProjects: limits.maxProjects,
      availableSlots: limits.availableSlots,
      isLimitReached: limits.isLimitReached,
      bandwidthUsedGB: limits.bandwidthUsedGB,
      bandwidthLimitGB: limits.bandwidthLimitGB,
    },
    payments,
    allPlans: db.getPlans(),
  });
});

apiRouter.post('/billing/create-checkout-session', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { planId, billingCycle, provider } = req.body;
  const plan = db.getPlanById(planId);
  if (!plan) return res.status(404).json({ error: 'Plan not found.' });

  const cycle = billingCycle === 'annual' ? 'annual' : 'monthly';
  const amount = cycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;
  const selectedProvider = provider === 'razorpay' ? 'razorpay' : 'stripe';

  return res.json({
    sessionId: `chk_host_${selectedProvider}_${crypto.randomUUID().slice(0, 10)}`,
    provider: selectedProvider,
    planId: plan.id,
    planName: plan.name,
    billingCycle: cycle,
    amount,
    currency: 'USD',
    customerEmail: req.user!.email,
  });
});

apiRouter.post('/billing/verify-payment', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { planId, billingCycle, provider, paymentMethod, simulateFailure } = req.body;

  if (simulateFailure) {
    return res.status(402).json({ error: 'Payment declined by gateway.', status: 'failed' });
  }

  const targetPlan = db.getPlanById(planId);
  if (!targetPlan) return res.status(404).json({ error: 'Plan not found.' });

  const cycle = billingCycle === 'annual' ? 'annual' : 'monthly';
  const amount = cycle === 'annual' ? targetPlan.priceAnnual : targetPlan.priceMonthly;
  const selectedProvider = provider === 'razorpay' ? 'razorpay' : 'stripe';
  const now = new Date().toISOString();
  const nextPeriod = new Date(Date.now() + (cycle === 'annual' ? 365 : 30) * 86400000).toISOString();

  const payment: PaymentRecord = {
    id: 'pay_' + crypto.randomUUID().slice(0, 8),
    userId,
    subscriptionId: 'sub_' + crypto.randomUUID().slice(0, 8),
    planId: targetPlan.id,
    amount,
    currency: 'USD',
    billingCycle: cycle,
    status: 'succeeded',
    paymentMethod: paymentMethod || 'Visa •••• 4242',
    provider: selectedProvider,
    transactionId: `txn_${selectedProvider}_${crypto.randomUUID().slice(0, 10)}`,
    createdAt: now,
  };

  db.createPayment(payment);

  const updatedSub: UserSubscription = {
    id: payment.subscriptionId,
    userId,
    planId: targetPlan.id,
    billingCycle: cycle,
    status: 'active',
    currentPeriodStart: now,
    currentPeriodEnd: nextPeriod,
    cancelAtPeriodEnd: false,
    paymentProvider: selectedProvider,
  };

  db.setUserSubscription(updatedSub);
  db.logActivity(userId, req.user!.name, 'PLAN_UPGRADED', `Upgraded to ${targetPlan.name} (${targetPlan.maxProjects} hosted projects limit)`);

  const updatedLimits = getUserHostingLimits(userId);

  return res.json({
    success: true,
    message: `Hosting plan upgraded to ${targetPlan.name}! You can now host up to ${targetPlan.maxProjects} projects.`,
    payment,
    subscription: updatedSub,
    stats: {
      totalProjects: updatedLimits.totalProjects,
      maxProjects: updatedLimits.maxProjects,
      availableSlots: updatedLimits.availableSlots,
      isLimitReached: updatedLimits.isLimitReached,
    },
  });
});

// ==========================================
// ADMIN DASHBOARD
// ==========================================

apiRouter.get('/admin/stats', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const users = db.getAllUsers();
  const projects = db.getAllProjects();
  const plans = db.getPlans();
  const payments = db.getAllPayments();

  let totalBandwidth = 0;
  projects.forEach((p) => {
    totalBandwidth += p.analytics?.bandwidthGB || 0;
  });

  let totalRevenue = 0;
  payments.forEach((p) => {
    if (p.status === 'succeeded') totalRevenue += p.amount;
  });

  return res.json({
    stats: {
      totalUsers: users.length,
      totalProjects: projects.length,
      totalBandwidthGB: Number(totalBandwidth.toFixed(1)),
      totalRevenue,
      serverNodes: [
        { name: 'us-east-1 (N. Virginia)', status: 'healthy', load: '34%' },
        { name: 'eu-west-1 (Frankfurt)', status: 'healthy', load: '41%' },
        { name: 'ap-southeast-1 (Singapore)', status: 'healthy', load: '28%' },
      ],
    },
    activityLogs: db.getActivityLogs(25),
    users: users.map((u) => {
      const uProjects = db.getProjectsByUserId(u.id);
      const sub = db.getUserSubscription(u.id);
      const plan = db.getPlanById(sub?.planId || 'starter');
      const { passwordHash: _, ...safe } = u;
      return {
        ...safe,
        projectCount: uProjects.length,
        planName: plan?.name || 'Starter',
        maxProjects: plan?.maxProjects || 3,
      };
    }),
    plans,
    payments,
  });
});

apiRouter.put('/admin/users/:id/status', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.body;
  const updated = db.updateUser(req.params.id, { status });
  if (!updated) return res.status(404).json({ error: 'User not found.' });
  return res.json({ message: `User status set to ${status}.`, user: updated });
});

apiRouter.put('/admin/plans/:planId', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { maxProjects, bandwidthLimitGB, priceMonthly, priceAnnual } = req.body;
  const updated = db.updatePlan(req.params.planId, {
    maxProjects: Number(maxProjects),
    bandwidthLimitGB: Number(bandwidthLimitGB),
    priceMonthly: Number(priceMonthly),
    priceAnnual: Number(priceAnnual),
  });
  return res.json({ message: 'Plan limits updated.', plan: updated });
});

apiRouter.post('/admin/reset-demo', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  db.resetToDefaults();
  return res.json({ message: 'Hosting platform reset to initial state.' });
});
