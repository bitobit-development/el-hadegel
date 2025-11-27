import { auth } from '@/auth';
import { AdminHeader } from '@/components/admin/admin-header';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  // No redirect needed - parent (protected) layout handles authentication

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <AdminHeader user={session!.user} />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
