# Feature: Multiple Questionnaire Publishing with Unique Shareable Links

## Executive Summary

**Current Limitation**: The questionnaire system only supports ONE active questionnaire at a time because all questionnaires share the same public URL (`/questionnaire`). The system uses a single `isActive` boolean flag, requiring deactivation of one questionnaire before activating another.

**Proposed Solution**: Enable multiple questionnaires to be published simultaneously, each with a unique shareable URL based on a slug identifier. The admin control panel will display shareable links for each questionnaire, allowing administrators to easily copy and distribute unique URLs.

**Business Value**:
- Run multiple campaigns/questionnaires in parallel
- Target different audiences with different questionnaires
- Maintain historical questionnaires accessible while launching new ones
- Improve campaign tracking with unique URLs
- Better user experience with descriptive, memorable URLs

---

## Current System Analysis

### Database Schema (Current)
```prisma
model Questionnaire {
  id          Int      @id @default(autoincrement())
  title       String
  description String?
  isActive    Boolean  @default(false)  // ⚠️ Only ONE can be true at a time
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  questions    Question[]
  responses    QuestionnaireResponse[]
}
```

### Current Routing
- **Public Route**: `/questionnaire` (static URL)
- **Fetch Logic**: `getActiveQuestionnaire()` - returns `findFirst({ where: { isActive: true } })`
- **Limitation**: Only ONE questionnaire can have `isActive=true` at any given time

### Current Admin Workflow
1. Admin creates questionnaire
2. Admin adds questions
3. Admin clicks "Activate" button
4. System deactivates ALL other questionnaires (transaction)
5. System activates selected questionnaire
6. Public URL `/questionnaire` now shows the newly activated questionnaire

### Current Admin Table Columns
| כותרת (Title) | סטטוס (Status) | שאלות (Questions) | תשובות (Responses) | נוצר בתאריך (Created) | פעולות (Actions) |
|--------------|--------------|------------------|-------------------|---------------------|------------------|
| שאלון 1      | 🟢 פעיל      | 5                | 23                | 01/12/2025          | Edit/Power/View  |
| שאלון 2      | 🔴 לא פעיל   | 8                | 0                 | 02/12/2025          | Edit/Power/View  |

**Missing**: No column for shareable link, no way to see unique URL per questionnaire

---

## Proposed Solution Architecture

### 1. Database Schema Changes

**Add Two New Fields to Questionnaire Model**:

```prisma
model Questionnaire {
  id           Int      @id @default(autoincrement())
  title        String
  description  String?
  slug         String   @unique  // 🆕 URL-friendly identifier (e.g., "army-recruitment-survey-2025")
  isActive     Boolean  @default(false)  // "Featured" questionnaire (optional)
  isPublished  Boolean  @default(false)  // 🆕 Publicly accessible (multiple can be true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  questions    Question[]
  responses    QuestionnaireResponse[]

  @@index([slug])         // 🆕 Fast slug lookup
  @@index([isPublished])  // 🆕 Filter published questionnaires
}
```

**Field Definitions**:
- **`slug`** (String, unique, required):
  - URL-friendly identifier derived from title
  - Example: "שאלון גיוס לצה״ל" → `"army-recruitment-survey-2025"`
  - Validation: lowercase, alphanumeric + hyphens only, 3-100 chars
  - Must be unique across all questionnaires
  - Can be auto-generated or manually edited by admin

- **`isPublished`** (Boolean, default: false):
  - Controls public accessibility
  - Multiple questionnaires can be `isPublished=true` simultaneously
  - Unpublished questionnaires return 404 on public routes

- **`isActive`** (Boolean, existing field, keep for backward compatibility):
  - Marks ONE questionnaire as "featured" (optional)
  - Used for default landing page or homepage widget
  - Not required for individual questionnaire access

**Migration Strategy**:
1. Add `slug` and `isPublished` columns (nullable initially)
2. Generate slugs for existing questionnaires: `questionnaire-{id}` as fallback
3. Set `isPublished = isActive` for existing records (maintain current behavior)
4. Make `slug` required (NOT NULL)
5. Add unique constraint on `slug`

---

### 2. URL Routing Strategy

**New Dynamic Route Structure**:

```
app/
├── questionnaire/
│   ├── page.tsx                    # ❌ DEPRECATE or redirect to featured
│   └── [slug]/
│       └── page.tsx                # 🆕 Dynamic questionnaire page by slug
└── q/
    └── [slug]/
        └── page.tsx                # 🆕 Shorter URL alias (optional)
```

**URL Examples**:
- Long form: `https://elhadegel.co.il/questionnaire/army-recruitment-2025`
- Short form: `https://elhadegel.co.il/q/army-recruitment-2025`
- Featured: `https://elhadegel.co.il/questionnaire` → Redirects to active questionnaire or shows list

**Routing Decision Tree**:
```
User visits /questionnaire/[slug]
  ↓
Does slug exist in database?
  ├─ No → 404 Page (friendly error: "שאלון לא נמצא")
  └─ Yes → Is questionnaire published? (isPublished=true)
      ├─ No → 404 Page (friendly error: "שאלון לא זמין כרגע")
      └─ Yes → Display questionnaire form ✅
```

**Featured Questionnaire Logic** (`/questionnaire` without slug):
```
Option A: Redirect to isActive=true questionnaire slug
Option B: Show list of all published questionnaires with links
Option C: Show featured questionnaire inline (backward compatible)
```

**Recommendation**: Option A (redirect) for simplest migration path

---

### 3. Slug Generation Algorithm

**Automatic Slug Generation** (on questionnaire creation):

```typescript
/**
 * Generate URL-friendly slug from Hebrew title
 * Example: "שאלון גיוס לצה״ל 2025" → "army-recruitment-idf-2025"
 */
function generateSlug(title: string, questionnaireId?: number): string {
  // Step 1: Transliterate Hebrew to English (using library or manual mapping)
  const transliterated = transliterateHebrew(title);

  // Step 2: Normalize to lowercase, remove special chars, replace spaces with hyphens
  const normalized = transliterated
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric except spaces/hyphens
    .replace(/\s+/g, '-')          // Replace spaces with hyphens
    .replace(/-+/g, '-')           // Remove duplicate hyphens
    .substring(0, 80);             // Limit length

  // Step 3: Add unique suffix to prevent collisions
  const suffix = questionnaireId ? `-${questionnaireId}` : `-${Date.now()}`;

  return normalized + suffix;
}

/**
 * Check if slug is unique, if not, append counter
 */
async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (await slugExists(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}
```

**Manual Slug Editing** (admin UI):
- Allow admin to edit slug field in questionnaire creation/edit dialog
- Validate format: `^[a-z0-9]+(?:-[a-z0-9]+)*$` (lowercase alphanumeric + hyphens)
- Check uniqueness on save
- Show preview of full URL: `https://elhadegel.co.il/q/{slug}`

