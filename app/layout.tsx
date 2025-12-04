import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import { OrganizationSchema, WebSiteSchema } from "@/components/JsonLd";
import { generateHomeMetadata } from "@/lib/seo-utils";
import { Analytics } from '@vercel/analytics/next';
import { Toaster } from 'sonner';

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["hebrew", "latin"],
});

export const metadata: Metadata = generateHomeMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <OrganizationSchema />
        <WebSiteSchema />
      </head>
      <body
        className={`${rubik.variable} antialiased`}
      >
        {children}
        <Analytics />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
