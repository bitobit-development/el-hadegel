# Feature Specification: Inline Editing Expansion for Questionnaire Responses

**Status**: Draft - REVISED
**Created**: 2025-12-04
**Last Updated**: 2025-12-04 (Revised based on user feedback)
**Author**: Noam (Prompt Engineering Specialist)

**Revision Note**: This specification has been updated to reflect a **table-based inline editing approach** rather than the original modal dialog approach. The user prefers true inline editing with question text and custom fields as table columns.

## 🔄 REVISED SECTIONS SUMMARY

**Major Design Change**: From modal dialog (Option A) to expanded table (Option B)

**What Changed**:
1. **Section 4 - Proposed Solution**: Now recommends expanded table with inline editing (not modal dialog)
2. **Section 5.3 - Component Architecture**: Removed QuickEditDialog components, added EditableQuestionCell and EditableCustomFieldCell
3. **Section 6 - UI/UX Design**: Table-focused design with sticky columns, horizontal scrolling, truncation strategy
4. **Section 7 - Implementation Plan**: Updated phases to focus on table expansion, not dialog creation

**What Stayed the Same**:
- Database schema (no changes)
- Server actions (same mutations, just called from table cells instead of dialog)
- Validation requirements (same rules)
- Success criteria (mostly same, updated to reflect table UX)

**Key New Considerations**:
- **Column Ordering**: Questions by orderIndex, then custom fields by orderIndex
- **Column Truncation**: Question text truncated to 30 chars with tooltip
- **Sticky First Column**: Name column sticky during horizontal scroll (RTL: `right: 0`)
- **Performance**: Lazy rendering for 50+ columns, optimistic UI updates
- **Mobile**: Horizontal scroll with visible scrollbar (recommended)

## 📋 Quick Implementation Summary (REVISED)

**Table Structure**:
```
[שם מלא (sticky)] [טלפון] [אימייל] [Q1 text...] [Q2 text...] [Q3 text...] [CF1 name] [CF2 name] [תאריך] [פעולות]
```

**New Files to Create**:
1. `app/actions/questionnaire-response-actions.ts` - Server actions for question answers
2. `components/admin/questionnaires/EditableQuestionCell.tsx` - Editable cell for questions
3. `components/admin/questionnaires/EditableCustomFieldCell.tsx` - Editable cell for custom fields
4. `lib/utils/table-helpers.ts` - Utility functions (truncate text, format values)

**Files to Modify**:
1. `components/admin/questionnaires/AdminQuestionnaireSubmissions.tsx` - Add question/custom field columns
2. `app/actions/questionnaire-actions.ts` - Update data fetching to include answers and custom field values

**Implementation Phases** (4-5 days total):
1. **Day 1**: Server actions + validation
2. **Day 2**: EditableQuestionCell component (YES_NO, TEXT, LONG_TEXT)
3. **Day 3**: EditableCustomFieldCell component (all 5 types)
4. **Day 4**: Table integration, column ordering, sticky headers
5. **Day 5**: Mobile responsive, performance optimization, testing

---

## Table of Contents