**Hebrew Transliteration Map** (basic implementation):
```typescript
const hebrewToEnglish: Record<string, string> = {
  'א': 'a', 'ב': 'b', 'ג': 'g', 'ד': 'd', 'ה': 'h', 'ו': 'v',
  'ז': 'z', 'ח': 'ch', 'ט': 't', 'י': 'y', 'כ': 'k', 'ך': 'k',
  'ל': 'l', 'ם': 'm', 'מ': 'm', 'ן': 'n', 'נ': 'n', 'ס': 's',
  'ע': 'a', 'פ': 'p', 'ף': 'f', 'צ': 'tz', 'ץ': 'tz', 'ק': 'k',
  'ר': 'r', 'ש': 'sh', 'ת': 't',
  // Common Hebrew words
  'גיוס': 'recruitment', 'צה״ל': 'idf', 'שאלון': 'survey',
  'חוק': 'law', 'חרדים': 'haredim',
};
```

---

### 4. Server Actions Updates

**New Server Actions**:

```typescript
/**
 * Get questionnaire by slug (public access)
 * Returns null if not found or not published
 */
export async function getQuestionnaireBySlug(slug: string) {
  const questionnaire = await prismaQuestionnaire.questionnaire.findUnique({
    where: { slug },
    include: {
      questions: {
        select: { /* ... */ },
        orderBy: { orderIndex: 'asc' },
      },
      _count: { select: { responses: true } },
    },
  });

  // Security: Only return if published
  if (!questionnaire || !questionnaire.isPublished) {
    return null;
  }

  return questionnaire;
}

/**
 * Publish questionnaire (make publicly accessible)
 * Does NOT affect other questionnaires
 */
export async function publishQuestionnaire(id: number) {
  // Verify has questions
  const questionnaire = await prismaQuestionnaire.questionnaire.findUnique({
    where: { id },
    include: { _count: { select: { questions: true } } },
  });

  if (!questionnaire) throw new Error('שאלון לא נמצא');
  if (questionnaire._count.questions === 0) {
    throw new Error('לא ניתן לפרסם שאלון ללא שאלות');
  }

  // Publish
  await prismaQuestionnaire.questionnaire.update({
    where: { id },
    data: { isPublished: true },
  });

  revalidatePath('/admin/questionnaires');
  revalidatePath(`/questionnaire/${questionnaire.slug}`);
}

/**
 * Unpublish questionnaire (make inaccessible)
 */
export async function unpublishQuestionnaire(id: number) {
  const questionnaire = await prismaQuestionnaire.questionnaire.findUnique({
    where: { id },
    select: { slug: true },
  });

  if (!questionnaire) throw new Error('שאלון לא נמצא');

  await prismaQuestionnaire.questionnaire.update({
    where: { id },
    data: { isPublished: false },
  });

  revalidatePath('/admin/questionnaires');
  revalidatePath(`/questionnaire/${questionnaire.slug}`);
}

/**
 * Update questionnaire slug (admin only)
 * Validates uniqueness and format
 */
export async function updateQuestionnaireSlug(id: number, newSlug: string) {
  // Validate format
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!slugRegex.test(newSlug)) {
    throw new Error('Slug must be lowercase alphanumeric with hyphens');
  }

  // Check uniqueness
  const existing = await prismaQuestionnaire.questionnaire.findFirst({
    where: { slug: newSlug, NOT: { id } },
  });

  if (existing) {
    throw new Error('Slug already exists');
  }

  const questionnaire = await prismaQuestionnaire.questionnaire.update({
    where: { id },
    data: { slug: newSlug },
  });

  revalidatePath('/admin/questionnaires');
  revalidatePath(`/questionnaire/${newSlug}`);

  return questionnaire;
}

/**
 * Get all published questionnaires (public)
 */
export async function getPublishedQuestionnaires() {
  return await prismaQuestionnaire.questionnaire.findMany({
    where: { isPublished: true },
    select: {
      id: true,
      title: true,
      description: true,
      slug: true,
      _count: { select: { questions: true, responses: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}
```

**Modified Server Actions**:

```typescript
/**
 * Create questionnaire - NOW generates slug automatically
 */
export async function createQuestionnaire(data: QuestionnaireInput) {
  const validated = questionnaireSchema.parse(data);

  // Generate unique slug from title
  const baseSlug = generateSlug(validated.title);
  const uniqueSlug = await ensureUniqueSlug(baseSlug);

  const questionnaire = await prismaQuestionnaire.questionnaire.create({
    data: {
      title: validated.title,
      description: validated.description || null,
      slug: uniqueSlug,           // 🆕 Auto-generated
      isActive: false,            // Keep existing behavior
      isPublished: false,         // 🆕 Unpublished by default
    },
  });

  revalidatePath('/admin/questionnaires');
  return questionnaire;
}
```

---

### 5. Admin UI Updates

#### A. Enhanced Questionnaire Table

**New Table Structure**:

| כותרת | קישור לשאלון | סטטוס | מפורסם | שאלות | תשובות | נוצר | פעולות |
|------|------------|-------|--------|------|--------|------|--------|
| שאלון גיוס 2025 | 🔗 `q/army-2025` [📋] | 🟢 פעיל | ✅ מפורסם | 5 | 23 | 01/12 | ... |
| סקר דעת קהל | 🔗 `q/public-opinion` [📋] | ⚪ לא פעיל | ✅ מפורסם | 8 | 45 | 28/11 | ... |
| טיוטה | 🔗 `q/draft-123` [📋] | ⚪ לא פעיל | ❌ לא מפורסם | 3 | 0 | 02/12 | ... |

**New Column: "קישור לשאלון" (Questionnaire Link)**:
```tsx
<TableCell className="text-center">
  <div className="flex items-center justify-center gap-2">
    {/* Clickable short link */}
    <a
      href={`/questionnaire/${questionnaire.slug}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
    >
      <Link2 className="h-3 w-3" />
      <code className="text-xs">{questionnaire.slug}</code>
    </a>

    {/* Copy to clipboard button */}
    <Button
      size="sm"
      variant="ghost"
      onClick={() => {
        const fullUrl = `${window.location.origin}/q/${questionnaire.slug}`;
        navigator.clipboard.writeText(fullUrl);
        toast.success('הקישור הועתק ללוח');
      }}
      title="העתק קישור"
    >
      <Clipboard className="h-4 w-4" />
    </Button>
  </div>
