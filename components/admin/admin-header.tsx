'use client';

import { signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { LogOut, Home } from 'lucide-react';

interface AdminHeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/login' });
  };

  return (
    <header className="mb-8 md:mb-10 lg:mb-12 bg-gradient-to-r from-[#001f3f] to-[#002855] p-6 shadow-xl">
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Image
              src="/star.svg"
              alt="אל הדגל"
              width={226}
              height={63}
              className="opacity-90 hover:opacity-100 transition-opacity"
              priority
            />
            <div className="text-right">
              <h1 className="text-3xl font-bold mb-1 bg-gradient-to-l from-white to-gray-100 bg-clip-text text-transparent">
                לוח בקרה - ניהול עמדות
              </h1>
              <p className="text-white/90 text-base">
                מערכת ניהול עמדות חברי הכנסת
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{user.name}</p>
              <p className="text-xs text-white/70">{user.email}</p>
            </div>
            <Link href="/">
              <Button variant="ghost" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-white/30 hover:border-white/50">
                <Home className="h-4 w-4 ml-2" />
                עמוד הבית
              </Button>
            </Link>
            <Button onClick={handleLogout} variant="outline" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-white/30 hover:border-white/50">
              <LogOut className="h-4 w-4 ml-2" />
              התנתק
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
