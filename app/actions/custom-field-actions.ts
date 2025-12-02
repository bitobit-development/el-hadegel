/**
 * Server Actions for Custom Field Management
 * Handles creation, updating, and deletion of custom field definitions and values
 *
 * IMPORTANT: Uses separate questionnaire database (prismaQuestionnaire)
 */

'use server';

import { revalidatePath } from 'next/cache';
import { prismaQuestionnaire } from '@/lib/prisma-questionnaire';
import {
  customFieldDefinitionSchema,
  updateCustomFieldDefinitionSchema,
  validateCustomFieldValue,
  prepareValueData,
  type CustomFieldDefinitionInput,
  type CustomFieldDefinitionUpdate,
} from '@/lib/validation/custom-field-validation';

/**
 * Get all custom field definitions for a questionnaire
 * Ordered by orderIndex for consistent display
 */
export async function getCustomFieldDefinitions(questionnaireId: number) {
  try {
    const fields = await prismaQuestionnaire.customFieldDefinition.findMany({
      where: { questionnaireId },
      orderBy: { orderIndex: 'asc' },
    });

    return fields;
  } catch (error) {
    console.error('Error fetching custom field definitions:', error);
    throw new Error('שגיאה בטעינת הגדרות השדות המותאמים');
  }
}

/**
 * Create new custom field definition
 * Automatically calculates next orderIndex
 */
export async function createCustomFieldDefinition(data: CustomFieldDefinitionInput) {
  try {
    // Validate input
    const validated = customFieldDefinitionSchema.parse(data);

    // Check questionnaire exists
    const questionnaire = await prismaQuestionnaire.questionnaire.findUnique({
      where: { id: validated.questionnaireId },
      select: { id: true },
    });

    if (!questionnaire) {
      throw new Error('שאלון לא נמצא');
    }

    // Calculate next orderIndex
    const maxOrderField = await prismaQuestionnaire.customFieldDefinition.findFirst({
      where: { questionnaireId: validated.questionnaireId },
      orderBy: { orderIndex: 'desc' },
      select: { orderIndex: true },
    });

    const nextOrderIndex = (maxOrderField?.orderIndex ?? -1) + 1;

    // Prepare fieldOptions JSON (cast to InputJsonValue for Prisma)
    const fieldOptions: any =
      validated.fieldType === 'SELECT' && validated.fieldOptions
        ? { options: validated.fieldOptions }
        : null;

    // Create field definition
    const field = await prismaQuestionnaire.customFieldDefinition.create({
      data: {
        questionnaireId: validated.questionnaireId,
        fieldName: validated.fieldName,
        fieldType: validated.fieldType,
        fieldOptions: fieldOptions,
        isRequired: validated.isRequired,
        defaultValue: validated.defaultValue ?? null,
        orderIndex: nextOrderIndex,
      },
    });

    // Revalidate admin pages
    revalidatePath('/admin/questionnaires');
    revalidatePath(`/admin/questionnaires/${validated.questionnaireId}/submissions`);

    return field;
  } catch (error) {
    console.error('Error creating custom field definition:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      throw new Error('נתונים לא תקינים. אנא בדוק את כל השדות.');
    }
    throw new Error(error instanceof Error ? error.message : 'שגיאה ביצירת שדה מותאם');
  }
}

/**
 * Update existing custom field definition
 * Partial update - only provided fields are updated
 */
export async function updateCustomFieldDefinition(fieldId: number, data: CustomFieldDefinitionUpdate) {
  try {
    // Validate partial data
    const validated = updateCustomFieldDefinitionSchema.parse(data);

    // Check field exists
    const existingField = await prismaQuestionnaire.customFieldDefinition.findUnique({
      where: { id: fieldId },
      select: { id: true, questionnaireId: true },
    });

    if (!existingField) {
      throw new Error('שדה מותאם לא נמצא');
    }

    // Prepare fieldOptions JSON if SELECT type (cast to any for Prisma InputJsonValue)
    const updateData: any = { ...validated };
    if (validated.fieldType === 'SELECT' && validated.fieldOptions) {
      updateData.fieldOptions = { options: validated.fieldOptions } as any;
    } else if (validated.fieldType && validated.fieldType !== 'SELECT') {
      // Clear fieldOptions if changing from SELECT to another type
      updateData.fieldOptions = null;
    }

    // Update field definition
    const updatedField = await prismaQuestionnaire.customFieldDefinition.update({
      where: { id: fieldId },
      data: updateData,
    });

    // Revalidate admin pages
    revalidatePath('/admin/questionnaires');
    revalidatePath(`/admin/questionnaires/${existingField.questionnaireId}/submissions`);

    return updatedField;
  } catch (error) {
    console.error('Error updating custom field definition:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      throw new Error('נתונים לא תקינים. אנא בדוק את כל השדות.');
    }
    throw new Error(error instanceof Error ? error.message : 'שגיאה בעדכון שדה מותאם');
  }
}

/**
 * Delete custom field definition
 * Cascades to all related custom field values
 */
