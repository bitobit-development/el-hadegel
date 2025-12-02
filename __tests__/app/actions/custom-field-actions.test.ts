/**
 * Unit Tests for Custom Field Server Actions
 * Tests all server actions with comprehensive mocking
 */

import {
  getCustomFieldDefinitions,
  createCustomFieldDefinition,
  updateCustomFieldDefinition,
  deleteCustomFieldDefinition,
  getResponseCustomFieldValues,
  updateCustomFieldValue,
  bulkUpdateCustomFieldValues,
} from '@/app/actions/custom-field-actions';
import { prismaQuestionnaire } from '@/lib/prisma-questionnaire';
import { revalidatePath } from 'next/cache';

// Mock dependencies
jest.mock('@/lib/prisma-questionnaire', () => ({
  __esModule: true,
  prismaQuestionnaire: {
    customFieldDefinition: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    customFieldValue: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    questionnaire: {
      findUnique: jest.fn(),
    },
    questionnaireResponse: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

const mockPrisma = prismaQuestionnaire as jest.Mocked<typeof prismaQuestionnaire>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>;

describe('custom-field-actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getCustomFieldDefinitions', () => {
    it('should fetch all field definitions for questionnaire', async () => {
      const mockFields = [
        {
          id: 1,
          questionnaireId: 1,
          fieldName: 'עיר מגורים',
          fieldType: 'TEXT',
          fieldOptions: null,
          isRequired: false,
          defaultValue: null,
          orderIndex: 0,
        },
        {
          id: 2,
          questionnaireId: 1,
          fieldName: 'מצב משפחתי',
          fieldType: 'SELECT',
          fieldOptions: { options: ['רווק/ה', 'נשוי/אה'] },
          isRequired: true,
          defaultValue: null,
          orderIndex: 1,
        },
      ];

      mockPrisma.customFieldDefinition.findMany.mockResolvedValue(mockFields as any);

      const result = await getCustomFieldDefinitions(1);

      expect(mockPrisma.customFieldDefinition.findMany).toHaveBeenCalledWith({
        where: { questionnaireId: 1 },
        orderBy: { orderIndex: 'asc' },
      });
      expect(result).toEqual(mockFields);
    });

    it('should return empty array when no fields exist', async () => {
      mockPrisma.customFieldDefinition.findMany.mockResolvedValue([]);

      const result = await getCustomFieldDefinitions(1);

      expect(result).toEqual([]);
    });

    it('should throw error on database failure', async () => {
      mockPrisma.customFieldDefinition.findMany.mockRejectedValue(
        new Error('DB Error')
      );

      await expect(getCustomFieldDefinitions(1)).rejects.toThrow(
        'שגיאה בטעינת הגדרות השדות המותאמים'
      );
    });
  });

  describe('createCustomFieldDefinition', () => {
    it('should create TEXT field definition successfully', async () => {
      const inputData = {
        questionnaireId: 1,
        fieldName: 'עיר מגורים',
        fieldType: 'TEXT' as const,
        isRequired: false,
      };

      mockPrisma.questionnaire.findUnique.mockResolvedValue({ id: 1 } as any);
      mockPrisma.customFieldDefinition.findFirst.mockResolvedValue(null);
      mockPrisma.customFieldDefinition.create.mockResolvedValue({
        id: 1,
        ...inputData,
        fieldOptions: null,
        defaultValue: null,
        orderIndex: 0,
      } as any);

      const result = await createCustomFieldDefinition(inputData);

      expect(mockPrisma.questionnaire.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { id: true },
      });
      expect(mockPrisma.customFieldDefinition.findFirst).toHaveBeenCalledWith({
        where: { questionnaireId: 1 },
        orderBy: { orderIndex: 'desc' },
        select: { orderIndex: true },
      });
      expect(mockPrisma.customFieldDefinition.create).toHaveBeenCalledWith({
        data: {
          questionnaireId: 1,
          fieldName: 'עיר מגורים',
          fieldType: 'TEXT',
          fieldOptions: null,
          isRequired: false,
          defaultValue: null,
          orderIndex: 0,
        },
      });
      expect(mockRevalidatePath).toHaveBeenCalledTimes(2);
    });

    it('should create SELECT field with options', async () => {
      const inputData = {
        questionnaireId: 1,
        fieldName: 'מצב משפחתי',
        fieldType: 'SELECT' as const,
        fieldOptions: ['רווק/ה', 'נשוי/אה', 'גרוש/ה'],
        isRequired: true,
      };

      mockPrisma.questionnaire.findUnique.mockResolvedValue({ id: 1 } as any);
      mockPrisma.customFieldDefinition.findFirst.mockResolvedValue(null);
      mockPrisma.customFieldDefinition.create.mockResolvedValue({
        id: 2,
        questionnaireId: 1,
        fieldName: 'מצב משפחתי',
        fieldType: 'SELECT',
        fieldOptions: { options: ['רווק/ה', 'נשוי/אה', 'גרוש/ה'] },
        isRequired: true,
        defaultValue: null,
        orderIndex: 0,
      } as any);

      const result = await createCustomFieldDefinition(inputData);

      expect(mockPrisma.customFieldDefinition.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          fieldType: 'SELECT',
          fieldOptions: { options: ['רווק/ה', 'נשוי/אה', 'גרוש/ה'] },
        }),
      });
    });

    it('should calculate next orderIndex correctly', async () => {
      const inputData = {
        questionnaireId: 1,
        fieldName: 'שדה חדש',
        fieldType: 'TEXT' as const,
        isRequired: false,
      };

      mockPrisma.questionnaire.findUnique.mockResolvedValue({ id: 1 } as any);
      mockPrisma.customFieldDefinition.findFirst.mockResolvedValue({
        orderIndex: 5,
      } as any);
      mockPrisma.customFieldDefinition.create.mockResolvedValue({
        id: 3,
        ...inputData,
        fieldOptions: null,
        defaultValue: null,
        orderIndex: 6,
      } as any);

      await createCustomFieldDefinition(inputData);

      expect(mockPrisma.customFieldDefinition.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orderIndex: 6,
        }),
      });
    });

    it('should throw error if questionnaire not found', async () => {
      const inputData = {
        questionnaireId: 999,
        fieldName: 'שדה',
        fieldType: 'TEXT' as const,
        isRequired: false,
      };

      mockPrisma.questionnaire.findUnique.mockResolvedValue(null);

      await expect(createCustomFieldDefinition(inputData)).rejects.toThrow(
        'שאלון לא נמצא'
      );
    });

    it('should throw error on validation failure', async () => {
      const invalidData = {
        questionnaireId: -1, // Invalid
        fieldName: 'שדה',
        fieldType: 'TEXT' as const,
        isRequired: false,
      };

      await expect(createCustomFieldDefinition(invalidData)).rejects.toThrow();
    });
  });

  describe('updateCustomFieldDefinition', () => {
    it('should update field definition successfully', async () => {
      const updateData = {
        fieldName: 'שם מעודכן',
        isRequired: true,
      };

      mockPrisma.customFieldDefinition.findUnique.mockResolvedValue({
        id: 1,
        questionnaireId: 1,
      } as any);
      mockPrisma.customFieldDefinition.update.mockResolvedValue({
        id: 1,
        questionnaireId: 1,
        fieldName: 'שם מעודכן',
        fieldType: 'TEXT',
        fieldOptions: null,
        isRequired: true,
        defaultValue: null,
        orderIndex: 0,
      } as any);

      const result = await updateCustomFieldDefinition(1, updateData);

      expect(mockPrisma.customFieldDefinition.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { id: true, questionnaireId: true },
      });
      expect(mockPrisma.customFieldDefinition.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateData,
      });
      expect(mockRevalidatePath).toHaveBeenCalledTimes(2);
    });

    it('should update field type and clear options when changing from SELECT', async () => {
      const updateData = {
        fieldType: 'TEXT' as const,
      };

      mockPrisma.customFieldDefinition.findUnique.mockResolvedValue({
        id: 1,
        questionnaireId: 1,
      } as any);
      mockPrisma.customFieldDefinition.update.mockResolvedValue({
        id: 1,
        questionnaireId: 1,
        fieldName: 'שדה',
        fieldType: 'TEXT',
        fieldOptions: null,
        isRequired: false,
        defaultValue: null,
        orderIndex: 0,
      } as any);

      await updateCustomFieldDefinition(1, updateData);

      expect(mockPrisma.customFieldDefinition.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          fieldType: 'TEXT',
          fieldOptions: null,
        }),
      });
    });

    it('should throw error if field not found', async () => {
      mockPrisma.customFieldDefinition.findUnique.mockResolvedValue(null);

      await expect(
        updateCustomFieldDefinition(999, { fieldName: 'שדה' })
      ).rejects.toThrow('שדה מותאם לא נמצא');
    });
  });

  describe('deleteCustomFieldDefinition', () => {
    it('should delete field definition and return count', async () => {
      mockPrisma.customFieldDefinition.findUnique.mockResolvedValue({
        id: 1,
        questionnaireId: 1,
        _count: { values: 5 },
      } as any);
      mockPrisma.customFieldDefinition.delete.mockResolvedValue({} as any);

      const result = await deleteCustomFieldDefinition(1);

      expect(mockPrisma.customFieldDefinition.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual({
        success: true,
        deletedValues: 5,
      });
      expect(mockRevalidatePath).toHaveBeenCalledTimes(2);
    });

    it('should throw error if field not found', async () => {
      mockPrisma.customFieldDefinition.findUnique.mockResolvedValue(null);

      await expect(deleteCustomFieldDefinition(999)).rejects.toThrow(
        'שדה מותאם לא נמצא'
      );
    });
  });

  describe('getResponseCustomFieldValues', () => {
    it('should fetch all custom field values for response', async () => {
      const mockValues = [
        {
          id: 1,
          responseId: 1,
          fieldId: 1,
          textValue: 'תל אביב',
          numberValue: null,
          dateValue: null,
          field: {
            id: 1,
            fieldName: 'עיר מגורים',
            fieldType: 'TEXT',
            fieldOptions: null,
            isRequired: false,
            orderIndex: 0,
          },
        },
        {
          id: 2,
          responseId: 1,
          fieldId: 2,
          textValue: null,
          numberValue: 35,
          dateValue: null,
          field: {
            id: 2,
            fieldName: 'גיל',
            fieldType: 'NUMBER',
            fieldOptions: null,
            isRequired: true,
            orderIndex: 1,
          },
        },
      ];

      mockPrisma.customFieldValue.findMany.mockResolvedValue(mockValues as any);

      const result = await getResponseCustomFieldValues(1);

      expect(mockPrisma.customFieldValue.findMany).toHaveBeenCalledWith({
        where: { responseId: 1 },
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
      expect(result).toEqual(mockValues);
    });

    it('should return empty array when no values exist', async () => {
      mockPrisma.customFieldValue.findMany.mockResolvedValue([]);

      const result = await getResponseCustomFieldValues(1);

      expect(result).toEqual([]);
    });
  });

  describe('updateCustomFieldValue', () => {
    it('should upsert TEXT field value', async () => {
      mockPrisma.customFieldDefinition.findUnique.mockResolvedValue({
        id: 1,
        fieldType: 'TEXT',
        isRequired: false,
        fieldOptions: null,
      } as any);
      mockPrisma.customFieldValue.upsert.mockResolvedValue({
        id: 1,
        responseId: 1,
        fieldId: 1,
        textValue: 'תל אביב',
        numberValue: null,
        dateValue: null,
      } as any);
      mockPrisma.questionnaireResponse.findUnique.mockResolvedValue({
        questionnaireId: 1,
      } as any);

      const result = await updateCustomFieldValue(1, 1, 'תל אביב');

      expect(mockPrisma.customFieldValue.upsert).toHaveBeenCalledWith({
        where: {
          responseId_fieldId: {
            responseId: 1,
            fieldId: 1,
          },
        },
        update: {
          textValue: 'תל אביב',
          numberValue: null,
          dateValue: null,
        },
        create: {
          responseId: 1,
          fieldId: 1,
          textValue: 'תל אביב',
          numberValue: null,
          dateValue: null,
        },
      });
      expect(mockRevalidatePath).toHaveBeenCalled();
    });

    it('should upsert NUMBER field value', async () => {
      mockPrisma.customFieldDefinition.findUnique.mockResolvedValue({
        id: 2,
        fieldType: 'NUMBER',
        isRequired: true,
        fieldOptions: null,
      } as any);
      mockPrisma.customFieldValue.upsert.mockResolvedValue({
        id: 2,
        responseId: 1,
        fieldId: 2,
        textValue: null,
        numberValue: 35,
        dateValue: null,
      } as any);
      mockPrisma.questionnaireResponse.findUnique.mockResolvedValue({
        questionnaireId: 1,
      } as any);

      await updateCustomFieldValue(1, 2, 35);

      expect(mockPrisma.customFieldValue.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            numberValue: 35,
          }),
        })
      );
    });

    it('should upsert DATE field value', async () => {
      const date = new Date('1989-05-15');
      mockPrisma.customFieldDefinition.findUnique.mockResolvedValue({
        id: 3,
        fieldType: 'DATE',
        isRequired: false,
        fieldOptions: null,
      } as any);
      mockPrisma.customFieldValue.upsert.mockResolvedValue({
        id: 3,
        responseId: 1,
        fieldId: 3,
        textValue: null,
        numberValue: null,
        dateValue: date,
      } as any);
      mockPrisma.questionnaireResponse.findUnique.mockResolvedValue({
        questionnaireId: 1,
      } as any);

      await updateCustomFieldValue(1, 3, date);

      expect(mockPrisma.customFieldValue.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            dateValue: date,
          }),
        })
      );
    });

    it('should validate SELECT field value against options', async () => {
      mockPrisma.customFieldDefinition.findUnique.mockResolvedValue({
        id: 4,
        fieldType: 'SELECT',
        isRequired: true,
        fieldOptions: { options: ['רווק/ה', 'נשוי/אה'] },
      } as any);
      mockPrisma.customFieldValue.upsert.mockResolvedValue({
        id: 4,
        responseId: 1,
        fieldId: 4,
        textValue: 'נשוי/אה',
        numberValue: null,
        dateValue: null,
      } as any);
      mockPrisma.questionnaireResponse.findUnique.mockResolvedValue({
        questionnaireId: 1,
      } as any);

      await updateCustomFieldValue(1, 4, 'נשוי/אה');

      expect(mockPrisma.customFieldValue.upsert).toHaveBeenCalled();
    });

    it('should throw error for invalid SELECT value', async () => {
      mockPrisma.customFieldDefinition.findUnique.mockResolvedValue({
        id: 4,
        fieldType: 'SELECT',
        isRequired: true,
        fieldOptions: { options: ['רווק/ה', 'נשוי/אה'] },
      } as any);

      await expect(updateCustomFieldValue(1, 4, 'אלמן/ה')).rejects.toThrow();
    });

    it('should throw error if field not found', async () => {
      mockPrisma.customFieldDefinition.findUnique.mockResolvedValue(null);

      await expect(updateCustomFieldValue(1, 999, 'value')).rejects.toThrow(
        'שדה מותאם לא נמצא'
      );
    });

    it('should throw error for invalid required field', async () => {
      mockPrisma.customFieldDefinition.findUnique.mockResolvedValue({
        id: 1,
        fieldType: 'TEXT',
        isRequired: true,
        fieldOptions: null,
      } as any);

      await expect(updateCustomFieldValue(1, 1, null)).rejects.toThrow();
    });
  });

  describe('bulkUpdateCustomFieldValues', () => {
    it('should update multiple field values in transaction', async () => {
      const values = [
        { fieldId: 1, value: 'תל אביב' },
        { fieldId: 2, value: 35 },
      ];

      mockPrisma.questionnaireResponse.findUnique.mockResolvedValue({
        id: 1,
        questionnaireId: 1,
      } as any);

      // Mock transaction
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          customFieldDefinition: {
            findUnique: jest.fn()
              .mockResolvedValueOnce({
                id: 1,
                fieldType: 'TEXT',
                isRequired: false,
                fieldOptions: null,
              })
              .mockResolvedValueOnce({
                id: 2,
                fieldType: 'NUMBER',
                isRequired: true,
                fieldOptions: null,
              }),
          },
          customFieldValue: {
            upsert: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(txMock as any);
      });

      const result = await bulkUpdateCustomFieldValues(1, values);

      expect(result).toEqual({ success: true });
      expect(mockRevalidatePath).toHaveBeenCalled();
    });

    it('should throw error if response not found', async () => {
      mockPrisma.questionnaireResponse.findUnique.mockResolvedValue(null);

      await expect(bulkUpdateCustomFieldValues(999, [])).rejects.toThrow(
        'תשובה לא נמצאה'
      );
    });

    it('should throw error if any field not found in transaction', async () => {
      mockPrisma.questionnaireResponse.findUnique.mockResolvedValue({
        id: 1,
        questionnaireId: 1,
      } as any);

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          customFieldDefinition: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        };
        return callback(txMock as any);
      });

      await expect(
        bulkUpdateCustomFieldValues(1, [{ fieldId: 999, value: 'test' }])
      ).rejects.toThrow();
    });

    it('should throw error if any validation fails in transaction', async () => {
      mockPrisma.questionnaireResponse.findUnique.mockResolvedValue({
        id: 1,
        questionnaireId: 1,
      } as any);

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          customFieldDefinition: {
            findUnique: jest.fn().mockResolvedValue({
              id: 1,
              fieldType: 'TEXT',
              isRequired: true,
              fieldOptions: null,
            }),
          },
        };
        return callback(txMock as any);
      });

      // Empty value for required field should fail
      await expect(
        bulkUpdateCustomFieldValues(1, [{ fieldId: 1, value: '' }])
      ).rejects.toThrow();
    });
  });
});
