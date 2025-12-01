# Feature Specification - Law Commenting System

## Project Overview

**Project Name**: Law Commenting System for IDF Recruitment Law
**Version**: 1.0
**Release Date**: 2025-12-01
**Platform**: Web Application (Next.js)
**Language**: Hebrew (עברית)

---

## Executive Summary

The Law Commenting System enables Israeli citizens to read the IDF Recruitment Law, submit comments on individual paragraphs, and view approved community feedback. Administrators can moderate submissions through a dedicated dashboard with approval/rejection workflows and bulk operations.

---

## User Stories

### Public User Stories

**US-1: View Law Document**
- **As a** public visitor
- **I want to** read the IDF Recruitment Law
- **So that** I can understand its content
- **Acceptance Criteria**:
  - ✅ Law displayed in Hebrew with RTL layout
  - ✅ Paragraphs numbered sequentially
  - ✅ Section titles clearly visible
  - ✅ Table of contents for navigation
  - ✅ Mobile responsive design

**US-2: Submit Comment on Paragraph**
- **As a** public visitor
- **I want to** submit a comment on a specific paragraph
- **So that** I can share my opinion
- **Acceptance Criteria**:
  - ✅ Comment form with required fields (name, email, phone, comment)
  - ✅ Optional suggested edit field
  - ✅ Israeli phone number validation
  - ✅ Email format validation
  - ✅ Minimum comment length (10 characters)
  - ✅ Success message after submission
  - ✅ Comments await moderation before public display

**US-3: View Approved Comments**
- **As a** public visitor
- **I want to** see approved comments on a paragraph
- **So that** I can read community feedback
- **Acceptance Criteria**:
  - ✅ Comment count badge on paragraph cards
  - ✅ "צפה בתגובות" button (if comments exist)
  - ✅ Dialog showing all approved comments
  - ✅ Commenter name and date displayed
  - ✅ Personal info (email, phone) hidden
  - ✅ Chronological order (newest first)

---

### Admin User Stories

**US-4: Login to Admin Dashboard**
- **As an** administrator
- **I want to** securely login to the admin area
- **So that** I can moderate comments
- **Acceptance Criteria**:
  - ✅ Login page with email/password
  - ✅ Session-based authentication
  - ✅ Redirect to dashboard on success
  - ✅ Error message for invalid credentials

**US-5: View All Comments**
- **As an** administrator
- **I want to** see all submitted comments
- **So that** I can review them
- **Acceptance Criteria**:
  - ✅ Paginated table (50 per page)
  - ✅ Sortable columns
  - ✅ Status badges (Pending, Approved, Rejected, Spam)
  - ✅ Commenter details visible (name, email, phone)
  - ✅ Submission date and time
  - ✅ Associated paragraph number

**US-6: Moderate Individual Comment**
- **As an** administrator
- **I want to** approve or reject a comment
- **So that** I can control what's published
- **Acceptance Criteria**:
  - ✅ "אשר" button (approve)
  - ✅ "דחה" button (reject with optional reason)
  - ✅ "סמן כספאם" button
  - ✅ "מחק" button (permanent deletion)
  - ✅ Confirmation for destructive actions
  - ✅ Approved comments immediately visible on public page

**US-7: Bulk Moderate Comments**
- **As an** administrator
- **I want to** approve/reject multiple comments at once
- **So that** I can work efficiently
- **Acceptance Criteria**:
  - ✅ Checkbox selection for multiple comments
  - ✅ "אשר הכל" button (max 100)
  - ✅ "דחה הכל" button (max 100)
  - ✅ "מחק הכל" button (max 100)
  - ✅ Success message with count
  - ✅ Table refreshes after operation

**US-8: Filter and Search Comments**
- **As an** administrator
- **I want to** filter comments by status, paragraph, or search term
- **So that** I can find specific comments quickly
- **Acceptance Criteria**:
  - ✅ Status dropdown filter
  - ✅ Paragraph selector
  - ✅ Search box (searches: name, email, content)
  - ✅ Date range filter
  - ✅ Filters can be combined
  - ✅ Results update immediately

**US-9: View Comment Statistics**
- **As an** administrator
- **I want to** see statistics about comments
- **So that** I can understand moderation workload
- **Acceptance Criteria**:
  - ✅ Total comments count
  - ✅ Pending count (yellow)
  - ✅ Approved count (green)
  - ✅ Rejected/Spam count (red)
  - ✅ Breakdown by paragraph
  - ✅ Real-time updates

---

## Functional Requirements

### FR-1: Comment Submission

