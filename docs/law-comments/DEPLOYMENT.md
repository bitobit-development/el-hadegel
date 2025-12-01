# Deployment - Law Commenting System

## Production Deployment Guide

### Prerequisites

- Vercel account (recommended) or other Next.js hosting
- Neon PostgreSQL database (production tier)
- Domain name (optional but recommended)
- Git repository (GitHub, GitLab, Bitbucket)

---

## Deployment Steps

### 1. Database Setup (Neon PostgreSQL)

**Create Production Database**:

1. Go to https://neon.tech
2. Create new project: "el-hadegel-production"
3. Copy connection string:
   ```
   postgres://[user]:[password]@[host]/[database]?sslmode=require
   ```
4. Note: Neon provides automatic backups and point-in-time recovery

**Run Migrations**:

```bash
# Set production DATABASE_URL locally
export DATABASE_URL="postgres://[production-connection-string]"

# Run migrations (creates tables)
npx prisma migrate deploy

# Seed database
npx prisma db seed
```

**Verify Database**:

```bash
# Check tables created
npx prisma studio

# Verify:
# ✓ LawDocument table exists
# ✓ LawParagraph table exists (with 7 paragraphs)
# ✓ LawComment table exists
# ✓ Admin table exists (with default admin)
```

---

### 2. Environment Variables

**Required Variables** (add to Vercel/hosting provider):

```bash
# Database
DATABASE_URL="postgres://[user]:[password]@[host]/[database]?sslmode=require"

# Authentication (IMPORTANT: Generate new secrets!)
AUTH_SECRET="[generate-with-openssl-rand-base64-32]"
AUTH_URL="https://yourdomain.com"  # Production URL

# Feature Flags
NEXT_PUBLIC_ENABLE_STATUS_INFO="false"  # Disable in production

# API Keys (optional, for news posts)
NEWS_API_KEY="[your-production-api-key]"
```

**Generate AUTH_SECRET**:

```bash
openssl rand -base64 32
# Output: e.g., "7K3n9Pq2Rm5Xv8Yb1Cd4Ef6Gh7Jk0Lm"
```

⚠️ **Security Warning**:
- **NEVER** use development secrets in production
- **NEVER** commit `.env` to Git
- **ALWAYS** rotate secrets if exposed

---

### 3. Deploy to Vercel

**Option A: Via Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Set environment variables
vercel env add DATABASE_URL production
vercel env add AUTH_SECRET production
vercel env add AUTH_URL production
```

**Option B: Via Vercel Dashboard**

1. Go to https://vercel.com/new
2. Import Git repository
3. Configure project:
   - Framework Preset: Next.js
   - Build Command: `pnpm build`
   - Output Directory: `.next`
4. Add environment variables (Settings → Environment Variables)
5. Deploy

**Vercel Deployment Configuration**:

```json
// vercel.json (optional)
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["iad1"]  // Washington DC (closest to Israel)
}
```

---

### 4. Post-Deployment Verification

**Checklist**:

```bash
# 1. Check homepage loads
curl -I https://yourdomain.com

# 2. Check law document page loads
curl -I https://yourdomain.com/law-document

# 3. Test comment submission (from browser)
# Navigate to /law-document, click "הוסף תגובה", submit valid data

# 4. Test admin login
# Navigate to /login, enter credentials

# 5. Test admin dashboard
# Navigate to /admin/law-comments, verify comments visible

# 6. Check database connection
# Verify comments appear in Neon dashboard

# 7. Test moderation
# Approve a comment, verify it appears on public page
```

---

### 5. Change Default Admin Credentials

**Important**: Change default admin password immediately!

**Method 1: Via Prisma Studio**

```bash
# Connect to production DB
export DATABASE_URL="[production-url]"
npx prisma studio

# Navigate to Admin table
# Edit password field with new bcrypt hash
```

**Method 2: Via Script**

```typescript
// scripts/change-admin-password.ts
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

