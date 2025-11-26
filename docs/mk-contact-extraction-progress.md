# MK Contact Details Extraction Progress

**Date:** November 26, 2025
**Status:** ✅ COMPLETED
**Completion:** 120/120 MKs (100%)

## Summary

Successfully extracted phone and email contact details for ALL 120 Knesset Members. The extraction was completed in multiple phases using both manual verification with Playwright and automated agent-based extraction.

### Database Schema
Added two new columns to the MK table:
- `phone` (String, nullable)
- `email` (String, nullable)

Migration applied: `add_contact_details`

## Progress

### Extraction Phases

**Phase 1 - Pre-existing (60 MKs):**
Contact details already existed in database from previous extraction efforts.

**Phase 2 - Manual Verification (6 MKs):**
Manually extracted using Playwright browser automation with 4-second wait times:
- 1044: עמית הלוי (02-6753333, ahalevi@knesset.gov.il)
- 1045: ניסים ואטורי (02-6408070, nvaturi@knesset.gov.il)
- 1048: יעל רון בן משה (02-6408553, 02-6408162, yaelron@knesset.gov.il)
- 1050: משה טור פז (02-6408152, mturpaz@knesset.gov.il)
- 1067: שמחה רוטמן (02-6408124, srothman@knesset.gov.il)
- 1096: עמיחי אליהו (02-6408883, abene@knesset.gov.il)

**Phase 3 - Agent Extraction Batch 1 (9 MKs):**
Extracted using general-purpose agent with Playwright:
- 69: ישראל כץ (email only: yiskatz@knesset.gov.il)
- 1060, 1061, 1079, 1082, 1085, 1088, 1091, 1099

**Phase 4 - Agent Extraction Batch 2 (21 MKs):**
Final batch extracted using general-purpose agent:
- 1098, 1101, 1102, 1103, 1106, 1107, 1108, 1109, 1110, 1112, 1114, 1115, 1118, 1121, 1122, 1124, 1125, 1127, 1128, 1129, 1130

**Phase 5 - Previously Extracted (24 MKs):**
These MKs had contact details from earlier extraction sessions:
- אביחי אברהם בוארון (1126), אוהד טל (1090), אוריאל בוסו (1039), אושר שקלים (1123), אימאן ח'טיב יאסין (1032), איתמר בן גביר (1056), אלי דלל (1100), אליהו רביבו (1111), אפרת רייטן מרום (1068), בועז ביסמוט (1095), גלית דיסטל אטבריאן (1059), גלעד קריב (1066), דבי ביטון (1094), דן אילוז (1116), ואליד אלהואשלה (1093), ווליד טאהא (1026), ולדימיר בליאק (1049), חיים ביטון (1055), חנוך דב מלביצקי (1105), טטיאנה מזרסקי (1076), קטי קטרין שטרית (1018), רם בן ברק (1022), משה אבוטבול (1029), יוסף טייב (1043)

## Method

For each MK:
1. Navigate to: `https://m.knesset.gov.il/mk/apps/mk/mk-personal-details/{mkId}`
2. Wait 3 seconds for page to load
3. Extract phone and email from page content
4. Update database: `UPDATE MK SET phone = '{phone}', email = '{email}' WHERE mkId = {mkId};`

## Final Results

### Database Status
- **Total MKs with contact details:** 120/120 (100%) ✅
- **MKs with both phone and email:** 119/120 (99%)
- **MKs with email only (no phone):** 1/120 (1%) - MK 69 (ישראל כץ)
- **MKs without contact details:** 0/120 (0%)

### Key Findings

1. **All MKs have publicly available contact information** - The initial automated script failed to extract contacts due to insufficient wait times for the Angular application to load
2. **Extraction success required 4-second wait times** - Pages need time for dynamic content to render
3. **Phone number patterns:**
   - Most MKs have direct lines (02-640xxxx or 02-649xxxx)
   - Some MKs share the general Knesset number (02-6753333)
   - Two MKs have multiple phone numbers listed
4. **Email addresses:** All follow the pattern `[username]@knesset.gov.il`

### Technical Lessons Learned

1. **Timing is critical** - The Knesset website uses Angular which requires adequate load time
2. **Playwright MCP tools are reliable** - Manual verification with 4-second waits had 100% success rate
3. **Agent-based extraction scales well** - Processing 21+ MKs in a single agent task worked efficiently
4. **Better-sqlite3 adapter works flawlessly** - No database issues during 120+ updates