</TableCell>
```

**New Column: "מפורסם" (Published Status)**:
```tsx
<TableCell className="text-center">
  <Badge className={questionnaire.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
    {questionnaire.isPublished ? '✅ מפורסם' : '❌ לא מפורסם'}
  </Badge>
</TableCell>
```

**Updated Actions Column**:
```tsx
<div className="flex items-center justify-center gap-1">
  {/* Edit */}
  <Button size="sm" variant="ghost" onClick={() => setEditingQuestionnaire(questionnaire)}>
    <Edit className="h-4 w-4" />
  </Button>

  {/* Publish/Unpublish (NEW) */}
  {questionnaire.isPublished ? (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => handleUnpublish(questionnaire.id)}
      title="ביטול פרסום"
    >
      <EyeOff className="h-4 w-4 text-orange-600" />
    </Button>
  ) : (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => handlePublish(questionnaire.id)}
      title="פרסום"
    >
      <Eye className="h-4 w-4 text-green-600" />
    </Button>
  )}

  {/* Activate/Deactivate (Feature as "Featured") */}
  {questionnaire.isActive ? (
    <Button size="sm" variant="ghost" onClick={() => handleDeactivate(questionnaire.id)} title="ביטול סימון כמומלץ">
      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
    </Button>
  ) : (
    <Button size="sm" variant="ghost" onClick={() => handleActivate(questionnaire.id)} title="סימון כמומלץ">
      <Star className="h-4 w-4 text-gray-400" />
    </Button>
  )}

  {/* View Questions */}
  <Button size="sm" variant="ghost" asChild>
    <Link href={`/admin/questionnaires/${questionnaire.id}/questions`}>
      <FileQuestion className="h-4 w-4 text-blue-600" />
    </Link>
  </Button>

  {/* View Submissions */}
  <Button size="sm" variant="ghost" asChild>
    <Link href={`/admin/questionnaires/${questionnaire.id}/submissions`}>
      <Users className="h-4 w-4 text-purple-600" />
    </Link>
  </Button>

  {/* Delete */}
  <Button size="sm" variant="ghost" onClick={() => setDeletingId(questionnaire.id)}>
    <Trash2 className="h-4 w-4 text-red-600" />
  </Button>
</div>
```

#### B. Questionnaire Creation/Edit Dialog

**Add Slug Field**:

```tsx
<DialogContent className="max-w-2xl">
  <DialogHeader>
    <DialogTitle>{questionnaire ? 'עריכת שאלון' : 'יצירת שאלון חדש'}</DialogTitle>
  </DialogHeader>

  <form onSubmit={handleSubmit} className="space-y-4">
    {/* Title Field (existing) */}
    <div>
      <Label>כותרת השאלון</Label>
      <Input
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          // Auto-generate slug as user types (only for new questionnaires)
          if (!questionnaire) {
            setSlug(generateSlug(e.target.value));
          }
        }}
        required
      />
    </div>

    {/* Description Field (existing) */}
    <div>
      <Label>תיאור</Label>
      <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
    </div>

    {/* NEW: Slug Field */}
    <div>
      <Label>כתובת URL (Slug)</Label>
      <div className="flex gap-2">
        <Input
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
          placeholder="army-recruitment-2025"
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          required
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => setSlug(generateSlug(title))}
          title="יצירת Slug אוטומטית"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        הקישור הציבורי: <code className="bg-gray-100 px-1 rounded">elhadegel.co.il/q/{slug || 'your-slug'}</code>
      </p>
    </div>

    {/* Submit Button */}
    <Button type="submit" disabled={submitting}>
      {submitting ? 'שומר...' : (questionnaire ? 'עדכן שאלון' : 'צור שאלון')}
    </Button>
  </form>
</DialogContent>
```

#### C. Quick Publish Workflow

**Streamlined Publishing Flow**:
1. Admin creates questionnaire → Auto-generates slug → Saves as unpublished
2. Admin adds questions → Works on draft
3. Admin clicks "Publish" button in table → Questionnaire becomes publicly accessible
4. Admin copies shareable link and distributes

**Publishing Confirmation Dialog**:
```tsx
<AlertDialog open={publishingId !== null} onOpenChange={(open) => !open && setPublishingId(null)}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>פרסום שאלון</AlertDialogTitle>
      <AlertDialogDescription>
        השאלון יהיה זמין לציבור בכתובת:
        <br />
        <code className="bg-gray-100 px-2 py-1 rounded mt-2 block text-blue-600">
          {window.location.origin}/q/{questionnaire.slug}
        </code>
        <br />
        האם להמשיך?
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>ביטול</AlertDialogCancel>
      <AlertDialogAction onClick={handlePublishConfirm} className="bg-green-600 hover:bg-green-700">
        פרסם שאלון
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

### 6. Public-Facing Pages

#### A. Dynamic Questionnaire Page

**File**: `app/questionnaire/[slug]/page.tsx` (NEW)

```tsx
import { getQuestionnaireBySlug } from '@/app/actions/questionnaire-actions';
import { QuestionnaireForm } from '@/components/questionnaire/QuestionnaireForm';
import { QuestionnaireHeader } from '@/components/questionnaire/QuestionnaireHeader';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const questionnaire = await getQuestionnaireBySlug(params.slug);

  if (!questionnaire) {
    return { title: 'שאלון לא נמצא | EL HADEGEL' };
  }

  return {
    title: `${questionnaire.title} | EL HADEGEL`,
    description: questionnaire.description || 'מלא את השאלון והשמע את קולך',
  };
}

export default async function QuestionnairePage({ params }: { params: { slug: string } }) {
  const questionnaire = await getQuestionnaireBySlug(params.slug);

  // Return 404 if not found or not published
  if (!questionnaire) {
    notFound();
  }

  return (
    <div className="questionnaire-container min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <QuestionnaireHeader
        title={questionnaire.title}
        description={questionnaire.description}
      />
      <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12">
        <QuestionnaireForm questionnaire={questionnaire} />
      </div>
    </div>
  );
}
```

#### B. 404 Not Found Page

**File**: `app/questionnaire/[slug]/not-found.tsx` (NEW)

```tsx
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function QuestionnaireNotFound() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <Alert variant="destructive" className="border-red-200 bg-red-50">
        <AlertCircle className="h-5 w-5 text-red-600" />
        <AlertTitle className="text-right text-red-900">
          שאלון לא נמצא
        </AlertTitle>
        <AlertDescription className="text-right text-red-800">
          השאלון שביקשת אינו קיים או אינו זמין יותר.
          <br />
          ייתכן שהקישור שגוי או שהשאלון הוסר.
        </AlertDescription>
      </Alert>

      <div className="mt-6 text-center">
        <Button asChild>
          <Link href="/">חזרה לדף הבית</Link>
        </Button>
      </div>
    </div>
  );
}
```

#### C. Legacy Route Handler (Optional)

**File**: `app/questionnaire/page.tsx` (MODIFY)

