# Tweet System - Component Documentation

Complete reference for all UI components in the Tweet Tracking System.

## Component Hierarchy

```
HomePage
└── MKList
    └── MKCard
        ├── TweetIcon (when tweetCount > 0)
        └── TweetsDialog (modal)
            └── TweetsList
                └── TweetCard (for each tweet)
```

## TweetIcon

**File**: `components/TweetIcon.tsx`

**Purpose**: Displays a clickable icon with badge showing tweet count on MK cards.

**Props**:
```typescript
interface TweetIconProps {
  tweetCount: number;  // Number of tweets
  onClick: () => void; // Handler to open dialog
}
```

**Behavior**:
- Only renders if `tweetCount > 0`
- Shows MessageSquare icon (lucide-react)
- Badge displays count
- Blue theme colors
- Hover state with background change

**Example**:
```tsx
<TweetIcon
  tweetCount={5}
  onClick={() => setDialogOpen(true)}
/>
```

**Styling**:
- `hover:bg-blue-50` - Hover background
- `hover:border-blue-300` - Hover border
- `text-blue-600` - Icon color
- `bg-blue-100` - Badge background

---

## TweetCard

**File**: `components/TweetCard.tsx`

**Purpose**: Displays a single tweet with platform badge, date, and content.

**Props**:
```typescript
interface TweetCardProps {
  tweet: TweetData;      // Tweet object
  showMKName?: boolean;  // Show MK name (for admin views)
}
```

**TweetData Type**:
```typescript
interface TweetData {
  id: number;
  mkId: number;
  mkName: string;
  content: string;
  sourceUrl: string | null;
  sourcePlatform: string;
  postedAt: Date;
  createdAt: Date;
}
```

**Layout**:
- Platform badge (right)
- Relative time (left)
- Optional MK name
- Content (right-aligned, preserves whitespace)
- Source link (if sourceUrl exists)

**Example**:
```tsx
<TweetCard
  tweet={tweetData}
  showMKName={false}
/>
```

**Styling**:
- `hover:shadow-md` - Hover effect
- Platform colors from `getPlatformColor()`
- Relative time from `getRelativeTime()`
- Full date tooltip on hover

---

## TweetsList

**File**: `components/TweetsList.tsx`

**Purpose**: Renders a scrollable list of tweets with empty state.

**Props**:
```typescript
interface TweetsListProps {
  tweets: TweetData[];     // Array of tweets
  showMKName?: boolean;    // Show MK names
  emptyMessage?: string;   // Custom empty message
}
```

**Behavior**:
- Shows empty state if no tweets
- Scrollable with max-height 600px
- Renders TweetCard for each tweet
- Gap between cards (space-y-4)

**Empty State**:
- MessageSquareOff icon
- Primary message (customizable)
- Secondary explanatory text

**Example**:
```tsx
<TweetsList
  tweets={tweets}
  showMKName={false}
  emptyMessage="אין הצהרות להצגה"
/>
```

---

## TweetsDialog

**File**: `components/TweetsDialog.tsx`

**Purpose**: Modal dialog that loads and displays MK's tweets.

**Props**:
```typescript
interface TweetsDialogProps {
  mkId: number;     // MK's ID
  mkName: string;   // MK's name (Hebrew)
  isOpen: boolean;  // Dialog open state
  onClose: () => void; // Close handler
}
```

**Behavior**:
- Loads tweets when opened (`useEffect` on `isOpen`)
- Shows loading spinner during fetch
- Renders TweetsList after loading
- Closes on backdrop click, X button, or ESC key

**Data Loading**:
```typescript
useEffect(() => {
  if (isOpen) {
    loadTweets();
  }
}, [isOpen, mkId]);
```

Loads up to 50 tweets via `getMKTweets(mkId, 50)`.

**Example**:
```tsx
<TweetsDialog
  mkId={1}
  mkName="אבי דיכטר"
  isOpen={dialogOpen}
  onClose={() => setDialogOpen(false)}
/>
```

**Styling**:
- `max-w-2xl` - Maximum width
- `max-h-[80vh]` - Maximum height
- `overflow-hidden` - Clean scroll
- RTL direction

---

## Updated: MKCard

**File**: `components/mk-card.tsx`

**Changes**: Added tweet icon and dialog integration.

**New State**:
```typescript
const [dialogOpen, setDialogOpen] = useState(false);
```

**New Props Used**:
```typescript
mk.tweetCount // From MKDataWithTweetCount
```

