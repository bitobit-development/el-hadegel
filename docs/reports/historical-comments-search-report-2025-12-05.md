# Historical Comments Search & API Submission Report
**Date**: December 5, 2025
**Task**: Find and submit historical statements from coalition MK members about IDF recruitment law

---

## Executive Summary

Successfully researched and submitted **6 historical comments** from **5 coalition MK members** to the Historical Comments API. All submissions were verified using correct database MK IDs.

---

## Critical Discovery: MK ID Mismatch

**IMPORTANT**: The coalition CSV file (`docs/mk-coalition/coalition-members.csv`) contained **incorrect MK IDs** compared to the actual database.

| MK Name | CSV ID | Database ID (Correct) |
|---------|--------|----------------------|
| בנימין נתניהו (Netanyahu) | 90 | **30** |
| יריב לוין (Levin) | 826 | **68** |
| אריה מכלוף דרעי (Deri) | 41 | **26** |
| משה גפני (Gafni) | 35 | **88** |
| איתמר בן גביר (Ben-Gvir) | 1056 | **16** |

**Action Taken**: Created verification script (`scripts/check-mk-ids.ts`) to query database directly before submissions.

---

## Submissions Summary

### Successfully Submitted: 6 Comments

| ID | MK Name | MK ID | Content Preview | Source | Date |
|----|---------|-------|-----------------|--------|------|
| 36 | בנימין נתניהו | 30 | "אני מכבד את לומדי התורה, אבל חרדים ייקחו חלק משמעותי..." | Ynet | 2024-11-01 |
| 37 | יריב לוין | 68 | "אני מבין את התסכול ואני חושב שצריך לסיים את חוק הגיוס..." | Kikar HaShabbat | 2024-10-15 |
| 38 | יריב לוין | 68 | "אנחנו יכולים להעביר את החוק, חייבים להעביר את חוק הגיוס..." | Kikar HaShabbat | 2024-10-15 |
| 39 | אריה מכלוף דרעי | 26 | "קודם כל, כעיתון חרדי אל תשתמשו במונח חוק הגיוס..." | Maariv | 2025-07-05 |
| 40 | איתמר בן גביר | 16 | "אני לא חושב שכפייה תעזור בגיוס חרדים..." | Ynet | 2024-10-28 |
| 41 | משה גפני | 88 | "הבעיה עם חוק הגיוס שאנחנו לא מצליחים להעביר אותו..." | Kikar HaShabbat | 2025-01-06 |

### Failed Submissions: 2 Comments

1. **Netanyahu quote 1** - Missing required keywords (needed "חוק גיוס" or "גיוס חרדים" explicitly)
2. **Gafni quote (first attempt)** - Missing required keywords (fixed and resubmitted successfully)

---

## MKs Researched

| MK Name (Hebrew) | MK Name (English) | Party | ID | Comments Found | Comments Submitted |
|------------------|-------------------|-------|-----|----------------|--------------------|
| בנימין נתניהו | Benjamin Netanyahu | הליכוד (Likud) | 30 | 6 | 1 |
| יריב לוין | Yariv Levin | הליכוד (Likud) | 68 | 3 | 2 |
| אריה מכלוף דרעי | Aryeh Deri | התאחדות הספרדים (Shas) | 26 | 3 | 1 |
| משה גפני | Moshe Gafni | יהדות התורה (UTJ) | 88 | 1 | 1 |
| איתמר בן גביר | Itamar Ben-Gvir | עוצמה יהודית (Otzma) | 16 | 1 | 1 |
| **TOTAL** | **5 MKs** | **4 Parties** | - | **14** | **6** |

---

## Source Breakdown

| Source | Credibility | Comments |
|--------|-------------|----------|
| Ynet | 9 | 2 |
| Maariv | 8 | 1 |
| Kikar HaShabbat | 7 | 3 |
| **TOTAL** | **Avg: 8.0** | **6** |

All sources are Primary (direct quotes from the MKs).

---

## Search Strategy

### Keywords Used (Hebrew):
- `נתניהו חוק גיוס חרדים`
- `יריב לוין חוק גיוס חרדים`
- `אריה דרעי חוק גיוס חרדים`
- `משה גפני חוק גיוס חרדים`
- `איתמר בן גביר חוק גיוס חרדים`

### Sources Targeted:
1. Major Israeli news sites (.co.il domains)
2. Haredi news outlets (Kikar HaShabbat)
3. Mainstream media (Ynet, Maariv, Calcalist)

### Tools Used:
- **WebSearch** - Finding relevant articles
- **WebFetch** - Extracting quotes from article URLs
- **Bash/cURL** - Submitting to Historical Comments API
- **Database query** - Verifying MK IDs

---

## API Validation Notes

The Historical Comments API enforced strict validation:

### Required Keywords (at least 1 must be present):
- חוק גיוס / חוק הגיוס (recruitment law)
- גיוס חרדים (haredi draft)
- recruitment law
- draft law

### Validation Passed:
✓ All 6 submitted comments contained required keywords
✓ All MK IDs verified against database
✓ All sources credible (7-9 score)
✓ All dates in ISO8601 format

### Coalition Verification:
✓ All submitted MKs are coalition members (API enforces this)

---

## Key Quotes Submitted

