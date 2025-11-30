# Historical Comments Admin User Guide

> **📋 For**: System administrators managing historical comments from coalition Knesset members
> **⏱️ Reading time**: 15 minutes
> **🎯 Goal**: Learn to effectively manage, verify, and organize historical comments

## Table of Contents

1. [Getting Started](#getting-started)
2. [Understanding the Dashboard](#understanding-the-dashboard)
3. [Filtering Comments](#filtering-comments)
4. [Managing Individual Comments](#managing-individual-comments)
5. [Bulk Operations](#bulk-operations)
6. [Understanding Metadata](#understanding-metadata)
7. [Working with Duplicates](#working-with-duplicates)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Accessing the Admin Dashboard

1. **Login to the System**
   - Navigate to your application URL
   - Login with admin credentials
   - You'll see the landing page with MK cards

2. **Navigate to Admin Dashboard**
   - Click "לוח בקרה" (Control Panel) button in the top header
   - You'll be redirected to `/admin`

3. **Scroll to Historical Comments Section**
   - The Historical Comments Manager is below the MK position table
   - Look for the "הערות היסטוריות" (Historical Comments) section

### First Look

When you first access the Historical Comments Manager, you'll see:

- **Statistics Cards** at the top showing:
  - Total comments count
  - Verified comments count
  - Primary source percentage
  - Average credibility score

- **Platform Breakdown** showing distribution across:
  - News (ידיעות)
  - Twitter/X (טוויטר)
  - Facebook (פייסבוק)
  - YouTube (יוטיוב)
  - Knesset (כנסת)
  - Interview (ראיון)
  - Other (אחר)

- **Filters Panel** for searching and filtering
- **Comments Table** with sortable columns
- **Action Buttons** for bulk operations

---

## Understanding the Dashboard

### Statistics Cards

#### 1. Total Comments (סה״כ הערות)
- Shows total number of comments in the system
- **Excludes duplicates** - only counts primary comments
- Green card with document icon

**Example**: "סה״כ הערות: 245"

#### 2. Verified Comments (הערות מאומתות)
- Shows how many comments have been manually verified by admins
- Blue card with check icon
- Percentage shows verification rate

**Example**: "הערות מאומתות: 180 (73%)"

#### 3. Primary Sources (מקורות ראשוניים)
- Shows percentage of comments from primary sources (direct quotes)
- Purple card with star icon
- Primary sources are more reliable than secondary reporting

**Example**: "מקורות ראשוניים: 65%"

#### 4. Average Credibility (ממוצע אמינות)
- Shows average credibility score (1-10 scale)
- Orange card with shield icon
- Higher score = more credible sources

**Example**: "ממוצע אמינות: 7.2"

### Platform Breakdown

Colored badges showing distribution of comments across platforms:

- **🟢 News (ידיעות)**: News articles, publications
- **🔵 Twitter (טוויטר)**: X/Twitter posts
- **🟣 Facebook (פייסבוק)**: Facebook posts
- **🔴 YouTube (יוטיוב)**: YouTube videos/interviews
- **🟡 Knesset (כנסת)**: Official Knesset records
- **🟠 Interview (ראיון)**: TV/radio interviews
- **⚪ Other (אחר)**: Other sources

Each badge shows the count of comments from that platform.

**Example**: "ידיעות (120) | טוויטר (45) | כנסת (30)"

### Comments Table

The main table displays comments with the following columns:

| Column | Description |
|--------|-------------|
| ☑️ Checkbox | Select for bulk operations |
| תוכן (Content) | First 100 characters of comment |
| חבר כנסת (MK) | Member name and faction |
| מקור (Source) | Platform badge |
| אמינות (Credibility) | 1-10 score with visual indicator |
| תאריך (Date) | When comment was made |
| מאומת (Verified) | ✅ or ❌ icon |
| פעולות (Actions) | Verify, Delete, View buttons |

---

## Filtering Comments

The filter panel allows you to narrow down the comments table.

### 1. Search by Content/Source

**Location**: Top of filter panel
**Field**: "חיפוש לפי תוכן או מקור..." (Search by content or source)

**Searches in**:
- Comment content text
- Source name (e.g., "ידיעות אחרונות")
- Source URL

**Example**:
- Search "חוק גיוס" → Shows all comments mentioning recruitment law
- Search "ynet" → Shows comments from Ynet source

**💡 Tip**: Search is case-insensitive and works in Hebrew and English.

### 2. Filter by MK

**Location**: Dropdown menu in filter panel
**Label**: "סנן לפי חבר כנסת" (Filter by MK)

**Options**:
- "כל חברי הכנסת" (All MKs) - Default, shows all
- List of all coalition MKs (64 members)

**Usage**:
1. Click dropdown
2. Start typing MK name (Hebrew)
3. Select MK from list
4. Table updates to show only that MK's comments

**Example**: Select "בנימין נתניהו" → Shows only Netanyahu's comments

### 3. Filter by Platform

**Location**: Checkbox list in filter panel
**Label**: "סנן לפי פלטפורמה" (Filter by platform)

**Available Platforms**:
- ☐ ידיעות (News)
- ☐ טוויטר (Twitter)
- ☐ פייסבוק (Facebook)
- ☐ יוטיוב (YouTube)
- ☐ כנסת (Knesset)
- ☐ ראיון (Interview)
- ☐ אחר (Other)

**Usage**:
1. Check one or more platforms
2. Table shows only comments from selected platforms
3. Uncheck to remove filter

**Example**: Check "ידיעות" + "כנסת" → Shows only news articles and Knesset records

### 4. Filter by Verification Status

**Location**: Toggle buttons in filter panel
**Label**: "סנן לפי סטטוס אימות" (Filter by verification status)

**Options**:
- **הכל** (All) - Default, shows all comments
- **מאומת** (Verified) - Shows only verified comments (✅)
- **לא מאומת** (Unverified) - Shows only unverified comments (❌)

**Usage**: Click the desired button to filter

**Example**: Click "מאומת" → Shows only verified comments

### 5. Filter by Source Type

**Location**: Radio buttons in filter panel
**Label**: "סנן לפי סוג מקור" (Filter by source type)

**Options**:
- ○ **הכל** (All) - Shows both types
- ○ **ראשוני** (Primary) - Direct quotes from MK
- ○ **משני** (Secondary) - Reporting about MK's statement

**Usage**: Click the desired radio button

**💡 Tip**: Primary sources are generally more reliable as they're direct quotes.

### 6. Clear All Filters

**Location**: Button at top-right of filter panel
**Button**: "נקה סינונים" (Clear Filters)

**Action**: Resets all filters to default state:
- Clears search text
- Sets MK to "All"
- Unchecks all platforms
- Sets verification to "All"
- Sets source type to "All"

---

## Managing Individual Comments

### Viewing Comment Details

**How to Open**:
1. Find comment in table
2. Click "👁️ צפה" (View) button in Actions column
3. Detail dialog opens

**What You See**:
- Full comment text (no truncation)
- All metadata fields:
  - MK name and faction
  - Source platform and name
  - Source URL (clickable link)
  - Credibility score (1-10 with visual bar)
  - Comment date and publish date
  - Verification status
  - Keywords extracted from content
  - Topic classification
  - Image/video URLs if present
  - Additional context notes
- **Duplicate Information**:
  - Number of duplicates found
  - List of all duplicate sources
  - Duplicate group UUID

**Example Detail View**:
```
תוכן: חוק הגיוס הוא חוק חשוב למדינת ישראל ויש להעביר אותו במהרה

חבר כנסת: בנימין נתניהו (הליכוד)
מקור: ידיעות אחרונות
קישור: https://www.ynet.co.il/news/article/xyz123
אמינות: ⭐⭐⭐⭐⭐⭐⭐⭐ (8/10)
תאריך הערה: 15/01/2024 10:30
מאומת: ✅ כן

מילות מפתח: חוק גיוס, מדינת ישראל

כפילויות: 2 כפילויות נמצאו
1. Twitter - https://twitter.com/user/status/123 (16/01/2024)
2. Facebook - https://facebook.com/post/456 (17/01/2024)
```

### Verifying a Comment

**When to Verify**:
- ✅ Source URL is accessible and valid
- ✅ Content accurately reflects MK's statement
- ✅ Date is correct
- ✅ Source credibility is reasonable
- ✅ No obvious errors or misinformation

**How to Verify**:

**Method 1: From Table**
1. Find comment in table
2. Click "✅ אמת" (Verify) button in Actions column
3. Comment is immediately marked as verified
4. Green checkmark appears in Verified column
5. Statistics update automatically

**Method 2: From Detail Dialog**
1. Open comment details
2. If unverified, you'll see "❌ לא מאומת"
3. Close dialog
4. Click verify button from table

**⚠️ Important**: Verification cannot be undone individually. You must delete and re-add the comment if you verified by mistake.

### Deleting a Comment

**When to Delete**:
- ❌ Source URL is broken/invalid
- ❌ Content is spam or irrelevant
- ❌ Comment is not actually about recruitment law
- ❌ MK information is wrong
- ❌ Duplicate of existing comment (not auto-detected)

**How to Delete**:
1. Find comment in table
2. Click "🗑️ מחק" (Delete) button in Actions column
3. **Confirmation dialog appears** - Are you sure?
4. Click "מחק" to confirm or "ביטול" to cancel
5. Comment is permanently deleted
6. Table refreshes automatically
7. Statistics update

**⚠️ Warning**: Deletion is permanent and cannot be undone. The comment is removed from the database.

**💡 Tip**: If you're unsure, leave the comment unverified rather than deleting it.

---

## Bulk Operations

Bulk operations allow you to verify or delete multiple comments at once.

### Selecting Multiple Comments

**Method 1: Individual Selection**
1. Check the checkbox in the leftmost column for each comment
2. Selected comments are highlighted
3. Count appears in bulk actions bar: "3 נבחרו" (3 selected)

**Method 2: Select All**
1. Check the checkbox in the table header row
2. All comments on current page are selected
3. To select all comments across all pages, you must:
   - Select all on page 1
   - Perform action
   - Move to page 2
   - Repeat

**Deselecting**:
- Uncheck individual checkboxes
- Uncheck header checkbox to deselect all

### Bulk Verification

**When to Use**:
- You've reviewed multiple comments from a reliable source
- Same source has multiple valid comments
- Batch verification after CSV import

**How to Bulk Verify**:
1. Select 2 or more comments (checkboxes)
2. Bulk actions bar appears at top of table
3. Click "✅ אמת נבחרים" (Verify Selected) button
4. Confirmation dialog: "האם לאמת 5 הערות?" (Verify 5 comments?)
5. Click "אמת" (Verify) to confirm
6. All selected comments marked as verified
7. Success message: "5 הערות אומתו בהצלחה" (5 comments verified successfully)
8. Table refreshes
9. Statistics update

**💡 Tip**: Maximum 50 comments can be bulk verified at once.

### Bulk Deletion

**When to Use**:
- Multiple spam comments from same source
- Batch of invalid comments after review
- Cleanup of test data

**How to Bulk Delete**:
1. Select 2 or more comments (checkboxes)
2. Bulk actions bar appears
3. Click "🗑️ מחק נבחרים" (Delete Selected) button
4. **Strong confirmation dialog**: "⚠️ פעולה זו תמחק לצמיתות 5 הערות. האם להמשיך?"
5. Click "מחק" (Delete) to confirm or "ביטול" (Cancel)
6. All selected comments permanently deleted
7. Success message: "5 הערות נמחקו בהצלחה"
8. Table refreshes
9. Statistics update

**⚠️ Warning**: Bulk deletion is permanent and cannot be undone. Double-check selection before confirming.

**💡 Tip**: Maximum 50 comments can be bulk deleted at once.

---

## Understanding Metadata

### Source Credibility (1-10 Scale)

The credibility score indicates how reliable the source is.

**Score Ranges**:
- **9-10**: Highly credible (Official Knesset records, major news outlets)
- **7-8**: Very credible (Established news sources, verified social media)
- **5-6**: Moderately credible (Secondary reporting, unverified social media)
- **3-4**: Low credibility (Blogs, unverified sources)
- **1-2**: Very low credibility (Anonymous sources, questionable sites)

**Visual Indicators**:
- **Green bar** (7-10): High credibility
- **Yellow bar** (4-6): Medium credibility
- **Red bar** (1-3): Low credibility

**Who Sets It**:
- Automatically set to 5 (default) when comment is created
- Can be manually adjusted via CSV import
- Based on source reputation in external systems

**Example**:
- Ynet article: 8/10 (⭐⭐⭐⭐⭐⭐⭐⭐)
- Twitter post: 6/10 (⭐⭐⭐⭐⭐⭐)
- Blog comment: 3/10 (⭐⭐⭐)

### Platform Types

**News (ידיעות)**:
- Newspaper articles
- Online news publications
- News agencies
- Examples: Ynet, Haaretz, Jerusalem Post

**Twitter/X (טוויטר)**:
- Posts from X (formerly Twitter)
- Direct quotes from MK's account
- Retweets with commentary

**Facebook (פייסבוק)**:
- Posts from MK's Facebook page
- Facebook Live videos
- Public posts about MKs

**YouTube (יוטיוב)**:
- Video interviews
- Knesset session recordings
- TV interview clips

**Knesset (כנסת)**:
- Official Knesset protocols
- Committee meeting transcripts
- Floor speeches
- Most credible source (primary)

**Interview (ראיון)**:
- TV interviews (Channel 12, 13, 14)
- Radio interviews
- Podcast appearances

**Other (אחר)**:
- Press releases
- Official statements
- Other platforms not listed above

### Source Type: Primary vs Secondary

**Primary Source (מקור ראשוני)**:
- **Definition**: Direct quote from the MK
- **Examples**:
  - MK's own tweet
  - Knesset floor speech
  - Video interview where MK speaks
  - Official statement from MK's office
- **Reliability**: Highest - no interpretation layer
- **Badge**: 🟢 Green "ראשוני"

**Secondary Source (מקור משני)**:
- **Definition**: Reporting about MK's statement
- **Examples**:
  - News article quoting the MK
  - Analysis piece discussing MK's position
  - Social media post about what MK said
  - Transcript of MK's speech (not verbatim)
- **Reliability**: Lower - potential for misquoting or context loss
- **Badge**: 🟡 Yellow "משני"

**💡 Tip**: Always prefer primary sources when available. Verify secondary sources against primary when possible.

### Keywords and Topics

**Keywords**:
- Automatically extracted from comment content
- Must include at least one primary recruitment law keyword:
  - חוק גיוס / חוק הגיוס
  - גיוס חרדים
  - recruitment law / draft law
- May include secondary keywords:
  - צה״ל, IDF, חרדים, haredim, yeshiva, Torah scholars

**Topic Classification**:
- Currently all comments are classified as "IDF_RECRUITMENT"
- Future versions may support multiple topics
- Used for filtering and analytics

**Example Keywords Display**:
```
מילות מפתח: חוק גיוס, גיוס חרדים, צה״ל, ישיבות
```

---

## Working with Duplicates

### Understanding Duplicate Detection

The system automatically detects duplicates using two methods:

**1. Exact Match (Hash-based)**:
- Identical content = duplicate
- 100% accuracy
- Instant detection

**2. Fuzzy Match (Similarity-based)**:
- 85%+ similar content = duplicate
- Accounts for minor differences (punctuation, formatting)
- Scans last 90 days of comments

### Duplicate Groups

When duplicates are detected, they're linked together with a UUID:

**Primary Comment**:
- The **first** comment found (by commentDate)
- Shows in main table
- Counted in statistics
- Has `duplicateOf: null`

**Duplicate Comments**:
- Later comments with same/similar content
- **Not shown** in main table (filtered out)
- Not counted in statistics
- Have `duplicateOf: <primary_comment_id>`
- Linked to primary via `duplicateGroup: <uuid>`

### Viewing Duplicates

**In Detail Dialog**:
1. Open any comment details
2. Scroll to "כפילויות" (Duplicates) section
3. If duplicates exist, you'll see:
   - Count: "2 כפילויות נמצאו"
   - List of duplicate sources:
     ```
     1. Twitter - https://twitter.com/user/status/123 (16/01/2024)
     2. Facebook - https://facebook.com/post/456 (17/01/2024)
     ```
4. Each duplicate shows:
   - Platform
   - Source URL (clickable)
   - Publish date

**Example Scenario**:

MK posts statement on Twitter → Same statement reported by Ynet → Same statement on Facebook

Result:
- Twitter post (first) = Primary comment ✅ (shows in table)
- Ynet article = Duplicate 1 ❌ (hidden, linked to Twitter)
- Facebook post = Duplicate 2 ❌ (hidden, linked to Twitter)

All three have same `duplicateGroup: abc-123-def-456`

### Managing Duplicates

**If Duplicate Detection Failed**:
1. Manual deletion: Delete the later duplicate comment
2. The earlier comment remains as primary

**If False Positive (Not Actually Duplicate)**:
1. This is rare (85% threshold is conservative)
2. Contact system administrator to adjust similarity threshold
3. Threshold can be tuned in code (default: 0.85)

**Verifying Duplicates**:
- When you verify a primary comment, duplicates are NOT automatically verified
- Each duplicate is a separate record
- Only the primary comment matters for statistics

---

## Best Practices

### ✅ DO

1. **Verify Comments Systematically**
   - Work through one source at a time
   - Verify in batches (filter by platform)
   - Check source URL before verifying

2. **Use Filters Effectively**
   - Filter by MK when reviewing specific member
   - Filter by platform when checking source credibility
   - Use search for specific topics

3. **Check for Context**
   - Read full comment in detail dialog
   - Click source URL to see original context
   - Check publication date for relevance

4. **Leverage Bulk Operations**
   - Bulk verify after reviewing multiple comments
   - Bulk delete spam from same source
   - Select carefully before bulk actions

5. **Monitor Statistics**
   - Check verification rate weekly
   - Aim for >80% verification rate
   - Monitor platform distribution for bias

6. **Review Duplicates**
   - When viewing details, check duplicate list
   - Ensure all sources are captured
   - Verify primary comment is most authoritative

### ❌ DON'T

1. **Don't Verify Without Checking**
   - Never bulk verify without reviewing
   - Don't trust source name alone
   - Always verify source URL works

2. **Don't Delete Hastily**
   - Leave unverified rather than delete if unsure
   - Check for duplicates before deleting
   - Don't delete without viewing details first

3. **Don't Ignore Filters**
   - Don't try to review all comments at once
   - Use filters to break into manageable chunks
   - Clear filters when switching tasks

4. **Don't Overlook Metadata**
   - Credibility score matters
   - Source type affects reliability
   - Keywords indicate relevance

5. **Don't Forget to Clear Filters**
   - Clear filters when done with specific task
   - Otherwise you might miss comments in other views

---

## Troubleshooting

### Problem: No Comments Showing in Table

**Possible Causes**:
1. Filters are too restrictive
2. No comments exist in database
3. Database connection issue

**Solutions**:
1. Click "נקה סינונים" (Clear Filters)
2. Check statistics cards - if "סה״כ הערות: 0", database is empty
3. Check browser console for errors
4. Refresh page (F5)
5. Contact system administrator if issue persists

### Problem: Verification Not Working

**Symptoms**: Click "אמת" button, nothing happens

**Solutions**:
1. Check browser console for JavaScript errors
2. Refresh page and try again
3. Check that you're logged in as admin
4. Try verifying different comment
5. If only specific comment fails, it may be deleted - refresh page

### Problem: Delete Button Missing or Disabled

**Possible Causes**:
1. Comment is already being deleted by another admin
2. Comment doesn't exist (stale data)
3. JavaScript error

**Solutions**:
1. Refresh page (F5) to get latest data
2. Check browser console for errors
3. Try different comment
4. Clear browser cache and reload

### Problem: Filters Not Working

**Symptoms**: Selecting filter doesn't update table

**Solutions**:
1. Wait 2-3 seconds for debounce (search field)
2. Ensure filter values are selected correctly
3. Check that "הכל" (All) is not selected for that filter
4. Clear all filters and start over
5. Refresh page

### Problem: Bulk Actions Not Appearing

**Symptoms**: Selected comments, but no bulk actions bar

**Solutions**:
1. Ensure at least 2 comments are selected
2. Scroll to top of table - bar appears above table
3. Check that checkboxes are actually checked (blue background)
4. Deselect all and reselect
5. Refresh page

### Problem: Detail Dialog Shows Wrong Data

**Symptoms**: Click "View" button, dialog shows different comment

**Solutions**:
1. This is a critical bug - report immediately
2. Refresh page
3. Clear browser cache
4. Note the comment ID and details
5. Contact system administrator

### Problem: Statistics Not Updating

**Symptoms**: Verify/delete comments, stats don't change

**Solutions**:
1. Wait 5 seconds - update may be delayed
2. Manually refresh page (F5)
3. Check that action actually succeeded (look for success message)
4. If stats are way off, contact administrator (possible data issue)

### Problem: Search Returns Nothing

**Symptoms**: Search for known content, no results

**Solutions**:
1. Check spelling (Hebrew and English)
2. Try partial search (just "גיוס" instead of "חוק הגיוס")
3. Search is case-insensitive, but check language keyboard
4. Clear search and try again
5. Check if other filters are active (clear all filters)

### Problem: Can't Access Admin Dashboard

**Symptoms**: "לוח בקרה" button missing or link doesn't work

**Solutions**:
1. Ensure you're logged in as admin
2. Check URL - should be `/admin`
3. Clear browser cache
4. Try logging out and back in
5. Contact administrator to verify admin permissions

---

## Quick Reference

### Keyboard Shortcuts

None currently implemented. All actions require mouse clicks.

### Common Filters

| Task | Filters to Use |
|------|---------------|
| Review specific MK | MK dropdown → Select MK |
| Check news sources | Platform → Check "ידיעות" |
| Find unverified | Verification → "לא מאומת" |
| Primary sources only | Source Type → "ראשוני" |
| Recent comments | Sort → Date (newest first) |
| High credibility | Sort → Credibility (highest first) |

### Button Reference

| Button | Icon | Action |
|--------|------|--------|
| אמת | ✅ | Verify single comment |
| מחק | 🗑️ | Delete single comment |
| צפה | 👁️ | View comment details |
| אמת נבחרים | ✅ | Verify selected (bulk) |
| מחק נבחרים | 🗑️ | Delete selected (bulk) |
| נקה סינונים | ✖️ | Clear all filters |

### Status Indicators

| Icon | Meaning |
|------|---------|
| ✅ | Verified |
| ❌ | Not verified |
| 🟢 | Primary source |
| 🟡 | Secondary source |
| ⭐⭐⭐⭐⭐⭐⭐⭐ | Credibility score (8/10) |

---

## Getting Help

**Documentation**:
- [Developer Guide](./DEVELOPER_GUIDE.md) - Technical details
- [API Integration Guide](./API_INTEGRATION_GUIDE.md) - API usage
- [Quick Reference](./QUICK_REFERENCE.md) - Fast lookup

**Support**:
- Check troubleshooting section above
- Review browser console for errors
- Contact system administrator with:
  - Screenshot of issue
  - Steps to reproduce
  - Browser and version
  - Comment ID if applicable

---

**Last Updated**: 2025-01-18
**Version**: 1.0
**Author**: EL HADEGEL Development Team
