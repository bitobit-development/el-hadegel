/**
 * Coalition and Opposition utilities for the 25th Knesset
 */

// Coalition parties in the 25th Knesset (updated to include הימין הממלכתי)
export const COALITION_PARTIES = [
  'הליכוד',
  'התאחדות הספרדים שומרי תורה תנועתו של מרן הרב עובדיה יוסף זצ"ל',
  'יהדות התורה',
  'הציונות הדתית בראשות בצלאל סמוטריץ\'',
  'עוצמה יהודית בראשות איתמר בן גביר',
  'נעם - בראשות אבי מעוז',
  'הימין הממלכתי',
];

/**
 * Determine if an MK is part of the government coalition based on their faction
 * @param faction - The faction name in Hebrew
 * @returns true if the faction is part of the coalition, false if opposition
 */
export function isCoalitionMember(faction: string): boolean {
  return COALITION_PARTIES.includes(faction);
}

/**
 * Get coalition status label in Hebrew
 * @param faction - The faction name in Hebrew
 * @returns "קואליציה" or "אופוזיציה"
 */
export function getCoalitionStatus(faction: string): 'קואליציה' | 'אופוזיציה' {
  return isCoalitionMember(faction) ? 'קואליציה' : 'אופוזיציה';
}

/**
 * Coalition status type for filtering
 */
export type CoalitionStatus = 'coalition' | 'opposition';

/**
 * Coalition status labels in Hebrew
 */
export const COALITION_STATUS_LABELS: Record<CoalitionStatus, string> = {
  coalition: 'קואליציה',
  opposition: 'אופוזיציה',
};
