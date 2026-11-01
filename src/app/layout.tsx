import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HabitForge — AI Habit Tracker & Coach",
  description:
    "Build lasting habits with AI-powered coaching. HabitForge learns your patterns, predicts when you're about to break a streak, and provides personalized strategies to help you succeed.",
  keywords: ["habit tracker", "AI coach", "productivity", "habit building", "streak tracker"],
  authors: [{ name: "HabitForge" }],
  openGraph: {
    title: "HabitForge — AI Habit Tracker & Coach",
    description: "Build lasting habits with AI-powered coaching.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
