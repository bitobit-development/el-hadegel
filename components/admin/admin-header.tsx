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
    await signOut({ callbackUrl: '/' });
  };

  return (
    <header className="border-b bg-gradient-to-l from-[#0058ff] to-[#003d82] shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image
              src="/logo.svg"
              alt="אל הדגל"
              width={100}
              height={29}
              className="brightness-0 invert"
            />
            <h1 className="text-2xl font-bold text-white text-right">לוח בקרה - ניהול עמדות</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{user.name}</p>
              <p className="text-xs text-blue-100">{user.email}</p>
            </div>
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 hover:text-white">
                <Home className="h-4 w-4 ml-2" />
                עמוד הבית
              </Button>
            </Link>
            <Button onClick={handleLogout} variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/20 hover:text-white hover:border-white/50">
              <LogOut className="h-4 w-4 ml-2" />
              התנתק
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
