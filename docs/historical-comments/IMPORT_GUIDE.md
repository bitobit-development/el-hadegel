# Historical Comments Import Guide

Complete guide for importing 10-year historical data into the EL HADEGEL system.

## Table of Contents

1. [Overview](#overview)
2. [CSV Format Specification](#csv-format-specification)
3. [Preparation Steps](#preparation-steps)
4. [Script 1: Data Validation](#script-1-data-validation)
5. [Script 2: Batch Import](#script-2-batch-import)
6. [Script 3: CSV Formatter](#script-3-csv-formatter)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

---

## Overview

The import system consists of three scripts that work together:

1. **validate-historical-data.ts** - Validates CSV before import
2. **import-historical-comments.ts** - Imports data via REST API
3. **format-historical-csv.ts** - Converts raw data to proper format

**Import Flow**:
```
Raw Data → Format (Script 3) → Validate (Script 1) → Import (Script 2) → Database
```

**Key Features**:
- ✅ Automatic deduplication (hash + fuzzy matching)
- ✅ Rate limiting (1000 requests/hour)
- ✅ Retry logic (3 attempts with exponential backoff)
- ✅ Checkpoint/resume support
- ✅ Coalition member verification
- ✅ Recruitment law keyword validation

---

## CSV Format Specification

### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `mkId` | Integer | Knesset member ID (must be coalition) | `1` |
| `content` | String | Comment text (10-5000 chars) | `"חוק הגיוס חשוב..."` |
| `sourceUrl` | URL | Original source URL (max 2000 chars) | `https://www.ynet.co.il/...` |
| `sourcePlatform` | Enum | Platform name (see list below) | `News` |
| `sourceType` | Enum | `Primary` or `Secondary` | `Primary` |
| `commentDate` | ISO8601 | When comment was made | `2024-01-15T10:00:00Z` |

### Optional Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `sourceName` | String | Publication/outlet name (max 200 chars) | `ידיעות אחרונות` |
| `sourceCredibility` | Integer | Credibility score (1-10) | `8` |
| `imageUrl` | URL | Associated image URL | `https://example.com/image.jpg` |
| `videoUrl` | URL | Associated video URL | `https://youtube.com/watch?v=...` |
| `additionalContext` | String | Extra notes/context | `דובר בשם הסיעה` |

### Platform Values

Must be one of (case-sensitive):
- `News`
- `Twitter`
- `Facebook`
- `YouTube`
- `Knesset`
- `Interview`
- `Other`

### Date Format

ISO8601 format: `YYYY-MM-DDTHH:MM:SSZ`

**Valid Examples**:
- `2024-01-15T10:00:00Z` ✅
- `2024-01-15T10:00:00.000Z` ✅
- `2024-01-15T10:00:00+02:00` ✅

**Invalid Examples**:
- `2024-01-15` ❌
- `15/01/2024` ❌
- `2024-01-15 10:00:00` ❌

### Coalition Members

Only 64 coalition members accepted across 6 parties:
- הליכוד (Likud) - 32 members
- התאחדות הספרדים שומרי תורה (Shas) - 11 members
- יהדות התורה (UTJ) - 7 members
- הציונות הדתית (Religious Zionism) - 7 members
- עוצמה יהודית (Otzma Yehudit) - 6 members
- נעם (Noam) - 1 member

### Recruitment Law Keywords

Content must include at least one primary keyword:
- חוק גיוס / חוק הגיוס
- גיוס חרדים
- recruitment law / draft law

---

## Preparation Steps

### 1. Set Up Environment

```bash
# Set API key (required)
export NEWS_API_KEY="your-api-key-here"

# Optional: Set custom API URL
export API_BASE_URL="https://your-domain.com"
```

**Generate API Key**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

### 2. Prepare Your Data

**Option A: Use Template**
```bash
# Generate sample template
npx tsx scripts/format-historical-csv.ts --template > my-data.csv

# Edit my-data.csv with your data
```

**Option B: Format Existing Data**
```bash
# Convert raw CSV/JSON/TSV to proper format
npx tsx scripts/format-historical-csv.ts raw-data.csv formatted-data.csv
```

### 3. Verify Database Connection

```bash
# Test database access
npx prisma db push
```

---

## Script 1: Data Validation

**Purpose**: Validate CSV data before import to catch errors early.

### Usage

```bash
npx tsx scripts/validate-historical-data.ts <csv-file-path>
```

### Example

```bash
npx tsx scripts/validate-historical-data.ts data/historical-comments.csv
```

### Output

**Success (All Valid)**:
```
✅ Validation Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Rows: 2000
✅ Valid: 2000
❌ Invalid: 0

✅ All rows valid. Ready to import!
```

**Errors Found**:
```
✅ Validation Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Rows: 2000
✅ Valid: 1950
❌ Invalid: 50

Error Summary:
  - INVALID_DATE: 30 rows
  - MISSING_FIELD: 15 rows
  - INVALID_MK_ID: 5 rows

⚠️  Warnings:
  - 100 rows with LOW_CREDIBILITY
  - 50 rows with MISSING_SOURCE_NAME

📄 Detailed report saved to: validation-errors.json

❌ Validation failed. Fix errors before importing.
```

### Validation Rules

1. **Required Fields**: All required fields present and non-empty
2. **MK ID**: Positive integer, exists in database, is coalition member
3. **Content**: 10-5000 characters, includes recruitment law keywords
4. **URL**: Valid format, max 2000 chars
5. **Platform**: Exact match to valid platform names
6. **Source Type**: Primary or Secondary
7. **Date**: Valid ISO8601 format
8. **Credibility**: Optional, 1-10 if present
9. **Source Name**: Optional, max 200 chars if present
10. **Image/Video URLs**: Valid URL format if present

### Error Report

File: `validation-errors.json`

```json
{
  "timestamp": "2025-12-02T10:00:00Z",
  "summary": {
    "totalRows": 2000,
    "validRows": 1950,
    "invalidRows": 50,
    "errorCount": 65,
    "warningCount": 150
  },
  "errorSummary": {
    "INVALID_DATE": 30,
    "MISSING_FIELD": 15,
    "INVALID_MK_ID": 5
  },
  "errors": [
    {
      "row": 42,
      "type": "INVALID_DATE",
      "field": "commentDate",
      "message": "תאריך לא תקין. נדרש פורמט ISO8601",
      "value": "2024-01-15"
    }
  ],
  "warnings": [...]
}
```

### Exit Codes

- `0` - All rows valid
- `1` - One or more validation errors

---

## Script 2: Batch Import

**Purpose**: Import validated CSV via REST API with rate limiting and resume support.

### Usage

```bash
# Fresh import
npx tsx scripts/import-historical-comments.ts <csv-file-path>

# Resume from checkpoint
npx tsx scripts/import-historical-comments.ts <csv-file-path> --resume
```

### Examples

```bash
# Start import
npx tsx scripts/import-historical-comments.ts data/historical-comments.csv

# Resume interrupted import
npx tsx scripts/import-historical-comments.ts data/historical-comments.csv --resume
```

### Configuration

| Setting | Value | Description |
|---------|-------|-------------|
| Batch Size | 100 | Comments per batch |
| Rate Limit | 1000/hour | For environment keys |
| Delay | 3.6s | Between requests |
| Retry Attempts | 3 | With exponential backoff |
| Min Remaining | 100 | Pause threshold |

### Output

**Progress Display**:
```
📥 Historical Comments Batch Import
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CSV File: data/historical-comments.csv
API URL: http://localhost:3000
Rate Limit: 1000 requests/hour
Delay: 3600ms between requests

📖 Reading CSV file...
✅ Found 2000 rows (20 batches)

🔍 Checking rate limit...
✅ Rate limit: 950/1000 remaining

🚀 Starting import...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Batch 1/20 - Progress: 5%
✅ Imported: 95 | ⚠️  Duplicates: 3 | ❌ Errors: 2
⏱️  ETA: 1h 15m
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

...

✅ Import Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Rows: 2000
✅ Successfully Imported: 1850 (new comments)
⚠️  Detected as Duplicates: 100
❌ Errors: 50
⏱️  Time Elapsed: 1h 12m
📊 Average Rate: 27 comments/minute

📄 Error log: import-errors.log
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Checkpoint System

**Purpose**: Save progress after each batch to enable resume.

**Checkpoint File**: `import-checkpoint.json`

```json
{
  "timestamp": "2025-12-02T10:30:00Z",
  "csvFile": "data/historical-comments.csv",
  "totalRows": 2000,
  "batchNum": 15,
  "totalBatches": 20,
  "imported": 1350,
  "duplicates": 80,
  "errors": 45,
  "lastSuccessfulUrl": "https://...",
  "processedUrls": ["url1", "url2", ...]
}
```

**Resume After Interruption**:
```bash
# Script detects checkpoint automatically
npx tsx scripts/import-historical-comments.ts data/historical-comments.csv --resume

# Prompts:
# 🔄 Found existing checkpoint from 02/12/2025, 10:30:00
# Resume from checkpoint? (y/n):
```

### Graceful Shutdown

Press `Ctrl+C` during import:

```
^C
⚠️  Interrupt detected. Saving checkpoint...
✅ Checkpoint saved. You can resume with --resume flag.
```

### Error Logging

**Error Log File**: `import-errors.log`

```
=== Batch 5 - 2025-12-02T10:15:00Z ===

URL: https://example.com/article
Error: חוק לא מכיל מילות מפתח הקשורות לגיוס
MK ID: 42
Content: תוכן התגובה...
Platform: News
Date: 2024-01-15T10:00:00Z
---

URL: https://example.com/article2
Error: MK 99 אינו חבר קואליציה
MK ID: 99
Content: ...
Platform: Twitter
Date: 2024-01-16T12:00:00Z
---
```

### Rate Limit Handling

**Automatic Pause**:
```
⏳ Rate limit low (85 remaining). Pausing for 3450s...
```

**Manual Check**:
```bash
# Check current rate limit
curl -X GET "http://localhost:3000/api/historical-comments?limit=1" \
  -H "Authorization: Bearer YOUR-API-KEY" \
  -I | grep X-RateLimit
```

---

## Script 3: CSV Formatter

**Purpose**: Convert raw data (CSV/JSON/TSV) to proper CSV format.

### Usage

```bash
# Format file
npx tsx scripts/format-historical-csv.ts <input-file> <output-file>

# Generate template
npx tsx scripts/format-historical-csv.ts --template
npx tsx scripts/format-historical-csv.ts --template > template.csv
```

### Examples

```bash
# CSV to CSV (with normalization)
npx tsx scripts/format-historical-csv.ts raw-data.csv formatted-data.csv

# JSON to CSV
npx tsx scripts/format-historical-csv.ts raw-data.json formatted-data.csv

# TSV to CSV
npx tsx scripts/format-historical-csv.ts raw-data.tsv formatted-data.csv

# Generate template
npx tsx scripts/format-historical-csv.ts --template > my-template.csv
```

### Features

1. **Auto-Detect Format**: CSV, TSV, JSON
2. **Field Name Normalization**: Case-insensitive mapping
3. **Date Conversion**: Any format → ISO8601
4. **URL Cleaning**: Add protocol, validate
5. **Platform Mapping**: Variations → canonical names
6. **HTML Stripping**: Remove tags from content
7. **Default Values**: sourceType defaults to Secondary

### Platform Mapping

Formatter automatically maps variations:

| Input | Output |
|-------|--------|
| `twitter`, `x`, `tweet` | `Twitter` |
| `facebook`, `fb` | `Facebook` |
| `youtube`, `yt` | `YouTube` |
| `news`, `newspaper`, `article` | `News` |
| `knesset` | `Knesset` |
| `interview` | `Interview` |
| `other` | `Other` |

### Field Aliases

Flexible field names supported:

| Aliases | Normalized To |
|---------|---------------|
| `mk_id`, `mk`, `member_id` | `mkId` |
| `comment`, `text`, `comment_content` | `content` |
| `url`, `source`, `link` | `sourceUrl` |
| `platform`, `source_platform` | `sourcePlatform` |
| `type`, `source_type` | `sourceType` |
| `date`, `comment_date`, `posted_at` | `commentDate` |
| `name`, `source_name` | `sourceName` |

### Output

```
🔧 Formatting Historical Comments CSV
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Input: raw-data.csv
Output: formatted-data.csv

📖 Reading input file...
✅ Loaded 2000 rows

🔧 Formatting rows...
✅ Formatted 2000/2000 rows

💾 Writing CSV file...
✅ Saved to formatted-data.csv

✅ Formatting Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Input File: raw-data.csv
Output File: formatted-data.csv
Rows Formatted: 2000
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Next Steps:
1. Validate: npx tsx scripts/validate-historical-data.ts formatted-data.csv
2. Import: npx tsx scripts/import-historical-comments.ts formatted-data.csv
```

---

## Troubleshooting

### Common Issues

#### 1. API Key Not Set

**Error**:
```
❌ Error: NEWS_API_KEY environment variable not set
```

**Solution**:
```bash
export NEWS_API_KEY="your-api-key-here"
```

#### 2. Invalid Date Format

**Error**:
```
INVALID_DATE: תאריך לא תקין. נדרש פורמט ISO8601
```

**Solution**:
Use formatter to convert dates:
```bash
npx tsx scripts/format-historical-csv.ts raw.csv formatted.csv
```

Or manually fix to ISO8601: `2024-01-15T10:00:00Z`

#### 3. Platform Name Not Recognized

**Error**:
```
INVALID_PLATFORM: פלטפורמה לא תקינה
```

**Solution**:
Use formatter (auto-maps variations) or manually change to one of:
`News`, `Twitter`, `Facebook`, `YouTube`, `Knesset`, `Interview`, `Other`

#### 4. MK Not Coalition Member

**Error**:
```
NOT_COALITION: יאיר לפיד (יש עתיד) אינו חבר קואליציה
```

**Solution**:
Only coalition members accepted. Remove opposition MKs from CSV.

#### 5. Content Missing Keywords

**Error**:
```
NO_KEYWORDS: התוכן לא מכיל מילות מפתח הקשורות לחוק הגיוס
```

**Solution**:
Add recruitment law keywords to content:
- חוק גיוס / חוק הגיוס
- גיוס חרדים
- recruitment law / draft law

#### 6. Rate Limit Exceeded

**Error**:
```
429 Rate Limit Exceeded
```

**Solution**:
Script automatically waits. Or manually wait:
```bash
# Check reset time
curl -I "http://localhost:3000/api/historical-comments?limit=1" \
  -H "Authorization: Bearer YOUR-API-KEY" | grep X-RateLimit-Reset
```

#### 7. Duplicate Comment

**Info** (not an error):
```
⚠️  Duplicates: 50
```

**Explanation**:
System automatically detects duplicates (exact hash + fuzzy matching).
Duplicates are logged but not imported again.

#### 8. Import Interrupted

**Scenario**: Process killed mid-import

**Solution**:
Resume from checkpoint:
```bash
npx tsx scripts/import-historical-comments.ts data.csv --resume
```

#### 9. CSV File Not Found

**Error**:
```
❌ קובץ CSV לא נמצא: data/comments.csv
```

**Solution**:
Check file path is correct and file exists:
```bash
ls -la data/comments.csv
```

#### 10. Database Connection Failed

**Error**:
```
PrismaClientInitializationError: Can't reach database server
```

**Solution**:
Check DATABASE_URL in .env and database is running:
```bash
# Test connection
npx prisma db pull
```

---

## Best Practices

### 1. Always Validate First

```bash
# NEVER skip validation
npx tsx scripts/validate-historical-data.ts data.csv

# Only import if validation passes
npx tsx scripts/import-historical-comments.ts data.csv
```

### 2. Use Checkpoints for Large Imports

```bash
# For 2000+ rows, checkpoints are automatic
# Just use --resume if interrupted
npx tsx scripts/import-historical-comments.ts data.csv --resume
```

### 3. Monitor Rate Limits

```bash
# Check remaining requests before large import
curl -I "http://localhost:3000/api/historical-comments?limit=1" \
  -H "Authorization: Bearer YOUR-API-KEY" | grep X-RateLimit
```

### 4. Test with Small Batch First

```bash
# Test with 10 rows before full import
head -n 11 data/full-data.csv > data/test-data.csv  # 1 header + 10 rows
npx tsx scripts/validate-historical-data.ts data/test-data.csv
npx tsx scripts/import-historical-comments.ts data/test-data.csv
```

### 5. Keep Error Logs

```bash
# Archive error logs after fixing
mv import-errors.log import-errors-2025-12-02.log
```

### 6. Use Formatter for Raw Data

```bash
# Always format before validate
npx tsx scripts/format-historical-csv.ts raw.csv formatted.csv
npx tsx scripts/validate-historical-data.ts formatted.csv
npx tsx scripts/import-historical-comments.ts formatted.csv
```

### 7. Backup Database Before Large Import

```bash
# Backup before 1000+ row import
pg_dump $DATABASE_URL > backup-before-import.sql
```

### 8. Run During Off-Peak Hours

For large imports (2000+ rows), run during off-peak hours:
- Less database load
- Better rate limit availability
- Easier to monitor

### 9. Document Your Import

```bash
# Create import log
cat > import-log.txt <<EOF
Date: 2025-12-02
Source: 10-year Twitter archive
Rows: 2000
Imported: 1850
Duplicates: 100
Errors: 50
Error Log: import-errors-2025-12-02.log
EOF
```

### 10. Clean Up After Import

```bash
# Remove checkpoint after successful import
rm import-checkpoint.json

# Archive error log if errors occurred
mv import-errors.log logs/import-errors-2025-12-02.log

# Remove validation report
rm validation-errors.json
```

---

## Complete Workflow Example

### Scenario: Import 10-year Twitter archive (2000 comments)

```bash
# Step 1: Set up environment
export NEWS_API_KEY="abc123xyz..."
export API_BASE_URL="http://localhost:3000"

# Step 2: Start dev server (if local)
pnpm dev

# Step 3: Format raw data
npx tsx scripts/format-historical-csv.ts twitter-archive.json formatted.csv
# Output: 2000 rows formatted

# Step 4: Validate
npx tsx scripts/validate-historical-data.ts formatted.csv
# Output: 1950 valid, 50 invalid
# Fix errors in formatted.csv

# Step 5: Re-validate
npx tsx scripts/validate-historical-data.ts formatted.csv
# Output: 2000 valid, 0 invalid ✅

# Step 6: Test import with small batch
head -n 11 formatted.csv > test.csv
npx tsx scripts/import-historical-comments.ts test.csv
# Output: 10 imported successfully ✅

# Step 7: Full import
npx tsx scripts/import-historical-comments.ts formatted.csv
# Runs for ~1 hour with progress updates
# If interrupted: Ctrl+C saves checkpoint

# Step 8: Resume if needed
npx tsx scripts/import-historical-comments.ts formatted.csv --resume

# Step 9: Verify in database
npx prisma studio
# Check HistoricalComment table

# Step 10: Clean up
rm import-checkpoint.json
mv import-errors.log logs/twitter-import-2025-12-02.log
rm validation-errors.json

# Step 11: Document
echo "Twitter archive imported: 1850 new, 100 duplicates, 50 errors" >> import-history.txt
```

---

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review error logs: `import-errors.log`, `validation-errors.json`
3. Consult API documentation: `docs/api/HISTORICAL_COMMENTS_API.md`
4. Check database logs: `npx prisma studio`

---

**Document Version**: 1.0
**Last Updated**: 2025-12-02
**Scripts Version**: 1.0.0
