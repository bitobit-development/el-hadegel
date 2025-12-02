/**
 * Excel Export Utility for Questionnaire Responses
 * Generates Excel files with questionnaire responses including custom field columns
 */

import * as XLSX from 'xlsx';

/**
 * Export responses to Excel
 * @param questionnaireTitle - Title of the questionnaire
 * @param exportData - Data containing questions and response data
 * @returns Blob containing the Excel file
 */
export async function exportResponsesToExcel(
  questionnaireTitle: string,
  exportData: {
    questions: Array<{ index: number; text: string; type: string }>;
    data: Array<Record<string, any>>;
  }
): Promise<Blob> {
  try {
    // Extract data
    const { questions, data } = exportData;

    // If no data, create empty sheet with headers only
    if (data.length === 0) {
      const emptyData = [
        {
          'שם מלא': '',
          'טלפון': '',
          'אימייל': '',
          'תאריך הגשה': '',
          ...Object.fromEntries(questions.map((q) => [`שאלה ${q.index}`, ''])),
        },
      ];
      const ws = XLSX.utils.json_to_sheet(emptyData);
      setColumnWidths(ws);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'תשובות');
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      return new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
    }

    // Determine all column headers (including custom fields)
    const allHeaders = new Set<string>();
    data.forEach((row) => {
      Object.keys(row).forEach((key) => allHeaders.add(key));
    });

    // Define standard column order
    const standardColumns = ['שם מלא', 'טלפון', 'אימייל', 'תאריך הגשה'];
    const questionColumns = questions.map((q) => `שאלה ${q.index}`);

    // Extract custom field columns (all headers not in standard or question columns)
    const customFieldColumns = Array.from(allHeaders).filter(
      (header) =>
        !standardColumns.includes(header) &&
        !questionColumns.includes(header)
    );

    // Create ordered column list
    const orderedColumns = [
      ...standardColumns,
      ...questionColumns,
      ...customFieldColumns,
    ];

    // Transform data to match ordered columns and format values
    const orderedData = data.map((row) => {
      const orderedRow: Record<string, any> = {};

      orderedColumns.forEach((col) => {
        let value = row[col];

        // Format date values
        if (col === 'תאריך הגשה' && value instanceof Date) {
          value = value.toLocaleString('he-IL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          });
        } else if (value instanceof Date) {
          value = value.toLocaleDateString('he-IL');
        }

        // Ensure empty strings for missing values
        orderedRow[col] = value !== undefined && value !== null ? value : '';
      });

      return orderedRow;
    });

    // Create worksheet from JSON data
    const ws = XLSX.utils.json_to_sheet(orderedData, {
      header: orderedColumns,
    });

    // Set column widths
    setColumnWidths(ws, customFieldColumns.length);

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'תשובות');

    // Generate Excel buffer
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    // Return as Blob
    return new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  } catch (error) {
    console.error('Error creating Excel file:', error);
    throw new Error('שגיאה ביצירת קובץ אקסל');
  }
}

/**
 * Set column widths for better readability
 * @param ws - Worksheet object
 * @param customFieldCount - Number of custom field columns
 */
function setColumnWidths(ws: XLSX.WorkSheet, customFieldCount: number = 0): void {
  const standardWidths = [
    { wch: 20 }, // שם מלא
    { wch: 15 }, // טלפון
    { wch: 25 }, // אימייל
    { wch: 20 }, // תאריך הגשה
  ];

  // Calculate total columns
  const questionCount = Object.keys(ws).filter((key) =>
    key.match(/^[A-Z]+1$/)
  ).length - 4; // Subtract standard columns

  const questionWidths = Array(questionCount - customFieldCount).fill({ wch: 30 });
  const customFieldWidths = Array(customFieldCount).fill({ wch: 25 });

  ws['!cols'] = [...standardWidths, ...questionWidths, ...customFieldWidths];
}
