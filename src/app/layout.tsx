import type { Metadata, Viewport } from "next";
import { Manrope, Hind_Siliguri } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { ToastProvider } from "@/components/Toast";
import { I18nProvider } from "@/lib/i18n";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const hind = Hind_Siliguri({
  variable: "--font-hind",
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const themeScript = `(function(){try{var t=localStorage.getItem("deshi_theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark");}catch(e){}})();`;

export const metadata: Metadata = {
  title: "Deshi Health Companion",
  description:
    "Bangladesh-first calorie, diet and exercise-balancing app with a RAG-grounded AI coach.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#EEEDF5" },
    { media: "(prefers-color-scheme: dark)", color: "#14121F" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${hind.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">
        <ConvexClientProvider>
          <I18nProvider>
            <ToastProvider>{children}</ToastProvider>
          </I18nProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
