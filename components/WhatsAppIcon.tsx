'use client';

import { MessageCircle } from 'lucide-react';
import { generateWhatsAppURL, DEFAULT_WHATSAPP_MESSAGE } from '@/lib/whatsapp-utils';

interface WhatsAppIconProps {
  mobileNumber: string;
  mkName: string;
  message?: string;
  className?: string;
}

/**
 * WhatsApp Icon Button
 * Opens WhatsApp Web/App with pre-filled message to MK
 * Only render this component if canContactViaWhatsApp() returns true
 */
export function WhatsAppIcon({
  mobileNumber,
  mkName,
  message = DEFAULT_WHATSAPP_MESSAGE,
  className = '',
}: WhatsAppIconProps) {
  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent MK card click event

    const whatsappURL = generateWhatsAppURL(mobileNumber, message);
    window.open(whatsappURL, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      onClick={handleWhatsAppClick}
      className={`
        absolute top-2 right-2 sm:top-3 sm:right-3
        z-10
        p-1.5 sm:p-2
        rounded-full
        bg-[#25D366]/90 hover:bg-[#128C7E]
        backdrop-blur-sm
        transition-all duration-200
        hover:scale-110
        shadow-lg hover:shadow-xl
        cursor-pointer
        group/whatsapp
        ${className}
      `.trim()}
      aria-label={`שלח הודעת WhatsApp ל${mkName}`}
      title="שלח הודעת WhatsApp"
      type="button"
    >
      <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white group-hover/whatsapp:text-white" />
    </button>
  );
}