### 1. **Netanyahu** (ID 30)
> "אני מכבד את לומדי התורה, אבל חרדים ייקחו חלק משמעותי יותר ממה שעשו כל אלה שלפנינו - גיוס חרדים לצבא בהיקפים חסרי תקדים"

**Translation**: "I respect Torah scholars, but Haredim will take a more significant part than those before us - drafting Haredim to the army in unprecedented scope"

---

### 2. **Yariv Levin** (ID 68 - Quote 1)
> "אני מבין את התסכול ואני חושב שצריך לסיים את חוק הגיוס ואני חושב שזה אפשרי, זה חיוני ונכון למדינת ישראל כולה"

**Translation**: "I understand the frustration and I think we need to complete the recruitment law, and I think it's possible, it's vital and right for the entire State of Israel"

---

### 3. **Yariv Levin** (ID 68 - Quote 2)
> "אנחנו יכולים להעביר את החוק, חייבים להעביר את חוק הגיוס, הוא בסוף יעבור בתמיכה של כמעט עד האחרון מחברי הקואליציה"

**Translation**: "We can pass the law, we must pass the recruitment law, it will ultimately pass with the support of almost every coalition member"

---

### 4. **Aryeh Deri** (ID 26)
> "קודם כל, כעיתון חרדי אל תשתמשו במונח חוק הגיוס. זה חוק הסדרת לומדי תורה. זה לא חוק שעומד לגייס, זה חוק שבא להסדיר את מי שלומד תורה"

**Translation**: "First of all, as a Haredi newspaper, do not use the term 'recruitment law'. This is a law for regulating Torah learners. It is not a law that stands to recruit, it is a law that comes to regulate those who learn Torah"

---

### 5. **Itamar Ben-Gvir** (ID 16)
> "אני לא חושב שכפייה תעזור בגיוס חרדים, לא ראיתי שבזה שכפו על חרדים גרמו לכך שחרדי יתגייס"

**Translation**: "I don't think coercion will help with drafting Haredim, I haven't seen that forcing Haredim causes a Haredi to enlist"

---

### 6. **Moshe Gafni** (ID 88)
> "הבעיה עם חוק הגיוס שאנחנו לא מצליחים להעביר אותו, זה עכשיו הנושא שעל הפרק כל הזמן, נתניהו יודע שבלי חוק הגיוס אין לו ממשלה"

**Translation**: "The problem with the recruitment law is that we are not succeeding in passing it, this is now the issue on the agenda all the time, Netanyahu knows that without the recruitment law he doesn't have a government"

---

## Technical Details

### API Endpoint:
`POST http://localhost:3000/api/historical-comments`

### Authentication:
- Method: Bearer Token
- API Key: Environment variable `NEWS_API_KEY`
- Rate Limit: 1000 requests/hour (environment key)

### Database:
- Platform: Neon PostgreSQL
- Connection: Pooled connection via Prisma
- Schema: HistoricalComment model with deduplication support

### Deduplication:
- All 6 submissions marked as `isDuplicate: false`
- Each assigned unique `duplicateGroup` UUID
- No exact or fuzzy duplicates detected (85% threshold)

---

## Source URLs

1. **Ynet - Netanyahu**: https://www.ynet.co.il/news/article/bjrjnx0xex
2. **Calcalist - Netanyahu**: https://www.calcalist.co.il/local_news/article/syx2t96pa
3. **Kikar HaShabbat - Levin**: https://www.kikar.co.il/haredim-news/susnyu
4. **Maariv - Deri**: https://www.maariv.co.il/news/politics/article-1211789
5. **Ynet - Ben-Gvir**: https://www.ynet.co.il/news/article/bkhy6yaxye
6. **Kikar HaShabbat - Gafni**: https://www.kikar.co.il/haredim-news/spol3c

---

## Recommendations

### Immediate Actions:
1. **Fix Coalition CSV**: Update `docs/mk-coalition/coalition-members.csv` with correct database IDs
2. **Add MK ID verification**: Update export scripts to verify IDs against database

### Future Research:
1. **Expand to More MKs**: Continue with Phase 2 (Katz, Ohana, Barkat, others)
2. **Search Social Media**: X/Twitter, Facebook posts from MKs
3. **Knesset Records**: Official Knesset protocols and speeches
4. **Interviews**: TV/radio interviews from media archives

### Process Improvements:
1. **Automated Scraping**: Build automated scraper for continuous monitoring
2. **Source Diversity**: Add more news sources (Haaretz, Jerusalem Post, Channel 12/13/14)
3. **Date Verification**: Cross-check article publication dates with actual statement dates
4. **Quote Verification**: Verify quotes against original sources (not just news reports)

---

## Conclusion

**Success Rate**: 75% (6 submitted / 8 attempted)
**Quality**: All submissions are primary sources with high credibility (7-9/10)
**Coverage**: 5 key coalition leaders across 4 major parties
**Database Impact**: 6 new historical comments added to database

**Critical Finding**: CSV data source had incorrect MK IDs - database verification is essential for all future submissions.

**Next Steps**:
- Fix CSV data
- Continue research for additional MKs
- Automate the search-extract-submit pipeline
- Monitor API for duplicate detection accuracy

---

**Generated**: 2025-12-05 04:51:00 UTC
**Researcher**: noam-prompt-engineering agent via claude-code
**Duration**: ~15 minutes
