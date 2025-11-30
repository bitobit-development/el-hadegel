/**
 * Coalition Membership Tracker
 *
 * Maintains the current government coalition composition.
 * Update this array when coalition membership changes.
 *
 * Last Updated: 2025-11-30
 * Current Government: 37th Government of Israel (2022-present)
 *
 * @see https://main.knesset.gov.il/mk/government/pages/currentgovernment.aspx
 */

/**
 * List of factions that are part of the current government coalition
 */
export const COALITION_FACTIONS = [
  'הליכוד',
  'התאחדות הספרדים שומרי תורה תנועתו של מרן הרב עובדיה יוסף זצ"ל',
  'יהדות התורה',
  'הציונות הדתית בראשות בצלאל סמוטריץ\'',
  'עוצמה יהודית בראשות איתמר בן גביר',
  'נעם - בראשות אבי מעוז',
] as const;

/**
 * Determines if an MK faction is part of the government coalition
 *
 * @param faction - The MK's faction name
 * @returns true if coalition member, false if opposition
 */
export function isCoalitionMember(faction: string): boolean {
  const normalized = faction.trim();
  return COALITION_FACTIONS.some(
    (f) => f.trim().toLowerCase() === normalized.toLowerCase()
  );
}

/**
 * Coalition status type for filtering
 */
export type CoalitionStatus = 'coalition' | 'opposition';

/**
 * Hebrew labels for coalition status
 */
export const COALITION_LABELS: Record<CoalitionStatus, string> = {
  coalition: 'קואליציה',
  opposition: 'אופוזיציה',
};
