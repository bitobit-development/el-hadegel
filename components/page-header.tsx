/*
 * AUTH PRESERVATION NOTES (2025-11-30)
 * =====================================
 * PageHeader updated to support both public and authenticated modes
 *
 * TO REVERT TO FULLY PROTECTED MODE:
 * 1. Restore original interface with required user prop (line 9-13)
 * 2. Remove Session import and session prop (line 5, 15)
 * 3. Remove conditional rendering logic (lines 47-87)
 * 4. Restore original always-authenticated UI (lines 49-76 in original file)
 *
 * ORIGINAL INTERFACE:
 * interface PageHeaderProps {
 *   user: {
 *     name?: string | null;
 *     email?: string | null;
 *   };
 * }
 */

'use client';

import { signOut } from 'next-auth/react';
import { Session } from 'next-auth';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, LogOut, LogIn, FileText } from 'lucide-react';

interface PageHeaderProps {
  session: Session | null;
}

export function PageHeader({ session }: PageHeaderProps) {
  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/login' });
  };

  return (
    <header className="mb-6 md:mb-8 lg:mb-12 bg-gradient-to-r from-[#001f3f] to-[#002855] p-4 md:p-6 shadow-xl">
      <div className="container mx-auto max-w-7xl">
        {/* Mobile: Stack vertically, Desktop: Horizontal layout */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Logo and Title Section */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-6">
            <Link
              href="https://www.elhadegel.co.il/"
              target="_blank"
              rel="noopener noreferrer"
              className="logo-shine flex-shrink-0"
            >
              <Image
                src="/star.svg"
                alt="אל הדגל"
                width={113}
                height={32}
                className="w-[90px] h-[25px] sm:w-[113px] sm:h-[32px] md:w-[170px] md:h-[47px] lg:w-[226px] lg:h-[63px]"
                priority
              />
            </Link>
            <div className="text-right flex-1 min-w-0">
              <h1 className="text-base sm:text-lg md:text-2xl lg:text-3xl font-bold mb-0.5 md:mb-1 bg-gradient-to-l from-white to-gray-100 bg-clip-text text-transparent leading-tight">
                אל הדגל - מעקב עמדות חוק הפטור מגיוס
              </h1>
              <p className="text-white/90 text-[11px] sm:text-xs md:text-sm lg:text-base leading-tight">
                מערכת מעקב עמדות חברי הכנסת
              </p>
            </div>
          </div>

          {/* User Info and Actions Section */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4 md:flex-shrink-0">
            {session?.user ? (
              // Authenticated state - show user info and logout
              <>
                {/* User Info - Hidden on small mobile, shown on medium+ */}
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-white">{session.user.name}</p>
                  <p className="text-xs text-white/70">{session.user.email}</p>
                </div>

                {/* Buttons - Horizontal on mobile, maintain horizontal on desktop */}
                <div className="flex items-center gap-2 md:gap-3">
                  <Link href="/admin" className="flex-1 md:flex-none">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full md:w-auto h-10 px-3 sm:px-4 bg-white/10 hover:bg-white/20 text-white border-white/30 hover:border-white/50 text-xs sm:text-sm"
                    >
                      <LayoutDashboard className="h-4 w-4 ml-1.5 sm:ml-2 flex-shrink-0" />
                      <span className="truncate">לוח בקרה</span>
                    </Button>
                  </Link>
                  <Link href="/law-document" className="flex-1 md:flex-none">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full md:w-auto h-10 px-3 sm:px-4 bg-white/10 hover:bg-white/20 text-white border-white/30 hover:border-white/50 text-xs sm:text-sm"
                    >
                      <FileText className="h-4 w-4 ml-1.5 sm:ml-2 flex-shrink-0" />
                      <span className="truncate">הצעת החוק</span>
                    </Button>
                  </Link>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="sm"
                    className="flex-1 md:flex-none h-10 px-3 sm:px-4 bg-white/10 hover:bg-white/20 text-white border-white/30 hover:border-white/50 text-xs sm:text-sm"
                  >
                    <LogOut className="h-4 w-4 ml-1.5 sm:ml-2 flex-shrink-0" />
                    <span className="truncate">התנתק</span>
                  </Button>
                </div>
              </>
            ) : (
              // Public state - no login button (users access /login manually)
              <div className="flex items-center gap-2 md:gap-3">
                {/* Login button removed - users navigate to /login manually */}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
