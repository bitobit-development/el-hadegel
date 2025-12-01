# Law Document Commenting System - Overview & Architecture

## System Purpose

The Law Document Commenting System enables public engagement with the proposed "חוק יסוד: שירות חובה למען המדינה" (Basic Law: Mandatory Service for the State) by allowing visitors to comment on individual paragraphs and suggest edits. Administrators moderate these comments before they appear publicly.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      PUBLIC INTERFACE                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Landing Page          Law Document Page                     │
│  ┌──────────┐         ┌────────────────────┐               │
│  │ Glowing  │────────>│ LawDocumentViewer  │               │
│  │ CTA      │         │ ├─ TableOfContents │               │
│  │ Button   │         │ ├─ LawParagraphCard│               │
│  └──────────┘         │ │  ├─ Comment Badge│               │
│                       │ │  └─ Add Comment  │               │
│                       │ └─ CommentsDialog  │               │
│                       └────────────────────┘               │
│                              │                              │
└──────────────────────────────┼──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVER ACTIONS LAYER                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Public Actions              Admin Actions                   │
│  ┌──────────────────┐       ┌──────────────────┐           │
│  │ getLawDocument() │       │ getAllComments() │           │
│  │ submitComment()  │       │ approveComment() │           │
│  │ getComments()    │       │ rejectComment()  │           │
│  │ getCount()       │       │ markAsSpam()     │           │
│  └──────────────────┘       │ bulkApprove()    │           │
│                             │ deleteComment()  │           │
│                             └──────────────────┘           │
│                              │                              │
└──────────────────────────────┼──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   VALIDATION & SECURITY LAYER                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────┐        │
│  │ Zod Schema │  │ Spam        │  │ Rate Limiter │        │
│  │ Validation │  │ Detection   │  │ (IP + Email) │        │
│  └────────────┘  └─────────────┘  └──────────────┘        │
│                                                              │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────┐        │
│  │ XSS        │  │ Duplicate   │  │ Israeli      │        │
│  │ Prevention │  │ Detection   │  │ Phone Valid. │        │
│  └────────────┘  └─────────────┘  └──────────────┘        │
│                              │                              │
└──────────────────────────────┼──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATABASE LAYER (Prisma)                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌───────────────┐  ┌───────────────┐   │
│  │ LawDocument  │  │ LawParagraph  │  │ LawComment    │   │
│  ├──────────────┤  ├───────────────┤  ├───────────────┤   │
│  │ id           │  │ id            │  │ id            │   │
│  │ title        │  │ documentId    │  │ paragraphId   │   │
│  │ version      │  │ orderIndex    │  │ firstName     │   │
│  │ isActive     │  │ content       │  │ lastName      │   │
│  │ publishedAt  │  │ sectionTitle  │  │ email         │   │
│  └──────────────┘  └───────────────┘  │ phoneNumber   │   │
│                                        │ content       │   │
│                                        │ suggestedEdit │   │
│                                        │ status        │   │
│                                        │ moderatedBy   │   │
│                                        │ moderatedAt   │   │
│                                        └───────────────┘   │
│                                                              │
│  Enum: CommentStatus { PENDING, APPROVED, REJECTED, SPAM }  │
│                              │                              │
└──────────────────────────────┼──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               POSTGRESQL DATABASE (Neon)                     │
└─────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

### Public UI Components

```
LawDocumentPage (Server Component)
│
├─ LawDocumentViewer (Client Component)
│  │
│  ├─ DocumentHeader
│  │  ├─ Title
│  │  ├─ Version
│  │  └─ PublishedDate
│  │
│  ├─ TableOfContents (Sticky Sidebar)
│  │  └─ SectionLinks[]
│  │
│  └─ LawParagraphCard[] (for each paragraph)
│     │
│     ├─ ParagraphContent
│     ├─ CommentBadge (shows count)
│     │  └─ onClick → CommentsViewDialog
│     │
│     └─ AddCommentButton
│        └─ onClick → CommentSubmissionDialog
│
└─ Dialogs (Lazy Loaded)
   │
   ├─ CommentSubmissionDialog
   │  ├─ ParagraphPreview
   │  ├─ ContactInfoForm (firstName, lastName, email, phone)
   │  ├─ CommentTextarea
   │  ├─ SuggestedEditTextarea (optional)
   │  └─ SubmitButton
   │
   └─ CommentsViewDialog
      ├─ ParagraphPreview
      └─ CommentCard[] (for each approved comment)
         ├─ CommenterName
         ├─ CommentDate
         ├─ CommentContent
         └─ SuggestedEdit (if exists)
```

