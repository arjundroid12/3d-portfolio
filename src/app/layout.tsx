import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Arjun Vashishtha — Full-Stack Developer & AI Builder",
  description: "Portfolio of Arjun Vashishtha — 4th-year B.Tech CSE student at VIT Bhopal. Building autonomous AI agents, full-stack apps, and data-driven solutions.",
  keywords: ["Arjun Vashishtha", "AI Agent", "Full-Stack Developer", "Next.js", "React", "Python", "Machine Learning", "Portfolio"],
  authors: [{ name: "Arjun Vashishtha" }],
  openGraph: {
    title: "Arjun Vashishtha — Full-Stack Developer & AI Builder",
    description: "Building autonomous AI agents, full-stack apps, and data-driven solutions.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
