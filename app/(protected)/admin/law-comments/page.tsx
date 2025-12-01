import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { AdminLawCommentsManager } from '@/components/admin/law-comments/AdminLawCommentsManager';

/**
 * Admin Law Comments Page
 * Server component that verifies admin session and passes admin ID to client component
 */
export default async function AdminLawCommentsPage() {
  // Verify session
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  // Get admin from database
  const admin = await prisma.admin.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  if (!admin) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ניהול תגובות על חוק הגיוס
        </h1>
        <p className="text-gray-600">
          בדיקה ואישור תגובות מהציבור על הצעת החוק
        </p>
      </div>

      <AdminLawCommentsManager adminId={admin.id} adminName={admin.name} />
    </div>
  );
}
