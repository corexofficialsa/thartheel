import type { Metadata, Viewport } from "next";
import { Fraunces, Geist } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { CookieNotice } from "@/components/site/cookie-notice";
import { UtmCapture } from "@/components/site/utm-capture";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

// Geist for interface text, Fraunces (a warm, bookish serif) for display
// headings — the variable names line up with the `--font-sans` /
// `--font-heading` tokens in globals.css.
const fontSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fontHeading = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: "variable",
});

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://") ? process.env.NEXT_PUBLIC_APP_URL : "https://www.mirqath.com";
const DESCRIPTION =
  "Mirqath Quran Academy — structured, teacher-led Quran learning from the Arabic letters to memorising the Qur'an, with live classes, homework and progress tracking.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Mirqath Quran Academy", template: "%s · Mirqath Quran Academy" },
  description: DESCRIPTION,
  applicationName: "Mirqath Quran Academy",
  openGraph: {
    type: "website",
    siteName: "Mirqath Quran Academy",
    title: "Mirqath Quran Academy",
    description: DESCRIPTION,
    url: "/",
    images: [{ url: "/brand/mirqath-logo.png", width: 1200, height: 1046, alt: "Mirqath Quran Academy" }],
  },
  twitter: { card: "summary", title: "Mirqath Quran Academy", description: DESCRIPTION, images: ["/brand/mirqath-logo.png"] },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Mirqath Quran Academy" },
};

export const viewport: Viewport = {
  themeColor: "#152b54",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontHeading.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <a
            href="#main"
            className="sr-only z-[60] rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
          >
            Skip to content
          </a>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster />
          <ServiceWorkerRegister />
          <CookieNotice />
          <UtmCapture />
        </ThemeProvider>
      </body>
    </html>
  );
}
