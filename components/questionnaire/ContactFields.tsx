'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ContactFieldsProps {
  fullName: string;
  phoneNumber: string;
  email: string;
  errors: {
    fullName?: string;
    phoneNumber?: string;
    email?: string;
  };
  onChange: (field: string, value: string) => void;
}

export function ContactFields({
  fullName,
  phoneNumber,
  email,
  errors,
  onChange,
}: ContactFieldsProps) {
  return (
    <div className="contact-fields-glow rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 shadow-lg">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 text-right">
        פרטי יצירת קשר
        <span className="mr-2 text-red-500" aria-label="כל השדות חובה">*</span>
      </h3>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-right font-medium">
            שם מלא
            <span className="mr-1 text-red-500" aria-label="שדה חובה">*</span>
          </Label>
          <Input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => onChange('fullName', e.target.value)}
            placeholder="הזן את שמך המלא"
            className={cn(
              'text-right',
              errors.fullName && 'border-red-500 focus-visible:ring-red-500'
            )}
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? 'error-fullName' : undefined}
          />
          {errors.fullName && (
            <p
              id="error-fullName"
              className="text-sm font-medium text-red-600 text-right"
              role="alert"
            >
              {errors.fullName}
            </p>
          )}
        </div>

        {/* Phone Number */}
        <div className="space-y-2">
          <Label htmlFor="phoneNumber" className="text-right font-medium">
            מספר טלפון
            <span className="mr-1 text-red-500" aria-label="שדה חובה">*</span>
          </Label>
          <Input
            id="phoneNumber"
            type="tel"
            value={phoneNumber}
            onChange={(e) => onChange('phoneNumber', e.target.value)}
            placeholder="05XXXXXXXX"
            dir="ltr"
            className={cn(
              'text-left',
              errors.phoneNumber && 'border-red-500 focus-visible:ring-red-500'
            )}
            aria-invalid={!!errors.phoneNumber}
            aria-describedby={errors.phoneNumber ? 'error-phoneNumber' : undefined}
          />
          {errors.phoneNumber && (
            <p
              id="error-phoneNumber"
              className="text-sm font-medium text-red-600 text-right"
              role="alert"
            >
              {errors.phoneNumber}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-right font-medium">
            כתובת אימייל
            <span className="mr-1 text-red-500" aria-label="שדה חובה">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => onChange('email', e.target.value)}
            placeholder="your@email.com"
            dir="ltr"
            className={cn(
              'text-left',
              errors.email && 'border-red-500 focus-visible:ring-red-500'
            )}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'error-email' : undefined}
          />
          {errors.email && (
            <p
              id="error-email"
              className="text-sm font-medium text-red-600 text-right"
              role="alert"
            >
              {errors.email}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
