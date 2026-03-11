import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "Card Show Nation — Find Card Shows Near You",
    template: "%s | Card Show Nation",
  },
  description:
    "Discover upcoming sports card shows, Pokémon events, TCG tournaments, and collectible shows nationwide. Search by state, city, or date.",
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
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-screen flex-col font-sans">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