async function changePassword() {
  const newPassword = 'YourStrongPasswordHere!123';
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.admin.update({
    where: { email: 'admin@elhadegel.co.il' },
    data: { password: hashedPassword },
  });

  console.log('✅ Password changed successfully');
}

changePassword()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Run**:
```bash
export DATABASE_URL="[production-url]"
npx tsx scripts/change-admin-password.ts
```

---

## Database Migrations (Production)

### Applying New Migrations

**Safe Migration Process**:

1. **Test Locally**:
   ```bash
   # Create migration locally
   npx prisma migrate dev --name add_new_field

   # Test migration
   pnpm dev
   # Verify everything works
   ```

2. **Backup Production Database**:
   ```bash
   # Neon automatic backups exist, but manual backup recommended
   pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
   ```

3. **Apply to Production**:
   ```bash
   # Set production DATABASE_URL
   export DATABASE_URL="[production-url]"

   # Apply migration
   npx prisma migrate deploy

   # Verify
   npx prisma studio
   ```

4. **Verify Application**:
   - Check Vercel deployment logs
   - Test affected features
   - Monitor error logs

**Rollback Strategy**:

If migration fails:

```bash
# Restore from backup
psql $DATABASE_URL < backup-20251201.sql

# Or use Neon point-in-time recovery
# (via Neon dashboard)
```

---

## Monitoring and Logging

### Vercel Logs

**View Logs**:

```bash
# Via CLI
vercel logs [deployment-url]

# Via Dashboard
# Go to Vercel Dashboard → Deployments → Select deployment → Logs
```

**Log Filtering**:

```bash
# Only errors
vercel logs --filter=error

# Specific timeframe
vercel logs --since=1h
```

### Error Tracking (Recommended: Sentry)

**Setup Sentry**:

```bash
pnpm add @sentry/nextjs

npx @sentry/wizard -i nextjs
```

**Configuration**:

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
```

---

## Performance Monitoring

### Vercel Analytics

**Enable**:

```bash
pnpm add @vercel/analytics

# Add to app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Database Performance

**Neon Dashboard Metrics**:
- Query performance
- Connection pool usage
- Storage usage
- Replication lag

**Optimize Queries**:

```typescript
// Use Prisma query logging in production
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'production'
    ? ['warn', 'error']
    : ['query', 'info', 'warn', 'error'],
});
```

---

## Backup Strategy

### Neon Automatic Backups

- **Frequency**: Daily (retained 7 days on free tier)
- **Point-in-time recovery**: Available on Pro tier
- **Manual snapshots**: Via Neon dashboard

### Manual Backup Script

```bash
#!/bin/bash
# scripts/backup-database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backups/backup_$DATE.sql"

pg_dump $DATABASE_URL > $BACKUP_FILE

# Upload to cloud storage (optional)
# aws s3 cp $BACKUP_FILE s3://your-bucket/backups/

echo "✅ Backup created: $BACKUP_FILE"
```

**Schedule** (via cron):

```bash
# Run daily at 2 AM
0 2 * * * /path/to/scripts/backup-database.sh
```

---

## Security Hardening

### Production Security Checklist

- [x] Change default admin password
- [x] Set strong AUTH_SECRET (32+ bytes)
- [x] Enable HTTPS only (Vercel does this automatically)
- [x] Configure CSP headers
- [x] Set secure environment variables
- [ ] Enable Vercel firewall rules (if needed)
- [ ] Set up rate limiting at CDN level (optional)
- [ ] Configure domain whitelist for admin access (optional)
- [ ] Enable 2FA for Vercel account
- [ ] Enable 2FA for database account (Neon)

### Rate Limiting (Production)

**Current**: In-memory (5/hr per IP, 10/hr per email)

**Recommended for High Traffic**:

Use Vercel Edge Middleware with Redis:

```bash
pnpm add @vercel/edge
pnpm add @upstash/redis
```

