'use client';

import { LawDocumentData } from '@/types/law-comment';
import { TableOfContents } from './TableOfContents';
import { LawParagraphCard } from './LawParagraphCard';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface Props {
  documentData: LawDocumentData;
}

export function LawDocumentViewer({ documentData }: Props) {
  const formatDate = (date: Date) => {
    return format(date, 'd MMMM yyyy', { locale: he });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <header className="mb-12 text-center">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black mb-4 leading-tight">
          {documentData.title}
        </h1>
        {documentData.description && (
          <p className="text-lg text-gray-700 mb-4 max-w-3xl mx-auto">
            {documentData.description}
          </p>
        )}
        <div className="text-gray-600 text-base sm:text-lg">
          <span className="font-semibold">גרסה {documentData.version}</span>
          <span className="mx-2">•</span>
          <span>{formatDate(documentData.publishedAt)}</span>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Table of Contents - Hidden on mobile */}
        <aside className="hidden lg:block lg:col-span-3">
          <TableOfContents paragraphs={documentData.paragraphs} />
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-9">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 lg:p-12">
            {documentData.paragraphs.map((paragraph) => (
              <LawParagraphCard
                key={paragraph.id}
                paragraph={paragraph}
              />
            ))}
          </div>
        </main>
      </div>

      {/* Print Stylesheet */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          article {
            page-break-inside: avoid;
          }
          h2 {
            page-break-after: avoid;
          }
          .bg-slate-50 {
            background: white !important;
          }
          .shadow-sm {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
