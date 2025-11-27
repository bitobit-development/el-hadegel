import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // No header here - child routes handle their own headers
  // Landing page uses PageHeader (in page.tsx)
  // Admin routes use AdminHeader (in admin/layout.tsx)
  return <>{children}</>;
}
