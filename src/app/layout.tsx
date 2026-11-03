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
const swScript =
  process.env.NODE_ENV === "production"
    ? `(function(){if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'}).catch(function(){});});}})();`
    : `(function(){if(!('serviceWorker' in navigator))return;window.addEventListener('load',function(){navigator.serviceWorker.getRegistrations().then(function(rs){return Promise.all(rs.map(function(r){return r.unregister();}));}).then(function(){if(!('caches' in window))return;return caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k.indexOf('deshi-health-')===0;}).map(function(k){return caches.delete(k);}));});}).catch(function(){});});})();`;

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
        <script dangerouslySetInnerHTML={{ __html: swScript }} />
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
