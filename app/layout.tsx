import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { GlobalErrorBoundary } from "@/components/error-boundary";
import { AuthProvider } from "@/components/auth-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Emex Dashboard - Lead Generation & Outreach",
  description: "Automated lead generation, email outreach, and content management for Emex Express",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <GlobalErrorBoundary>
            {children}
          </GlobalErrorBoundary>
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
