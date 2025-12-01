import { getLawDocument } from '@/app/actions/law-comment-actions';
import { LawDocumentViewer } from '@/components/law-document/LawDocumentViewer';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'הצעת חוק יסוד: שירות חובה למען המדינה | אל הדגל',
  description: 'צפו בהצעת החוק המלאה והגיבו על כל פסקה',
};

export default async function LawDocumentPage() {
  const documentData = await getLawDocument();

  // If no active document found, redirect to home
  if (!documentData) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <LawDocumentViewer documentData={documentData} />
    </div>
  );
}
