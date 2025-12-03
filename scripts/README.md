# Historical Comments Import Scripts

## Overview

Three production-ready scripts for importing 10-year historical data into the EL HADEGEL system.

## Scripts

### 1. validate-historical-data.ts
Validates CSV data before import to catch errors early.

**Features**:
- 13 validation rules (required fields, formats, business logic)
- Coalition member verification
- Recruitment law keyword validation
- Detailed error reporting with JSON export
- Warning system for non-critical issues

**Usage**:
```bash
npx tsx scripts/validate-historical-data.ts <csv-file-path>
```

**Exit Codes**:
- `0` - All rows valid
- `1` - Validation errors found

### 2. import-historical-comments.ts
Imports validated CSV via REST API with rate limiting and resume support.

**Features**:
- Batch processing (100 comments/batch)
- Rate limiting (1000 requests/hour for env keys)
- Retry logic (3 attempts with exponential backoff)
- Checkpoint system (resume from interruption)
- Progress tracking with ETA
- Detailed error logging

**Usage**:
```bash
# Fresh import
npx tsx scripts/import-historical-comments.ts <csv-file-path>

# Resume from checkpoint
npx tsx scripts/import-historical-comments.ts <csv-file-path> --resume
```

**Environment Variables**:
- `NEWS_API_KEY` - API key for authentication (required)
- `API_BASE_URL` - Base URL for API (default: http://localhost:3000)

### 3. format-historical-csv.ts
Converts raw data (CSV/JSON/TSV) to proper CSV format.

**Features**:
- Auto-detect input format
- Field name normalization (case-insensitive)
- Date conversion to ISO8601
- URL cleaning and validation
- Platform name mapping to canonical values
- HTML tag stripping
- Default value assignment

**Usage**:
```bash
# Format file
npx tsx scripts/format-historical-csv.ts <input-file> <output-file>

# Generate template
npx tsx scripts/format-historical-csv.ts --template > template.csv
```

## Shared Utilities

### lib/csv-utils.ts
- CSV reading with UTF-8 support
- Field normalization
- Format validation helpers
- Keyword checking
- Template generation

### lib/api-client.ts
- HTTP client with retry logic
- Rate limit handling
- Exponential backoff
- Error formatting

### lib/checkpoint.ts
- Save/load checkpoint state
- Progress calculation
- ETA estimation
- Resume validation

## Complete Workflow

```bash
# 1. Set up environment
export NEWS_API_KEY="your-api-key-here"
export DATABASE_URL="file:./prisma/dev.db"  # or Neon URL

# 2. Format raw data (if needed)
npx tsx scripts/format-historical-csv.ts raw-data.csv formatted-data.csv

# 3. Validate data
npx tsx scripts/validate-historical-data.ts formatted-data.csv
# Fix errors if any, then re-validate

# 4. Test import with small batch
head -n 11 formatted-data.csv > test-data.csv
npx tsx scripts/import-historical-comments.ts test-data.csv

# 5. Full import
npx tsx scripts/import-historical-comments.ts formatted-data.csv

# 6. Resume if interrupted
npx tsx scripts/import-historical-comments.ts formatted-data.csv --resume

# 7. Clean up
rm import-checkpoint.json
mv import-errors.log logs/import-2025-12-02.log
```

## Configuration

### Rate Limiting
- Environment keys: 1000 requests/hour
- Database keys: 100 requests/hour
- Safe delay: 3.6 seconds between requests
- Automatic pause when remaining < 100

### Batch Processing
- Batch size: 100 comments
- Checkpoint saved after each batch
- Graceful shutdown on Ctrl+C

### Validation Rules
1. Required fields present
2. MK ID positive integer, exists in database, is coalition member
3. Content 10-5000 chars, includes recruitment law keywords
4. URL valid format, max 2000 chars
5. Platform matches enum (News, Twitter, Facebook, YouTube, Knesset, Interview, Other)
6. Source type: Primary or Secondary
7. Date ISO8601 format
8. Optional fields: credibility 1-10, sourceName max 200 chars
9. Image/video URLs valid if present

### Coalition Members
Only 64 coalition members accepted across 6 parties:
- הליכוד (Likud) - 32 members
- התאחדות הספרדים שומרי תורה (Shas) - 11 members
- יהדות התורה (UTJ) - 7 members
- הציונות הדתית (Religious Zionism) - 7 members
- עוצמה יהודית (Otzma Yehudit) - 6 members
- נעם (Noam) - 1 member

### Recruitment Law Keywords
Content must include at least one:
- חוק גיוס / חוק הגיוס
- גיוס חרדים
- recruitment law / draft law

## Error Handling

### Validation Errors
Saved to `validation-errors.json` with:
- Row number
- Error type
- Field name
- Error message
- Invalid value

### Import Errors
Logged to `import-errors.log` with:
- Batch number
- Timestamp
- URL
- Error message
- Full row data

### Checkpoint System
Saved to `import-checkpoint.json` with:
- Current batch number
- Imported/duplicate/error counts
- Last successful URL
- All processed URLs (for resume)

## Testing

### Sample Data
Template: `docs/historical-comments/sample-template.csv`
Test data: `test-data-import.csv` (5 rows with valid + invalid examples)

### Test with Pilot Data
```bash
# Create 10-row test file
head -n 11 full-data.csv > pilot-data.csv

# Validate
npx tsx scripts/validate-historical-data.ts pilot-data.csv

# Import
npx tsx scripts/import-historical-comments.ts pilot-data.csv
```

## Documentation

- **CSV Format**: `docs/historical-comments/sample-template.csv`
- **Import Guide**: `docs/historical-comments/IMPORT_GUIDE.md`
- **API Reference**: `docs/api/HISTORICAL_COMMENTS_API.md`

## Troubleshooting

### "DATABASE_URL environment variable is not set"
```bash
export DATABASE_URL="file:./prisma/dev.db"  # SQLite
# or
export DATABASE_URL="your-neon-url"  # Neon Postgres
```

### "NEWS_API_KEY environment variable not set"
```bash
export NEWS_API_KEY="your-api-key-here"
```

### "Invalid date format"
Use formatter to convert dates:
```bash
npx tsx scripts/format-historical-csv.ts raw.csv formatted.csv
```

### "MK is not part of coalition"
Only coalition members accepted. Remove opposition MKs from CSV.

### "Content missing keywords"
Add recruitment law keywords:
- חוק גיוס / חוק הגיוס
- גיוס חרדים

### "Rate limit exceeded"
Script automatically waits. Or check reset time:
```bash
curl -I "http://localhost:3000/api/historical-comments?limit=1" \
  -H "Authorization: Bearer YOUR-API-KEY" | grep X-RateLimit
```

### "Import interrupted"
Resume from checkpoint:
```bash
npx tsx scripts/import-historical-comments.ts data.csv --resume
```

## Performance

### Expected Times (1000 requests/hour limit)
- 100 comments: ~6 minutes
- 500 comments: ~30 minutes
- 1000 comments: ~1 hour
- 2000 comments: ~2 hours

### Optimization Tips
1. Use environment API key (1000/hour vs 100/hour for DB keys)
2. Run during off-peak hours
3. Test with small batch first
4. Monitor rate limit headers
5. Use checkpoints for large imports

## Security

### API Key Management
- Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`
- Store in environment variable (not in code)
- Never commit API keys to git

### Data Validation
- All input sanitized (XSS prevention)
- SQL injection prevented (Prisma ORM)
- URL validation and cleaning
- Content length limits

### Coalition Verification
- Only 64 coalition members accepted
- Rejects opposition MKs with clear error message

## File Summary

| File | Lines | Purpose |
|------|-------|---------|
| `validate-historical-data.ts` | 530 | Data validation |
| `import-historical-comments.ts` | 530 | Batch import with resume |
| `format-historical-csv.ts` | 350 | CSV formatting/conversion |
| `lib/csv-utils.ts` | 330 | CSV utilities |
| `lib/api-client.ts` | 260 | API client with retry |
| `lib/checkpoint.ts` | 290 | Checkpoint system |
| **Total** | **2,290** | Complete implementation |

## Dependencies

**Required**:
- `csv-parse@6.1.0` - CSV parsing
- `csv-stringify@6.6.0` - CSV generation
- `@prisma/client@7.0.1` - Database access
- `tsx@4.20.6` - TypeScript execution

**All dependencies already installed in project.**

## Status

✅ **Production-Ready**
- All scripts compile successfully
- TypeScript strict mode enabled
- Comprehensive error handling
- Detailed documentation
- Ready for testing with real data

## Next Steps

1. Test validation script with pilot data (10-50 rows)
2. Test import script with pilot data
3. Verify database records created correctly
4. Test checkpoint/resume functionality
5. Run full import with 10-year dataset

---

**Created**: 2025-12-02
**Version**: 1.0.0
**Status**: ✅ Complete and Ready for Testing
