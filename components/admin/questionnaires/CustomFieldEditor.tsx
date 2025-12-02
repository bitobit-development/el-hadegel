'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateCustomFieldValue } from '@/app/actions/custom-field-actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CustomFieldTypeValue } from '@/lib/validation/custom-field-validation';

interface CustomFieldDefinition {
  id: number;
  fieldName: string;
  fieldType: 'TEXT' | 'LONG_TEXT' | 'NUMBER' | 'DATE' | 'SELECT';
  fieldOptions: any | null;
  isRequired: boolean;
  defaultValue: string | null;
}

interface CustomFieldEditorProps {
  responseId: number;
  fields: CustomFieldDefinition[];
  values: Record<number, string | number | Date | null>;
  onUpdate: () => void;
}

export function CustomFieldEditor({
  responseId,
  fields,
  values,
  onUpdate,
}: CustomFieldEditorProps) {
  // State to track field values locally
  const [fieldValues, setFieldValues] = useState<Record<number, string>>({});
  const [savingFields, setSavingFields] = useState<Set<number>>(new Set());

  // Initialize field values from props
  useEffect(() => {
    const initialValues: Record<number, string> = {};
    fields.forEach((field) => {
      const value = values[field.id];
      if (value !== null && value !== undefined) {
        if (field.fieldType === 'DATE' && value instanceof Date) {
          // Format date for input[type="date"] (YYYY-MM-DD)
          initialValues[field.id] = value.toISOString().split('T')[0];
        } else {
          initialValues[field.id] = String(value);
        }
      } else {
        initialValues[field.id] = field.defaultValue || '';
      }
    });
    setFieldValues(initialValues);
  }, [fields, values]);

  const handleSaveField = async (fieldId: number, fieldType: CustomFieldTypeValue) => {
    const rawValue = fieldValues[fieldId];

    // Convert value based on field type
    let valueToSave: string | number | Date | null;
    if (!rawValue || rawValue.trim() === '') {
      valueToSave = null;
    } else {
      switch (fieldType) {
        case 'NUMBER':
          valueToSave = parseFloat(rawValue);
          if (isNaN(valueToSave)) {
            toast.error('ערך לא תקין. נא להזין מספר');
            return;
          }
          break;
        case 'DATE':
          valueToSave = new Date(rawValue);
          if (isNaN(valueToSave.getTime())) {
            toast.error('תאריך לא תקין');
            return;
          }
          break;
        default:
          valueToSave = rawValue.trim();
      }
    }

    setSavingFields((prev) => new Set(prev).add(fieldId));

    try {
      await updateCustomFieldValue(responseId, fieldId, valueToSave);
      toast.success('הערך נשמר בהצלחה');
      onUpdate();
    } catch (error) {
      console.error('Error saving custom field value:', error);
      toast.error(error instanceof Error ? error.message : 'שגיאה בשמירת הערך');
    } finally {
      setSavingFields((prev) => {
        const next = new Set(prev);
        next.delete(fieldId);
        return next;
      });
    }
  };

  // Return null if no custom fields exist
  if (fields.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 text-right">שדות מותאמים אישית</h3>

      <div className="space-y-4">
        {fields.map((field) => {
          const isSaving = savingFields.has(field.id);
          const currentValue = fieldValues[field.id] || '';

          // Extract options from JSON structure for SELECT type
          const options = field.fieldType === 'SELECT' && field.fieldOptions && typeof field.fieldOptions === 'object'
            ? (field.fieldOptions as any).options || []
            : [];

          return (
            <div key={field.id} className="rounded-lg border bg-white p-4">
              <Label htmlFor={`field-${field.id}`} className="text-right font-medium">
                {field.fieldName}
                {field.isRequired && (
                  <span className="mr-1 text-red-500" aria-label="שדה חובה">*</span>
                )}
              </Label>

              <div className="mt-2 flex gap-2">
                {/* Render different input types based on field type */}
                {field.fieldType === 'TEXT' && (
                  <Input
                    id={`field-${field.id}`}
                    type="text"
                    value={currentValue}
                    onChange={(e) =>
                      setFieldValues((prev) => ({ ...prev, [field.id]: e.target.value }))
                    }
                    placeholder={field.defaultValue || 'הזן ערך...'}
                    maxLength={500}
                    className="flex-1 text-right"
                    aria-required={field.isRequired}
                  />
                )}

                {field.fieldType === 'LONG_TEXT' && (
                  <Textarea
                    id={`field-${field.id}`}
                    value={currentValue}
                    onChange={(e) =>
                      setFieldValues((prev) => ({ ...prev, [field.id]: e.target.value }))
                    }
                    placeholder={field.defaultValue || 'הזן ערך...'}
                    maxLength={2000}
                    rows={4}
                    className="flex-1 resize-none text-right"
                    aria-required={field.isRequired}
                  />
                )}

                {field.fieldType === 'NUMBER' && (
                  <Input
                    id={`field-${field.id}`}
                    type="number"
                    value={currentValue}
                    onChange={(e) =>
                      setFieldValues((prev) => ({ ...prev, [field.id]: e.target.value }))
                    }
                    placeholder={field.defaultValue || 'הזן מספר...'}
                    className="flex-1 text-right"
                    aria-required={field.isRequired}
                  />
                )}

                {field.fieldType === 'DATE' && (
                  <Input
                    id={`field-${field.id}`}
                    type="date"
                    value={currentValue}
                    onChange={(e) =>
                      setFieldValues((prev) => ({ ...prev, [field.id]: e.target.value }))
                    }
                    className="flex-1 text-right"
                    aria-required={field.isRequired}
                  />
                )}

                {field.fieldType === 'SELECT' && (
                  <Select
                    value={currentValue}
                    onValueChange={(value) =>
                      setFieldValues((prev) => ({ ...prev, [field.id]: value }))
                    }
                  >
                    <SelectTrigger
                      id={`field-${field.id}`}
                      className="flex-1 text-right"
                      aria-required={field.isRequired}
                    >
                      <SelectValue placeholder={field.defaultValue || 'בחר ערך...'} />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((option: string) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Save button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSaveField(field.id, field.fieldType as CustomFieldTypeValue)}
                  disabled={isSaving}
                  className="shrink-0"
                  aria-label={`שמור ערך עבור ${field.fieldName}`}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    'שמור'
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
