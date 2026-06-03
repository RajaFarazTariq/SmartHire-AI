import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ClerkThemeProvider } from "@/components/clerk-theme-provider";
import { SessionSentinel } from "@/components/session-sentinel";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "SmartHire AI — Intelligent Resume Screening",
  description:
    "AI-powered recruitment platform that extracts skills, scores candidates, and ranks them against your job descriptions with explainable match scores.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className={`${inter.variable} min-h-full font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ClerkThemeProvider>
            <SessionSentinel />
            {children}
            <Toaster richColors position="top-right" />
          </ClerkThemeProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