**Option 1: Redirect to Featured Questionnaire**
```tsx
import { redirect } from 'next/navigation';
import { prismaQuestionnaire } from '@/lib/prisma-questionnaire';

export default async function QuestionnaireIndexPage() {
  // Find active (featured) questionnaire
  const featured = await prismaQuestionnaire.questionnaire.findFirst({
    where: { isActive: true, isPublished: true },
    select: { slug: true },
  });

  if (featured) {
    redirect(`/questionnaire/${featured.slug}`);
  }

  // If no featured, redirect to list or homepage
  redirect('/');
}
```

**Option 2: Show List of Published Questionnaires**
```tsx
import { getPublishedQuestionnaires } from '@/app/actions/questionnaire-actions';
import Link from 'next/link';

export default async function QuestionnaireIndexPage() {
  const questionnaires = await getPublishedQuestionnaires();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold text-right mb-8">שאלונים זמינים</h1>

      <div className="grid gap-4">
        {questionnaires.map((q) => (
          <Link
            key={q.id}
            href={`/questionnaire/${q.slug}`}
            className="block p-6 border rounded-lg hover:shadow-lg transition-shadow bg-white"
          >
            <h2 className="text-xl font-semibold text-right">{q.title}</h2>
            {q.description && (
              <p className="text-gray-600 text-right mt-2">{q.description}</p>
            )}
            <div className="flex justify-end gap-4 mt-4 text-sm text-gray-500">
              <span>{q._count.questions} שאלות</span>
              <span>{q._count.responses} תשובות</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

---

### 7. Migration Strategy

**Step 1: Database Migration**
```bash
# Create migration file
npx prisma migrate dev --name add_slug_and_is_published

# Migration SQL (auto-generated by Prisma)
ALTER TABLE "Questionnaire" ADD COLUMN "slug" TEXT;
ALTER TABLE "Questionnaire" ADD COLUMN "isPublished" BOOLEAN DEFAULT false;

# Backfill existing questionnaires with slugs
UPDATE "Questionnaire" SET "slug" = 'questionnaire-' || "id" WHERE "slug" IS NULL;
UPDATE "Questionnaire" SET "isPublished" = "isActive" WHERE "isPublished" IS NULL;

# Add constraints
ALTER TABLE "Questionnaire" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Questionnaire_slug_key" ON "Questionnaire"("slug");
CREATE INDEX "Questionnaire_slug_idx" ON "Questionnaire"("slug");
CREATE INDEX "Questionnaire_isPublished_idx" ON "Questionnaire"("isPublished");
```

**Step 2: Code Deployment**
1. Deploy server action updates (getQuestionnaireBySlug, publish/unpublish)
2. Deploy dynamic route `/questionnaire/[slug]/page.tsx`
3. Update admin UI (table columns, dialogs)
4. Update existing questionnaire logic to handle both old and new systems

**Step 3: Data Migration Script**
```typescript
// scripts/migrate-questionnaires-to-slugs.ts
import { prismaQuestionnaire } from '@/lib/prisma-questionnaire';

async function migrateQuestionnaireSlugs() {
  const questionnaires = await prismaQuestionnaire.questionnaire.findMany();

  for (const q of questionnaires) {
    // Generate slug from title
    const slug = generateSlug(q.title, q.id);

    // Ensure uniqueness
    const uniqueSlug = await ensureUniqueSlug(slug);

    // Update questionnaire
    await prismaQuestionnaire.questionnaire.update({
      where: { id: q.id },
      data: {
        slug: uniqueSlug,
        isPublished: q.isActive, // Maintain current behavior
      },
    });

    console.log(`Migrated: ${q.title} → ${uniqueSlug}`);
  }

  console.log(`✅ Migrated ${questionnaires.length} questionnaires`);
}

