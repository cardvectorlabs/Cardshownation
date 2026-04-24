import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { GooglePageViewTracker } from "@/components/analytics/google-page-view-tracker";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? "";
const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() ?? "";
const GOOGLE_TAG_ID = GA_MEASUREMENT_ID || GOOGLE_ADS_ID;

export const metadata: Metadata = {
  title: {
    default: "Card Show Nation | Card Show Directory",
    template: "%s | Card Show Nation",
  },
  description:
    "The national card show directory. Find upcoming sports card, Pokemon, and TCG shows by state, city, and date.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://cardshownation.com"
  ),
  openGraph: {
    siteName: "Card Show Nation",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL ?? "https://cardshownation.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta charSet="utf-8" />
        {GOOGLE_TAG_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
                GOOGLE_TAG_ID
              )}`}
              strategy="afterInteractive"
            />
            <Script id="google-tag-config" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('js', new Date());
                ${GA_MEASUREMENT_ID ? `gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });` : ""}
                ${GOOGLE_ADS_ID ? `gtag('config', '${GOOGLE_ADS_ID}');` : ""}
              `}
            </Script>
          </>
        )}
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8982218628461022"
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen bg-slate-50 font-sans text-slate-950 antialiased">
        {GOOGLE_TAG_ID && <GooglePageViewTracker />}
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