**Requirements**:
- **FR-1.1**: System SHALL accept comments only from valid email addresses
- **FR-1.2**: System SHALL validate Israeli phone number format
- **FR-1.3**: System SHALL enforce minimum comment length of 10 characters
- **FR-1.4**: System SHALL enforce maximum comment length of 5000 characters
- **FR-1.5**: System SHALL set comment status to PENDING by default
- **FR-1.6**: System SHALL sanitize all user input to prevent XSS
- **FR-1.7**: System SHALL detect and block spam comments
- **FR-1.8**: System SHALL prevent duplicate submissions (90% similarity, 24-hour window)
- **FR-1.9**: System SHALL rate limit submissions (5/hour per IP, 10/hour per email)

### FR-2: Comment Moderation

**Requirements**:
- **FR-2.1**: System SHALL require admin authentication for moderation actions
- **FR-2.2**: System SHALL support four comment statuses: PENDING, APPROVED, REJECTED, SPAM
- **FR-2.3**: System SHALL allow admin to approve/reject individual comments
- **FR-2.4**: System SHALL allow admin to approve/reject up to 100 comments at once
- **FR-2.5**: System SHALL record moderator ID and timestamp for all moderation actions
- **FR-2.6**: System SHALL allow admin to add optional notes when rejecting
- **FR-2.7**: System SHALL permanently delete comments when admin confirms deletion

### FR-3: Comment Display

**Requirements**:
- **FR-3.1**: System SHALL display only APPROVED comments on public page
- **FR-3.2**: System SHALL hide personal information (email, phone, IP) from public
- **FR-3.3**: System SHALL show comment count badge on paragraph cards
- **FR-3.4**: System SHALL display comments in chronological order (newest first)
- **FR-3.5**: System SHALL limit public comment display to 50 per paragraph
- **FR-3.6**: System SHALL show commenter first and last name

### FR-4: Security

**Requirements**:
- **FR-4.1**: System SHALL hash admin passwords with bcrypt (cost factor 10)
- **FR-4.2**: System SHALL use session-based authentication with JWT
- **FR-4.3**: System SHALL protect against SQL injection via Prisma ORM
- **FR-4.4**: System SHALL protect against XSS via content sanitization
- **FR-4.5**: System SHALL protect against CSRF via Next.js Server Actions
- **FR-4.6**: System SHALL log IP address and user agent for spam tracking
- **FR-4.7**: System SHALL implement rate limiting to prevent abuse

---

## Non-Functional Requirements

### NFR-1: Performance

- **NFR-1.1**: Law document page SHALL load in < 2 seconds
- **NFR-1.2**: Comment submission SHALL complete in < 500ms
- **NFR-1.3**: Admin dashboard SHALL load in < 3 seconds
- **NFR-1.4**: Database queries SHALL use indexes for O(log n) lookups
- **NFR-1.5**: System SHALL handle 100 concurrent users without degradation

### NFR-2: Accessibility

- **NFR-2.1**: System SHALL support screen readers
- **NFR-2.2**: System SHALL support keyboard navigation
- **NFR-2.3**: Dialogs SHALL trap focus and support Escape key
- **NFR-2.4**: Form fields SHALL have proper ARIA labels
- **NFR-2.5**: Color contrast SHALL meet WCAG 2.1 AA standards

### NFR-3: Internationalization

- **NFR-3.1**: Primary language SHALL be Hebrew
- **NFR-3.2**: Layout SHALL be RTL (right-to-left)
- **NFR-3.3**: Date formats SHALL use Hebrew locale (he-IL)
- **NFR-3.4**: Error messages SHALL be in Hebrew
- **NFR-3.5**: Font SHALL support Hebrew characters (Rubik)

### NFR-4: Maintainability

- **NFR-4.1**: Code SHALL use TypeScript for type safety
- **NFR-4.2**: Database schema SHALL use Prisma ORM
- **NFR-4.3**: Validation SHALL use Zod schemas
- **NFR-4.4**: Code SHALL follow ESLint rules
- **NFR-4.5**: Documentation SHALL exist for all major features

### NFR-5: Scalability

- **NFR-5.1**: Database SHALL use connection pooling
- **NFR-5.2**: Queries SHALL use pagination (max 100 per page)
- **NFR-5.3**: Rate limiting SHALL use in-memory caching
- **NFR-5.4**: Static assets SHALL be cached by CDN
- **NFR-5.5**: System SHALL support horizontal scaling (Vercel)

### NFR-6: Reliability

- **NFR-6.1**: Database SHALL have automatic daily backups
- **NFR-6.2**: System uptime SHALL be > 99.5%
- **NFR-6.3**: Failed transactions SHALL rollback atomically
- **NFR-6.4**: Errors SHALL be logged for debugging
- **NFR-6.5**: System SHALL gracefully handle database disconnections

---

## Technical Constraints

### TC-1: Technology Stack