migrateQuestionnaireSlugs();
```

**Step 4: Testing Phase**
1. Test slug generation with Hebrew titles
2. Test dynamic routing with various slugs
3. Test publish/unpublish functionality
4. Test copy-to-clipboard feature
5. Test 404 handling for invalid slugs
6. Test backward compatibility with isActive flag

**Step 5: User Communication**
- Update documentation with new shareable link feature
- Notify admins about new publish workflow
- Update training materials with new table columns

---

## Implementation To-Do List

### Phase 1: Database & Backend (uri-testing + adi-fullstack)

- [ ] **1.1 Database Schema Migration** (Priority: Critical, Owner: gal-database)
  - [ ] Add `slug` field (String, unique, nullable initially)
  - [ ] Add `isPublished` field (Boolean, default: false)
  - [ ] Create Prisma migration file
  - [ ] Run migration on development database
  - [ ] Test migration rollback procedure

- [ ] **1.2 Slug Generation Utilities** (Priority: High, Owner: adi-fullstack)
  - [ ] Create `lib/slug-utils.ts` file
  - [ ] Implement `generateSlug(title: string)` function with Hebrew transliteration
  - [ ] Implement `ensureUniqueSlug(baseSlug: string)` function
  - [ ] Add slug validation regex and helper functions
  - [ ] Write unit tests for slug generation (15+ test cases)

- [ ] **1.3 Server Actions - New Functions** (Priority: High, Owner: adi-fullstack)
  - [ ] Create `getQuestionnaireBySlug(slug: string)` action
    - Include published check
    - Include questions and response count
    - Return null if not found/published
  - [ ] Create `publishQuestionnaire(id: number)` action
    - Validate has questions
    - Set isPublished = true
    - Revalidate paths
  - [ ] Create `unpublishQuestionnaire(id: number)` action
    - Set isPublished = false
    - Revalidate paths
  - [ ] Create `updateQuestionnaireSlug(id: number, newSlug: string)` action
    - Validate slug format
    - Check uniqueness
    - Update database
  - [ ] Create `getPublishedQuestionnaires()` action
    - Filter by isPublished = true
    - Include counts
    - Order by createdAt desc

- [ ] **1.4 Server Actions - Modified Functions** (Priority: High, Owner: adi-fullstack)
  - [ ] Update `createQuestionnaire()` to auto-generate slug
  - [ ] Add slug field to response types
  - [ ] Update Zod validation schemas to include slug
  - [ ] Add isPublished to questionnaire type definitions

- [ ] **1.5 Data Migration Script** (Priority: Medium, Owner: adi-fullstack)
  - [ ] Create `scripts/migrate-questionnaires-to-slugs.ts`
  - [ ] Implement backfill logic for existing questionnaires
  - [ ] Generate slugs from titles (fallback: `questionnaire-{id}`)
  - [ ] Set `isPublished = isActive` for existing records
  - [ ] Add dry-run mode for testing
  - [ ] Add logging and error handling

- [ ] **1.6 Testing - Backend** (Priority: High, Owner: uri-testing)
  - [ ] Unit tests for slug generation (15 tests)
    - Hebrew transliteration
    - Special character handling
    - Uniqueness enforcement
    - Edge cases (empty, very long, special chars)
  - [ ] Unit tests for new server actions (25 tests)
    - getQuestionnaireBySlug (published/unpublished/not found)
    - publish/unpublish (success, validation errors)
    - updateQuestionnaireSlug (uniqueness, format validation)
  - [ ] Integration tests for migration script (5 tests)
  - [ ] Target: 90%+ code coverage for new backend code

### Phase 2: Routing & Public Pages (nextjs-architect)

- [ ] **2.1 Dynamic Route Creation** (Priority: Critical, Owner: nextjs-architect)
  - [ ] Create `app/questionnaire/[slug]/page.tsx` file
  - [ ] Implement server component with getQuestionnaireBySlug call
  - [ ] Add generateMetadata function for SEO
  - [ ] Handle not-found case with notFound() call
  - [ ] Add proper TypeScript types for params

- [ ] **2.2 Short URL Alias (Optional)** (Priority: Low, Owner: nextjs-architect)
  - [ ] Create `app/q/[slug]/page.tsx` file
  - [ ] Implement same logic as long-form route
  - [ ] Add redirect from /q/[slug] to /questionnaire/[slug] if preferred

- [ ] **2.3 Custom 404 Page** (Priority: Medium, Owner: nextjs-architect + tal-design)
  - [ ] Create `app/questionnaire/[slug]/not-found.tsx`
  - [ ] Design friendly Hebrew error message
  - [ ] Add "חזרה לדף הבית" button
  - [ ] Add styling consistent with brand

- [ ] **2.4 Legacy Route Handler** (Priority: Medium, Owner: nextjs-architect)
  - [ ] Modify `app/questionnaire/page.tsx`
  - [ ] Implement redirect logic to featured questionnaire
  - [ ] Add fallback for no featured questionnaire
  - [ ] Document behavior change

- [ ] **2.5 Testing - Routing** (Priority: High, Owner: uri-testing)
  - [ ] E2E tests for dynamic routing (10 tests)
    - Valid slug loads questionnaire
    - Invalid slug shows 404
    - Unpublished questionnaire shows 404
    - Hebrew in URL handled correctly
  - [ ] E2E tests for legacy route redirect (3 tests)
  - [ ] E2E tests for 404 page (2 tests)

### Phase 3: Admin UI Updates (tal-design + frontend-engineer)

- [ ] **3.1 Questionnaire Table Updates** (Priority: High, Owner: tal-design)
  - [ ] Add "קישור לשאלון" (Link) column
    - Display shortened slug in table
    - Add clickable link that opens in new tab
    - Add copy-to-clipboard button with icon
    - Show toast notification on copy
  - [ ] Add "מפורסם" (Published) column
    - Badge component (green for published, gray for unpublished)
    - Hebrew labels
  - [ ] Update "פעולות" (Actions) column
    - Replace Power/PowerOff with Eye/EyeOff icons (publish/unpublish)
    - Change Star icon meaning to "Featured" (isActive)
    - Update tooltips in Hebrew
    - Add loading states for async actions
  - [ ] Responsive design for mobile (stack columns)

- [ ] **3.2 Create/Edit Dialog Updates** (Priority: High, Owner: tal-design)
  - [ ] Add "Slug" input field
    - Label in Hebrew with explanation
    - Auto-generate slug as user types title (new questionnaires only)
    - Manual editing with format validation
    - Refresh button to regenerate slug
    - Preview of full URL below input
    - Validation error messages in Hebrew
  - [ ] Update form submission to include slug
  - [ ] Update validation to check slug format
  - [ ] Add character counter for slug (max 100)

- [ ] **3.3 Publish Confirmation Dialog** (Priority: Medium, Owner: tal-design)
  - [ ] Create new AlertDialog component
  - [ ] Show full shareable URL in dialog
  - [ ] Confirm button with green styling
  - [ ] Cancel button
  - [ ] Add copy-to-clipboard functionality in dialog

- [ ] **3.4 Copy-to-Clipboard Functionality** (Priority: Medium, Owner: frontend-engineer)
  - [ ] Implement clipboard API with fallback
  - [ ] Show toast notification on success
  - [ ] Handle errors gracefully
  - [ ] Add visual feedback (icon change on copy)

- [ ] **3.5 Action Handlers** (Priority: High, Owner: frontend-engineer)
  - [ ] Implement `handlePublish(id)` function
    - Call `publishQuestionnaire()` server action
    - Show loading state
    - Update local state on success
    - Show toast notification
  - [ ] Implement `handleUnpublish(id)` function
    - Call `unpublishQuestionnaire()` server action
    - Show confirmation dialog
    - Update local state on success
  - [ ] Implement `handleCopyLink(slug)` function
    - Copy full URL to clipboard
    - Show toast notification
  - [ ] Update existing handlers for new state management

- [ ] **3.6 Testing - Admin UI** (Priority: High, Owner: uri-testing)
  - [ ] E2E tests for table updates (8 tests)
    - Link column displays correctly
    - Copy button works
    - Published badge shows correct status
    - Actions column buttons trigger correct functions
  - [ ] E2E tests for create/edit dialog (10 tests)
    - Slug auto-generates from title
    - Manual slug editing works
    - Validation prevents invalid slugs
    - Refresh button regenerates slug
    - URL preview updates correctly
  - [ ] E2E tests for publish workflow (5 tests)
    - Publish button makes questionnaire public
    - Unpublish button removes public access
    - Confirmation dialogs work
    - Toast notifications appear

### Phase 4: Integration & Testing (uri-testing + maya-code-review)

- [ ] **4.1 End-to-End Integration Tests** (Priority: Critical, Owner: uri-testing)
  - [ ] Complete workflow test: Create → Add Questions → Publish → Access Public URL
  - [ ] Multi-questionnaire test: Publish multiple, verify all accessible
  - [ ] Unpublish test: Unpublish questionnaire, verify 404 on public route
  - [ ] Featured questionnaire test: Set isActive, verify redirect from /questionnaire
  - [ ] Slug collision test: Create questionnaires with similar names
  - [ ] Hebrew character test: Create questionnaire with Hebrew title, verify slug generation
  - [ ] Mobile responsiveness test: Verify table columns on mobile devices
  - [ ] Performance test: Load admin table with 100+ questionnaires

- [ ] **4.2 Security & Access Control Tests** (Priority: High, Owner: uri-testing)
  - [ ] Verify unpublished questionnaires return 404 (not 403)
  - [ ] Test direct URL access to [slug] routes
  - [ ] Verify admin-only actions require authentication
  - [ ] Test CSRF protection on publish/unpublish actions
  - [ ] Verify no sensitive data exposed in public routes

- [ ] **4.3 Code Review** (Priority: High, Owner: maya-code-review)
  - [ ] Review database migration safety
  - [ ] Review slug generation logic for edge cases
  - [ ] Review server actions for proper validation
  - [ ] Review admin UI for accessibility (ARIA labels, keyboard nav)
  - [ ] Review error handling and user feedback
  - [ ] Check for TypeScript type safety
  - [ ] Verify all Hebrew text uses proper RTL layout

- [ ] **4.4 Performance Testing** (Priority: Medium, Owner: uri-testing)
  - [ ] Benchmark slug generation (target: <10ms)
  - [ ] Benchmark getQuestionnaireBySlug (target: <100ms)
  - [ ] Test admin table load with 1000+ questionnaires
  - [ ] Test concurrent publish operations
  - [ ] Verify database index usage (EXPLAIN queries)

### Phase 5: Documentation & Deployment (yael-technical-docs + rotem-strategy)

- [ ] **5.1 Technical Documentation** (Priority: Medium, Owner: yael-technical-docs)
  - [ ] Update `CLAUDE.md` with new multi-questionnaire system
  - [ ] Document slug generation algorithm
  - [ ] Document new server actions with examples
  - [ ] Document admin UI changes with screenshots
  - [ ] Create migration guide for existing users
  - [ ] Update API documentation (if applicable)

- [ ] **5.2 User Guides** (Priority: Medium, Owner: yael-technical-docs)
  - [ ] Create "How to Publish a Questionnaire" guide
  - [ ] Create "How to Share Questionnaire Links" guide
  - [ ] Create "How to Manage Multiple Questionnaires" guide
  - [ ] Add screenshots for each step
  - [ ] Translate all guides to Hebrew

- [ ] **5.3 Deployment Planning** (Priority: High, Owner: rotem-strategy)
  - [ ] Create rollback plan for migration
  - [ ] Plan phased deployment strategy
    - Phase A: Deploy database migration
    - Phase B: Deploy backend changes
    - Phase C: Deploy frontend changes
    - Phase D: Run data migration script
  - [ ] Document environment variable requirements (none new)
  - [ ] Plan zero-downtime deployment approach
  - [ ] Create deployment checklist

- [ ] **5.4 Monitoring & Rollback** (Priority: High, Owner: rotem-strategy)
  - [ ] Set up monitoring for new routes
  - [ ] Monitor 404 rates on questionnaire routes
  - [ ] Monitor publish/unpublish action success rates
  - [ ] Monitor slug generation performance
  - [ ] Document rollback procedure (database + code)
  - [ ] Test rollback procedure in staging

- [ ] **5.5 Communication Plan** (Priority: Low, Owner: rotem-strategy)
  - [ ] Notify admins of new feature before deployment
  - [ ] Create announcement for users (if applicable)
  - [ ] Update help documentation
  - [ ] Plan training session for admin users
  - [ ] Prepare FAQ for common questions

---

## Execution Plan by Sub-Agent

### 1. gal-database (Database Architect)
**Scope**: Database schema design and migration strategy

**Tasks**:
- [ ] Design optimal database schema for slug and isPublished fields
- [ ] Create Prisma migration file with indexes
- [ ] Review migration for performance implications
- [ ] Design rollback strategy for database changes
- [ ] Verify indexing strategy for fast slug lookups
- [ ] Recommend any additional database optimizations

**Deliverables**:
- Prisma migration file: `prisma/migrations/YYYYMMDDHHMMSS_add_slug_and_is_published/migration.sql`
- Database optimization recommendations document
- Rollback procedure document

**Dependencies**: None (first to execute)

**Estimated Effort**: 4-6 hours

---

### 2. adi-fullstack (Fullstack Engineer)
**Scope**: Backend implementation (server actions, utilities, migration script)

**Tasks**:
- [ ] Implement slug generation utilities with Hebrew transliteration
- [ ] Create new server actions (getBySlug, publish, unpublish, updateSlug)
- [ ] Modify existing server actions (createQuestionnaire)
- [ ] Implement data migration script with dry-run mode
- [ ] Add Zod validation schemas for slug field
- [ ] Update TypeScript types to include new fields

**Deliverables**:
- `lib/slug-utils.ts` (slug generation utilities)
- `app/actions/questionnaire-actions.ts` (updated with 5 new actions)
- `scripts/migrate-questionnaires-to-slugs.ts` (migration script)
- Updated Zod schemas in `lib/validation/questionnaire-validation.ts`

**Dependencies**:
- gal-database (database migration must be completed first)

**Estimated Effort**: 12-16 hours

---

### 3. nextjs-architect (Next.js Specialist)
**Scope**: Routing architecture and public-facing pages

**Tasks**:
- [ ] Create dynamic route structure `/questionnaire/[slug]/page.tsx`
- [ ] Implement server component with proper data fetching
- [ ] Add generateMetadata for SEO
- [ ] Create custom 404 page
- [ ] Modify legacy `/questionnaire/page.tsx` for redirect logic
- [ ] Ensure proper TypeScript types for route params
- [ ] Optimize page loading performance (React Server Components)

**Deliverables**:
- `app/questionnaire/[slug]/page.tsx` (dynamic route)
- `app/questionnaire/[slug]/not-found.tsx` (404 page)
- Updated `app/questionnaire/page.tsx` (redirect logic)
- `app/q/[slug]/page.tsx` (optional short URL alias)

**Dependencies**:
- adi-fullstack (server actions must exist before routing implementation)

**Estimated Effort**: 6-8 hours

---

### 4. tal-design (Frontend Design Engineer)
**Scope**: Admin UI design and implementation

**Tasks**:
- [ ] Design new table columns (Link, Published status)
- [ ] Design create/edit dialog with slug field
- [ ] Design publish confirmation dialog
- [ ] Implement responsive table layout
- [ ] Update badge components for new statuses
- [ ] Design copy-to-clipboard visual feedback
- [ ] Ensure accessibility (ARIA labels, keyboard navigation)
- [ ] Maintain RTL layout for Hebrew text

**Deliverables**:
- Updated `components/admin/questionnaires/QuestionnaireTable.tsx`
- Updated `components/admin/questionnaires/QuestionnaireDialog.tsx`
- New `components/admin/questionnaires/PublishConfirmDialog.tsx` (optional)
- CSS updates for new components
- Figma mockups (optional, for review)

**Dependencies**:
- adi-fullstack (server actions needed for form submission)

**Estimated Effort**: 10-14 hours

---

### 5. frontend-engineer (Frontend Engineer)
**Scope**: Interactive functionality and state management

**Tasks**:
- [ ] Implement action handlers (publish, unpublish, copy link)
- [ ] Implement clipboard API with fallback
- [ ] Add loading states for async operations
- [ ] Implement toast notifications
- [ ] Update local state management in table
- [ ] Handle form validation in client component
- [ ] Add auto-slug-generation on title change
- [ ] Implement dialog state management

**Deliverables**:
- Action handler functions in `QuestionnaireTable.tsx`
- Clipboard utility in `lib/clipboard-utils.ts` (optional)
- Updated form logic in `QuestionnaireDialog.tsx`
- Client-side validation for slug format

**Dependencies**:
- tal-design (UI components must exist before adding interactivity)
- adi-fullstack (server actions to call)

**Estimated Effort**: 8-10 hours

---

### 6. uri-testing (Testing Engineer)
**Scope**: Comprehensive testing across all layers

**Tasks**:
- [ ] Write unit tests for slug generation (15 tests)
- [ ] Write unit tests for server actions (25 tests)
- [ ] Write E2E tests for dynamic routing (10 tests)
- [ ] Write E2E tests for admin UI (23 tests)
- [ ] Write integration tests for complete workflows (8 tests)
- [ ] Write security tests (5 tests)
- [ ] Write performance tests (5 tests)
- [ ] Generate code coverage report (target: 90%+)
- [ ] Document test results and any issues found

**Deliverables**:
- `__tests__/lib/slug-utils.test.ts` (unit tests)
- `__tests__/app/actions/questionnaire-actions.test.ts` (unit tests)
- `tests/questionnaire-routing.spec.ts` (E2E tests)
- `tests/admin-questionnaire-publish.spec.ts` (E2E tests)
- Test coverage report (HTML format)
- Test results summary document

**Dependencies**:
- All other agents (testing is last phase)

**Estimated Effort**: 16-20 hours

---

### 7. maya-code-review (Code Quality Specialist)
**Scope**: Code review, security, and quality assurance

**Tasks**:
- [ ] Review database migration for safety and rollback
- [ ] Review slug generation for edge cases and security
- [ ] Review server actions for proper validation
- [ ] Review admin UI for accessibility compliance
- [ ] Review TypeScript type safety
- [ ] Review error handling and user feedback
- [ ] Review performance implications
- [ ] Check for code duplication and refactoring opportunities
- [ ] Verify all Hebrew text uses proper RTL layout
- [ ] Review test coverage adequacy

**Deliverables**:
- Code review report with findings and recommendations
- Security audit checklist
- Accessibility compliance checklist (WCAG 2.1 AA)
- List of required fixes before deployment
- List of recommended improvements (nice-to-have)

**Dependencies**:
- All implementation agents (review after code is written)
- uri-testing (review after tests are written)

**Estimated Effort**: 8-12 hours

---

### 8. yael-technical-docs (Technical Documentation Specialist)
**Scope**: Documentation and user guides

**Tasks**:
- [ ] Update `CLAUDE.md` with new multi-questionnaire system
- [ ] Document slug generation algorithm with examples
- [ ] Document new server actions with code examples
- [ ] Create admin user guide with screenshots
- [ ] Create migration guide for existing users
- [ ] Update API documentation (if applicable)
- [ ] Translate all guides to Hebrew
- [ ] Create FAQ document

**Deliverables**:
- Updated `CLAUDE.md` (Questionnaire System section)
- `docs/guides/multi-questionnaire-publishing.md` (admin guide)
- `docs/guides/questionnaire-migration.md` (migration guide)
- `docs/api/questionnaire-api.md` (API documentation)
- `docs/faq/questionnaire-publishing-faq.md` (FAQ)
- Hebrew translations of all guides

**Dependencies**:
- All implementation agents (document after features are complete)

**Estimated Effort**: 10-14 hours

---

### 9. rotem-strategy (Strategic Project Orchestrator)
**Scope**: Project coordination, deployment planning, and risk management

**Tasks**:
- [ ] Create detailed project timeline with milestones
- [ ] Coordinate dependencies between agents
- [ ] Monitor progress and identify blockers
- [ ] Plan phased deployment strategy
- [ ] Create rollback plan and test in staging
- [ ] Set up monitoring for new features
- [ ] Plan communication with stakeholders
- [ ] Conduct post-deployment review
- [ ] Document lessons learned

**Deliverables**:
- Project timeline (Gantt chart or similar)
- Deployment plan with checklist
- Rollback procedure document
- Monitoring setup documentation
- Post-deployment review report

**Dependencies**:
- All agents (orchestrates entire project)

**Estimated Effort**: 8-10 hours (ongoing throughout project)

---

## Timeline & Dependencies

```
Week 1:
┌─────────────────────────────────────────────────┐
│ Day 1-2: Database & Backend Foundation         │
│ - gal-database: Schema design + migration       │
│ - adi-fullstack: Slug utils + server actions    │
└─────────────────────────────────────────────────┘

