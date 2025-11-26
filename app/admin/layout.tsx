import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AdminHeader } from '@/components/admin/admin-header';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <AdminHeader user={session.user} />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
