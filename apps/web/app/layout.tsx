import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Card Show Nation | Card Show Directory",
    template: "%s | Card Show Nation",
  },
  description:
    "Card Show Nation helps collectors discover upcoming sports card, Pokemon, and TCG shows by state, city, and date.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://cardshownation.com"
  ),
  openGraph: {
    siteName: "Card Show Nation",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-slate-50 font-sans text-slate-950 antialiased">
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
