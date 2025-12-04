'use client';

import { useState } from 'react';
import { TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, Loader2 } from 'lucide-react';
import { updateCustomFieldValue } from '@/app/actions/custom-field-actions';
import { toast } from 'sonner';

interface CustomFieldDefinition {
  id: number;
  fieldName: string;
  fieldType: 'TEXT' | 'LONG_TEXT' | 'NUMBER' | 'DATE' | 'SELECT';
  fieldOptions: any; // JSON field with { options: string[] } for SELECT type
  isRequired: boolean;
}

interface CustomFieldValue {
  textValue: string | null;
  numberValue: number | null;
  dateValue: Date | null;
}

interface EditableCustomFieldCellProps {
  responseId: number;
  field: CustomFieldDefinition;
  currentValue: CustomFieldValue | undefined;
}

/**
 * Extract actual value from CustomFieldValue based on field type
 */
function extractValue(
  fieldType: CustomFieldDefinition['fieldType'],
  value: CustomFieldValue | undefined
): string {
  if (!value) return '';

  switch (fieldType) {
    case 'TEXT':
    case 'LONG_TEXT':
    case 'SELECT':
      return value.textValue || '';
    case 'NUMBER':
      return value.numberValue !== null ? String(value.numberValue) : '';
    case 'DATE':
      return value.dateValue ? new Date(value.dateValue).toISOString().split('T')[0] : '';
    default:
      return '';
  }
}

/**
 * Editable table cell for custom field values
 *
 * Supports five field types:
 * - TEXT: Short text input (max 500 chars)
 * - LONG_TEXT: Textarea (max 2000 chars)
 * - NUMBER: Number input
 * - DATE: Date picker
 * - SELECT: Dropdown with predefined options
 *
 * Each cell has its own save button for individual updates.
 */
export function EditableCustomFieldCell({
  responseId,
  field,
  currentValue,
}: EditableCustomFieldCellProps) {
  const initialValue = extractValue(field.fieldType, currentValue);
  const [value, setValue] = useState<string>(initialValue);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Parse value based on field type
      let parsedValue: string | number | Date | null;

      if (field.fieldType === 'NUMBER') {
        const trimmed = value.trim();
        if (trimmed === '') {
          parsedValue = null;
        } else {
          const num = parseFloat(trimmed);
          if (isNaN(num)) {
            toast.error('ערך חייב להיות מספר תקין');
            setIsSaving(false);
            return;
          }
          parsedValue = num;
        }
      } else if (field.fieldType === 'DATE') {
        if (value === '') {
          parsedValue = null;
        } else {
          parsedValue = new Date(value);
          if (isNaN(parsedValue.getTime())) {
            toast.error('תאריך לא תקין');
            setIsSaving(false);
            return;
          }
        }
      } else {
        // TEXT, LONG_TEXT, SELECT
        const trimmed = value.trim();
        parsedValue = trimmed.length > 0 ? trimmed : null;
      }

      // Call server action
      await updateCustomFieldValue(responseId, field.id, parsedValue);
      toast.success('הערך נשמר בהצלחה');
    } catch (error) {
      console.error('Error saving custom field value:', error);
      toast.error(error instanceof Error ? error.message : 'שגיאה בשמירת הערך');
    } finally {
      setIsSaving(false);
    }
  };

  // Check if value has changed from initial
  const hasChanged = value !== initialValue;

  // Extract options for SELECT type
  const options: string[] =
    field.fieldType === 'SELECT' && field.fieldOptions
      ? (field.fieldOptions as any).options || []
      : [];

  return (
    <TableCell className="min-w-[200px] max-w-[300px] p-2">
      <div className="flex flex-col gap-2">
        {/* Input field based on field type */}
        {field.fieldType === 'TEXT' && (
          <Input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={isSaving}
            dir="rtl"
            maxLength={500}
            placeholder={field.isRequired ? 'שדה חובה' : 'הזן ערך...'}
            className={`h-9 text-sm ${
              field.isRequired && value.trim().length === 0
                ? 'border-red-300 focus-visible:ring-red-500'
                : 'border-gray-300 focus-visible:ring-blue-500'
            }`}
          />
        )}

        {field.fieldType === 'LONG_TEXT' && (
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={isSaving}
            dir="rtl"
            rows={3}
            maxLength={2000}
            placeholder={field.isRequired ? 'שדה חובה' : 'הזן ערך...'}
            className={`text-sm resize-none ${
              field.isRequired && value.trim().length === 0
                ? 'border-red-300 focus-visible:ring-red-500'
                : 'border-gray-300 focus-visible:ring-blue-500'
            }`}
          />
        )}

        {field.fieldType === 'NUMBER' && (
          <Input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={isSaving}
            placeholder={field.isRequired ? 'שדה חובה' : 'הזן מספר...'}
            className={`h-9 text-sm text-center ${
              field.isRequired && value.trim().length === 0
                ? 'border-red-300 focus-visible:ring-red-500'
                : 'border-gray-300 focus-visible:ring-blue-500'
            }`}
            step="any"
          />
        )}

        {field.fieldType === 'DATE' && (
          <Input
            type="date"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={isSaving}
            className={`h-9 text-sm ${
              field.isRequired && value.trim().length === 0
                ? 'border-red-300 focus-visible:ring-red-500'
                : 'border-gray-300 focus-visible:ring-blue-500'
            }`}
          />
        )}

        {field.fieldType === 'SELECT' && (
          <Select value={value} onValueChange={setValue} disabled={isSaving}>
            <SelectTrigger
              className={`h-9 text-sm ${
                field.isRequired && value === ''
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              dir="rtl"
            >
              <SelectValue placeholder="בחר אופציה..." />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Character count for text fields */}
        {(field.fieldType === 'TEXT' || field.fieldType === 'LONG_TEXT') && value.length > 0 && (
          <div className="text-xs text-gray-500 text-left">
            {value.length} / {field.fieldType === 'TEXT' ? 500 : 2000}
          </div>
        )}

        {/* Save button - only show if value changed */}
        {hasChanged && (
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="sm"
            className="bg-green-600 hover:bg-green-700 h-8 text-xs"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin ml-1" />
                שומר...
              </>
            ) : (
              <>
                <Save className="h-3 w-3 ml-1" />
                שמור
              </>
            )}
          </Button>
        )}
      </div>
    </TableCell>
  );
}
