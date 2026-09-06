import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "../components/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FieldSync — Infrastructure Progress Tracking",
  description:
    "FieldSync is an intelligent infrastructure progress tracking platform for real-time project monitoring, field evidence, WBS tracking, AI review, and delay alerts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-[#F4F5F3] text-[#102A2A] antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}