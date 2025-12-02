/**
 * Validation Schemas for Custom Fields System
 * Uses Zod for type-safe validation with Hebrew error messages
 */

import { z } from 'zod';

/**
 * CustomFieldType enum (matches Prisma schema)
 * Export for TypeScript usage
 */
export const CustomFieldType = {
  TEXT: 'TEXT',
  LONG_TEXT: 'LONG_TEXT',
  NUMBER: 'NUMBER',
  DATE: 'DATE',
  SELECT: 'SELECT',
} as const;

export type CustomFieldTypeValue = typeof CustomFieldType[keyof typeof CustomFieldType];

/**
 * Custom Field Type Schema
 */
const CustomFieldTypeSchema = z.enum(['TEXT', 'LONG_TEXT', 'NUMBER', 'DATE', 'SELECT'], {
  message: 'סוג שדה לא תקין',
});

/**
 * Custom Field Definition Schema
 * For creating new custom field definitions
 */
export const customFieldDefinitionSchema = z
  .object({
    questionnaireId: z
      .number()
      .int('מזהה שאלון חייב להיות מספר שלם')
      .positive('מזהה שאלון חייב להיות חיובי'),
    fieldName: z
      .string()
      .min(1, 'שם שדה חייב להכיל לפחות תו אחד')
      .max(200, 'שם שדה לא יכול לעלות על 200 תווים')
      .trim(),
    fieldType: CustomFieldTypeSchema,
    fieldOptions: z
      .array(z.string().min(1, 'אופציה לא יכולה להיות ריקה'))
      .min(1, 'יש לספק לפחות אופציה אחת עבור שדה בחירה')
      .max(100, 'לא ניתן להגדיר יותר מ-100 אופציות')
      .optional()
      .nullable(),
    isRequired: z.boolean().default(false),
    defaultValue: z.string().max(500, 'ערך ברירת מחדל לא יכול לעלות על 500 תווים').optional().nullable(),
  })
  .refine(
    (data) => {
      // If fieldType is SELECT, fieldOptions must be provided
      if (data.fieldType === 'SELECT') {
        return data.fieldOptions && data.fieldOptions.length > 0;
      }
      return true;
    },
    {
      message: 'עבור שדה מסוג בחירה חייב להגדיר אופציות',
      path: ['fieldOptions'],
    }
  );

export type CustomFieldDefinitionInput = z.infer<typeof customFieldDefinitionSchema>;

/**
 * Update Custom Field Definition Schema
 * Partial schema for updating existing fields
 */
export const updateCustomFieldDefinitionSchema = customFieldDefinitionSchema
  .omit({ questionnaireId: true })
  .partial();

export type CustomFieldDefinitionUpdate = z.infer<typeof updateCustomFieldDefinitionSchema>;

/**
 * Custom Field Value Schema
 * For validating individual field values
 */
export const customFieldValueSchema = z.object({
  fieldId: z
    .number()
    .int('מזהה שדה חייב להיות מספר שלם')
    .positive('מזהה שדה חייב להיות חיובי'),
  value: z.union([z.string(), z.number(), z.date(), z.null()]),
});

export type CustomFieldValueInput = z.infer<typeof customFieldValueSchema>;

/**
 * Validate custom field value based on field type
 * Returns validation result with error message if invalid
 */