1. [Feature Overview](#feature-overview)
2. [Current State](#current-state)
3. [Problem Statement](#problem-statement)
4. [Proposed Solution](#proposed-solution)
5. [Technical Architecture](#technical-architecture)
6. [UI/UX Design](#uiux-design)
7. [Implementation Plan](#implementation-plan)
8. [Validation Requirements](#validation-requirements)
9. [Edge Cases & Considerations](#edge-cases--considerations)
10. [Success Criteria](#success-criteria)
11. [Future Enhancements](#future-enhancements)

---

## 1. Feature Overview

### What We're Building

Expanding the inline editing capabilities of the questionnaire responses table to support:
- **Question answers** (YES_NO, TEXT, LONG_TEXT types)
- **Custom field values** (TEXT, LONG_TEXT, NUMBER, DATE, SELECT types)

Currently, only contact information fields (fullName, phoneNumber, email) support inline editing. This expansion will enable admins to quickly edit any aspect of a response without opening the full detail dialog.

### Why This Matters

**Current Pain Points**:
- Editing a single answer requires opening the detail dialog (extra click, context switch)
- Bulk corrections (e.g., fixing typos across multiple responses) are time-consuming
- No quick way to update custom fields like "Status" or "Assigned To"
- Detail dialog is heavy for simple edits

**Benefits**:
- **Speed**: Edit any field with one click (activate edit mode) + one click (save)
- **Efficiency**: See multiple responses side-by-side while editing
- **Reduced Context Switching**: Stay in table view instead of modal dialogs
- **Better UX**: Familiar Excel-like editing experience

### Target Users

- **Primary**: Admins managing questionnaire responses
- **Use Cases**:
  - Correcting typos in answers
  - Updating custom fields (status, notes, assignments)
  - Quick data entry for missing fields
  - Bulk updates across multiple responses

---

## 2. Current State

### What's Already Implemented

**Inline Editing for Contact Info** (✅ COMPLETE):
- Located in: `components/admin/questionnaires/AdminQuestionnaireSubmissions.tsx`
- Fields: `fullName`, `phoneNumber`, `email`
- Behavior:
  - Click edit button (appears on hover) to activate edit mode
  - Input fields appear in-place with current values
  - Individual save button per field
  - Cancel button restores original value
  - Toast notifications on success/error
  - Automatic table refresh after save

**Current Table Structure**:
```
┌─────────┬─────────┬────────────┬──────────┬────────┬──────────┐
│ שם מלא  │ טלפון   │ אימייל      │ תאריך    │ תשובות │ פעולות   │
├─────────┼─────────┼────────────┼──────────┼────────┼──────────┤
│ יוסי כהן│ 050-123 │ y@ex.com   │ 02/12/25 │ 3      │ [פרטים]  │
└─────────┴─────────┴────────────┴──────────┴────────┴──────────┘
```

**Current Architecture**:
```typescript
// State management (per response row)
const [editMode, setEditMode] = useState<Record<number, boolean>>({});
const [editValues, setEditValues] = useState<Record<number, EditableFields>>({});
const [saving, setSaving] = useState<Record<number, Set<string>>>({});

// Server Action
async function updateQuestionnaireResponse(responseId, updates) {
  // Prisma update on QuestionnaireResponse table
  // Revalidates: /admin/questionnaires/[id]/submissions
}
```

**UI Pattern** (EditableCell component):
```
┌─────────────────────────────────────────────────────────────┐
│ View Mode (Normal)                                          │
├─────────────────────────────────────────────────────────────┤
│ יוסי כהן        [ערוך] ← Edit button appears on hover       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Edit Mode (Active)                                          │
├─────────────────────────────────────────────────────────────┤
│ [Input: יוסי כהן]  [שמור] [בטל]                             │
└─────────────────────────────────────────────────────────────┘
```

**Database Tables Involved**:
- `QuestionnaireResponse`: Contact info fields (fullName, phoneNumber, email)

**Current Questionnaire Data**:
- 3 questions in questionnaire (Q8, Q9, Q10)
- Multiple responses with varying answers
- Some responses have custom fields

---

## 3. Problem Statement

### Limitations of Current System

1. **Scope**: Only 3 fields editable inline (contact info)
2. **Scale**: Questionnaires may have 10-50 questions + 5-20 custom fields
3. **Complexity**: Different field types require different input components
4. **Performance**: Table with 60+ columns would be unusable
5. **Discoverability**: Users may not realize fields are editable

### Design Challenges

**Challenge 1: Horizontal Space Constraints**
- Current table: 3 contact columns + 1 date + 1 actions = 5 columns
- Adding 50 question columns + 20 custom field columns = 75 total columns
- Horizontal scrolling becomes painful beyond ~10 columns

**Challenge 2: Field Type Diversity**
- YES_NO questions: Need dropdown (כן/לא)
- TEXT questions: Need text input
- LONG_TEXT questions: Need textarea or expandable input
- NUMBER custom fields: Need numeric input with validation
- DATE custom fields: Need date picker
- SELECT custom fields: Need dropdown with field-specific options

**Challenge 3: Validation Complexity**
- Each field type has different validation rules
- Required fields must be enforced
- Custom field validation (min/max for numbers, keyword validation for comments)

**Challenge 4: State Management**
- Each response has N questions + M custom fields
- Need to track edit mode per field per response
- Need to track saving state per field per response
- Need to handle validation errors per field

---

## 4. Proposed Solution **(REVISED)**

### High-Level Approach: Expanded Table with True Inline Editing

**EXPAND table horizontally** with question and custom field columns for true inline editing:

### Option B: Expanded Table with Inline Editing (RECOMMENDED - REVISED)

**Concept**: Add question text and custom field names as table columns, extend existing EditableCell pattern to all fields.

**Pros**:
- ✅ True inline editing (no modal context switch)
- ✅ Excel-like experience (familiar to users)
- ✅ See multiple responses side-by-side while editing
- ✅ Reuses existing EditableCell pattern (proven UX)
- ✅ No extra clicks to enter edit mode
- ✅ Fast editing workflow (stay in table context)

**Cons**:
- ❌ Wide table requires horizontal scrolling
- ❌ More complex state management (many editable cells)
- ❌ Requires responsive design for mobile (<768px)

**UI Flow** (REVISED - Expanded Table):
```
BEFORE (Current - Narrow Table):
┌─────────┬─────────┬────────────┬──────────┬────────┬──────────┐
│ שם מלא  │ טלפון   │ אימייל      │ תאריך    │ תשובות │ פעולות   │
├─────────┼─────────┼────────────┼──────────┼────────┼──────────┤
│ יוסי כהן│ 050-123 │ y@ex.com   │ 02/12/25 │ 3      │ [פרטים]  │
└─────────┴─────────┴────────────┴──────────┴────────┴──────────┘

AFTER (Expanded Table with Question & Custom Field Columns):
┌────────┬────────┬──────────┬──────────────────┬──────────────────┬──────────────────┬─────────┬────────┬──────────┬──────────┐
│ שם מלא │ טלפון  │ אימייל    │ מספר מילים על... │ האם אתה תומך?    │ למה?             │ סטטוס   │ הערות  │ תאריך    │ פעולות   │
│(sticky)│        │          │ (Q8, truncated)  │ (Q9)            │ (Q10)            │ (CF1)   │ (CF2)  │          │          │
├────────┼────────┼──────────┼──────────────────┼──────────────────┼──────────────────┼─────────┼────────┼──────────┼──────────┤
│ יוסי   │ 050-   │ y@ex.com │ תומך בחוק        │ כן               │ זה נכון          │ טופל    │ ללא    │ 02/12/25 │ [פרטים]  │
│        │ 123    │          │ [ערוך]           │ [ערוך]           │ [ערוך]           │ [ערוך]  │[ערוך]  │          │ [מחק]    │
└────────┴────────┴──────────┴──────────────────┴──────────────────┴──────────────────┴─────────┴────────┴──────────┴──────────┘
                                                 ▲ Horizontal scrolling →
```

**Column Structure** (REVISED):
1. **Sticky Columns** (always visible):
   - שם מלא (Full Name) - sticky on right (RTL)

2. **Contact Info Columns** (existing):
   - טלפון (Phone)
   - אימייל (Email)

3. **Question Columns** (NEW - ordered by orderIndex):
   - Column header: Question text (truncated to 30 chars with ellipsis)
   - Cell content: Answer value (YES_NO shows "כן/לא", TEXT shows text)
   - Each cell editable via EditableCell pattern

4. **Custom Field Columns** (NEW - ordered by orderIndex):
   - Column header: Field name (e.g., "סטטוס", "הערות")
   - Cell content: Field value (type-specific display)
   - Each cell editable via EditableCell pattern

5. **Fixed Columns** (always last):
   - תאריך הגשה (Submission Date)
   - פעולות (Actions)

**Key Features**:
- Sticky first column (name) for easy navigation during scroll
- Edit button appears on hover per cell
- Individual save buttons per field (same as existing contact info pattern)
- Horizontal scrolling supported with smooth scroll behavior
- Question text truncated to 30 chars max with ellipsis
- Custom field names shown as-is (no truncation if reasonable length)

---

### Recommended Approach: **Option B (Expanded Table)** (REVISED)

**Rationale**:
1. **User Preference**: User explicitly requested table-based approach (not modal)
2. **Consistency**: Extends existing EditableCell pattern (contact info already works this way)
3. **True Inline Editing**: No context switch, stay in table view
4. **Excel-like UX**: Familiar to users who work with spreadsheets
5. **Efficiency**: Edit multiple responses without opening/closing dialogs
6. **Code Reuse**: Leverages existing EditableCell component for all field types

**Design Considerations**:

**Column Ordering** (REVISED):
- Questions ordered by `orderIndex` (ascending, 0, 1, 2...)
- Custom fields ordered by `orderIndex` (ascending, 0, 1, 2...)
- Questions appear BEFORE custom fields (standard data before metadata)

**Column Truncation**:
- Question text truncated to max 30 characters with ellipsis
- Example: "מספר מילים על עצמי בהקשר של..." → "מספר מילים על עצמי בהקשר..."
- Full question text shown in tooltip on hover
- Custom field names shown as-is (typically shorter)

**Horizontal Scrolling**:
- Table container with `overflow-x: auto`
- Smooth scroll behavior enabled
- First column (name) sticky for orientation during scroll
- Sticky position: `position: sticky; right: 0;` (RTL)

**Responsive Design** (Mobile <768px):
- Option 1: Show only essential columns (name, phone, email) + "הצג עוד" button
- Option 2: Horizontal scroll with visible scrollbar indicator
- Option 3: Transform to card layout (stack fields vertically)
- **Recommended**: Option 2 (horizontal scroll) for consistency with existing mobile pattern

**Performance** (50+ columns):
- Lazy rendering of cells outside viewport (React Virtualized or react-window)
- Debounced edit state updates
- Optimistic UI updates before server confirmation
- Pagination to limit rows (existing: 20 per page)

---

## 5. Technical Architecture **(REVISED)**

### 5.1 Database Schema (No Changes Needed)

**Existing Tables** (unchanged):

```prisma
// Contact info (already editable inline)
model QuestionnaireResponse {
  id           Int      @id @default(autoincrement())
  fullName     String
  phoneNumber  String
  email        String
  submittedAt  DateTime
  // ... other fields
  answers      ResponseAnswer[]
  customFieldValues CustomFieldValue[]
}

// Question answers (NOW editable inline via table cells)
model ResponseAnswer {
  id           Int      @id @default(autoincrement())
  responseId   Int
  questionId   Int
  answer       Boolean? // For YES_NO type
  textAnswer   String?  // For TEXT/LONG_TEXT type
  question     Question @relation(...)
  response     QuestionnaireResponse @relation(...)

  @@unique([responseId, questionId])
}

// Questions (used for column headers)
model Question {
  id            Int      @id @default(autoincrement())
  questionnaireId Int
  questionText  String   // Used as column header (truncated)
  questionType  QuestionType // YES_NO, TEXT, LONG_TEXT
  orderIndex    Int      // Determines column order
  isRequired    Boolean
  // ... other fields
}

// Custom field values (NOW editable inline via table cells)
model CustomFieldValue {
  id           Int      @id @default(autoincrement())
  responseId   Int
  fieldId      Int
  textValue    String?  // For TEXT/LONG_TEXT/SELECT
  numberValue  Float?   // For NUMBER
  dateValue    DateTime? // For DATE
  field        CustomFieldDefinition @relation(...)
  response     QuestionnaireResponse @relation(...)

  @@unique([responseId, fieldId])
}

// Custom field definitions (used for column headers)
model CustomFieldDefinition {
  id              Int      @id @default(autoincrement())
  questionnaireId Int
  fieldName       String   // Used as column header (as-is)
  fieldType       CustomFieldType // TEXT, LONG_TEXT, NUMBER, DATE, SELECT
  orderIndex      Int      // Determines column order
  isRequired      Boolean
  // ... other fields
}
```

**Key Points**:
- No schema changes required - all fields already exist
- `orderIndex` fields used for column ordering (questions, then custom fields)
- Unique constraints prevent duplicate answers/values per response

---

### 5.2 New Server Actions **(REVISED)**

**Location**: `app/actions/questionnaire-response-actions.ts` (NEW FILE)

**Purpose**: Server actions for updating question answers and custom field values inline (reuse existing server action architecture)

```typescript
// ==========================================
// SERVER ACTION 1: Update Question Answer
// ==========================================
export async function updateResponseAnswer(
  responseId: number,
  questionId: number,
  value: boolean | string | null
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await auth();
    if (!session) throw new Error('Unauthorized');

    // Fetch question to determine type
    const question = await prismaQuestionnaire.question.findUnique({
      where: { id: questionId },
      select: { questionType: true, isRequired: true },
    });

    if (!question) throw new Error('Question not found');

    // Validate based on question type
    if (question.questionType === 'YES_NO') {
      if (value !== null && typeof value !== 'boolean') {
        return { success: false, error: 'ערך חייב להיות כן/לא' };
      }
      if (question.isRequired && value === null) {
        return { success: false, error: 'שדה חובה' };
      }
    } else if (question.questionType === 'TEXT' || question.questionType === 'LONG_TEXT') {
      if (value !== null && typeof value !== 'string') {
        return { success: false, error: 'ערך חייב להיות טקסט' };
      }
      if (question.isRequired && (!value || value.trim() === '')) {
        return { success: false, error: 'שדה חובה' };
      }
      if (question.questionType === 'TEXT' && value && value.length > 500) {
        return { success: false, error: 'טקסט לא יכול לעלות על 500 תווים' };
      }
      if (question.questionType === 'LONG_TEXT' && value && value.length > 2000) {
        return { success: false, error: 'טקסט לא יכול לעלות על 2000 תווים' };
      }
    }

    // Prepare data based on type
    const updateData: any = {};
    if (question.questionType === 'YES_NO') {
      updateData.answer = value as boolean | null;
      updateData.textAnswer = null;
    } else {
      updateData.answer = null;
      updateData.textAnswer = value as string | null;
    }

    // Upsert answer
    await prismaQuestionnaire.responseAnswer.upsert({
      where: {
        responseId_questionId: {
          responseId,
          questionId,
        },
      },
      update: updateData,
      create: {
        responseId,
        questionId,
        ...updateData,
      },
    });

    revalidatePath('/admin/questionnaires');
    return { success: true };
  } catch (error) {
    console.error('Error updating response answer:', error);
    return { success: false, error: 'שגיאה בעדכון התשובה' };
  }
}

// ==========================================
// SERVER ACTION 2: Get Editable Response Data
// ==========================================
export async function getEditableResponseData(
  responseId: number
): Promise<EditableResponseData | null> {
  try {
    const response = await prismaQuestionnaire.questionnaireResponse.findUnique({
      where: { id: responseId },
      include: {
        questionnaire: {
          include: {
            questions: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
        answers: {
          include: {
            question: true,
          },
        },
        customFieldValues: {
          include: {
            field: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
      },
    });

    if (!response) return null;

    // Transform to UI-friendly format
    return {
      id: response.id,
      fullName: response.fullName,
      phoneNumber: response.phoneNumber,
      email: response.email,
      questions: response.questionnaire.questions.map(q => ({
        id: q.id,
        questionText: q.questionText,
        questionType: q.questionType,
        isRequired: q.isRequired,
        currentAnswer: response.answers.find(a => a.questionId === q.id),
      })),
      customFields: response.customFieldValues.map(v => ({
        id: v.id,
        fieldId: v.fieldId,
        fieldName: v.field.fieldName,
        fieldType: v.field.fieldType,
        fieldOptions: v.field.fieldOptions,
        isRequired: v.field.isRequired,
        currentValue: extractFieldValue(v.field.fieldType, v),
      })),
    };
  } catch (error) {
    console.error('Error fetching editable response data:', error);
    return null;
  }
}

// Type definitions
type EditableResponseData = {
  id: number;
  fullName: string;
  phoneNumber: string;
  email: string;
  questions: Array<{
    id: number;
    questionText: string;
    questionType: 'YES_NO' | 'TEXT' | 'LONG_TEXT';
    isRequired: boolean;
    currentAnswer?: { answer: boolean | null; textAnswer: string | null };
  }>;
  customFields: Array<{
    id: number;
    fieldId: number;
    fieldName: string;
    fieldType: 'TEXT' | 'LONG_TEXT' | 'NUMBER' | 'DATE' | 'SELECT';
    fieldOptions: any;
    isRequired: boolean;
    currentValue: string | number | Date | null;
  }>;
};
```

**Why New File?**
- Keeps questionnaire response mutations separate from definition mutations
- Existing `questionnaire-actions.ts` handles questionnaire CRUD (create/delete questionnaires)
- New file handles response data mutations (update answers, custom fields)
- Clear separation of concerns

**Note**: Custom field updates can reuse existing `updateCustomFieldValue()` from `custom-field-actions.ts` (already implemented).

---

### 5.3 Component Architecture **(REVISED - Table-Based)**

**NO NEW DIALOG COMPONENTS** - All editing happens inline in table cells.

#### Component 1: EditableQuestionCell **(NEW)**

**Location**: `components/admin/questionnaires/EditableQuestionCell.tsx` (NEW FILE)

**Purpose**: Reusable cell component for editing question answers inline (extends EditableCell pattern).

**Props**:
```typescript
interface QuickEditDialogProps {
  responseId: number | null;          // null = closed, number = open
  onClose: () => void;                // Close handler
  onUpdate: () => void;               // Callback after successful update
}
```

**State Management**:
```typescript
const [loading, setLoading] = useState(true);
const [data, setData] = useState<EditableResponseData | null>(null);
const [saving, setSaving] = useState<Set<string>>(new Set()); // Track which fields are saving
```

**Component Structure**:
```typescript
export function QuickEditDialog({ responseId, onClose, onUpdate }: QuickEditDialogProps) {
  // Load data on dialog open
  useEffect(() => {
    if (responseId) {
      loadData();
    }
  }, [responseId]);

  async function loadData() {
    setLoading(true);
    const result = await getEditableResponseData(responseId!);
    setData(result);
    setLoading(false);
  }

  if (!responseId) return null;

  return (
    <Dialog open={!!responseId} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>עריכה מהירה - {data?.fullName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-6">
            {/* Section 1: Contact Info */}
            <ContactInfoSection
              fullName={data!.fullName}
              phoneNumber={data!.phoneNumber}
              email={data!.email}
              responseId={responseId}
              onSave={handleContactInfoSave}
              saving={saving}
            />

            {/* Section 2: Question Answers */}
            <QuestionAnswersSection
              questions={data!.questions}
              responseId={responseId}
              onSave={handleAnswerSave}
              saving={saving}
            />

            {/* Section 3: Custom Fields */}
            <CustomFieldsSection
              fields={data!.customFields}
              responseId={responseId}
              onSave={handleCustomFieldSave}
              saving={saving}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

**UI Layout** (ASCII mockup):
```
┌────────────────────────────────────────────────────────────────┐
│ עריכה מהירה - יוסי כהן                               [✕ סגור] │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ 📋 פרטי קשר                                        [▼ לפתוח]  │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ שם מלא:    [Input: יוסי כהן]              [שמור] [Loading]│
│ │ טלפון:     [Input: 0501234567]            [שמור]          │
│ │ אימייל:    [Input: yossi@example.com]     [שמור]          │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                │
│ ❓ תשובות לשאלות (5)                               [▼ לפתוח]  │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ שאלה 1: האם אתה תומך בחוק הגיוס?                        │   │
│ │ [Dropdown: כן ▼]                          [שמור]          │
│ │                                                          │   │
│ │ שאלה 2: מדוע? (טקסט חופשי)                              │   │
│ │ [Textarea: אני תומך כי...]                [שמור]         │
│ │                                                          │   │
│ │ שאלה 3: מה העיר שלך?                                    │   │
│ │ [Input: תל אביב]                          [שמור]          │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                │
│ 🏷️ שדות מותאמים אישית (3)                        [▼ לפתוח]  │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ עיר מגורים: [Dropdown: תל אביב ▼]       [שמור]          │
│ │ גיל:        [Input: 35]                   [שמור]          │
│ │ הערות:      [Textarea: ללא...]            [שמור]          │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                │
│                                   [סגור] ←                     │
└────────────────────────────────────────────────────────────────┘
```

**Key Features**:
- **Collapsible Sections**: Use shadcn/ui Collapsible component
- **Individual Save Buttons**: Per field, same pattern as current inline editing
- **Loading States**: Spinner per field while saving
- **Validation Errors**: Toast notifications for errors
- **No "Save All" Button**: Save is per-field (explicit, no surprises)
- **Auto-Close**: Optional, can stay open for multiple edits

---

#### Component 2: ContactInfoSection

**Location**: Same file or separate `ContactInfoSection.tsx`

**Purpose**: Editable contact info fields (fullName, phoneNumber, email) within quick edit dialog.

**Implementation**: Reuse existing inline edit logic from `AdminQuestionnaireSubmissions.tsx`, but adapt for dialog context.

```typescript
function ContactInfoSection({
  fullName,
  phoneNumber,
  email,
  responseId,
  onSave,
  saving,
}: ContactInfoSectionProps) {
  const [values, setValues] = useState({ fullName, phoneNumber, email });

  async function handleSave(field: 'fullName' | 'phoneNumber' | 'email') {
    const result = await updateQuestionnaireResponse(responseId, {
      [field]: values[field],
    });

    if (result.success) {
      toast.success('הערך נשמר בהצלחה');
      onSave();
    } else {
      toast.error(result.error || 'שגיאה בשמירה');
    }
  }

  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger className="flex items-center gap-2">
        <span className="text-lg font-semibold">📋 פרטי קשר</span>
        <ChevronDown className="h-4 w-4" />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 mt-3">
        {/* Full Name */}
        <div className="flex items-center gap-2">
          <Label className="w-24">שם מלא:</Label>
          <Input
            value={values.fullName}
            onChange={(e) => setValues({ ...values, fullName: e.target.value })}
            className="flex-1"
          />
          <Button
            size="sm"
            onClick={() => handleSave('fullName')}
            disabled={saving.has('fullName')}
          >
            {saving.has('fullName') ? 'שומר...' : 'שמור'}
          </Button>
        </div>

        {/* Phone Number */}
        <div className="flex items-center gap-2">
          <Label className="w-24">טלפון:</Label>
          <Input
            value={values.phoneNumber}
            onChange={(e) => setValues({ ...values, phoneNumber: e.target.value })}
            className="flex-1"
          />
          <Button
            size="sm"
            onClick={() => handleSave('phoneNumber')}
            disabled={saving.has('phoneNumber')}
          >
            {saving.has('phoneNumber') ? 'שומר...' : 'שמור'}
          </Button>
        </div>

        {/* Email */}
        <div className="flex items-center gap-2">
          <Label className="w-24">אימייל:</Label>
          <Input
            type="email"
            value={values.email}
            onChange={(e) => setValues({ ...values, email: e.target.value })}
            className="flex-1"
          />
          <Button
            size="sm"
            onClick={() => handleSave('email')}
            disabled={saving.has('email')}
          >
            {saving.has('email') ? 'שומר...' : 'שמור'}
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
```

---

#### Component 3: QuestionAnswersSection

**Location**: Same file or separate `QuestionAnswersSection.tsx`

**Purpose**: Editable question answers (YES_NO, TEXT, LONG_TEXT types).

```typescript
function QuestionAnswersSection({
  questions,
  responseId,
  onSave,
  saving,
}: QuestionAnswersSectionProps) {
  const [values, setValues] = useState<Record<number, boolean | string | null>>(
    () => {
      const initial: Record<number, boolean | string | null> = {};
      questions.forEach(q => {
        if (q.questionType === 'YES_NO') {
          initial[q.id] = q.currentAnswer?.answer ?? null;
        } else {
          initial[q.id] = q.currentAnswer?.textAnswer ?? null;
        }
      });
      return initial;
    }
  );

  async function handleSave(questionId: number) {
    const result = await updateResponseAnswer(
      responseId,
      questionId,
      values[questionId]
    );

    if (result.success) {
      toast.success('התשובה נשמרה בהצלחה');
      onSave();
    } else {
      toast.error(result.error || 'שגיאה בשמירה');
    }
  }

  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger className="flex items-center gap-2">
        <span className="text-lg font-semibold">❓ תשובות לשאלות ({questions.length})</span>
        <ChevronDown className="h-4 w-4" />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 mt-3">
        {questions.map(question => (
          <div key={question.id} className="border rounded-lg p-3 space-y-2">
            {/* Question Text */}
            <div className="font-medium text-sm">
              {question.questionText}
              {question.isRequired && <span className="text-red-500 mr-1">*</span>}
            </div>

            {/* Input based on question type */}
            <div className="flex items-center gap-2">
              {question.questionType === 'YES_NO' ? (
                <Select
                  value={values[question.id] === null ? 'null' : String(values[question.id])}
                  onValueChange={(val) => {
                    const newValue = val === 'null' ? null : val === 'true';
                    setValues({ ...values, [question.id]: newValue });
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="בחר תשובה" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">לא נענה</SelectItem>
                    <SelectItem value="true">כן</SelectItem>
                    <SelectItem value="false">לא</SelectItem>
                  </SelectContent>
                </Select>
              ) : question.questionType === 'TEXT' ? (
                <Input
                  value={(values[question.id] as string) || ''}
                  onChange={(e) => setValues({ ...values, [question.id]: e.target.value })}
                  placeholder="הכנס תשובה"
                  maxLength={500}
                  className="flex-1"
                />
              ) : (
                <Textarea
                  value={(values[question.id] as string) || ''}
                  onChange={(e) => setValues({ ...values, [question.id]: e.target.value })}
                  placeholder="הכנס תשובה"
                  maxLength={2000}
                  rows={3}
                  className="flex-1"
                />
              )}

              <Button
                size="sm"
                onClick={() => handleSave(question.id)}
                disabled={saving.has(`question-${question.id}`)}
              >
                {saving.has(`question-${question.id}`) ? 'שומר...' : 'שמור'}
              </Button>
            </div>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
```

---

#### Component 4: CustomFieldsSection

**Location**: Same file or separate `CustomFieldsSection.tsx`

**Purpose**: Editable custom field values (TEXT, LONG_TEXT, NUMBER, DATE, SELECT types).

**Implementation**: Reuse logic from existing `CustomFieldEditor.tsx`, but adapt for dialog context.

```typescript
function CustomFieldsSection({
  fields,
  responseId,
  onSave,
  saving,
}: CustomFieldsSectionProps) {
  const [values, setValues] = useState<Record<number, string | number | Date | null>>(
    () => {
      const initial: Record<number, string | number | Date | null> = {};
      fields.forEach(f => {
        initial[f.fieldId] = f.currentValue;
      });
      return initial;
    }
  );

  async function handleSave(fieldId: number) {
    const result = await updateCustomFieldValue(
      responseId,
      fieldId,
      values[fieldId]
    );

    if (result.success) {
      toast.success('הערך נשמר בהצלחה');
      onSave();
    } else {
      toast.error(result.error || 'שגיאה בשמירה');
    }
  }

  if (fields.length === 0) {
    return (
      <div className="text-muted-foreground text-sm text-center py-4">
        אין שדות מותאמים אישית
      </div>
    );
  }

  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger className="flex items-center gap-2">
        <span className="text-lg font-semibold">🏷️ שדות מותאמים אישית ({fields.length})</span>
        <ChevronDown className="h-4 w-4" />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 mt-3">
        {fields.map(field => (
          <div key={field.fieldId} className="flex items-center gap-2">
            <Label className="w-32 text-sm">
              {field.fieldName}
              {field.isRequired && <span className="text-red-500 mr-1">*</span>}:
            </Label>

            {/* Input based on field type */}
            {field.fieldType === 'TEXT' && (
              <Input
                value={(values[field.fieldId] as string) || ''}
                onChange={(e) => setValues({ ...values, [field.fieldId]: e.target.value })}
                maxLength={500}
                className="flex-1"
              />
            )}

            {field.fieldType === 'LONG_TEXT' && (
              <Textarea
                value={(values[field.fieldId] as string) || ''}
                onChange={(e) => setValues({ ...values, [field.fieldId]: e.target.value })}
                maxLength={2000}
                rows={3}
                className="flex-1"
              />
            )}

            {field.fieldType === 'NUMBER' && (
              <Input
                type="number"
                value={(values[field.fieldId] as number) || ''}
                onChange={(e) => setValues({ ...values, [field.fieldId]: parseFloat(e.target.value) })}
                className="flex-1"
              />
            )}

            {field.fieldType === 'DATE' && (
              <Input
                type="date"
                value={
                  values[field.fieldId]
                    ? new Date(values[field.fieldId] as Date).toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) => setValues({ ...values, [field.fieldId]: new Date(e.target.value) })}
                className="flex-1"
              />
            )}

            {field.fieldType === 'SELECT' && (
              <Select
                value={(values[field.fieldId] as string) || ''}
                onValueChange={(val) => setValues({ ...values, [field.fieldId]: val })}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="בחר אופציה" />
                </SelectTrigger>
                <SelectContent>
                  {(field.fieldOptions?.options || []).map((option: string) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button
              size="sm"
              onClick={() => handleSave(field.fieldId)}
              disabled={saving.has(`field-${field.fieldId}`)}
            >
              {saving.has(`field-${field.fieldId}`) ? 'שומר...' : 'שמור'}
            </Button>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
```

---

### 5.4 Integration into AdminQuestionnaireSubmissions

**Changes to Existing Component**:

1. **Add "עריכה מהירה" Button** in actions column:
```typescript
// In TableCell with actions
<TableCell>
  <div className="flex gap-2">
    <Button
      size="sm"
      variant="outline"
      onClick={() => setQuickEditResponseId(response.id)}
    >
      עריכה מהירה
    </Button>
    <Button
      size="sm"
      variant="outline"
      onClick={() => setSelectedResponse(response)}
    >
      הצג פרטים
    </Button>
  </div>
</TableCell>
```

2. **Add State for Quick Edit Dialog**:
```typescript
const [quickEditResponseId, setQuickEditResponseId] = useState<number | null>(null);
```

3. **Render QuickEditDialog**:
```typescript
<QuickEditDialog
  responseId={quickEditResponseId}
  onClose={() => setQuickEditResponseId(null)}
  onUpdate={handleRefresh}
/>
```

**Before vs After**:
```
BEFORE (Current):
┌──────────────────────────────────────────────────────┐
│ Actions Column                                       │
├──────────────────────────────────────────────────────┤
│ [הצג פרטים] [מחק]                                   │
└──────────────────────────────────────────────────────┘

AFTER (With Quick Edit):
┌──────────────────────────────────────────────────────┐
│ Actions Column                                       │
├──────────────────────────────────────────────────────┤
│ [עריכה מהירה] [הצג פרטים] [מחק]                    │
└──────────────────────────────────────────────────────┘
```

---

## 6. UI/UX Design

### 6.1 Dialog Layout

**Dimensions**:
- **Width**: `max-w-3xl` (48rem / 768px) - wide enough for comfortable editing
- **Height**: `max-h-[80vh]` - 80% viewport height, scrollable content area
- **Padding**: Standard dialog padding (`p-6`)

**Sections**:
1. **Header**: Title ("עריכה מהירה - [Name]") + Close button (top-right)
2. **Content Area**: Scrollable with 3 collapsible sections
3. **Footer**: Optional (currently none, could add "סגור" button)

**Scroll Behavior**:
- Dialog body scrolls, header/footer fixed
- Smooth scroll on long content (50+ fields)
- No horizontal scroll (responsive field widths)

---

### 6.2 Field Layouts

**Single-Line Fields** (TEXT, NUMBER, DATE, SELECT):
```
┌──────────────────────────────────────────────────────┐
│ [Label (120px)] [Input (flex-1)] [Save Button (80px)]│
└──────────────────────────────────────────────────────┘
```

**Multi-Line Fields** (LONG_TEXT):
```
┌──────────────────────────────────────────────────────┐
│ [Label (120px)]                   [Save Button (80px)]│
│ [Textarea (full-width, 3-4 rows)]                   │
└──────────────────────────────────────────────────────┘
```

**YES_NO Dropdown**:
```
┌──────────────────────────────────────────────────────┐
│ [Question Text (full-width)]                        │
│ [Dropdown (flex-1)] [Save Button (80px)]            │
│ Options: לא נענה | כן | לא                         │
└──────────────────────────────────────────────────────┘
```

---

### 6.3 Collapsible Sections

**Default State**:
- **Contact Info**: Collapsed (less frequently edited)
- **Questions**: Open (primary edit target)
- **Custom Fields**: Open (if <5 fields), collapsed (if 5+ fields)

**Trigger Design**:
```
📋 פרטי קשר                                    [▼]
❓ תשובות לשאלות (12)                          [▼]
🏷️ שדות מותאמים אישית (8)                     [▼]
```

**Icons**:
- 📋 Contact Info
- ❓ Questions
- 🏷️ Custom Fields

**Count Badge**: Show total count in section header (e.g., "תשובות לשאלות (12)")

---

### 6.4 Mobile Responsiveness

**Breakpoints**:
- **Desktop** (>768px): Side-by-side layout (Label | Input | Button)
- **Mobile** (<768px): Stacked layout (Label above Input, Button below)

**Mobile Layout**:
```
┌──────────────────────────┐
│ שם מלא:                 │
│ [Input (full-width)]    │
│ [שמור] [בטל]            │
│                         │
│ טלפון:                  │
│ [Input (full-width)]    │
│ [שמור] [בטל]            │
└──────────────────────────┘
```

**Dialog Width on Mobile**:
- Use `max-w-[95vw]` on small screens
- Reduce padding (`p-4` instead of `p-6`)
- Stack save/cancel buttons vertically if needed

---

### 6.5 Hebrew RTL Considerations

**Text Alignment**:
- All text right-aligned (`text-right` class)
- Labels on right, inputs in center, buttons on left

**Icons**:
- Chevron icons flip direction (▼ when closed, ▲ when open)
- Close button (✕) stays top-right

**Input Direction**:
- Hebrew text inputs: `dir="rtl"`
- English/numeric inputs: `dir="ltr"` (auto-detect)

---

### 6.6 Visual States

**Normal State** (Not Saving):
```
[Input: value here]  [שמור]
```

**Saving State**:
```
[Input: value here]  [שומר...] ← Button disabled, spinner icon
```

**Error State**:
```
[Input: value here (red border)]  [שמור]
(Error toast appears: "ערך לא תקין")
```

**Success State**:
```
[Input: value here (green flash animation)]  [שמור]
(Success toast appears: "הערך נשמר בהצלחה")
```

---

### 6.7 Keyboard Shortcuts (Optional Enhancement)

**Shortcuts**:
- `Ctrl+S` / `Cmd+S`: Save focused field
- `Esc`: Close dialog
- `Tab`: Navigate between fields
- `Enter` (in Input): Save field (not submit entire form)
- `Enter` (in Textarea): New line (not save)

---

## 7. Implementation Plan **(REVISED)**

### Phase 1: Server Actions + Data Fetching (Day 1) **(REVISED)**

**Step 1.1**: Create `app/actions/questionnaire-response-actions.ts`
- Implement `updateResponseAnswer(responseId, questionId, value)` server action
- Validation logic for YES_NO, TEXT, LONG_TEXT types
- Upsert logic (update if exists, create if not)
- Write unit tests (Jest)

**Step 1.2**: Update `app/actions/questionnaire-actions.ts`
- Modify `getQuestionnaireResponses()` to include:
  - `answers` relation with `question` (for display values)
  - `customFieldValues` relation with `field` (for display values)
  - Order by `question.orderIndex` and `field.orderIndex`
- Test data fetching with 3 questions + 2 custom fields

**Step 1.3**: Verify existing custom field action
- Confirm `updateCustomFieldValue()` works as-is (already implemented)
- Test with all 5 types (TEXT, LONG_TEXT, NUMBER, DATE, SELECT)

**Estimated Time**: 4-6 hours

---

### Phase 2: EditableQuestionCell Component (Day 2) **(REVISED)**

**Step 2.1**: Create `components/admin/questionnaires/EditableQuestionCell.tsx`
- Props: `responseId`, `questionId`, `questionType`, `currentValue`, `isRequired`
- Extends existing EditableCell pattern (reuse edit mode logic)
- Render input based on question type:
  - YES_NO → Select dropdown (כן/לא/לא נענה)
  - TEXT → Input (max 500 chars)
  - LONG_TEXT → Textarea (max 2000 chars, 3 rows)
- Individual save button per cell
- Cancel button restores original value

**Step 2.2**: Add validation
- Required field checks (show error, block save)
- Character limits (client-side + server-side)
- Hebrew error messages via toast

**Step 2.3**: Test in isolation
- Create Storybook story or test page
- Test all 3 question types
- Verify edit → save → refresh flow

**Estimated Time**: 5-6 hours

---

### Phase 3: EditableCustomFieldCell Component (Day 3) **(REVISED)**

**Step 3.1**: Create `components/admin/questionnaires/EditableCustomFieldCell.tsx`
- Props: `responseId`, `fieldId`, `fieldType`, `fieldOptions`, `currentValue`, `isRequired`
- Extends EditableCell pattern (same as EditableQuestionCell)
- Render input based on field type:
  - TEXT → Input (max 500)
  - LONG_TEXT → Textarea (max 2000, 3 rows)
  - NUMBER → Input type="number"
  - DATE → Input type="date"
  - SELECT → Select dropdown (options from fieldOptions)

**Step 3.2**: Implement save logic
- Call existing `updateCustomFieldValue()` server action
- Handle success/error responses
- Toast notifications

**Step 3.3**: Test with all field types
- Create test custom fields (all 5 types)
- Verify validation (required, type-specific)
- Test edge cases (null values, empty strings)

**Estimated Time**: 5-6 hours

---

### Phase 4: Table Integration (Day 4) **(REVISED)**

**Step 4.1**: Update `AdminQuestionnaireSubmissions.tsx`
- Fetch questions and custom field definitions on page load
- Generate table columns dynamically:
  - Contact columns (existing)
  - Question columns (map over questions, truncate text to 30 chars)
  - Custom field columns (map over custom fields, use fieldName as-is)
  - Date and actions columns (existing)
- Add tooltip to question headers (full question text on hover)

**Step 4.2**: Render EditableQuestionCell for question columns
- Map over response.answers to render cells
- Handle missing answers (null values)
- Link cell to question via questionId

**Step 4.3**: Render EditableCustomFieldCell for custom field columns
- Map over response.customFieldValues to render cells
- Handle missing values (null for new fields)
- Link cell to field via fieldId

**Step 4.4**: Add sticky first column
- Apply `position: sticky; right: 0;` to name column (RTL)
- Add shadow effect to indicate scroll position
- Test horizontal scrolling behavior

**Estimated Time**: 6-8 hours

---

### Phase 5: Polish, Mobile, Performance (Day 5) **(REVISED)**

**Step 5.1**: Mobile responsiveness
- Test on mobile viewport (375px width)
- Implement horizontal scroll with visible scrollbar
- Consider column visibility toggle (optional: hide less important columns)
- Test touch interactions (tap to edit, swipe to scroll)

**Step 5.2**: Performance optimization
- Lazy rendering for tables with 50+ columns (react-window or similar)
- Debounced edit state updates (reduce re-renders)
- Optimistic UI updates (show changes before server confirms)
- Test with 50 questions + 20 custom fields

**Step 5.3**: UI polish
- Truncate long cell values with ellipsis (20 chars max in view mode)
- Add loading spinner per cell during save
- Success flash animation (green border for 1 second)
- Improve edit button visibility on hover

**Step 5.4**: Cross-browser testing
- Chrome, Firefox, Safari
- Test RTL layout (sticky column, text alignment)
- Test Hebrew font rendering

**Step 5.5**: Accessibility
- Keyboard navigation (Tab through cells, Enter to edit, Esc to cancel)
- Screen reader labels (aria-label on edit buttons)
- Focus indicators (visible outline)

**Estimated Time**: 6-8 hours

---

### Phase 6: Documentation & Testing (Day 6) **(REVISED)**

**Step 6.1**: Write component documentation
- JSDoc comments for EditableQuestionCell and EditableCustomFieldCell
- Document props interfaces with examples
- Add usage notes (when to use, edge cases)

**Step 6.2**: Update CLAUDE.md
- Add "Inline Editing Expansion" section under Questionnaire System
- Document new server actions
- Document new components
- Add table structure diagram

**Step 6.3**: Integration testing (Playwright)
- E2E test: Open submissions page → Edit question answer → Save → Verify
- E2E test: Edit custom field value → Save → Verify
- E2E test: Edit multiple fields → Verify all saved correctly

**Step 6.4**: User acceptance testing
- Test with real admin users (if available)
- Collect feedback on UX (especially horizontal scroll)
- Fix critical issues before merge

**Step 6.5**: Create utility helpers
- `lib/utils/table-helpers.ts`:
  - `truncateQuestionText(text, maxLength = 30)` - Truncate with ellipsis
  - `formatAnswerValue(questionType, value)` - Display "כן/לא" or text
  - `formatCustomFieldValue(fieldType, value)` - Type-specific formatting

**Estimated Time**: 4-5 hours

---

### Total Estimated Time: 30-39 hours (~5-6 working days) **(REVISED)**

**Note**: Slightly longer than original modal approach due to:
- Table column generation logic (dynamic based on questions + custom fields)
- Sticky column implementation (RTL considerations)
- Performance optimization for wide tables (50+ columns)
- Mobile horizontal scroll UX refinement

---

## 8. Validation Requirements

### 8.1 Contact Info Validation

**Full Name**:
- **Type**: String
- **Required**: Yes
- **Min Length**: 1 char
- **Max Length**: 200 chars
- **Validation**: Trim whitespace
- **Error Messages** (Hebrew):
  - Empty: "שם מלא הוא שדה חובה"
  - Too long: "שם מלא לא יכול לעלות על 200 תווים"

**Phone Number**:
- **Type**: String
- **Required**: Yes
- **Format**: Israeli phone regex: `^05\d{8}$` (or with hyphens/spaces)
- **Validation**: Strip non-digits, check length
- **Error Messages**:
  - Empty: "מספר טלפון הוא שדה חובה"
  - Invalid format: "מספר טלפון לא תקין (דוגמה: 0501234567)"

**Email**:
- **Type**: String
- **Required**: Yes
- **Format**: Standard email regex
- **Validation**: Zod email validator
- **Error Messages**:
  - Empty: "אימייל הוא שדה חובה"
  - Invalid format: "כתובת אימייל לא תקינה"

---

### 8.2 Question Answer Validation

**YES_NO Questions**:
- **Type**: Boolean | null
- **Allowed Values**: `true` (כן), `false` (לא), `null` (לא נענה)
- **Required Check**: If `isRequired=true`, must be `true` or `false` (not null)
- **Error Messages**:
  - Required not answered: "שדה חובה - יש לבחור כן או לא"

**TEXT Questions**:
- **Type**: String | null
- **Max Length**: 500 chars
- **Required Check**: If `isRequired=true`, must not be empty/null
- **Validation**: Trim whitespace before checking
- **Error Messages**:
  - Required empty: "שדה חובה - יש למלא תשובה"
  - Too long: "תשובה לא יכולה לעלות על 500 תווים"

**LONG_TEXT Questions**:
- **Type**: String | null
- **Max Length**: 2000 chars
- **Required Check**: If `isRequired=true`, must not be empty/null
- **Validation**: Trim whitespace before checking
- **Error Messages**:
  - Required empty: "שדה חובה - יש למלא תשובה"
  - Too long: "תשובה לא יכולה לעלות על 2000 תווים"

---

### 8.3 Custom Field Validation

**TEXT Fields**:
- **Type**: String | null
- **Max Length**: 500 chars
- **Required Check**: If `isRequired=true`, must not be empty/null
- **Error Messages**:
  - Required empty: "שדה חובה"
  - Too long: "טקסט לא יכול לעלות על 500 תווים"

**LONG_TEXT Fields**:
- **Type**: String | null
- **Max Length**: 2000 chars
- **Required Check**: If `isRequired=true`, must not be empty/null
- **Error Messages**:
  - Required empty: "שדה חובה"
  - Too long: "טקסט לא יכול לעלות על 2000 תווים"

**NUMBER Fields**:
- **Type**: Number | null
- **Validation**: Must be finite number (no NaN, Infinity)
- **Required Check**: If `isRequired=true`, must not be null
- **Error Messages**:
  - Required empty: "שדה חובה"
  - Invalid: "ערך חייב להיות מספר תקין"

**DATE Fields**:
- **Type**: Date | null
- **Format**: ISO8601 string (YYYY-MM-DD) or Date object
- **Validation**: Must be valid date
- **Required Check**: If `isRequired=true`, must not be null
- **Error Messages**:
  - Required empty: "שדה חובה"
  - Invalid: "תאריך לא תקין"

**SELECT Fields**:
- **Type**: String | null
- **Validation**: Must match one of `fieldOptions.options` array
- **Required Check**: If `isRequired=true`, must not be null
- **Error Messages**:
  - Required empty: "שדה חובה - יש לבחור אופציה"
  - Invalid option: "ערך לא קיים ברשימה"

---

### 8.4 Validation Implementation

**Client-Side Validation** (UI):
- Use Zod schemas for all fields
- Validate on blur (not on every keystroke)
- Show validation errors inline (red border + error text)
- Disable save button if validation fails

**Server-Side Validation** (Server Actions):
- Re-validate ALL inputs (never trust client)
- Use same Zod schemas as client
- Return structured error messages
- Log validation failures for debugging

**Example Zod Schema** (for question answers):
```typescript
const questionAnswerSchema = z.object({
  responseId: z.number().int().positive(),
  questionId: z.number().int().positive(),
  value: z.union([
    z.boolean(),
    z.string().max(2000),
    z.null(),
  ]),
});
```

---

## 9. Edge Cases & Considerations

### 9.1 Performance Issues

**Problem 1: Many Questions**
- **Scenario**: Questionnaire with 50 questions
- **Impact**: Dialog becomes very long, slow to render
- **Solution**:
  - Lazy render questions (only visible ones)
  - Use `react-window` or `react-virtual` for virtualized list
  - Or: Paginate questions (10 per page, with next/prev buttons)
  - Or: Keep collapsed by default (user expands to edit)

**Problem 2: Many Custom Fields**
- **Scenario**: 30 custom fields defined
- **Impact**: Long scroll, overwhelming UI
- **Solution**:
  - Group by category (if field categories added in future)
  - Keep custom fields section collapsed by default
  - Add search/filter for fields (if 20+ fields)

**Problem 3: Large Text Values**
- **Scenario**: LONG_TEXT answer with 2000 chars
- **Impact**: Textarea takes up entire screen
- **Solution**:
  - Limit textarea rows to 4-5 initially
  - Add "Expand" button to grow textarea
  - Or: Use modal text editor for long content

**Recommended Limits**:
- **Questions**: No hard limit, use collapsible sections
- **Custom Fields**: Warn if >20 fields, suggest categories
- **Dialog Load Time**: Target <1 second for 50 fields
- **Save Time**: Target <500ms per field

---

### 9.2 Concurrent Edits

**Problem**: Two admins edit same response simultaneously

**Scenario**:
1. Admin A opens quick edit dialog for Response #123
2. Admin B opens same dialog at same time
3. Admin A saves field "Full Name" → "New Name A"
4. Admin B saves field "Full Name" → "New Name B"
5. Result: Last write wins (Admin B's value)

**Solutions**:
- **Option 1**: Optimistic locking (add `version` field to QuestionnaireResponse)
  - Track version number on each update
  - If version mismatch on save, show error: "התשובה עודכנה על ידי מישהו אחר"
  - Refresh dialog data, ask user to re-apply changes

- **Option 2**: Real-time sync (WebSocket)
  - Push updates to all connected admins
  - Show "Admin X is editing this response" indicator
  - Lock fields being edited (collaborative editing)

- **Option 3**: Last-write-wins (current behavior)
  - Accept data loss risk
  - Document in admin guidelines: "Don't edit same response simultaneously"

**Recommendation**: Option 1 (optimistic locking) - good balance of complexity vs safety.

---

### 9.3 Required Field Validation

**Problem**: User leaves required field empty

**Scenario**:
1. Admin edits response, leaves required field empty
2. Admin clicks save
3. What happens?

**Solution**:
- Show validation error: "שדה חובה - יש למלא ערך"
- Do NOT save empty value
- Highlight field with red border
- Keep dialog open (don't close on error)

**Implementation**:
```typescript
if (field.isRequired && !value) {
  toast.error(`${field.fieldName} הוא שדה חובה`);
  return;
}
```

---

### 9.4 Network Errors

**Problem**: Save request fails (network timeout, server error)

**Scenario**:
1. Admin edits field, clicks save
2. Network request fails (500 error, timeout, etc.)
3. What happens to unsaved data?

**Solution**:
- Show error toast: "שגיאה בשמירה - נסה שוב"
- Keep field in edit mode (don't revert value)
- Retry button (optional)
- Log error details for debugging

**Implementation**:
```typescript
try {
  const result = await updateResponseAnswer(...);
  if (!result.success) {
    toast.error(result.error || 'שגיאה בשמירה');
  }
} catch (error) {
  console.error('Network error:', error);
  toast.error('שגיאה בשמירה - בדוק את החיבור לאינטרנט');
}
```

---

### 9.5 Data Integrity

**Problem**: User accidentally deletes important data

**Scenario**:
1. Admin clears TEXT field (deletes content)
2. Admin clicks save
3. Data is lost

**Solutions**:
- **Option 1**: Undo button (30-second window to undo save)
- **Option 2**: History tracking (save old value before update)
- **Option 3**: Confirmation dialog for clearing non-empty fields
- **Option 4**: Accept risk (current inline editing has no undo)

**Recommendation**: Option 2 (history tracking) - audit log already exists for contact info, extend to all fields.

---

### 9.6 Mobile UX

**Problem**: Dialog too large on mobile screens

**Solution**:
- Reduce dialog width on mobile: `max-w-[95vw]`
- Stack fields vertically
- Increase touch target size (buttons min 44x44px)
- Test on iPhone SE (375px width) and up

**Problem**: Keyboard covers inputs on mobile

**Solution**:
- Use `position: fixed` for save buttons (keep visible)
- Or: Use native browser behavior (auto-scroll to input)

---

### 9.7 RTL Layout Issues

**Problem**: Mixed Hebrew/English content breaks alignment

**Solution**:
- Detect language per field (if mostly English, use `dir="ltr"`)
- Use CSS `unicode-bidi: plaintext` for auto-detection
- Test with mixed content (Hebrew + English + numbers)

**Problem**: Date picker shows LTR calendar

**Solution**:
- Use Hebrew locale for date picker (if using library like react-datepicker)
- Or: Use native `<input type="date">` (browser handles locale)

---

### 9.8 Accessibility

**Required for WCAG 2.1 Level AA**:

1. **Keyboard Navigation**:
   - All interactive elements focusable via Tab
   - Focus indicators visible (outline)
   - Enter key saves focused field
   - Esc key closes dialog

2. **Screen Readers**:
   - All inputs have labels (`<Label>` component)
   - Required fields indicated: `aria-required="true"`
   - Validation errors announced: `aria-invalid="true"` + `aria-describedby` pointing to error message
   - Section headings use semantic HTML (`<h3>`)

3. **Color Contrast**:
   - Text on background: min 4.5:1 ratio
   - Error text: red with sufficient contrast (#dc2626)
   - Success feedback: not color-only (icon + toast)

4. **Form Validation**:
   - Errors shown inline (near field)
   - Error message linked to input via `aria-describedby`
   - Focus moved to first error field on validation failure

**Testing Tools**:
- axe DevTools (Chrome extension)
- NVDA or JAWS screen reader
- Keyboard-only testing (no mouse)

---

## 10. Success Criteria

### 10.1 Functional Requirements (Must-Have)

**✅ Criterion 1**: Admin can open quick edit dialog from responses table
- **Test**: Click "עריכה מהירה" button → Dialog opens

**✅ Criterion 2**: Admin can edit contact info (fullName, phoneNumber, email)
- **Test**: Change value, click save → Value persists in database

**✅ Criterion 3**: Admin can edit YES_NO question answers
- **Test**: Change dropdown value, save → Answer persists

**✅ Criterion 4**: Admin can edit TEXT/LONG_TEXT question answers
- **Test**: Edit text, save → Text persists (with character limit enforced)

**✅ Criterion 5**: Admin can edit all custom field types
- **Test**: Edit TEXT, LONG_TEXT, NUMBER, DATE, SELECT → All persist correctly

**✅ Criterion 6**: Validation enforced for all field types
- **Test**: Try to save invalid data → Error shown, save blocked

**✅ Criterion 7**: Required fields enforced
- **Test**: Try to save empty required field → Error shown

**✅ Criterion 8**: Multiple fields editable without closing dialog
- **Test**: Edit 3 different fields, save each → All persist

**✅ Criterion 9**: Dialog works on mobile (375px width)
- **Test**: Open dialog on mobile → Readable, usable, scrollable

**✅ Criterion 10**: Hebrew RTL layout correct
- **Test**: All text right-aligned, inputs flow correctly

---

### 10.2 Performance Requirements

**⚡ Criterion 11**: Dialog opens in <1 second (with 50 fields)
- **Test**: Measure time from button click to dialog rendered
- **Benchmark**: Median <1s, P95 <2s

**⚡ Criterion 12**: Field save completes in <500ms
- **Test**: Measure time from save click to success toast
- **Benchmark**: Median <500ms, P95 <1s

**⚡ Criterion 13**: No UI lag when typing in fields
- **Test**: Type quickly in textarea → No dropped characters
- **Benchmark**: 60fps maintained

---

### 10.3 User Experience Requirements

**🎨 Criterion 14**: Fields grouped by category (Contact, Questions, Custom)
- **Test**: Visual inspection → Three collapsible sections visible

**🎨 Criterion 15**: Field count shown in section headers
- **Test**: "תשובות לשאלות (12)" → Count matches actual number

**🎨 Criterion 16**: Loading state shown while fetching data
- **Test**: Open dialog → Spinner visible until data loaded

**🎨 Criterion 17**: Saving state shown per field
- **Test**: Click save → Button shows "שומר..." with disabled state

**🎨 Criterion 18**: Success feedback shown after save
- **Test**: Save field → Toast notification appears: "הערך נשמר בהצלחה"

**🎨 Criterion 19**: Error feedback shown on validation failure
- **Test**: Save invalid data → Toast notification: "ערך לא תקין"

**🎨 Criterion 20**: Dialog closable via X button and Esc key
- **Test**: Press Esc → Dialog closes

---

### 10.4 Code Quality Requirements

**📝 Criterion 21**: All components have TypeScript types
- **Test**: `npm run type-check` passes

**📝 Criterion 22**: Server actions have input validation (Zod)
- **Test**: Send invalid data → Validation error returned

**📝 Criterion 23**: Components reuse existing patterns (shadcn/ui)
- **Test**: Code review → Uses Dialog, Input, Select, etc. from shadcn

**📝 Criterion 24**: No console errors in browser
- **Test**: Open dialog, edit fields → No errors in DevTools

**📝 Criterion 25**: ESLint checks pass
- **Test**: `npm run lint` passes

---

### 10.5 Testing Requirements

**🧪 Criterion 26**: Unit tests for server actions (>80% coverage)
- **Test**: `npm test` → updateResponseAnswer, getEditableResponseData tested

**🧪 Criterion 27**: Integration tests for dialog (Playwright)
- **Test**: E2E test opens dialog, edits field, verifies save

**🧪 Criterion 28**: Manual testing checklist completed
- **Test**: QA team signs off on all scenarios

---

### 10.6 Accessibility Requirements

**♿ Criterion 29**: All inputs keyboard-navigable
- **Test**: Tab through dialog → All fields reachable

**♿ Criterion 30**: Screen reader announces field labels
- **Test**: Use NVDA → Fields announced correctly

**♿ Criterion 31**: Color contrast meets WCAG AA
- **Test**: axe DevTools → No contrast violations

---

### 10.7 Documentation Requirements

**📚 Criterion 32**: Feature documented in CLAUDE.md
- **Test**: Section exists under "Questionnaire Response Management"

**📚 Criterion 33**: Component props documented (JSDoc)
- **Test**: Hover over component in VS Code → Docs appear

**📚 Criterion 34**: Server action usage examples provided
- **Test**: Code comments include example calls

---

### Definition of Done

**This feature is COMPLETE when**:
- ✅ All 34 criteria above met
- ✅ Code review approved
- ✅ QA testing passed
- ✅ Deployed to staging environment
- ✅ Admin user training completed (if applicable)
- ✅ No critical bugs in issue tracker

---

## 11. Future Enhancements

### 11.1 Bulk Edit Mode

**Description**: Select multiple responses, edit same field across all selected

**Use Case**: Admin wants to mark 10 responses as "סטטוס: טופל"

**Implementation**:
- Checkboxes in responses table
- "עריכה קבוצתית" button appears when 2+ selected
- Dialog shows fields once, applies to all selected responses
- Confirmation: "האם לעדכן X תגובות?"

**Complexity**: Medium (3-4 days)

---

### 11.2 Field-Level History

**Description**: Track changes per field, not just response-level

**Use Case**: Admin wants to see who changed "Status" field and when

**Implementation**:
- New table: `FieldValueHistory` (fieldId, oldValue, newValue, changedBy, changedAt)
- Show history icon next to each field in quick edit dialog
- Click icon → Modal with change log

**Complexity**: Medium (3-5 days)

---

### 11.3 Undo/Redo

**Description**: Undo last save (30-second window)

**Use Case**: Admin accidentally clears important field

**Implementation**:
- Store previous value in-memory (React state)
- Show "Undo" button in toast notification
- Expires after 30 seconds or dialog close

**Complexity**: Low (1-2 days)

---

### 11.4 Real-Time Collaboration

**Description**: See which admins are editing same response

**Use Case**: Prevent conflicting edits

**Implementation**:
- WebSocket connection (Socket.io or Pusher)
- Broadcast "Admin X opened response Y" events
- Show indicator: "Admin B is editing this response"
- Lock fields being edited by others

**Complexity**: High (1-2 weeks)

---

### 11.5 Smart Suggestions

**Description**: Auto-suggest common values for custom fields

**Use Case**: Admin types "תל" → Autocomplete suggests "תל אביב"

**Implementation**:
- Query database for most common values per field
- Show dropdown suggestions as user types
- Use debounced search

**Complexity**: Medium (2-3 days)

---

### 11.6 Export Edited Data

**Description**: Export only edited fields to Excel

**Use Case**: Track changes for reporting

**Implementation**:
- Add filter: "Show only edited responses"
- Export includes: responseId, fieldName, oldValue, newValue, editedBy, editedAt
- CSV or Excel format

**Complexity**: Low (1 day)

---

### 11.7 Mobile App

**Description**: Native iOS/Android app for field editing

**Use Case**: Admins edit responses on-the-go

**Implementation**:
- React Native app
- Reuse same server actions
- Optimized touch UI

**Complexity**: Very High (2-3 months)

---

## Appendix A: Related Files **(REVISED)**

**Existing Files to Reference**:
- `components/admin/questionnaires/AdminQuestionnaireSubmissions.tsx` - **MODIFY**: Add question and custom field columns, render editable cells
- `components/admin/questionnaires/QuestionnaireDetailDialog.tsx` - Reference for data structure (no changes)
- `components/admin/questionnaires/CustomFieldEditor.tsx` - Reference for custom field input rendering (no changes)
- `app/actions/custom-field-actions.ts` - **REUSE**: `updateCustomFieldValue()` already implemented
- `app/actions/questionnaire-actions.ts` - **MODIFY**: Update `getQuestionnaireResponses()` to include answers and custom field values
- `lib/validation/custom-field-validation.ts` - **REUSE**: Validation utilities already implemented

**New Files to Create**:
- `app/actions/questionnaire-response-actions.ts` - NEW server actions:
  - `updateResponseAnswer(responseId, questionId, value)` - Update/create question answer
- `components/admin/questionnaires/EditableQuestionCell.tsx` - NEW component:
  - Inline editable cell for question answers (YES_NO, TEXT, LONG_TEXT)
  - Extends existing EditableCell pattern
- `components/admin/questionnaires/EditableCustomFieldCell.tsx` - NEW component:
  - Inline editable cell for custom field values (all 5 types)
  - Extends existing EditableCell pattern
- `lib/utils/table-helpers.ts` - NEW utility functions:
  - `truncateQuestionText(text, maxLength)` - Truncate with ellipsis
  - `formatAnswerValue(questionType, value)` - Display "כן/לא" or text
  - `formatCustomFieldValue(fieldType, value)` - Type-specific formatting
- `types/questionnaire-edit.ts` - NEW TypeScript types:
  - `EditableQuestionCellProps` - Props for question cell
  - `EditableCustomFieldCellProps` - Props for custom field cell

**Files NO LONGER NEEDED** (from original modal approach):
- ~~`QuickEditDialog.tsx`~~ - Not creating dialog
- ~~`ContactInfoSection.tsx`~~ - Contact info already inline editable
- ~~`QuestionAnswersSection.tsx`~~ - Using table cells instead
- ~~`CustomFieldsSection.tsx`~~ - Using table cells instead

---

## Appendix B: ASCII Diagrams

### Full Dialog Layout (Desktop)
```
┌────────────────────────────────────────────────────────────────────┐
│ עריכה מהירה - יוסי כהן                                  [✕ סגור] │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│ ┌────────────────────────────────────────────────────────────┐    │
│ │ 📋 פרטי קשר                                     [▼ לפתוח] │    │
│ │ ──────────────────────────────────────────────────────────│    │
│ │ שם מלא:    [Input: יוסי כהן]              [שמור]        │    │
│ │ טלפון:     [Input: 0501234567]            [שמור]        │    │
│ │ אימייל:    [Input: yossi@example.com]     [שמור]        │    │
│ └────────────────────────────────────────────────────────────┘    │
│                                                                    │
│ ┌────────────────────────────────────────────────────────────┐    │
│ │ ❓ תשובות לשאלות (5)                           [▲ לסגור] │    │
│ │ ──────────────────────────────────────────────────────────│    │
│ │                                                          │    │
│ │ ┌────────────────────────────────────────────────────┐   │    │
│ │ │ שאלה 1: האם אתה תומך בחוק הגיוס? *             │   │    │
│ │ │ [Dropdown: כן ▼]                   [שמור]       │   │    │
│ │ └────────────────────────────────────────────────────┘   │    │
│ │                                                          │    │
│ │ ┌────────────────────────────────────────────────────┐   │    │
│ │ │ שאלה 2: מדוע?                                   │   │    │
│ │ │ [Textarea: אני תומך כי...]         [שמור]       │   │    │
│ │ └────────────────────────────────────────────────────┘   │    │
│ │                                                          │    │
│ │ ┌────────────────────────────────────────────────────┐   │    │
│ │ │ שאלה 3: מה העיר שלך?                            │   │    │
│ │ │ [Input: תל אביב]                    [שמור]       │   │    │
│ │ └────────────────────────────────────────────────────┘   │    │
│ │                                                          │    │
│ └────────────────────────────────────────────────────────────┘    │
│                                                                    │
│ ┌────────────────────────────────────────────────────────────┐    │
│ │ 🏷️ שדות מותאמים אישית (3)                    [▲ לסגור] │    │
│ │ ──────────────────────────────────────────────────────────│    │
│ │ עיר מגורים: [Dropdown: תל אביב ▼]    [שמור]            │    │
│ │ גיל:        [Input: 35]                [שמור]            │    │
│ │ הערות:      [Textarea: ללא...]         [שמור]            │    │
│ └────────────────────────────────────────────────────────────┘    │
│                                                                    │
│                                                         [סגור] ←   │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Mobile Layout (375px width)
```
┌──────────────────────────┐
│ עריכה מהירה          [✕]│
├──────────────────────────┤
│                          │
│ 📋 פרטי קשר        [▼]  │
│ ─────────────────────    │
│ שם מלא:                 │
│ [Input: יוסי כהן]       │
│ [שמור]                  │
│                          │
│ טלפון:                  │
│ [Input: 0501234567]     │
│ [שמור]                  │
│                          │
│ ❓ תשובות (5)      [▲]  │
│ ─────────────────────    │
│ שאלה 1: האם תומך? *     │
│ [Dropdown: כן ▼]        │
│ [שמור]                  │
│                          │
│ שאלה 2: מדוע?           │
│ [Textarea:              │
│  אני תומך...]           │
│ [שמור]                  │
│                          │
│ 🏷️ שדות (3)       [▲]  │
│ ─────────────────────    │
│ עיר מגורים:             │
│ [Dropdown: ת״א ▼]       │
│ [שמור]                  │
│                          │
│           [סגור]         │
└──────────────────────────┘
```

---

## Appendix C: Questions for Product Owner

Before implementation, clarify:

1. **Priority**: Is this feature high priority? (Estimate: 4-5 days dev time)
2. **Scope**: Should we implement all 3 sections (contact, questions, custom fields) or phase rollout?
3. **Existing Detail Dialog**: Should we keep both dialogs or merge functionality?
4. **Bulk Edit**: Is bulk editing (select multiple responses) in scope for v1?
5. **History Tracking**: Should we add field-level history or reuse existing audit log?
6. **Performance**: What's the maximum expected question count? (Affects virtualization decision)
7. **Mobile**: Is mobile editing a priority? (Affects responsive design effort)
8. **Accessibility**: WCAG 2.1 Level AA required? (Adds testing/remediation time)
9. **Rollout**: Gradual rollout (beta flag) or all admins immediately?
10. **Training**: Do admins need training materials/video?

---

**End of Feature Specification**

---

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2025-12-04 | 1.0 | Initial specification created (modal dialog approach) |
| 2025-12-04 | 2.0 | **MAJOR REVISION**: Changed to table-based inline editing approach per user feedback. Removed modal dialog components, added EditableQuestionCell and EditableCustomFieldCell components. Updated implementation plan, UI/UX design, and component architecture. |

---

## Approval

**Reviewed By**: _________________
**Approved By**: _________________
**Date**: _________________
