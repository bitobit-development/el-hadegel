/**
 * Unit Tests for Custom Field Validation
 * Tests all validation functions with comprehensive edge cases
 */

import { describe, it, expect } from '@jest/globals';
import {
  CustomFieldType,
  customFieldDefinitionSchema,
  updateCustomFieldDefinitionSchema,
  validateCustomFieldValue,
  prepareValueData,
  extractFieldValue,
  type CustomFieldTypeValue,
} from '@/lib/validation/custom-field-validation';

describe('Custom Field Validation', () => {
  describe('customFieldDefinitionSchema', () => {
    it('validates valid TEXT field definition', () => {
      const validData = {
        questionnaireId: 1,
        fieldName: 'עיר מגורים',
        fieldType: CustomFieldType.TEXT as CustomFieldTypeValue,
        isRequired: false,
      };

      const result = customFieldDefinitionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('validates valid SELECT field with options', () => {
      const validData = {
        questionnaireId: 1,
        fieldName: 'מצב משפחתי',
        fieldType: CustomFieldType.SELECT as CustomFieldTypeValue,
        fieldOptions: ['רווק/ה', 'נשוי/אה', 'גרוש/ה'],
        isRequired: true,
      };

      const result = customFieldDefinitionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects SELECT field without options', () => {
      const invalidData = {
        questionnaireId: 1,
        fieldName: 'בחירה',
        fieldType: CustomFieldType.SELECT as CustomFieldTypeValue,
        isRequired: false,
      };

      const result = customFieldDefinitionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('עבור שדה מסוג בחירה');
      }
    });

    it('rejects invalid questionnaireId (negative)', () => {
      const invalidData = {
        questionnaireId: -1,
        fieldName: 'שדה',
        fieldType: CustomFieldType.TEXT as CustomFieldTypeValue,
        isRequired: false,
      };

      const result = customFieldDefinitionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects empty field name', () => {
      const invalidData = {
        questionnaireId: 1,
        fieldName: '',
        fieldType: CustomFieldType.TEXT as CustomFieldTypeValue,
        isRequired: false,
      };

      const result = customFieldDefinitionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects field name exceeding 200 characters', () => {
      const invalidData = {
        questionnaireId: 1,
        fieldName: 'א'.repeat(201),
        fieldType: CustomFieldType.TEXT as CustomFieldTypeValue,
        isRequired: false,
      };

      const result = customFieldDefinitionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('accepts defaultValue within 500 character limit', () => {
      const validData = {
        questionnaireId: 1,
        fieldName: 'שדה',
        fieldType: CustomFieldType.TEXT as CustomFieldTypeValue,
        defaultValue: 'ערך ברירת מחדל',
        isRequired: false,
      };

      const result = customFieldDefinitionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('updateCustomFieldDefinitionSchema', () => {
    it('allows partial updates', () => {
      const partialData = {
        fieldName: 'שם חדש',
      };

      const result = updateCustomFieldDefinitionSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });

    it('validates field type change', () => {
      const partialData = {
        fieldType: CustomFieldType.NUMBER as CustomFieldTypeValue,
      };

      const result = updateCustomFieldDefinitionSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });
  });

  describe('validateCustomFieldValue', () => {
    describe('TEXT field validation', () => {
      it('accepts valid text', () => {
        const result = validateCustomFieldValue(
          CustomFieldType.TEXT as CustomFieldTypeValue,
          'תל אביב',
          false
        );
        expect(result.valid).toBe(true);
      });

      it('rejects text exceeding 500 characters', () => {
        const longText = 'א'.repeat(501);
        const result = validateCustomFieldValue(
          CustomFieldType.TEXT as CustomFieldTypeValue,
          longText,
          false
        );
        expect(result.valid).toBe(false);
        expect(result.error).toContain('500 תווים');
      });

      it('rejects non-string value', () => {
        const result = validateCustomFieldValue(
          CustomFieldType.TEXT as CustomFieldTypeValue,
          123 as any,
          false
        );
        expect(result.valid).toBe(false);
        expect(result.error).toContain('טקסט');
      });

      it('rejects empty required field', () => {
        const result = validateCustomFieldValue(
          CustomFieldType.TEXT as CustomFieldTypeValue,
          '',
          true
        );
        expect(result.valid).toBe(false);
        expect(result.error).toContain('שדה חובה');
      });

      it('accepts empty non-required field', () => {
        const result = validateCustomFieldValue(
          CustomFieldType.TEXT as CustomFieldTypeValue,
          '',
          false
        );
        expect(result.valid).toBe(true);
      });
    });

    describe('LONG_TEXT field validation', () => {
      it('accepts valid long text', () => {
        const result = validateCustomFieldValue(
          CustomFieldType.LONG_TEXT as CustomFieldTypeValue,
          'הערה ארוכה עם תוכן מרובה'.repeat(10),
          false
        );
        expect(result.valid).toBe(true);
      });

      it('rejects text exceeding 2000 characters', () => {
        const veryLongText = 'א'.repeat(2001);
        const result = validateCustomFieldValue(
          CustomFieldType.LONG_TEXT as CustomFieldTypeValue,
          veryLongText,
          false
        );
        expect(result.valid).toBe(false);
        expect(result.error).toContain('2000 תווים');
      });
    });

    describe('NUMBER field validation', () => {
      it('accepts valid integer', () => {
        const result = validateCustomFieldValue(
          CustomFieldType.NUMBER as CustomFieldTypeValue,
          35,
          false
        );
        expect(result.valid).toBe(true);
      });

      it('accepts valid decimal', () => {
        const result = validateCustomFieldValue(
          CustomFieldType.NUMBER as CustomFieldTypeValue,
          35.5,
          false
        );
        expect(result.valid).toBe(true);
      });

      it('accepts numeric string', () => {
        const result = validateCustomFieldValue(
          CustomFieldType.NUMBER as CustomFieldTypeValue,
          '42',
          false
        );
        expect(result.valid).toBe(true);
      });

      it('rejects non-numeric string', () => {
        const result = validateCustomFieldValue(
          CustomFieldType.NUMBER as CustomFieldTypeValue,
          'not a number',
          false
        );
        expect(result.valid).toBe(false);
        expect(result.error).toContain('מספר תקין');
      });

      it('rejects Infinity', () => {
        const result = validateCustomFieldValue(
          CustomFieldType.NUMBER as CustomFieldTypeValue,
          Infinity,
          false
        );
        expect(result.valid).toBe(false);
        expect(result.error).toContain('לא תקין');
      });

      it('rejects NaN', () => {
        const result = validateCustomFieldValue(
          CustomFieldType.NUMBER as CustomFieldTypeValue,
          NaN,
          false
        );
        expect(result.valid).toBe(false);
        expect(result.error).toContain('מספר תקין');
      });
    });

    describe('DATE field validation', () => {
      it('accepts valid Date object', () => {
        const result = validateCustomFieldValue(
          CustomFieldType.DATE as CustomFieldTypeValue,
          new Date('1989-05-15'),
          false
        );
        expect(result.valid).toBe(true);
      });

      it('accepts valid ISO date string', () => {
        const result = validateCustomFieldValue(
          CustomFieldType.DATE as CustomFieldTypeValue,
          '1989-05-15',
          false
        );
        expect(result.valid).toBe(true);
      });

      it('rejects invalid date string', () => {
        const result = validateCustomFieldValue(
          CustomFieldType.DATE as CustomFieldTypeValue,
          'not-a-date',
          false
        );
        expect(result.valid).toBe(false);
        expect(result.error).toContain('תאריך');
      });

      it('rejects non-date value', () => {
        const result = validateCustomFieldValue(
          CustomFieldType.DATE as CustomFieldTypeValue,
          123 as any,
          false
        );
        expect(result.valid).toBe(false);
        expect(result.error).toContain('תאריך');
      });
    });

    describe('SELECT field validation', () => {
      const options = ['רווק/ה', 'נשוי/אה', 'גרוש/ה'];

      it('accepts valid option', () => {
        const result = validateCustomFieldValue(
          CustomFieldType.SELECT as CustomFieldTypeValue,
          'נשוי/אה',
          false,
          options
        );
        expect(result.valid).toBe(true);
      });

      it('rejects invalid option', () => {
        const result = validateCustomFieldValue(
          CustomFieldType.SELECT as CustomFieldTypeValue,
          'אלמן/ה',
          false,
          options
        );
        expect(result.valid).toBe(false);
        expect(result.error).toContain('אחת מהאופציות');
      });

      it('rejects when no options provided', () => {
        const result = validateCustomFieldValue(
          CustomFieldType.SELECT as CustomFieldTypeValue,
          'רווק/ה',
          false,
          null
        );
        expect(result.valid).toBe(false);
        expect(result.error).toContain('אופציות בחירה');
      });

      it('rejects non-string value', () => {
        const result = validateCustomFieldValue(
          CustomFieldType.SELECT as CustomFieldTypeValue,
          123 as any,
          false,
          options
        );
        expect(result.valid).toBe(false);
        expect(result.error).toContain('טקסט');
      });
    });

    describe('null/undefined/empty handling', () => {
      it('accepts null for non-required field', () => {
        const result = validateCustomFieldValue(
          CustomFieldType.TEXT as CustomFieldTypeValue,
          null,
          false
        );
        expect(result.valid).toBe(true);
      });

      it('accepts undefined for non-required field', () => {
        const result = validateCustomFieldValue(
          CustomFieldType.TEXT as CustomFieldTypeValue,
          undefined,
          false
        );
        expect(result.valid).toBe(true);
      });

      it('rejects null for required field', () => {
        const result = validateCustomFieldValue(
          CustomFieldType.TEXT as CustomFieldTypeValue,
          null,
          true
        );
        expect(result.valid).toBe(false);
        expect(result.error).toContain('שדה חובה');
      });
    });
  });

  describe('prepareValueData', () => {
    it('prepares TEXT value correctly', () => {
      const result = prepareValueData(
        CustomFieldType.TEXT as CustomFieldTypeValue,
        'תל אביב'
      );
      expect(result.textValue).toBe('תל אביב');
      expect(result.numberValue).toBeNull();
      expect(result.dateValue).toBeNull();
    });

    it('prepares LONG_TEXT value correctly', () => {
      const longText = 'הערה ארוכה';
      const result = prepareValueData(
        CustomFieldType.LONG_TEXT as CustomFieldTypeValue,
        longText
      );
      expect(result.textValue).toBe(longText);
      expect(result.numberValue).toBeNull();
      expect(result.dateValue).toBeNull();
    });

    it('prepares NUMBER value correctly from number', () => {
      const result = prepareValueData(
        CustomFieldType.NUMBER as CustomFieldTypeValue,
        35
      );
      expect(result.textValue).toBeNull();
      expect(result.numberValue).toBe(35);
      expect(result.dateValue).toBeNull();
    });

    it('prepares NUMBER value correctly from string', () => {
      const result = prepareValueData(
        CustomFieldType.NUMBER as CustomFieldTypeValue,
        '42'
      );
      expect(result.textValue).toBeNull();
      expect(result.numberValue).toBe(42);
      expect(result.dateValue).toBeNull();
    });

    it('prepares DATE value correctly from Date object', () => {
      const date = new Date('1989-05-15');
      const result = prepareValueData(
        CustomFieldType.DATE as CustomFieldTypeValue,
        date
      );
      expect(result.textValue).toBeNull();
      expect(result.numberValue).toBeNull();
      expect(result.dateValue).toEqual(date);
    });

    it('prepares DATE value correctly from string', () => {
      const result = prepareValueData(
        CustomFieldType.DATE as CustomFieldTypeValue,
        '1989-05-15'
      );
      expect(result.textValue).toBeNull();
      expect(result.numberValue).toBeNull();
      expect(result.dateValue).toEqual(new Date('1989-05-15'));
    });

    it('prepares SELECT value correctly', () => {
      const result = prepareValueData(
        CustomFieldType.SELECT as CustomFieldTypeValue,
        'נשוי/אה'
      );
      expect(result.textValue).toBe('נשוי/אה');
      expect(result.numberValue).toBeNull();
      expect(result.dateValue).toBeNull();
    });

    it('handles null value', () => {
      const result = prepareValueData(
        CustomFieldType.TEXT as CustomFieldTypeValue,
        null
      );
      expect(result.textValue).toBeNull();
      expect(result.numberValue).toBeNull();
      expect(result.dateValue).toBeNull();
    });

    it('handles undefined value', () => {
      const result = prepareValueData(
        CustomFieldType.TEXT as CustomFieldTypeValue,
        undefined
      );
      expect(result.textValue).toBeNull();
      expect(result.numberValue).toBeNull();
      expect(result.dateValue).toBeNull();
    });

    it('handles empty string', () => {
      const result = prepareValueData(
        CustomFieldType.TEXT as CustomFieldTypeValue,
        ''
      );
      expect(result.textValue).toBeNull();
      expect(result.numberValue).toBeNull();
      expect(result.dateValue).toBeNull();
    });
  });

  describe('extractFieldValue', () => {
    it('extracts TEXT value correctly', () => {
      const valueRecord = {
        textValue: 'תל אביב',
        numberValue: null,
        dateValue: null,
      };
      const result = extractFieldValue(
        CustomFieldType.TEXT as CustomFieldTypeValue,
        valueRecord
      );
      expect(result).toBe('תל אביב');
    });

    it('extracts LONG_TEXT value correctly', () => {
      const valueRecord = {
        textValue: 'הערה ארוכה',
        numberValue: null,
        dateValue: null,
      };
      const result = extractFieldValue(
        CustomFieldType.LONG_TEXT as CustomFieldTypeValue,
        valueRecord
      );
      expect(result).toBe('הערה ארוכה');
    });

    it('extracts NUMBER value correctly', () => {
      const valueRecord = {
        textValue: null,
        numberValue: 35,
        dateValue: null,
      };
      const result = extractFieldValue(
        CustomFieldType.NUMBER as CustomFieldTypeValue,
        valueRecord
      );
      expect(result).toBe(35);
    });

    it('extracts DATE value correctly', () => {
      const date = new Date('1989-05-15');
      const valueRecord = {
        textValue: null,
        numberValue: null,
        dateValue: date,
      };
      const result = extractFieldValue(
        CustomFieldType.DATE as CustomFieldTypeValue,
        valueRecord
      );
      expect(result).toEqual(date);
    });

    it('extracts SELECT value correctly', () => {
      const valueRecord = {
        textValue: 'נשוי/אה',
        numberValue: null,
        dateValue: null,
      };
      const result = extractFieldValue(
        CustomFieldType.SELECT as CustomFieldTypeValue,
        valueRecord
      );
      expect(result).toBe('נשוי/אה');
    });

    it('returns null for empty value record', () => {
      const valueRecord = {
        textValue: null,
        numberValue: null,
        dateValue: null,
      };
      const result = extractFieldValue(
        CustomFieldType.TEXT as CustomFieldTypeValue,
        valueRecord
      );
      expect(result).toBeNull();
    });
  });
});
