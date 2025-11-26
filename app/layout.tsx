import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["hebrew", "latin"],
});

export const metadata: Metadata = {
  title: "אל הדגל",
  description: "מעקב אחר עמדות חברי הכנסת בנושאים חקיקתיים חשובים",
  openGraph: {
    title: "אל הדגל",
    description: "מעקב אחר עמדות חברי הכנסת בנושאים חקיקתיים חשובים",
    locale: "he_IL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "אל הדגל",
    description: "מעקב אחר עמדות חברי הכנסת בנושאים חקיקתיים חשובים",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body
        className={`${rubik.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
