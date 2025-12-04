'use client';

import Link from 'next/link';
import Image from 'next/image';

interface ElHadegelButtonProps {
  text: string;
  href: string;
  ariaLabel: string;
  gradient?: string; // Optional custom gradient classes (e.g., "from-[#002855] to-[#003d70]")
}

export const ElHadegelButton = ({ text, href, ariaLabel, gradient }: ElHadegelButtonProps) => {
  // Default gradient if not provided
  const gradientClasses = gradient || 'from-[#001f3f] to-[#002855]';
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="elhadegel-button group relative inline-block"
      aria-label={ariaLabel}
    >
      {/* Floating Card Style Button - shadcn/ui Inspired */}
      <div
        className={`
          relative
          w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32
          rounded-full
          bg-gradient-to-r ${gradientClasses}
          border border-white/20
          flex flex-col items-center justify-center
          p-2 sm:p-2.5 md:p-3
          gap-1 sm:gap-1.5
          transition-all duration-300
          shadow-lg
          group-hover:-translate-y-1
          group-hover:shadow-xl
          group-hover:border-white/40
          group-hover:brightness-125
          group-hover:scale-110
          group-active:translate-y-0
          group-active:shadow-lg
        `}
      >
        {/* Subtle inner highlight for depth */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/5 to-transparent" />

        {/* Logo */}
        <div className="relative flex-shrink-0 transition-all duration-200 group-hover:scale-110 group-hover:brightness-110">
          <Image
            src="/star.svg"
            alt="אל הדגל"
            width={48}
            height={13}
            className="w-[34px] h-[9px] sm:w-[44px] sm:h-[12px] md:w-[56px] md:h-[15px]"
            priority
          />
        </div>

        {/* Hebrew Text */}
        <div className="relative text-center leading-tight">
          <span
            className="
              text-[9px] sm:text-[10px] md:text-[11px]
              font-bold
              text-white
              transition-all duration-200
              group-hover:scale-105
              group-hover:brightness-110
              block
            "
          >
            {text}
          </span>
        </div>
      </div>
    </Link>
  );
};
