/*
 * AUTH PRESERVATION NOTES (2025-11-30)
 * =====================================
 * This layout is PRESERVED and still protects the /admin route
 * Landing page (/) has been moved to app/(public)/ for public access
 *
 * TO REVERT TO FULLY PROTECTED MODE:
 * 1. Move app/(public)/page.tsx back to app/(protected)/page.tsx
 * 2. Delete app/(public)/ directory entirely
 * 3. This layout will automatically protect the landing page again
 * 4. Update PageHeader component to use required user prop (see PageHeader file)
 *
 * CURRENT PROTECTED ROUTES:
 * - /admin (and all child routes)
 *
 * ORIGINAL PROTECTED ROUTES (before change):
 * - / (landing page) - NOW PUBLIC
 * - /admin (and all child routes) - STILL PROTECTED
 */

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
