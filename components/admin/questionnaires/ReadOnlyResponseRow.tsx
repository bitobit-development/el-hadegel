'use client';

import { useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Eye, Trash2, Loader2 } from 'lucide-react';
import { formatQuestionnaireDate, formatPhoneNumber, getRelativeTime } from '@/lib/questionnaire-utils';

interface Answer {
  id: number;
  answer: boolean | null;
  textAnswer: string | null;
  question: {
    id: number;
    questionText: string;
    questionType: 'YES_NO' | 'TEXT' | 'LONG_TEXT';
  };
}

interface Response {
  id: number;
  fullName: string;
  phoneNumber: string;
  email: string;
  submittedAt: Date | string;
  answers: Answer[];
}

interface ReadOnlyResponseRowProps {
  response: Response;
  onEdit: () => void;
  onDelete: () => void;
  onViewDetails: () => void;
  isSaving: boolean;
}

export function ReadOnlyResponseRow({
  response,
  onEdit,
  onDelete,
  onViewDetails,
  isSaving,
}: ReadOnlyResponseRowProps) {
  const [isHoveringName, setIsHoveringName] = useState(false);
  const [isHoveringPhone, setIsHoveringPhone] = useState(false);
  const [isHoveringEmail, setIsHoveringEmail] = useState(false);

  return (
    <TableRow className={isSaving ? 'opacity-60' : ''}>
      {/* Name - with edit on hover */}
      <TableCell
        className="text-right font-medium relative group cursor-pointer"
        onMouseEnter={() => setIsHoveringName(true)}
        onMouseLeave={() => setIsHoveringName(false)}
        onClick={onEdit}
      >
        <div className="flex items-center justify-between">
          <span className={isSaving ? 'text-gray-500' : ''}>{response.fullName}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className={`opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-blue-100 rounded ${
              isHoveringName ? 'opacity-100' : ''
            }`}
            title="ערוך שם"
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
            ) : (
              <Pencil className="h-3 w-3 text-blue-600" />
            )}
          </button>
        </div>
      </TableCell>

      {/* Phone - with edit on hover */}
      <TableCell
        className="text-center text-sm relative group cursor-pointer"
        onMouseEnter={() => setIsHoveringPhone(true)}
        onMouseLeave={() => setIsHoveringPhone(false)}
        onClick={onEdit}
      >
        <div className="flex items-center justify-center gap-2">
          <span dir="ltr" className={`font-mono ${isSaving ? 'text-gray-500' : ''}`}>
            {formatPhoneNumber(response.phoneNumber)}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className={`opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-blue-100 rounded ${
              isHoveringPhone ? 'opacity-100' : ''
            }`}
            title="ערוך טלפון"
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
            ) : (
              <Pencil className="h-3 w-3 text-blue-600" />
            )}
          </button>
        </div>
      </TableCell>

      {/* Email - with edit on hover */}
      <TableCell
        className="text-center text-sm relative group cursor-pointer"
        onMouseEnter={() => setIsHoveringEmail(true)}
        onMouseLeave={() => setIsHoveringEmail(false)}
        onClick={onEdit}
      >
        <div className="flex items-center justify-center gap-2">
          <span dir="ltr" className={isSaving ? 'text-gray-500' : ''}>
            {response.email}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className={`opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-blue-100 rounded ${
              isHoveringEmail ? 'opacity-100' : ''
            }`}
            title="ערוך אימייל"
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
            ) : (
              <Pencil className="h-3 w-3 text-blue-600" />
            )}
          </button>
        </div>
      </TableCell>

      {/* Submitted At */}
      <TableCell className="text-center text-sm text-gray-600">
        <div>{getRelativeTime(response.submittedAt)}</div>
        <div className="text-xs text-gray-500">{formatQuestionnaireDate(response.submittedAt)}</div>
      </TableCell>

      {/* Answers Summary */}
      <TableCell className="text-center">
        <span className="font-semibold text-blue-600">{response.answers.length}</span>
      </TableCell>

      {/* Actions */}
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-1">
          {/* View Details */}
          <Button
            size="sm"
            variant="ghost"
            onClick={onViewDetails}
            disabled={isSaving}
            title="הצג פרטים"
          >
            <Eye className="h-4 w-4 text-blue-600" />
          </Button>

          {/* Delete */}
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            disabled={isSaving}
            title="מחיקה"
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