### Admin UI Components

```
AdminLawCommentsPage (Server Component)
│
└─ AdminLawCommentsManager (Client Component)
   │
   ├─ StatisticsDashboard
   │  ├─ TotalCard
   │  ├─ PendingCard (highlighted)
   │  ├─ ApprovedCard
   │  └─ RejectedSpamCard
   │
   ├─ FilterPanel
   │  ├─ SearchInput
   │  ├─ StatusFilter
   │  ├─ ParagraphFilter
   │  ├─ DateRangeFilter
   │  └─ ResetButton
   │
   ├─ CommentsTable
   │  ├─ TableHeader
   │  │  ├─ SelectAllCheckbox
   │  │  └─ ColumnHeaders[]
   │  │
   │  └─ CommentRow[] (for each comment)
   │     ├─ SelectCheckbox
   │     ├─ ParagraphNumber
   │     ├─ CommenterInfo
   │     ├─ CommentExcerpt
   │     ├─ StatusBadge
   │     ├─ SubmittedDate
   │     └─ Actions
   │        ├─ ApproveButton
   │        ├─ RejectButton
   │        ├─ SpamButton
   │        ├─ DeleteButton
   │        └─ DetailsButton → CommentDetailDialog
   │
   ├─ BulkActions
   │  ├─ BulkApproveButton
   │  ├─ BulkRejectButton
   │  └─ BulkDeleteButton
   │
   ├─ Pagination
   │  ├─ PreviousButton
   │  ├─ PageNumbers
   │  └─ NextButton
   │
   └─ Dialogs
      └─ CommentDetailDialog
         ├─ ParagraphContext
         ├─ CommenterDetails (full info)
         ├─ CommentContent (full text)
         ├─ SuggestedEdit (if exists)
         ├─ Metadata (IP, user agent, timestamp)
         ├─ ModerationHistory (who, when, why)
         └─ Actions (approve/reject/spam/delete)
```

## Data Flow Diagrams

### Comment Submission Flow

```
┌──────────┐
│  Visitor │
└────┬─────┘
     │
     ▼
┌─────────────────────────────┐
│ 1. Reads Law Document       │
│    (LawDocumentViewer)      │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ 2. Clicks "Add Comment"     │
│    (LawParagraphCard)       │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ 3. Fills Form               │
│    (CommentSubmissionDialog)│
│    - firstName              │
│    - lastName               │
│    - email                  │
│    - phoneNumber            │
│    - commentContent         │
│    - suggestedEdit (opt.)   │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ 4. Client-Side Validation   │
│    (React Hook Form + Zod)  │
│    ✓ All required fields    │
│    ✓ Email format           │
│    ✓ Phone format           │
│    ✓ Content length         │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ 5. submitLawComment()       │
│    (Server Action)          │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ 6. Server Validation        │
│    ✓ Zod schema             │
│    ✓ Rate limiting check    │
│    ✓ Spam detection         │
│    ✓ Duplicate detection    │
│    ✓ Content sanitization   │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ 7. Create LawComment Record │
│    status: PENDING          │
│    Store IP + user agent    │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ 8. Success Response         │
│    Show thank you message   │
│    Close dialog             │
└─────────────────────────────┘
```

### Admin Moderation Flow

