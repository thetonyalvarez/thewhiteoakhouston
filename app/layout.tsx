import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Resolve the public base URL for absolute metadata (OG image, canonical, etc).
 *
 * Priority:
 *   1. NEXT_PUBLIC_SITE_URL — set this in Vercel after the custom domain is live
 *   2. VERCEL_URL — auto-injected by Vercel for every deploy (preview + production)
 *   3. localhost — dev fallback
 *
 * Without this, pre-DNS-cutover share previews (Slack, iMessage, etc.) would
 * try to fetch /opengraph-image.png from thewhiteoakhouston.com — which is
 * still Squarespace until DNS moves — and the card would render blank.
 */
const resolveMetadataBase = (): URL => {
  if (process.env.NEXT_PUBLIC_SITE_URL) return new URL(process.env.NEXT_PUBLIC_SITE_URL);
  if (process.env.VERCEL_URL) return new URL(`https://${process.env.VERCEL_URL}`);
  return new URL("http://localhost:3000");
};

export const metadata: Metadata = {
  metadataBase: resolveMetadataBase(),
  title: "The White Oak — The Heights, Rooted.",
  description:
    "The White Oak — boutique residences in Houston Heights. 42 homes, rooftop, rooted in the neighborhood.",
  openGraph: {
    title: "The White Oak — The Heights, Rooted.",
    description:
      "Boutique residences in Houston Heights. 42 homes, rooftop, rooted in the neighborhood.",
    siteName: "The White Oak",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The White Oak — The Heights, Rooted.",
    description:
      "Boutique residences in Houston Heights. 42 homes, rooftop, rooted in the neighborhood.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${fraunces.variable} ${inter.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