export async function deleteCustomFieldDefinition(fieldId: number) {
  try {
    // Check field exists and get related info
    const existingField = await prismaQuestionnaire.customFieldDefinition.findUnique({
      where: { id: fieldId },
      select: {
        id: true,
        questionnaireId: true,
        _count: { select: { values: true } },
      },
    });

    if (!existingField) {
      throw new Error('שדה מותאם לא נמצא');
    }

    // Delete field (cascades to values automatically)
    await prismaQuestionnaire.customFieldDefinition.delete({
      where: { id: fieldId },
    });

    // Revalidate admin pages
    revalidatePath('/admin/questionnaires');
    revalidatePath(`/admin/questionnaires/${existingField.questionnaireId}/submissions`);

    return {
      success: true,
      deletedValues: existingField._count.values,
    };
  } catch (error) {
    console.error('Error deleting custom field definition:', error);
    throw new Error(error instanceof Error ? error.message : 'שגיאה במחיקת שדה מותאם');
  }
}

/**
 * Get all custom field values for a specific response
 * Includes field definition details for display
 */
export async function getResponseCustomFieldValues(responseId: number) {
  try {
    const values = await prismaQuestionnaire.customFieldValue.findMany({
      where: { responseId },
      include: {
        field: {
          select: {
            id: true,
            fieldName: true,
            fieldType: true,
            fieldOptions: true,
            isRequired: true,
            orderIndex: true,
          },
        },
      },
      orderBy: {
        field: { orderIndex: 'asc' },
      },
    });

    return values;
  } catch (error) {
    console.error('Error fetching custom field values:', error);
    throw new Error('שגיאה בטעינת ערכי השדות המותאמים');
  }
}

/**
 * Update or create custom field value for a response
 * Uses upsert to handle both create and update cases
 */
export async function updateCustomFieldValue(
  responseId: number,
  fieldId: number,
  value: string | number | Date | null
) {
  try {
    // Get field definition for validation
    const field = await prismaQuestionnaire.customFieldDefinition.findUnique({
      where: { id: fieldId },
      select: {
        id: true,
        fieldType: true,
        isRequired: true,
        fieldOptions: true,
      },
    });

    if (!field) {
      throw new Error('שדה מותאם לא נמצא');
    }

    // Extract options array from JSON if SELECT type
    const fieldOptions =
      field.fieldType === 'SELECT' && field.fieldOptions
        ? ((field.fieldOptions as any).options as string[])
        : null;

    // Validate value against field type
    const validation = validateCustomFieldValue(
      field.fieldType as any,
      value,
      field.isRequired,
      fieldOptions
    );

    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Prepare value data based on field type
    const valueData = prepareValueData(field.fieldType as any, value);

    // Upsert value (update if exists, create if not)
    const updatedValue = await prismaQuestionnaire.customFieldValue.upsert({
      where: {
        responseId_fieldId: {
          responseId,
          fieldId,
        },
      },
      update: valueData,
      create: {
        responseId,
        fieldId,
        ...valueData,
      },
    });

    // Get questionnaire ID for revalidation
    const response = await prismaQuestionnaire.questionnaireResponse.findUnique({
      where: { id: responseId },
      select: { questionnaireId: true },
    });

    if (response) {
      revalidatePath(`/admin/questionnaires/${response.questionnaireId}/submissions`);
    }

    return updatedValue;
  } catch (error) {
    console.error('Error updating custom field value:', error);
    throw new Error(error instanceof Error ? error.message : 'שגיאה בעדכון ערך השדה המותאם');
  }
}

/**
 * Bulk update custom field values for a response
 * Uses transaction for atomicity - all succeed or all fail
 */
export async function bulkUpdateCustomFieldValues(
  responseId: number,
  values: Array<{ fieldId: number; value: string | number | Date | null }>
) {
  try {
    // Verify response exists
    const response = await prismaQuestionnaire.questionnaireResponse.findUnique({
      where: { id: responseId },
      select: { id: true, questionnaireId: true },
    });

    if (!response) {
      throw new Error('תשובה לא נמצאה');
    }

    // Update all values in transaction
    await prismaQuestionnaire.$transaction(async (tx) => {
      for (const { fieldId, value } of values) {
        // Get field definition
        const field = await tx.customFieldDefinition.findUnique({
          where: { id: fieldId },
          select: {
            id: true,
            fieldType: true,
            isRequired: true,
            fieldOptions: true,
          },
        });

        if (!field) {
          throw new Error(`שדה מותאם ${fieldId} לא נמצא`);
        }

        // Extract options for SELECT type
        const fieldOptions =
          field.fieldType === 'SELECT' && field.fieldOptions
            ? ((field.fieldOptions as any).options as string[])
            : null;

        // Validate value
        const validation = validateCustomFieldValue(
          field.fieldType as any,
          value,
          field.isRequired,
          fieldOptions
        );

        if (!validation.valid) {
          throw new Error(`שדה ${fieldId}: ${validation.error}`);
        }

        // Prepare value data
        const valueData = prepareValueData(field.fieldType as any, value);

        // Upsert value
        await tx.customFieldValue.upsert({
          where: {
            responseId_fieldId: {
              responseId,
              fieldId,
            },
          },
          update: valueData,
          create: {
            responseId,
            fieldId,
            ...valueData,
          },
        });
      }
    });

    // Revalidate admin pages
    revalidatePath(`/admin/questionnaires/${response.questionnaireId}/submissions`);

    return { success: true };
  } catch (error) {
    console.error('Error bulk updating custom field values:', error);
    throw new Error(error instanceof Error ? error.message : 'שגיאה בעדכון ערכי השדות המותאמים');
  }
}
