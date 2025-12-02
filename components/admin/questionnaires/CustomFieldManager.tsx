'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  createCustomFieldDefinition,
  updateCustomFieldDefinition,
  deleteCustomFieldDefinition,
} from '@/app/actions/custom-field-actions';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CustomFieldType, type CustomFieldTypeValue } from '@/lib/validation/custom-field-validation';

interface CustomField {
  id: number;
  fieldName: string;
  fieldType: 'TEXT' | 'LONG_TEXT' | 'NUMBER' | 'DATE' | 'SELECT';
  fieldOptions: any | null;
  isRequired: boolean;
  defaultValue: string | null;
  orderIndex: number;
}

interface CustomFieldManagerProps {
  questionnaireId: number;
  fields: CustomField[];
}

// Helper function to get field type label in Hebrew
function getFieldTypeLabel(type: CustomFieldTypeValue): string {
  const labels = {
    TEXT: 'טקסט קצר',
    LONG_TEXT: 'טקסט ארוך',
    NUMBER: 'מספר',
    DATE: 'תאריך',
    SELECT: 'בחירה מרשימה',
  };
  return labels[type] || type;
}

export function CustomFieldManager({
  questionnaireId,
  fields,
}: CustomFieldManagerProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState<CustomFieldTypeValue>('TEXT');
  const [selectOptions, setSelectOptions] = useState<string[]>([]);
  const [currentOption, setCurrentOption] = useState('');
  const [defaultValue, setDefaultValue] = useState('');
  const [isRequired, setIsRequired] = useState(false);

  const resetForm = () => {
    setFieldName('');
    setFieldType('TEXT');
    setSelectOptions([]);
    setCurrentOption('');
    setDefaultValue('');
    setIsRequired(false);
    setEditingField(null);
  };

  const handleOpenDialog = (field?: CustomField) => {
    if (field) {
      setEditingField(field);
      setFieldName(field.fieldName);
      setFieldType(field.fieldType as CustomFieldTypeValue);

      // Extract options from JSON structure
      const options = field.fieldOptions && typeof field.fieldOptions === 'object'
        ? (field.fieldOptions as any).options || []
        : [];
      setSelectOptions(options);

      setDefaultValue(field.defaultValue || '');
      setIsRequired(field.isRequired);
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (!isSubmitting) {
      setDialogOpen(false);
      setTimeout(resetForm, 200); // Reset after animation
    }
  };

  const handleAddOption = () => {
    const trimmed = currentOption.trim();
    if (trimmed && !selectOptions.includes(trimmed)) {
      setSelectOptions([...selectOptions, trimmed]);
      setCurrentOption('');
    }
  };

  const handleRemoveOption = (option: string) => {
    setSelectOptions(selectOptions.filter((opt) => opt !== option));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!fieldName.trim()) {
      toast.error('נא למלא את שם השדה');
      return;
    }

    if (fieldType === 'SELECT' && selectOptions.length === 0) {
      toast.error('נא להוסיף לפחות אופציה אחת לשדה בחירה');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingField) {
        // Update existing field
        await updateCustomFieldDefinition(editingField.id, {
          fieldName: fieldName.trim(),
          fieldType,
          fieldOptions: fieldType === 'SELECT' ? selectOptions : null,
          isRequired,
          defaultValue: defaultValue.trim() || null,
        });
        toast.success('השדה עודכן בהצלחה');
      } else {
        // Create new field
        await createCustomFieldDefinition({
          questionnaireId,
          fieldName: fieldName.trim(),
          fieldType,
          fieldOptions: fieldType === 'SELECT' ? selectOptions : null,
          isRequired,
          defaultValue: defaultValue.trim() || null,
        });
        toast.success('השדה נוצר בהצלחה');
      }

      router.refresh();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving custom field:', error);
      toast.error(error instanceof Error ? error.message : 'שגיאה בשמירת השדה');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (fieldId: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק שדה זה? כל הנתונים המשוייכים אליו יימחקו.')) {
      return;
    }

    try {
      await deleteCustomFieldDefinition(fieldId);
      toast.success('השדה נמחק בהצלחה');
      router.refresh();
    } catch (error) {
      console.error('Error deleting custom field:', error);
      toast.error(error instanceof Error ? error.message : 'שגיאה במחיקת השדה');
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="text-right">
              <CardTitle>שדות מותאמים אישית</CardTitle>
              <CardDescription>
                הוסף עמודות נוספות לתשובות השאלון לצורך מעקב ותיעוד
              </CardDescription>
            </div>
            <Button
              onClick={() => handleOpenDialog()}
              className="shrink-0 bg-green-600 hover:bg-green-700"
            >
              <Plus className="ml-2 h-4 w-4" aria-hidden="true" />
              הוסף שדה
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {fields.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center">
              <p className="text-gray-500">עדיין לא הוגדרו שדות מותאמים אישית</p>
            </div>
          ) : (
            <div className="space-y-2">
              {fields.map((field) => {
                // Extract options from JSON structure
                const options = field.fieldOptions && typeof field.fieldOptions === 'object'
                  ? (field.fieldOptions as any).options || []
                  : [];

                return (
                  <div
                    key={field.id}
                    className="flex items-center justify-between rounded-lg border bg-white p-4 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex flex-1 items-center gap-3 text-right">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{field.fieldName}</span>
                          {field.isRequired && (
                            <Badge variant="outline" className="border-red-500 bg-red-50 text-red-700">
                              חובה
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {getFieldTypeLabel(field.fieldType as CustomFieldTypeValue)}
                          </Badge>
                          {field.defaultValue && (
                            <span className="text-sm text-gray-600">
                              ברירת מחדל: {field.defaultValue}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(field)}
                        aria-label={`ערוך שדה ${field.fieldName}`}
                      >
                        <Edit className="ml-1 h-4 w-4" aria-hidden="true" />
                        ערוך
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(field.id)}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        aria-label={`מחק שדה ${field.fieldName}`}
                      >
                        <Trash2 className="ml-1 h-4 w-4" aria-hidden="true" />
                        מחק
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-right text-xl">
              {editingField ? 'ערוך שדה מותאם אישית' : 'הוסף שדה מותאם אישית'}
            </DialogTitle>
            <DialogDescription className="text-right">
              {editingField
                ? 'ערוך את הגדרות השדה המותאם אישית'
                : 'הגדר שדה חדש לתיעוד מידע נוסף על התשובות'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Field Name */}
            <div className="space-y-2">
              <Label htmlFor="fieldName" className="text-right font-medium">
                שם השדה
                <span className="mr-1 text-red-500" aria-label="שדה חובה">*</span>
              </Label>
              <Input
                id="fieldName"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                placeholder='לדוגמה: "סטטוס טיפול", "הערות פנימיות"'
                className="text-right"
                maxLength={200}
                required
                aria-required="true"
              />
              <p className="text-sm text-gray-500 text-right">
                {fieldName.length} / 200 תווים
              </p>
            </div>

            {/* Field Type */}
            <div className="space-y-2">
              <Label htmlFor="fieldType" className="text-right font-medium">
                סוג השדה
                <span className="mr-1 text-red-500" aria-label="שדה חובה">*</span>
              </Label>
              <Select
                value={fieldType}
                onValueChange={(value: CustomFieldTypeValue) => {
                  setFieldType(value);
                  // Clear options if switching away from SELECT
                  if (value !== 'SELECT') {
                    setSelectOptions([]);
                  }
                }}
              >
                <SelectTrigger id="fieldType" className="text-right">
                  <SelectValue placeholder="בחר סוג שדה" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEXT">{getFieldTypeLabel('TEXT')}</SelectItem>
                  <SelectItem value="LONG_TEXT">{getFieldTypeLabel('LONG_TEXT')}</SelectItem>
                  <SelectItem value="NUMBER">{getFieldTypeLabel('NUMBER')}</SelectItem>
                  <SelectItem value="DATE">{getFieldTypeLabel('DATE')}</SelectItem>
                  <SelectItem value="SELECT">{getFieldTypeLabel('SELECT')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Select Options (only for SELECT type) */}
            {fieldType === 'SELECT' && (
              <div className="space-y-2">
                <Label htmlFor="selectOptions" className="text-right font-medium">
                  אופציות לבחירה
                  <span className="mr-1 text-red-500" aria-label="שדה חובה">*</span>
                </Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddOption}
                    disabled={!currentOption.trim() || selectOptions.includes(currentOption.trim())}
                    className="shrink-0"
                  >
                    הוסף
                  </Button>
                  <Input
                    id="selectOptions"
                    value={currentOption}
                    onChange={(e) => setCurrentOption(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddOption();
                      }
                    }}
                    placeholder="הקלד אופציה ולחץ הוסף או Enter"
                    className="flex-1 text-right"
                  />
                </div>
                {selectOptions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectOptions.map((option) => (
                      <Badge
                        key={option}
                        variant="outline"
                        className="bg-blue-50 text-blue-700 pl-1"
                      >
                        {option}
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(option)}
                          className="mr-1 rounded-full p-0.5 hover:bg-blue-200"
                          aria-label={`הסר אופציה ${option}`}
                        >
                          <X className="h-3 w-3" aria-hidden="true" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-sm text-gray-500 text-right">
                  {selectOptions.length} אופציות מוגדרות
                </p>
              </div>
            )}

            {/* Default Value */}
            <div className="space-y-2">
              <Label htmlFor="defaultValue" className="text-right font-medium">
                ערך ברירת מחדל
              </Label>
              <Input
                id="defaultValue"
                value={defaultValue}
                onChange={(e) => setDefaultValue(e.target.value)}
                placeholder="ערך התחלתי לשדה..."
                className="text-right"
                maxLength={500}
              />
              <p className="text-sm text-gray-500 text-right">
                אופציונלי - ערך זה ימולא אוטומטית בשדות חדשים
              </p>
            </div>

            {/* Is Required */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="isRequired"
                checked={isRequired}
                onCheckedChange={(checked) => setIsRequired(checked as boolean)}
              />
              <Label htmlFor="isRequired" className="cursor-pointer font-medium">
                שדה חובה
              </Label>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={isSubmitting}
              >
                ביטול
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !fieldName.trim() || (fieldType === 'SELECT' && selectOptions.length === 0)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    {editingField ? 'מעדכן...' : 'יוצר...'}
                  </>
                ) : (
                  editingField ? 'עדכן' : 'צור שדה'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