Week 1-2:
┌─────────────────────────────────────────────────┐
│ Day 3-5: Routing & Frontend                     │
│ - nextjs-architect: Dynamic routes + 404 page   │
│ - tal-design: Admin UI design + components      │
│ - frontend-engineer: Interactivity + handlers   │
└─────────────────────────────────────────────────┘

Week 2:
┌─────────────────────────────────────────────────┐
│ Day 6-8: Testing & Quality Assurance            │
│ - uri-testing: Comprehensive test suite         │
│ - maya-code-review: Code review + security      │
└─────────────────────────────────────────────────┘

Week 2-3:
┌─────────────────────────────────────────────────┐
│ Day 9-10: Documentation & Deployment            │
│ - yael-technical-docs: User guides + docs       │
│ - rotem-strategy: Deployment + monitoring       │
└─────────────────────────────────────────────────┘

Week 3:
┌─────────────────────────────────────────────────┐
│ Day 11-12: Deployment & Post-Launch             │
│ - rotem-strategy: Phased deployment execution   │
│ - All agents: Bug fixes + monitoring            │
└─────────────────────────────────────────────────┘
```

**Critical Path**:
gal-database → adi-fullstack → (nextjs-architect + tal-design) → frontend-engineer → uri-testing → maya-code-review → yael-technical-docs → rotem-strategy

**Total Estimated Effort**: 82-114 hours (10-14 days with 8-hour workdays)

---

## Success Metrics

### Technical Metrics
- [ ] All 98+ tests passing (unit + E2E + integration)
- [ ] Code coverage ≥90% for new backend code
- [ ] Code coverage ≥80% for new frontend code
- [ ] Zero critical security vulnerabilities (maya-code-review approval)
- [ ] Accessibility compliance: WCAG 2.1 AA (maya-code-review approval)
- [ ] TypeScript strict mode: 0 errors
- [ ] Performance: Slug generation <10ms, page load <2s

### Functional Metrics
- [ ] Admin can create questionnaire with auto-generated slug ✅
- [ ] Admin can manually edit slug before publishing ✅
- [ ] Admin can publish multiple questionnaires simultaneously ✅
- [ ] Each published questionnaire has unique shareable URL ✅
- [ ] Admin can copy questionnaire link to clipboard ✅
- [ ] Published questionnaires accessible at /questionnaire/[slug] ✅
- [ ] Unpublished questionnaires return 404 on public routes ✅
- [ ] Legacy /questionnaire route redirects to featured questionnaire ✅

### User Experience Metrics
- [ ] Admin table shows shareable link for each questionnaire
- [ ] Admin can see publish status at a glance (badge)
- [ ] Copy-to-clipboard works with one click
- [ ] Toast notifications provide clear feedback
- [ ] Mobile-responsive table design
- [ ] Hebrew RTL layout throughout
- [ ] No breaking changes to existing workflows

---

## Risk Assessment & Mitigation

### Risk 1: Hebrew Slug Generation Issues
**Probability**: Medium | **Impact**: High

**Description**: Hebrew title transliteration may produce non-unique or invalid slugs.

**Mitigation**:
- Implement robust uniqueness checking with auto-incrementing suffix
- Allow manual slug editing in admin UI
- Provide fallback slug format: `questionnaire-{id}`
- Add comprehensive unit tests for Hebrew transliteration (15+ test cases)

---

### Risk 2: Data Migration Failures
**Probability**: Low | **Impact**: Critical

**Description**: Migration script could fail mid-process, leaving database in inconsistent state.

**Mitigation**:
- Use database transactions for migration
- Implement dry-run mode to test migration before execution
- Create full database backup before migration
- Add detailed logging for every migration step
- Test migration on staging environment with production data copy
- Document rollback procedure

---

### Risk 3: Breaking Changes to Existing Workflows
**Probability**: Medium | **Impact**: High

**Description**: New publish/unpublish system could confuse existing users.

**Mitigation**:
- Maintain backward compatibility with `isActive` field
- Backfill `isPublished = isActive` during migration
- Provide clear admin UI indicators (badges, tooltips)
- Create user guide with screenshots
- Plan training session for admin users
- Monitor admin actions post-deployment for confusion patterns

---

### Risk 4: URL Conflicts and SEO Issues
**Probability**: Low | **Impact**: Medium

**Description**: Slug changes could break existing links if questionnaires are shared externally.

**Mitigation**:
- Allow slug editing but warn about breaking existing links
- Consider implementing slug history and redirects (future enhancement)
- Document that slug should be set once and not changed
- Add "Slug" field to create dialog (not just edit dialog)
- Log slug changes for audit trail

---

### Risk 5: Performance Degradation with Many Questionnaires
**Probability**: Low | **Impact**: Medium

**Description**: Admin table could load slowly with 100+ questionnaires.

**Mitigation**:
- Add database indexes on slug and isPublished fields
- Implement pagination in admin table (future enhancement)
- Benchmark queries with 1000+ questionnaires
- Optimize admin table to only load necessary fields
- Add loading states and skeleton loaders

---

## Future Enhancements (Post-MVP)

1. **Slug History & Redirects**: Track slug changes and automatically redirect old slugs to new ones
2. **Custom Domains**: Allow custom domains per questionnaire (e.g., survey.example.com)
3. **QR Code Generation**: Auto-generate QR codes for each questionnaire link
4. **Analytics Dashboard**: Track views, submissions, and engagement per questionnaire
5. **Scheduled Publishing**: Schedule questionnaires to publish/unpublish automatically
6. **Duplicate Questionnaire**: Clone existing questionnaire with new slug
7. **Questionnaire Templates**: Save questionnaires as reusable templates
8. **Embed Code Generator**: Generate iframe embed code for external websites
9. **Webhook Support**: Trigger webhooks on publish/unpublish/submission events
10. **API Endpoints**: RESTful API for programmatic questionnaire management

---

## Appendix

### A. Glossary

- **Slug**: URL-friendly identifier (e.g., "army-recruitment-2025")
- **isActive**: Boolean flag marking ONE questionnaire as "featured" (optional)
- **isPublished**: Boolean flag making questionnaire publicly accessible (multiple can be true)
- **Transliteration**: Converting Hebrew characters to English equivalents
- **Dynamic Route**: Next.js route with variable path segment (e.g., [slug])
- **Server Action**: Next.js server-side function callable from client components
- **Revalidation**: Clearing Next.js cache to show updated data

---

### B. File Structure Overview

```
el-hadegel/
├── prisma/
│   ├── questionnaire.schema.prisma         # ✏️ MODIFY: Add slug + isPublished
│   └── migrations/
│       └── YYYYMMDDHHMMSS_add_slug/        # 🆕 CREATE: Migration files
├── app/
│   ├── actions/
│   │   └── questionnaire-actions.ts        # ✏️ MODIFY: Add 5 new actions
│   ├── questionnaire/
│   │   ├── page.tsx                        # ✏️ MODIFY: Redirect logic
│   │   └── [slug]/
│   │       ├── page.tsx                    # 🆕 CREATE: Dynamic route
│   │       └── not-found.tsx               # 🆕 CREATE: 404 page
│   └── q/
│       └── [slug]/
│           └── page.tsx                    # 🆕 CREATE: Short URL alias
├── components/
│   └── admin/
│       └── questionnaires/
│           ├── QuestionnaireTable.tsx      # ✏️ MODIFY: Add columns + actions
│           └── QuestionnaireDialog.tsx     # ✏️ MODIFY: Add slug field
├── lib/
│   ├── slug-utils.ts                       # 🆕 CREATE: Slug generation
│   └── validation/
│       └── questionnaire-validation.ts     # ✏️ MODIFY: Add slug validation
├── scripts/
│   └── migrate-questionnaires-to-slugs.ts  # 🆕 CREATE: Data migration
├── __tests__/
│   ├── lib/
│   │   └── slug-utils.test.ts             # 🆕 CREATE: Unit tests
│   └── app/
│       └── actions/
│           └── questionnaire-actions.test.ts # ✏️ MODIFY: Add tests
├── tests/
│   ├── questionnaire-routing.spec.ts       # 🆕 CREATE: E2E routing tests
│   └── admin-questionnaire-publish.spec.ts # 🆕 CREATE: E2E admin tests
└── docs/
    ├── features/
    │   └── multi-questionnaire-publishing.md # 🆕 THIS FILE
    └── guides/
        ├── multi-questionnaire-publishing.md  # 🆕 CREATE: User guide
        └── questionnaire-migration.md         # 🆕 CREATE: Migration guide
```

**Summary**:
- **New Files**: 12
- **Modified Files**: 6
- **Total Files Affected**: 18

---

### C. References

- **Next.js Dynamic Routes**: https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes
- **Prisma Unique Constraints**: https://www.prisma.io/docs/concepts/components/prisma-schema/data-model#unique-constraints
- **Web Clipboard API**: https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API
- **Hebrew Transliteration**: https://en.wikipedia.org/wiki/Romanization_of_Hebrew
- **RTL Layout Best Practices**: https://rtlstyling.com/posts/rtl-styling

---

**Document Version**: 1.0
**Created**: 2025-12-04
**Author**: noam-prompt-engineering agent
**Status**: Ready for Implementation
**Estimated Completion**: 10-14 days
