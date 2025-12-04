# Cloudflare R2 Video Storage Setup Guide

This guide walks you through setting up Cloudflare R2 for video storage in the EL HADEGEL application.

## Table of Contents

- [Why R2?](#why-r2)
- [Prerequisites](#prerequisites)
- [Step 1: Create R2 Bucket](#step-1-create-r2-bucket)
- [Step 2: Generate API Token](#step-2-generate-api-token)
- [Step 3: Configure Environment Variables](#step-3-configure-environment-variables)
- [Step 4: Migrate Existing Videos (Optional)](#step-4-migrate-existing-videos-optional)
- [Step 5: Deploy to Vercel](#step-5-deploy-to-vercel)
- [Optional: Custom Domain](#optional-custom-domain)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Why R2?

Cloudflare R2 solves several critical problems with file system storage:

1. **Vercel Compatibility**: Vercel's file system is read-only (except `/tmp` which is ephemeral)
2. **Zero Egress Fees**: Unlike AWS S3, R2 charges no fees for data transfer out
3. **Global CDN**: Fast video delivery worldwide via Cloudflare's edge network
4. **Scalability**: No storage limits, pay only for what you use
5. **S3-Compatible**: Drop-in replacement using AWS SDK

---

## Prerequisites

- Active Cloudflare account (free tier works)
- Existing EL HADEGEL application
- Node.js 20+ installed locally
- Access to Vercel project (for deployment)

---

## Step 1: Create R2 Bucket

### 1.1 Access Cloudflare Dashboard

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **R2** in the left sidebar
3. Click **"Create bucket"**

### 1.2 Configure Bucket

- **Bucket name**: `el-hadegel-videos` (or your preferred name)
- **Location**: Choose closest to your users (e.g., WNAM for US, EEUR for Europe)
- **Storage class**: Standard (default)

**Screenshot Example:**
```
┌─────────────────────────────────────┐
│ Create a bucket                     │
├─────────────────────────────────────┤
│ Bucket name: el-hadegel-videos      │
│ Location: Western North America     │
│ Storage class: Standard             │
│                                     │
│ [Cancel]  [Create bucket]          │
└─────────────────────────────────────┘
```

### 1.3 Configure Public Access (Optional)

Two options for video access:

**Option A: Public Bucket (Faster, Direct Access)**
- Go to bucket settings
- Enable **"Public bucket"**
- Copy the public URL (e.g., `https://pub-abc123.r2.dev`)
- Use this as `R2_PUBLIC_URL` environment variable
- Videos redirect directly to R2 (no API route overhead)

**Option B: Private Bucket (More Control)**
- Keep bucket private (default)
- Videos stream through your API route
- Better for authentication/authorization
- Leave `R2_PUBLIC_URL` empty in environment variables

---

## Step 2: Generate API Token

### 2.1 Create API Token

1. In R2 Dashboard, click **"Manage R2 API Tokens"**
2. Click **"Create API Token"**
3. Configure token:
   - **Token name**: `el-hadegel-video-upload` (descriptive name)
   - **Permissions**: Select **"Edit"** (allows read + write)
   - **R2 Bucket scope**: Choose **"Specific bucket"** → Select `el-hadegel-videos`
   - **TTL**: Never expire (or set custom expiration)

### 2.2 Save Credentials

After creating, you'll see three values (SAVE THESE - shown only once):

- **Access Key ID**: `a1b2c3d4e5f6g7h8i9j0` (example)
- **Secret Access Key**: `k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6` (example)
- **Endpoint URL**: `https://1234567890abcdef.r2.cloudflarestorage.com`

**Important**: Copy all three values immediately. You cannot retrieve the secret key later.

### 2.3 Find Your Account ID

- Look at the endpoint URL: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
- Or go to **Cloudflare Dashboard** → Click profile icon → **"Account"** → Copy Account ID

---

## Step 3: Configure Environment Variables

### 3.1 Local Development (.env.local)

Create or update `.env.local` in your project root:

```bash
# Cloudflare R2 Video Storage
R2_ENDPOINT=https://1234567890abcdef.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=a1b2c3d4e5f6g7h8i9j0
R2_SECRET_ACCESS_KEY=k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
R2_BUCKET_NAME=el-hadegel-videos

# Optional: Only if bucket is public
R2_PUBLIC_URL=https://pub-abc123.r2.dev
```

**Replace with your actual values from Step 2.**

### 3.2 Test Locally

1. Restart your dev server:
   ```bash
   pnpm dev
   ```

2. Try uploading a video:
   - Navigate to `/admin/videos`
   - Click "העלה סרטון"
   - Select a test video file
   - Upload should succeed and show video ID

3. Verify in R2:
   - Go to Cloudflare Dashboard → R2 → `el-hadegel-videos`
   - Check `videos/` folder for uploaded file

---

## Step 4: Migrate Existing Videos (Optional)

If you have videos in the local `/videos` directory, migrate them to R2:

### 4.1 Run Migration Script

```bash
npx tsx scripts/migrate-videos-to-r2.ts
```

**Expected Output:**
```
🚀 Starting video migration to Cloudflare R2...

📂 Reading videos directory...
✅ Found 3 video file(s) to migrate

📤 Uploading: video-1701234567890.mp4...
   ✅ Uploaded successfully (15.32 MB)

📤 Uploading: video-1701234567891.webm...
   ✅ Uploaded successfully (12.45 MB)

📤 Uploading: video-1701234567892.mov...
   ✅ Uploaded successfully (20.18 MB)

==================================================
Migration Complete!
==================================================
✅ Successfully uploaded: 3 file(s)
==================================================

📝 Next steps:
   1. Verify files in R2 bucket via Cloudflare Dashboard
   2. Test video playback on your site
   3. Once confirmed working, you can delete local /videos directory
   4. Update Vercel environment variables with R2 credentials
```

### 4.2 Verify Migration

1. Check R2 bucket in Cloudflare Dashboard
2. Confirm all videos appear in `videos/` folder
3. Test video playback on your site
4. Once confirmed, delete local `/videos` directory:
   ```bash
   rm -rf videos/
   ```

---

## Step 5: Deploy to Vercel

### 5.1 Add Environment Variables to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `el-hadegel`
3. Go to **Settings** → **Environment Variables**
4. Add each variable:

| Variable | Value | Environment |
|----------|-------|-------------|
| `R2_ENDPOINT` | `https://1234567890abcdef.r2.cloudflarestorage.com` | Production, Preview, Development |
| `R2_ACCESS_KEY_ID` | `a1b2c3d4e5f6g7h8i9j0` | Production, Preview, Development |
| `R2_SECRET_ACCESS_KEY` | `k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6` | Production, Preview, Development |
| `R2_BUCKET_NAME` | `el-hadegel-videos` | Production, Preview, Development |
| `R2_PUBLIC_URL` | (optional) `https://pub-abc123.r2.dev` | Production, Preview, Development |

**Security Note**: Mark `R2_SECRET_ACCESS_KEY` as "Sensitive" in Vercel (hidden from UI).

### 5.2 Deploy Application

```bash
git add .
git commit -m "feat: Migrate video storage to Cloudflare R2"
git push origin main
```

Vercel will automatically deploy with new environment variables.

### 5.3 Verify Production Deployment

1. Wait for deployment to complete
2. Visit your production site
3. Test video upload in admin panel
4. Test video playback on public pages

---

## Optional: Custom Domain

Using a custom domain (e.g., `videos.elhadegel.co.il`) improves branding and allows HTTPS.

### Option 1: R2 Custom Domain (Recommended)

1. **Add Domain to R2 Bucket**:
   - Go to R2 bucket settings
   - Click **"Connect domain"**
   - Enter: `videos.elhadegel.co.il`
   - Cloudflare will generate CNAME record

2. **Configure DNS**:
   - Go to **Cloudflare DNS** (if using Cloudflare for DNS)
   - Add CNAME record:
     ```
     videos.elhadegel.co.il → el-hadegel-videos.1234567890abcdef.r2.cloudflarestorage.com
     ```
   - Wait for DNS propagation (5-10 minutes)

3. **Update Environment Variable**:
   ```bash
   R2_PUBLIC_URL=https://videos.elhadegel.co.il
   ```

### Option 2: Cloudflare Workers (Advanced)

For more control (e.g., authentication, custom headers):

1. Create Cloudflare Worker to proxy R2
2. Bind R2 bucket to Worker
3. Deploy Worker to custom domain
4. Use Worker URL as `R2_PUBLIC_URL`

See [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/examples/accessing-an-r2-bucket-from-a-worker/) for details.

---

## Testing

### Upload Test

1. Navigate to `/admin/videos`
2. Click "העלה סרטון"
3. Upload a small test video (< 10MB)
4. Verify:
   - Upload progress bar appears
   - Success toast shows after upload
   - Video appears in database
   - Video file exists in R2 bucket

### Playback Test

1. Navigate to `/admin/videos` or public video page
2. Click on uploaded video
3. Verify:
   - Video player loads
   - Video plays without buffering issues
   - Seeking (scrubbing timeline) works
   - Full-screen mode works

### Performance Test

1. Upload a large video (100MB+)
2. Monitor upload speed (should be fast)
3. Test playback on different devices:
   - Desktop browser
   - Mobile browser (iOS/Android)
   - Different network conditions (WiFi, 4G)

---

## Troubleshooting

### Issue: "R2_ENDPOINT environment variable is required"

**Cause**: Environment variables not loaded.

**Solution**:
1. Check `.env.local` file exists
2. Verify variable names match exactly (case-sensitive)
3. Restart dev server: `pnpm dev`

---

### Issue: Upload fails with "Access Denied"

**Cause**: API token lacks permissions.

**Solution**:
1. Verify API token has **"Edit"** permissions
2. Check token is scoped to correct bucket
3. Regenerate API token if needed
4. Update environment variables

---

### Issue: Video not playing after upload

**Cause**: Video file not found in R2 or wrong URL.

**Solution**:
1. Check R2 bucket in Cloudflare Dashboard
2. Verify file exists in `videos/` folder
3. Check `R2_PUBLIC_URL` matches bucket URL
4. Try without `R2_PUBLIC_URL` (use API route streaming)

---

### Issue: Migration script fails

**Cause**: Missing environment variables or no videos to migrate.

**Solution**:
1. Verify R2 environment variables in `.env.local`
2. Check `/videos` directory exists and contains videos
3. Run with verbose logging:
   ```bash
   DEBUG=* npx tsx scripts/migrate-videos-to-r2.ts
   ```

---

### Issue: Vercel deployment fails

**Cause**: Missing environment variables in Vercel.

**Solution**:
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Verify all 4 R2 variables are added
3. Check variables are enabled for Production/Preview/Development
4. Redeploy: `vercel --prod`

---

## Cost Estimation

Cloudflare R2 pricing (as of 2024):

- **Storage**: $0.015/GB/month
- **Class A Operations** (writes, lists): $4.50 per million requests
- **Class B Operations** (reads): $0.36 per million requests
- **Egress**: FREE (zero cost)

**Example Cost** (100 videos, 10GB total, 10,000 views/month):
- Storage: 10 GB × $0.015 = $0.15/month
- Uploads: 100 writes × $4.50/1M = $0.0005/month
- Views: 10,000 reads × $0.36/1M = $0.0036/month
- **Total**: ~$0.15/month

**Compare to AWS S3** (same scenario):
- Storage: $0.23/month
- Uploads: $0.0005/month
- Views: $0.004/month
- **Egress (downloads)**: ~$9.20/month (10K views × 10MB avg × $0.09/GB)
- **Total**: ~$9.43/month (63x more expensive)

---

## Additional Resources

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [R2 Pricing Calculator](https://r2-calculator.cloudflare.com/)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)

---

## Support

If you encounter issues not covered in this guide:

1. Check [Cloudflare Community](https://community.cloudflare.com/)
2. Review [R2 API Status](https://www.cloudflarestatus.com/)
3. Contact Cloudflare Support (Enterprise plan required)

---

**Last Updated**: December 4, 2025
**Version**: 1.0.0