```
┌───────┐
│ Admin │
└───┬───┘
    │
    ▼
┌────────────────────────────┐
│ 1. Navigate to             │
│    /admin/law-comments     │
└──────┬─────────────────────┘
       │
       ▼
┌────────────────────────────┐
│ 2. View Statistics         │
│    - Total: 150            │
│    - Pending: 23 ⚠️        │
│    - Approved: 115         │
│    - Rejected: 12          │
└──────┬─────────────────────┘
       │
       ▼
┌────────────────────────────┐
│ 3. Filter to PENDING       │
│    (StatusFilter)          │
└──────┬─────────────────────┘
       │
       ▼
┌────────────────────────────┐
│ 4. Review Comment          │
│    - Read content          │
│    - Check contact info    │
│    - Assess legitimacy     │
└──────┬─────────────────────┘
       │
       ▼
┌────────────────────────────┐
│ 5. Approve/Reject/Spam     │
│    Click action button     │
└──────┬─────────────────────┘
       │
       ▼
┌────────────────────────────┐
│ 6. approveComment()        │
│    (Server Action)         │
└──────┬─────────────────────┘
       │
       ▼
┌────────────────────────────┐
│ 7. Update Comment Record   │
│    status: APPROVED        │
│    moderatedBy: admin ID   │
│    moderatedAt: timestamp  │
└──────┬─────────────────────┘
       │
       ▼
┌────────────────────────────┐
│ 8. Revalidate Paths        │
│    - /law-document         │
│    - /admin/law-comments   │
└──────┬─────────────────────┘
       │
       ▼
┌────────────────────────────┐
│ 9. Comment Appears Public  │
│    Visible on law page     │
└────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: Next.js 16.0.4 (App Router)
- **React**: 19.2.0 (Server + Client Components)
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Forms**: React Hook Form 7.x
- **Validation**: Zod 3.x
- **Icons**: Lucide React
- **Date Formatting**: date-fns 3.x

### Backend
- **Server Actions**: Next.js native
- **Database ORM**: Prisma 7.0.1
- **Database**: PostgreSQL (Neon)
- **Authentication**: NextAuth.js v5
- **Rate Limiting**: In-memory with LRU eviction

### Security
- **Input Validation**: Zod schemas
- **Content Sanitization**: Custom HTML sanitizer
- **XSS Prevention**: React auto-escaping + sanitization
- **CSRF Protection**: NextAuth built-in
- **Rate Limiting**: Custom middleware (IP + email)
- **Spam Detection**: Keyword-based algorithm

### Testing
- **E2E**: Playwright
- **Unit**: Jest + React Testing Library
- **Coverage Target**: 90%+

## Security Architecture

### 13-Layer Security System

1. **Layer 1: Input Validation**
   - Zod schemas validate all user input
   - Type-safe validation at runtime
   - Custom validators for Israeli phone numbers

2. **Layer 2: XSS Prevention**
   - Content sanitization before storage
   - HTML tag stripping
   - Script tag removal
   - React automatic escaping on render

3. **Layer 3: Spam Detection**
   - Keyword pattern matching
   - Content repetition detection
   - URL count validation

4. **Layer 4: Duplicate Detection**
   - Content hash comparison
   - 24-hour window check
   - Same email + paragraph + similar content

5. **Layer 5: Rate Limiting**
   - 5 comments/hour per IP address
   - 10 comments/hour per email address
   - In-memory tracking with automatic cleanup

6. **Layer 6: Content Sanitization**
   - Remove dangerous HTML tags
   - Strip event handlers
   - Normalize whitespace

7. **Layer 7: Israeli Phone Validation**
   - Regex-based validation
   - Multiple format support
   - Prefix validation (+972, 0, etc.)

8. **Layer 8: Email Validation**
   - Format validation (Zod)
   - Domain existence check (optional)
   - Disposable email detection (optional)

9. **Layer 9: CSRF Protection**
   - NextAuth.js built-in tokens
   - Server Actions POST-only
   - Same-origin policy

10. **Layer 10: SQL Injection Prevention**
    - Prisma ORM parameterized queries
    - No raw SQL with user input
    - Input validation before queries

11. **Layer 11: Audit Logging**
    - Log all moderation actions
    - IP address recording
    - Timestamp tracking
    - Admin attribution

12. **Layer 12: Error Handling**
    - No sensitive data in errors
    - Descriptive Hebrew messages
    - Graceful degradation

13. **Layer 13: Database Security**
    - Encrypted connections (SSL/TLS)
    - Environment-based credentials
    - Principle of least privilege

## Performance Optimization

### Database Optimization

**Indexes**:
- `LawComment.paragraphId` - Fast comment queries per paragraph
- `LawComment.status` - Admin filtering by status
- `LawComment.submittedAt` - Chronological sorting
- `LawParagraph.documentId + orderIndex` - Unique constraint + fast lookup

**Query Optimization**:
- Use `include` for related data (avoid N+1)
- Pagination for admin table (max 50 per page)
- Limit public comment display (50 per paragraph)
- `groupBy` for comment counts (single query)

### Caching Strategy

**Server Components**:
- Cache law document until revalidation
- Revalidate after comment approval
- Use `revalidatePath()` in Server Actions

**Client Components**:
- Comment counts cached until dialog open
- Comments fetched lazily on dialog open
- No client-side caching (always fresh data)

### Code Splitting

**Lazy Loading**:
- Dialogs loaded only when needed
- Admin components code-split
- Heavy libraries (date-fns, etc.) tree-shaken

## Accessibility

### WCAG 2.1 AA Compliance

**Keyboard Navigation**:
- Tab through paragraphs
- Tab to comment badge → Enter to open
- Tab through form fields
- Escape to close dialogs
- Arrow keys for table navigation (admin)

**Screen Reader Support**:
- ARIA labels on all interactive elements
- Announced comment counts: "5 תגובות מאושרות"
- Form error messages announced
- Success notifications announced
- Table headers properly labeled

**Color Contrast**:
- Comment badge: 4.5:1 ratio
- Status indicators: WCAG AA compliant
- Form validation errors: red + icon (not just color)

**Focus Management**:
- Focus on dialog heading when opened
- Focus on first error field after validation
- Return focus to trigger element when dialog closes

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Vercel (Production Hosting)                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────┐        │
│  │ Next.js App (Edge Network)                 │        │
│  │ - Server Components (RSC)                  │        │
│  │ - Server Actions (API Routes)              │        │
│  │ - Static Generation (law document)         │        │
│  └────────────┬───────────────────────────────┘        │
│               │                                         │
└───────────────┼─────────────────────────────────────────┘
                │
                │ SSL/TLS
                │
                ▼
┌─────────────────────────────────────────────────────────┐
│              Neon (PostgreSQL Database)                 │
├─────────────────────────────────────────────────────────┤
│  - Managed PostgreSQL                                   │
│  - Automatic backups                                    │
│  - Connection pooling                                   │
│  - SSL encryption                                       │
└─────────────────────────────────────────────────────────┘
```

