import type { Metadata } from "next";
import { Nunito_Sans, Varela_Round } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { ToastProvider } from "@/components/Toast";

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
});

const varelaRound = Varela_Round({
  variable: "--font-varela",
  subsets: ["latin"],
  display: "swap",
});

// Apply stored theme (or OS preference) before first paint to avoid flash
const themeScript = `(function(){try{var t=localStorage.getItem("habitforge_theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark");}catch(e){}})();`;

export const metadata: Metadata = {
  title: "HabitForge — AI Habit Tracker & Coach",
  description:
    "Build lasting habits with AI-powered coaching. HabitForge learns your patterns, predicts when you're about to break a streak, and provides personalized strategies to help you succeed.",
  keywords: [
    "habit tracker",
    "AI coach",
    "productivity",
    "habit building",
    "streak tracker",
  ],
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
      className={`${nunitoSans.variable} ${varelaRound.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ConvexClientProvider>
          <ToastProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
          </ToastProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
