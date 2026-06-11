import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Tiffino — Your Daily Mess, Sorted",
  description: "Subscribe to a local mess, track your meals, and never skip lunch again.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-[var(--color-surface-alt)]">{children}</body>
    </html>
  );
}
