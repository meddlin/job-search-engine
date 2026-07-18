import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import TopNavigation from "@/app/components/TopNavigation";
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
  title: "Job Search Dashboard",
  description: "Track job applications, recruiters, resume work, and company research.",
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
        <TopNavigation />
        {children}
      </body>
    </html>
  );
}
