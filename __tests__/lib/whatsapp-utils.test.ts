import {
  isValidIsraeliMobile,
  formatMobileForWhatsApp,
  generateWhatsAppURL,
  canContactViaWhatsApp,
  DEFAULT_WHATSAPP_MESSAGE,
} from '@/lib/whatsapp-utils';

describe('WhatsApp Utils', () => {
  describe('isValidIsraeliMobile', () => {
    it('should return true for valid 10-digit local format', () => {
      expect(isValidIsraeliMobile('0501234567')).toBe(true);
      expect(isValidIsraeliMobile('0521234567')).toBe(true);
      expect(isValidIsraeliMobile('0531234567')).toBe(true);
      expect(isValidIsraeliMobile('0541234567')).toBe(true);
      expect(isValidIsraeliMobile('0551234567')).toBe(true);
    });

    it('should return true for valid format with dashes', () => {
      expect(isValidIsraeliMobile('050-123-4567')).toBe(true);
      expect(isValidIsraeliMobile('052-987-6543')).toBe(true);
    });

    it('should return true for valid format with spaces', () => {
      expect(isValidIsraeliMobile('050 123 4567')).toBe(true);
      expect(isValidIsraeliMobile('052 987 6543')).toBe(true);
    });

    it('should return true for valid international format', () => {
      expect(isValidIsraeliMobile('972501234567')).toBe(true);
      expect(isValidIsraeliMobile('+972501234567')).toBe(true);
      expect(isValidIsraeliMobile('+972-50-1234567')).toBe(true);
    });

    it('should return false for null or undefined', () => {
      expect(isValidIsraeliMobile(null)).toBe(false);
      expect(isValidIsraeliMobile(undefined as any)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidIsraeliMobile('')).toBe(false);
      expect(isValidIsraeliMobile('   ')).toBe(false);
    });

    it('should return false for invalid length', () => {
      expect(isValidIsraeliMobile('05012345')).toBe(false); // 8 digits
      expect(isValidIsraeliMobile('050123456')).toBe(false); // 9 digits
      expect(isValidIsraeliMobile('05012345678')).toBe(false); // 11 digits
    });

    it('should return false for invalid prefix', () => {
      expect(isValidIsraeliMobile('0601234567')).toBe(false); // 06X not valid
      expect(isValidIsraeliMobile('0701234567')).toBe(false); // 07X not valid
      expect(isValidIsraeliMobile('1501234567')).toBe(false); // doesn't start with 05
    });

    it('should return false for landline numbers', () => {
      expect(isValidIsraeliMobile('021234567')).toBe(false); // Jerusalem landline
      expect(isValidIsraeliMobile('031234567')).toBe(false); // Tel Aviv landline
      expect(isValidIsraeliMobile('041234567')).toBe(false); // Haifa landline
    });

    it('should return false for invalid international prefix', () => {
      expect(isValidIsraeliMobile('971501234567')).toBe(false); // UAE code
      expect(isValidIsraeliMobile('+1501234567')).toBe(false); // US code
    });
  });

  describe('formatMobileForWhatsApp', () => {
    it('should convert local format to international', () => {
      expect(formatMobileForWhatsApp('0501234567')).toBe('972501234567');
      expect(formatMobileForWhatsApp('0521234567')).toBe('972521234567');
      expect(formatMobileForWhatsApp('0531234567')).toBe('972531234567');
    });

    it('should handle format with dashes', () => {
      expect(formatMobileForWhatsApp('050-123-4567')).toBe('972501234567');
      expect(formatMobileForWhatsApp('052-987-6543')).toBe('972529876543');
    });

    it('should handle format with spaces', () => {
      expect(formatMobileForWhatsApp('050 123 4567')).toBe('972501234567');
      expect(formatMobileForWhatsApp('052 987 6543')).toBe('972529876543');
    });

    it('should handle format with parentheses', () => {
      expect(formatMobileForWhatsApp('(050) 123-4567')).toBe('972501234567');
      expect(formatMobileForWhatsApp('(052) 987 6543')).toBe('972529876543');
    });

    it('should preserve already international format', () => {
      expect(formatMobileForWhatsApp('972501234567')).toBe('972501234567');
      expect(formatMobileForWhatsApp('972521234567')).toBe('972521234567');
    });

    it('should handle international format with plus', () => {
      expect(formatMobileForWhatsApp('+972501234567')).toBe('972501234567');
      expect(formatMobileForWhatsApp('+972-50-1234567')).toBe('972501234567');
    });

    it('should handle mixed format with plus and spaces', () => {
      expect(formatMobileForWhatsApp('+972 50 123 4567')).toBe('972501234567');
      expect(formatMobileForWhatsApp('+972-52-987-6543')).toBe('972529876543');
    });

    it('should handle edge case without leading zero', () => {
      // Fallback: assume local format, remove leading 0
      expect(formatMobileForWhatsApp('501234567')).toBe('972501234567');
    });
  });

  describe('generateWhatsAppURL', () => {
    it('should generate correct URL with local mobile format', () => {
      const url = generateWhatsAppURL('0501234567');
      expect(url).toContain('https://wa.me/972501234567');
      expect(url).toContain('?text=');
    });

    it('should generate correct URL with international format', () => {
      const url = generateWhatsAppURL('972501234567');
      expect(url).toBe(
        `https://wa.me/972501234567?text=${encodeURIComponent(DEFAULT_WHATSAPP_MESSAGE)}`
      );
    });

    it('should URL-encode default Hebrew message', () => {
      const url = generateWhatsAppURL('0501234567');
      // Hebrew characters should be percent-encoded
      expect(url).toContain('%D7%A9%D7%9C%D7%95%D7%9D'); // "שלום" encoded
      expect(url).toContain('%D7%90%D7%A0%D7%99'); // "אני" encoded
    });

    it('should use custom message when provided', () => {
      const customMessage = 'Custom message here';
      const url = generateWhatsAppURL('0501234567', customMessage);
      expect(url).toContain(encodeURIComponent(customMessage));
      expect(url).not.toContain(encodeURIComponent(DEFAULT_WHATSAPP_MESSAGE));
    });

    it('should URL-encode custom Hebrew message', () => {
      const hebrewMessage = 'שלום, זו הודעה מותאמת';
      const url = generateWhatsAppURL('0501234567', hebrewMessage);
      expect(url).toContain(encodeURIComponent(hebrewMessage));
    });

    it('should handle special characters in message', () => {
      const messageWithSpecialChars = 'Hello & goodbye! 50% off?';
      const url = generateWhatsAppURL('0501234567', messageWithSpecialChars);
      expect(url).toContain(encodeURIComponent(messageWithSpecialChars));
      // Verify special chars are encoded
      expect(url).toContain('%26'); // & encoded
      expect(url).toContain('%21'); // ! encoded
      expect(url).toContain('%3F'); // ? encoded
    });

    it('should handle empty message', () => {
      const url = generateWhatsAppURL('0501234567', '');
      expect(url).toBe('https://wa.me/972501234567?text=');
    });

    it('should handle mobile with dashes and spaces', () => {
      const url = generateWhatsAppURL('050-123-4567');
      expect(url).toContain('https://wa.me/972501234567');
    });
  });

  describe('canContactViaWhatsApp', () => {
    it('should return true for coalition member with valid mobile', () => {
      expect(canContactViaWhatsApp(true, '0501234567')).toBe(true);
      expect(canContactViaWhatsApp(true, '972501234567')).toBe(true);
    });

    it('should return false for opposition member even with valid mobile', () => {
      expect(canContactViaWhatsApp(false, '0501234567')).toBe(false);
      expect(canContactViaWhatsApp(false, '972501234567')).toBe(false);
    });

    it('should return false for coalition member without mobile', () => {
      expect(canContactViaWhatsApp(true, null)).toBe(false);
      expect(canContactViaWhatsApp(true, '')).toBe(false);
      expect(canContactViaWhatsApp(true, undefined as any)).toBe(false);
    });

    it('should return false for coalition member with invalid mobile', () => {
      expect(canContactViaWhatsApp(true, '123456')).toBe(false);
      expect(canContactViaWhatsApp(true, 'invalid')).toBe(false);
      expect(canContactViaWhatsApp(true, '021234567')).toBe(false); // landline
    });

    it('should return false when both coalition and mobile are invalid', () => {
      expect(canContactViaWhatsApp(false, null)).toBe(false);
      expect(canContactViaWhatsApp(false, '')).toBe(false);
      expect(canContactViaWhatsApp(false, 'invalid')).toBe(false);
    });

    it('should handle coalition member with mobile in various formats', () => {
      expect(canContactViaWhatsApp(true, '050-123-4567')).toBe(true);
      expect(canContactViaWhatsApp(true, '050 123 4567')).toBe(true);
      expect(canContactViaWhatsApp(true, '+972-50-1234567')).toBe(true);
    });
  });

  describe('DEFAULT_WHATSAPP_MESSAGE', () => {
    it('should be in Hebrew', () => {
      expect(DEFAULT_WHATSAPP_MESSAGE).toContain('שלום');
      expect(DEFAULT_WHATSAPP_MESSAGE).toContain('אני');
      expect(DEFAULT_WHATSAPP_MESSAGE).toContain('חוק הגיוס');
    });

    it('should end with space for continuation', () => {
      expect(DEFAULT_WHATSAPP_MESSAGE).toMatch(/\s$/);
    });

    it('should not be empty', () => {
      expect(DEFAULT_WHATSAPP_MESSAGE.length).toBeGreaterThan(0);
    });
  });
});