export function validateCustomFieldValue(
  fieldType: CustomFieldTypeValue,
  value: string | number | Date | null | undefined,
  isRequired: boolean,
  fieldOptions?: string[] | null
): { valid: boolean; error?: string } {
  // Handle required field validation
  if (isRequired && (value === null || value === undefined || value === '')) {
    return { valid: false, error: 'שדה זה הינו שדה חובה' };
  }

  // Allow null/undefined for non-required fields
  if (!isRequired && (value === null || value === undefined || value === '')) {
    return { valid: true };
  }

  // Type-specific validation
  switch (fieldType) {
    case CustomFieldType.TEXT: {
      if (typeof value !== 'string') {
        return { valid: false, error: 'ערך חייב להיות טקסט' };
      }
      if (value.length > 500) {
        return { valid: false, error: 'טקסט לא יכול לעלות על 500 תווים' };
      }
      return { valid: true };
    }

    case CustomFieldType.LONG_TEXT: {
      if (typeof value !== 'string') {
        return { valid: false, error: 'ערך חייב להיות טקסט' };
      }
      if (value.length > 2000) {
        return { valid: false, error: 'טקסט לא יכול לעלות על 2000 תווים' };
      }
      return { valid: true };
    }

    case CustomFieldType.NUMBER: {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (typeof numValue !== 'number' || isNaN(numValue)) {
        return { valid: false, error: 'ערך חייב להיות מספר תקין' };
      }
      if (!isFinite(numValue)) {
        return { valid: false, error: 'ערך מספרי לא תקין' };
      }
      return { valid: true };
    }

    case CustomFieldType.DATE: {
      let dateValue: Date;

      if (typeof value === 'string') {
        dateValue = new Date(value);
      } else if (value instanceof Date) {
        dateValue = value;
      } else {
        return { valid: false, error: 'ערך חייב להיות תאריך תקין' };
      }

      if (isNaN(dateValue.getTime())) {
        return { valid: false, error: 'תאריך לא תקין' };
      }
      return { valid: true };
    }

    case CustomFieldType.SELECT: {
      if (typeof value !== 'string') {
        return { valid: false, error: 'ערך חייב להיות טקסט' };
      }
      if (!fieldOptions || fieldOptions.length === 0) {
        return { valid: false, error: 'אופציות בחירה לא הוגדרו' };
      }
      if (!fieldOptions.includes(value)) {
        return {
          valid: false,
          error: `ערך חייב להיות אחת מהאופציות: ${fieldOptions.join(', ')}`,
        };
      }
      return { valid: true };
    }

    default:
      return { valid: false, error: 'סוג שדה לא ידוע' };
  }
}

/**
 * Prepare value data object based on field type
 * Returns the correct value field (textValue, numberValue, or dateValue)
 */
export function prepareValueData(
  fieldType: CustomFieldTypeValue,
  value: string | number | Date | null | undefined
): {
  textValue?: string | null;
  numberValue?: number | null;
  dateValue?: Date | null;
} {
  if (value === null || value === undefined || value === '') {
    return {
      textValue: null,
      numberValue: null,
      dateValue: null,
    };
  }

  switch (fieldType) {
    case CustomFieldType.TEXT:
    case CustomFieldType.LONG_TEXT:
    case CustomFieldType.SELECT:
      return {
        textValue: String(value),
        numberValue: null,
        dateValue: null,
      };

    case CustomFieldType.NUMBER: {
      const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
      return {
        textValue: null,
        numberValue: numValue,
        dateValue: null,
      };
    }

    case CustomFieldType.DATE: {
      const dateValue = typeof value === 'string' ? new Date(value) : value instanceof Date ? value : null;
      return {
        textValue: null,
        numberValue: null,
        dateValue: dateValue,
      };
    }

    default:
      return {
        textValue: null,
        numberValue: null,
        dateValue: null,
      };
  }
}

/**
 * Extract value from CustomFieldValue based on field type
 * Returns the actual value regardless of storage column
 */
export function extractFieldValue(
  fieldType: CustomFieldTypeValue,
  valueRecord: {
    textValue?: string | null;
    numberValue?: number | null;
    dateValue?: Date | null;
  }
): string | number | Date | null {
  switch (fieldType) {
    case CustomFieldType.TEXT:
    case CustomFieldType.LONG_TEXT:
    case CustomFieldType.SELECT:
      return valueRecord.textValue ?? null;

    case CustomFieldType.NUMBER:
      return valueRecord.numberValue ?? null;

    case CustomFieldType.DATE:
      return valueRecord.dateValue ?? null;

    default:
      return null;
  }
}
