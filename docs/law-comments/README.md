# Law Document Commenting System - Documentation

Welcome to the documentation for the Law Document Commenting System feature of El Hadegel.

## Overview

This system allows visitors to view the proposed "חוק יסוד: שירות חובה למען המדינה" (Basic Law: Mandatory Service for the State) and submit comments on individual paragraphs. Administrators can then moderate these comments before they appear publicly.

## Quick Links

### For Users (Hebrew)
- **[מדריך למשתמש](./USER_GUIDE_HE.md)** - כיצד לצפות בהצעת החוק ולהגיב

### For Administrators (Hebrew)
- **[מדריך למנהלים](./ADMIN_GUIDE_HE.md)** - כיצד לנהל ולאשר תגובות

### For Developers (English)
- **[Overview & Architecture](./OVERVIEW.md)** - System architecture and design
- **[Developer Guide](./DEVELOPER_GUIDE.md)** - Development setup and workflows
- **[Database Schema](./DATABASE_SCHEMA.md)** - Database structure and migrations
- **[Component Documentation](./COMPONENTS.md)** - UI component reference
- **[API Reference](./API_REFERENCE.md)** - Server Actions and API
- **[Security Documentation](./SECURITY.md)** - Security implementation details
- **[Testing Guide](./TESTING.md)** - Testing strategy and execution
- **[Deployment Guide](./DEPLOYMENT.md)** - Production deployment steps
- **[Troubleshooting](./TROUBLESHOOTING.md)** - Common issues and solutions

### Additional Resources
- **[Feature Specification](./FEATURE_SPEC.md)** - Original requirements and user stories
- **[Changelog](./CHANGELOG.md)** - Version history and updates

## System Features

### Public Features
✅ **Beautiful Law Document Viewer** - Elegant, readable HTML presentation of the full law document
✅ **Paragraph-Level Commenting** - Comment on any specific paragraph
✅ **Contact Information Required** - Name, surname, email, phone number
✅ **Suggested Edits** - Optionally propose changes to paragraph text
✅ **View Approved Comments** - See what others have said
✅ **Glowing CTA Button** - Eye-catching call-to-action on landing page

### Admin Features
✅ **Moderation Dashboard** - Comprehensive interface for managing comments
✅ **Bulk Operations** - Approve, reject, or delete multiple comments at once
✅ **Statistics** - Real-time dashboard with pending/approved/rejected counts
✅ **Filtering & Search** - Find comments by status, paragraph, name, content
✅ **Comment Details** - View full context including visitor contact information
✅ **Spam Detection** - Automatic flagging of suspicious comments

### Security Features
✅ **13-Layer Security** - XSS prevention, spam detection, rate limiting, and more
✅ **Input Validation** - Comprehensive Zod schemas for all user input
✅ **Israeli Phone Validation** - Proper validation of Israeli phone formats
✅ **Duplicate Detection** - Prevents repeat submissions within 24 hours
✅ **Content Sanitization** - Removes dangerous HTML and scripts

## Technology Stack

- **Framework**: Next.js 16.0.4 (App Router with React Server Components)
- **React**: 19.2.0
- **Database**: PostgreSQL (Neon) with Prisma ORM 7.0.1
- **Authentication**: NextAuth.js v5
- **Styling**: Tailwind CSS v4
- **Validation**: Zod
- **Forms**: React Hook Form
- **Testing**: Playwright (E2E), Jest (Unit)

## Quick Start for Developers

```bash
# 1. Review the database schema
Read: docs/law-comments/DATABASE_SCHEMA.md

# 2. Run database migration
npx prisma migrate dev --name add_law_commenting_system

# 3. Seed the law document
npx tsx scripts/seed-law-document.ts

# 4. Start development server
pnpm dev

# 5. Navigate to the law document
http://localhost:3000/law-document

# 6. Access admin moderation
http://localhost:3000/admin/law-comments
```

## File Structure

```
docs/law-comments/
├── README.md                    # This file
├── OVERVIEW.md                  # Architecture overview
├── USER_GUIDE_HE.md            # Hebrew user guide
├── ADMIN_GUIDE_HE.md           # Hebrew admin guide
├── DEVELOPER_GUIDE.md          # Developer documentation
├── DATABASE_SCHEMA.md          # Database structure
├── API_REFERENCE.md            # Server Actions reference
├── COMPONENTS.md               # Component documentation
├── SECURITY.md                 # Security implementation
├── TESTING.md                  # Testing guide
├── DEPLOYMENT.md               # Deployment instructions
├── TROUBLESHOOTING.md          # Common issues
├── FEATURE_SPEC.md             # Requirements & specs
├── CHANGELOG.md                # Version history
└── source/
    ├── חוק יסוד השירות סופי-2.pdf  # Original PDF
    └── law-content.json         # Extracted content
```

## Key Concepts

### Comment Lifecycle

1. **Submission** - Visitor fills out form with contact details and comment
2. **Validation** - Server validates input, checks for spam/duplicates
3. **Pending** - Comment stored with status PENDING
4. **Moderation** - Admin reviews and approves/rejects
5. **Published** - Approved comments appear publicly on law document

### Status Types

- **PENDING** - Awaiting moderation (default)
- **APPROVED** - Visible to public
- **REJECTED** - Not visible, kept for admin review
- **SPAM** - Flagged as spam, potential IP blocking

### Comment Types

- **Regular Comment** - General feedback on paragraph
- **Suggested Edit** - Proposed changes to paragraph text (optional)

## Support & Contact

For questions or issues:
- **Technical Issues**: See [Troubleshooting Guide](./TROUBLESHOOTING.md)
- **Feature Requests**: Create issue in project repository
- **Security Concerns**: Contact project administrators directly

## Contributing

When contributing to this feature:
1. Read the [Developer Guide](./DEVELOPER_GUIDE.md)
2. Follow existing code patterns
3. Add tests for new functionality
4. Update relevant documentation
5. Submit pull request with clear description

## License

This feature is part of the El Hadegel project and follows the same license as the main project.

---

**Last Updated**: 2025-01-18
**Version**: 1.0.0
**Status**: ✅ Complete and Production-Ready
