import type { Metadata } from "next";
import { Playfair_Display, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
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
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${playfair.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
