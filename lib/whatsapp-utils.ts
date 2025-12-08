/**
 * WhatsApp Utility Functions for Coalition MK Messaging
 * Handles Israeli mobile number formatting and WhatsApp URL generation
 */

/**
 * Default Hebrew message for WhatsApp
 * Can be customized by user before sending
 */
export const DEFAULT_WHATSAPP_MESSAGE =
  'שלום, אני פונה אליך בנושא חוק הגיוס. ';

/**
 * Validates Israeli mobile number format
 * @param mobile - Israeli mobile number (format: 05XXXXXXXX or 050-XXX-XXXX)
 * @returns true if valid Israeli mobile format
 *
 * Valid formats:
 * - 0501234567 (10 digits)
 * - 050-123-4567 (with dashes)
 * - +972-50-1234567 (international)
 */
export function isValidIsraeliMobile(mobile: string | null): boolean {
  if (!mobile) return false;

  // Remove all non-digit characters
  const digits = mobile.replace(/\D/g, '');

  // Check if starts with 972 (international) or 05 (local)
  const isInternational = digits.startsWith('972') && digits.length === 12;
  const isLocal = digits.startsWith('05') && digits.length === 10;

  return isInternational || isLocal;
}

/**
 * Formats Israeli mobile number for WhatsApp international format
 * @param mobile - Israeli mobile number
 * @returns Formatted number (e.g., "972501234567")
 *
 * Examples:
 * - "0501234567" → "972501234567"
 * - "050-123-4567" → "972501234567"
 * - "+972501234567" → "972501234567"
 */
export function formatMobileForWhatsApp(mobile: string): string {
  // Remove all non-digit characters
  const digits = mobile.replace(/\D/g, '');

  // If already in international format (starts with 972)
  if (digits.startsWith('972')) {
    return digits;
  }

  // If in local format (starts with 05)
  if (digits.startsWith('05')) {
    // Remove leading 0, add 972
    return '972' + digits.slice(1);
  }

  // Fallback: assume local format, remove leading 0
  return '972' + digits.replace(/^0/, '');
}

/**
 * Generates WhatsApp Web/App URL with pre-filled message
 * @param mobile - Israeli mobile number
 * @param message - Optional custom message (defaults to DEFAULT_WHATSAPP_MESSAGE)
 * @returns WhatsApp URL
 *
 * Format: https://wa.me/972XXXXXXXXX?text=encoded_message
 */
export function generateWhatsAppURL(
  mobile: string,
  message: string = DEFAULT_WHATSAPP_MESSAGE
): string {
  const formattedMobile = formatMobileForWhatsApp(mobile);
  const encodedMessage = encodeURIComponent(message);

  return `https://wa.me/${formattedMobile}?text=${encodedMessage}`;
}

/**
 * Validates if MK is eligible for WhatsApp contact
 * @param isCoalition - Whether MK is coalition member
 * @param mobileNumber - MK's mobile number
 * @returns true if WhatsApp icon should be shown
 */
export function canContactViaWhatsApp(
  isCoalition: boolean,
  mobileNumber: string | null
): boolean {
  return isCoalition && isValidIsraeliMobile(mobileNumber);
}