**Integration**:
```tsx
{mk.tweetCount > 0 && (
  <TweetIcon
    tweetCount={mk.tweetCount}
    onClick={(e) => {
      e.preventDefault();
      setDialogOpen(true);
    }}
  />
)}

<TweetsDialog
  mkId={mk.id}
  mkName={mk.nameHe}
  isOpen={dialogOpen}
  onClose={() => setDialogOpen(false)}
/>
```

**Click Handler**:
```typescript
onClick={(e) => {
  e.preventDefault(); // Prevent navigation to profile
  setDialogOpen(true);
}}
```

---

## Utility Functions

### formatTweetDate

**File**: `lib/tweet-utils.ts`

Formats date in Hebrew using date-fns.

**Signature**:
```typescript
function formatTweetDate(date: Date): string
```

**Example**:
```typescript
formatTweetDate(new Date('2024-01-15T10:30:00Z'))
// Returns: "15 בינואר 2024, 10:30"
```

### getRelativeTime

**File**: `lib/tweet-utils.ts`

Returns relative time in Hebrew.

**Signature**:
```typescript
function getRelativeTime(date: Date): string
```

**Examples**:
```typescript
// Just now
getRelativeTime(new Date()) // "כרגע"

// 30 minutes ago
getRelativeTime(thirtyMinutesAgo) // "לפני 30 דקות"

// 3 hours ago
getRelativeTime(threeHoursAgo) // "לפני 3 שעות"

// 2 days ago
getRelativeTime(twoDaysAgo) // "לפני 2 ימים"
```

### getPlatformColor

**File**: `lib/tweet-utils.ts`

Returns Tailwind color class for platform badge.

**Signature**:
```typescript
function getPlatformColor(platform: string): string
```

**Mappings**:
- Twitter → `bg-blue-500`
- Facebook → `bg-blue-600`
- Instagram → `bg-pink-500`
- News → `bg-gray-700`
- Knesset Website → `bg-blue-700`
- Other → `bg-gray-500`

---

## Styling Conventions

### Colors

- **Primary Blue**: `#0058ff` - Links, icons
- **Accent Green**: `#23b33a` - Success states
- **Platform Colors**: As defined in `getPlatformColor()`
- **Muted**: `text-muted-foreground` - Secondary text

### Typography

- **Font**: Rubik (Hebrew subset)
- **Alignment**: Right-aligned (RTL)
- **Line Height**: `leading-relaxed` for content

### Spacing

- **Card Padding**: `p-4`
- **List Gap**: `space-y-4`
- **Dialog Padding**: `p-6`

### Responsive

- **Mobile**: Full-width, stacked layout
- **Tablet**: Responsive grid
- **Desktop**: Max-width containers

---

## Accessibility

### ARIA Labels

All interactive elements have Hebrew ARIA labels:
```typescript
aria-label={`הצג ${tweetCount} הצהרות`}
```

### Keyboard Navigation

- **Tab**: Move through focusable elements
- **Enter/Space**: Activate buttons
- **ESC**: Close dialog

### Screen Readers

- Proper heading hierarchy
- Descriptive button labels
- Alt text for icons (implicit in lucide-react)

---

## Testing Components

### Manual Testing

See `docs/testing/UI_TESTING_CHECKLIST.md` for comprehensive checklist.

### Browser Testing

Use Playwright MCP tools:
```typescript
// Navigate to homepage
await browser_navigate({ url: 'http://localhost:3000' });

// Click tweet icon
await browser_click({ element: 'Tweet Icon', ref: '...' });

// Verify dialog opens
await browser_snapshot();
```

### Component-Level Testing (Future)

Consider adding Jest/Vitest tests:
```typescript
import { render } from '@testing-library/react';
import { TweetCard } from '@/components/TweetCard';

test('renders tweet content', () => {
  const tweet = { /* mock data */ };
  const { getByText } = render(<TweetCard tweet={tweet} />);
  expect(getByText(tweet.content)).toBeInTheDocument();
});
```

---

## Common Patterns

### Loading States

```tsx
{isLoading ? (
  <div className="flex items-center justify-center py-12">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    <p className="text-sm text-muted-foreground">טוען...</p>
  </div>
) : (
  <Content />
)}
```

### Empty States

```tsx
{items.length === 0 && (
  <div className="flex flex-col items-center justify-center py-12">
    <Icon className="h-16 w-16 text-muted-foreground/30" />
    <p className="text-lg font-medium">אין נתונים</p>
  </div>
)}
```

### Error Handling

```tsx
try {
  const data = await fetchData();
  setData(data);
} catch (error) {
  console.error('Error:', error);
  // Show error state
} finally {
  setLoading(false);
}
```