**Or use Cloudflare in front of Vercel**:
- Rate limiting: 100 req/min per IP
- DDoS protection
- Bot detection

---

## Domain Configuration

### Custom Domain Setup

**Vercel**:

1. Go to Vercel Dashboard → Settings → Domains
2. Add domain: `elhadegel.co.il`
3. Update DNS records:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
4. Wait for DNS propagation (up to 48 hours)

**Update Environment Variables**:

```bash
# Update AUTH_URL to production domain
vercel env add AUTH_URL production
# Value: https://elhadegel.co.il
```

---

## Scaling Considerations

### Database Scaling (Neon)

**Free Tier Limits**:
- Storage: 3 GB
- Compute: 0.25 vCPU, 1 GB RAM
- Connections: 100

**Upgrade Triggers**:
- Storage > 2 GB → Upgrade to Pro
- Concurrent users > 50 → Increase compute
- Query time > 500ms → Optimize or scale

**Neon Autoscaling** (Pro tier):
- Automatically scales compute based on load
- No downtime
- Pay-as-you-go

### Application Scaling (Vercel)

**Automatic Scaling**:
- Vercel automatically scales based on traffic
- No configuration needed
- Serverless architecture

**Optimization for Scale**:

```typescript
// Use edge functions for static content
export const runtime = 'edge';

// Cache expensive queries
export const revalidate = 60; // Revalidate every 60 seconds
```

---

## Troubleshooting Production Issues

### Issue: Database Connection Errors

**Check**:
```bash
# Verify DATABASE_URL is set
vercel env ls

# Test connection
npx prisma studio --url=$DATABASE_URL
```

**Solution**:
- Verify Neon database is running
- Check connection string format
- Ensure SSL mode enabled (`?sslmode=require`)

### Issue: Build Failures

**Check Vercel logs**:
```bash
vercel logs [deployment-url]
```

**Common causes**:
- Missing environment variables
- Prisma client not generated
- Type errors in production mode

**Solution**:
```bash
# Generate Prisma client before build
npx prisma generate

# Rebuild
vercel --force
```

### Issue: Slow Performance

**Diagnose**:
- Check Vercel Analytics for slow pages
- Check Neon query performance
- Check Next.js build size

**Optimize**:
```bash
# Analyze bundle size
npx @next/bundle-analyzer
```

---

## Continuous Deployment

### Automatic Deployments

**Vercel Git Integration**:

1. Push to `main` branch → Automatic production deploy
2. Push to feature branch → Preview deployment
3. Pull request → Preview deployment with unique URL

**Workflow**:

```bash
# Development
git checkout -b feature/new-feature
git commit -am "Add new feature"
git push origin feature/new-feature
# → Vercel creates preview deployment

# Production
git checkout main
git merge feature/new-feature
git push origin main
# → Vercel deploys to production
```

---

## Rollback Procedure

**Vercel Instant Rollback**:

1. Go to Vercel Dashboard → Deployments
2. Find previous successful deployment
3. Click "Promote to Production"
4. Production instantly rolls back (no downtime)

**Database Rollback**:

```bash
# Use Neon point-in-time recovery
# Or restore from backup
psql $DATABASE_URL < backup-20251201.sql
```

---

## Production Checklist

Before going live:

- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] Admin password changed
- [ ] Domain configured
- [ ] SSL certificate active (HTTPS)
- [ ] Error tracking configured (Sentry)
- [ ] Analytics enabled
- [ ] Backups scheduled
- [ ] Monitoring alerts set up
- [ ] Load tested (100+ concurrent users)
- [ ] Security audit completed
- [ ] Documentation updated

---

## Support and Monitoring

**24/7 Monitoring** (recommended):
- Uptime monitoring: https://uptimerobot.com
- Error tracking: https://sentry.io
- Performance: Vercel Analytics

**Alerts**:
- Email on deployment failure
- Slack notification on errors
- SMS for critical issues (optional)