## Monitoring & Observability

### Metrics to Track

**Application Metrics**:
- Comment submission rate
- Approval/rejection ratio
- Average moderation time
- Most commented paragraphs
- User engagement (comments per visitor)

**Performance Metrics**:
- Page load time (law document)
- Comment submission latency
- Admin table load time
- Database query performance

**Security Metrics**:
- Spam detection rate
- Rate limit violations
- Failed validation attempts
- Duplicate submission attempts

**Business Metrics**:
- Total comments (cumulative)
- Active commenters (unique emails)
- Paragraph coverage (% with comments)
- Approval rate over time

## Future Enhancements

### Phase 2 Features (Post-MVP)

1. **Email Verification**
   - Send confirmation email before moderation
   - Reduces spam and ensures valid contacts

2. **Comment Voting**
   - Upvote/downvote helpful comments
   - Sort by popularity

3. **Threaded Replies**
   - Admins can reply to comments publicly
   - Create dialogue with commenters

4. **Comment Export**
   - Export to Excel/PDF for offline review
   - Generate summary reports

5. **Auto-Moderation**
   - AI-powered spam detection
   - Sentiment analysis
   - Auto-approve trusted users

6. **Real-Time Updates**
   - WebSocket for live admin dashboard
   - New comment notifications

7. **Public API**
   - Allow external systems to submit comments
   - OAuth authentication

8. **Analytics Dashboard**
   - Visualizations of comment trends
   - Paragraph heatmap
   - Demographic insights (if collected)

## Glossary

**Terms Used Throughout System**:

- **Law Document**: The full "חוק יסוד: שירות חובה למען המדינה" text
- **Paragraph**: Individual section/subsection of the law
- **Comment**: User feedback on a specific paragraph
- **Suggested Edit**: Optional proposed change to paragraph text
- **Moderation**: Admin review and approval/rejection process
- **Status**: Current state (PENDING, APPROVED, REJECTED, SPAM)
- **Commenter**: Person who submitted a comment
- **Moderator**: Admin user who reviews comments
- **Badge**: UI element showing comment count
- **CTA**: Call-to-Action (the glowing button)

---

**Document Version**: 1.0.0
**Last Updated**: 2025-01-18
**Maintained By**: El Hadegel Development Team