- **Framework**: Next.js 16.0.4 (App Router)
- **React**: 19.2.0 (Server Components)
- **Database**: Neon PostgreSQL (production) / SQLite (development)
- **ORM**: Prisma 7.0.1
- **Authentication**: NextAuth.js v5 (beta.30)
- **Validation**: Zod
- **UI**: shadcn/ui (Radix UI + Tailwind CSS v4)
- **Language**: TypeScript 5
- **Package Manager**: pnpm

### TC-2: Browser Support

- **Modern browsers**: Chrome 100+, Firefox 100+, Safari 15+, Edge 100+
- **Mobile**: iOS Safari 15+, Chrome Android 100+
- **No IE support**: Internet Explorer not supported

### TC-3: Database

- **Provider**: Neon (serverless PostgreSQL)
- **Connection**: SSL required (`?sslmode=require`)
- **Migrations**: Prisma Migrate
- **Indexes**: Required for paragraphId, status, email, submittedAt

---

## Success Criteria

The Law Commenting System is considered successful if:

✅ **Usability**:
- 90%+ of users can submit a comment without errors on first try
- Average time to submit comment < 2 minutes

✅ **Security**:
- Zero XSS vulnerabilities
- Zero SQL injection vulnerabilities
- All spam caught (0% false negatives acceptable)

✅ **Performance**:
- Page load time < 2 seconds (95th percentile)
- Comment submission < 500ms (95th percentile)
- Admin dashboard < 3 seconds (95th percentile)

✅ **Reliability**:
- Uptime > 99.5%
- Zero data loss incidents
- Successful database backups daily

✅ **Moderation**:
- Admin can process 50+ comments in < 5 minutes
- Bulk operations complete in < 10 seconds
- Zero comments lost during moderation

---

## Out of Scope (Version 1.0)

The following features are NOT included in Version 1.0:

❌ Comment voting (upvote/downvote)
❌ Comment replies/threads
❌ User accounts (comments are anonymous)
❌ Email notifications
❌ Comment editing after submission
❌ Real-time updates (WebSockets)
❌ Advanced spam ML detection
❌ Multi-language support (only Hebrew)
❌ Comment export to PDF
❌ Analytics dashboard
❌ Public API for comments

These may be considered for future versions based on user feedback.

---

## Assumptions and Dependencies

### Assumptions

1. Majority of users have modern browsers
2. Users understand Hebrew language
3. Admins have basic computer literacy
4. Internet connection is stable
5. Comments are submitted in good faith (with moderation for exceptions)

### Dependencies

1. **Neon PostgreSQL**: Database hosting
2. **Vercel**: Application hosting (recommended)
3. **Next.js**: Framework stability
4. **Prisma**: ORM stability
5. **NextAuth.js**: Authentication library
6. **shadcn/ui**: UI component library

---

## Acceptance Testing

Before release, the following must be verified:

### Public Features
- [ ] Law document loads correctly
- [ ] All 7 paragraphs visible
- [ ] Comment submission works with valid data
- [ ] Comment submission rejects invalid data
- [ ] Phone validation works (Israeli format)
- [ ] Email validation works
- [ ] Approved comments visible on public page
- [ ] Comment count badges accurate
- [ ] Hebrew RTL layout correct
- [ ] Mobile responsive

### Admin Features
- [ ] Login works with correct credentials
- [ ] Login fails with incorrect credentials
- [ ] Statistics cards show accurate counts
- [ ] Comment table displays all comments
- [ ] Approve action works
- [ ] Reject action works (with optional reason)
- [ ] Mark as spam works
- [ ] Delete works (with confirmation)
- [ ] Bulk approve works (max 100)
- [ ] Bulk reject works (max 100)
- [ ] Bulk delete works (max 100)
- [ ] Status filter works
- [ ] Paragraph filter works
- [ ] Search works (name, email, content)
- [ ] Date range filter works

### Security
- [ ] XSS payloads sanitized
- [ ] SQL injection attempts blocked
- [ ] Spam keywords detected
- [ ] Duplicate comments blocked
- [ ] Rate limiting enforced
- [ ] Admin auth required for moderation
- [ ] Personal info hidden from public

### Performance
- [ ] Page loads < 2 seconds
- [ ] Comment submission < 500ms
- [ ] Admin dashboard < 3 seconds
- [ ] Database queries use indexes
- [ ] No N+1 queries

---

## Future Enhancements (v2.0+)

Potential features for future releases:

1. **Comment Voting**: Upvote/downvote helpful comments
2. **Threaded Replies**: Allow replies to comments
3. **User Accounts**: Optional login for commenters
4. **Email Notifications**: Notify when comment approved
5. **Advanced Analytics**: Comment trends, popular paragraphs
6. **ML Spam Detection**: Replace keyword-based with ML
7. **Multi-Language**: Add English, Arabic support
8. **Public API**: REST API for comments
9. **Export Comments**: CSV, PDF export
10. **Real-Time Updates**: WebSocket-based live updates
