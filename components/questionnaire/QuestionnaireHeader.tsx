'use client';

import Image from 'next/image';
import { FileQuestion } from 'lucide-react';

interface QuestionnaireHeaderProps {
  title: string;
  description?: string | null;
}

export function QuestionnaireHeader({ title, description }: QuestionnaireHeaderProps) {
  return (
    <header className="bg-gradient-to-r from-[#001f3f] to-[#002855] p-4 md:p-6 shadow-xl rounded-b-2xl">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center gap-4 md:gap-6">
          {/* Text Section - Left Side */}
          <div className="text-right flex-1">
            <div className="flex items-center gap-3 justify-end mb-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-l from-white to-gray-100 bg-clip-text text-transparent leading-tight">
                {title}
              </h1>
              <FileQuestion className="h-10 w-10 sm:h-12 sm:w-12 text-white/90 flex-shrink-0" aria-hidden="true" />
            </div>
            {description && (
              <p className="text-white/90 text-sm sm:text-base md:text-lg leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {/* Logo - Right Side */}
          <Image
            src="/star.svg"
            alt="אל הדגל"
            width={170}
            height={47}
            className="opacity-90 hover:opacity-100 transition-opacity flex-shrink-0 w-[120px] h-[33px] sm:w-[200px] sm:h-[55px] md:w-[240px] md:h-[66px]"
            priority
          />
        </div>
      </div>
    </header>
  );
}
