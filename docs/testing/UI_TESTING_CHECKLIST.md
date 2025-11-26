# UI Testing Checklist

Manual testing checklist for the Tweet Tracking System UI components.

## Prerequisites
- [ ] Development server running (`pnpm dev`)
- [ ] Database seeded with test data
- [ ] At least one MK has tweets in the database

## MK Card - Tweet Icon

### Display Logic
- [ ] Tweet icon appears ONLY on MK cards with tweetCount > 0
- [ ] Tweet icon does NOT appear on MK cards with tweetCount = 0
- [ ] Tweet count badge shows correct number
- [ ] Icon and badge use blue theme colors

### Interactivity
- [ ] Hovering over tweet icon shows hover state (blue background)
- [ ] Clicking tweet icon does NOT navigate to MK profile
- [ ] Clicking tweet icon opens TweetsDialog modal

## Tweets Dialog

### Opening/Closing
- [ ] Dialog opens when clicking tweet icon
- [ ] Dialog shows loading spinner immediately
- [ ] Loading text displays: "טוען הצהרות..."
- [ ] Dialog can be closed by clicking X button
- [ ] Dialog can be closed by clicking outside (backdrop)
- [ ] Dialog can be closed by pressing ESC key

### Header
- [ ] Dialog title shows: "הצהרות ופוסטים - [MK Name]"
- [ ] Dialog description mentions the MK's name
- [ ] Text is right-aligned (RTL)

### Content - With Tweets
- [ ] Tweets load and display after loading completes
- [ ] Tweets appear in chronological order (newest first)
- [ ] Scrollbar appears when content exceeds max height (600px)
- [ ] All tweets for the MK are shown

### Content - No Tweets
- [ ] Empty state shows icon (MessageSquareOff)
- [ ] Empty message displays: "לא נמצאו הצהרות עבור [MK Name]"
- [ ] Secondary message explains that new tweets will appear here

## Tweet Card

### Layout
- [ ] Platform badge appears on the right
- [ ] Platform badge has correct color (Twitter=blue, News=gray, etc.)
- [ ] Relative time appears on the left ("לפני X שעות")
- [ ] Hovering over time shows full date tooltip
- [ ] Content text is right-aligned
- [ ] Content preserves line breaks (whitespace-pre-wrap)

### Platform Badges
Test with different platforms:
- [ ] Twitter - Blue badge
- [ ] Facebook - Blue badge (darker)
- [ ] Instagram - Pink badge
- [ ] News - Gray badge
- [ ] Knesset Website - Dark blue badge
- [ ] Other - Gray badge

### Source Link
- [ ] "צפה במקור" link appears when sourceUrl exists
- [ ] Link does NOT appear when sourceUrl is null
- [ ] Link opens in new tab (target="_blank")
- [ ] External link icon appears before text
- [ ] Link has blue color and underline on hover

### Hover Effects
- [ ] Card shadow increases on hover
- [ ] Hover transition is smooth

## Tweets List

### With Multiple Tweets
- [ ] Tweets display in a vertical list
- [ ] Spacing between cards is consistent
- [ ] List is scrollable when exceeding max height
- [ ] Scroll behavior is smooth

### Empty State
- [ ] Icon (MessageSquareOff) displays in center
- [ ] Primary message shows
- [ ] Secondary message explains future behavior
- [ ] Text is center-aligned
- [ ] Text color is muted

## Responsive Design

### Desktop (≥1024px)
- [ ] Dialog is max-width 2xl (672px)
- [ ] All content is readable
- [ ] Spacing is appropriate

### Tablet (768px-1023px)
- [ ] Dialog adjusts to available width
- [ ] Tweet cards remain readable
- [ ] No horizontal scrolling

### Mobile (≤767px)
- [ ] Dialog fills most of screen width
- [ ] Dialog max height is 80vh
- [ ] Tweet cards stack vertically
- [ ] Touch scrolling works smoothly
- [ ] Text remains readable at small sizes

## RTL (Right-to-Left) Layout

- [ ] All text aligns to the right
- [ ] Icons appear on correct side (left for external links)
- [ ] Dialog header text is right-aligned
- [ ] Platform badges appear on the right
- [ ] Time/date appears on the left
- [ ] Scroll bar appears on the left (browser-dependent)

## Accessibility

### Keyboard Navigation
- [ ] Tab key moves focus to tweet icon button
- [ ] Enter/Space opens dialog when icon focused
- [ ] Tab key moves through dialog elements
- [ ] ESC key closes dialog
- [ ] Focus returns to trigger button after closing

### Screen Readers
- [ ] Tweet icon has aria-label: "הצג X הצהרות"
- [ ] Dialog has proper ARIA attributes
- [ ] Content is announced correctly

## Performance

- [ ] Dialog opens within 200ms
- [ ] Tweets load within 500ms (for <50 tweets)
- [ ] No layout shift when tweets load
- [ ] Smooth scrolling in tweet list
- [ ] No memory leaks when opening/closing multiple times

## Edge Cases

### Long Content
- [ ] Very long tweet content wraps correctly
- [ ] Content doesn't break card layout
- [ ] Long MK names don't overflow

### Special Characters
- [ ] Hebrew text displays correctly
- [ ] Emojis display correctly
- [ ] URLs in content don't break layout

### Network Issues
- [ ] Loading state shows if fetch is slow
- [ ] Error handling (if fetch fails)

## Integration with Homepage

- [ ] MK cards fetch with tweet counts included
- [ ] Tweet counts match database
- [ ] Opening dialog doesn't affect page layout
- [ ] Multiple dialogs can be opened/closed in sequence
- [ ] Page remains scrollable when dialog is open

## Browser Compatibility

Test in:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

## Summary

- Total Items: ~90
- Passed: ___
- Failed: ___
- Blocked: ___

### Issues Found

1.
2.
3.

### Notes
