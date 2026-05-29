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

export const metadata: Metadata = {
  metadataBase: new URL("https://thewhiteoakhouston.com"),
  title: "The White Oak — The Heights, Rooted.",
  description:
    "The White Oak — boutique residences in Houston Heights. 42 homes, rooftop, rooted in the neighborhood.",
  openGraph: {
    title: "The White Oak — The Heights, Rooted.",
    description:
      "Boutique residences in Houston Heights. 42 homes, rooftop, rooted in the neighborhood.",
    url: "https://thewhiteoakhouston.com",
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
