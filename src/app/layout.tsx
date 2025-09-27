import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HelmetScore - Virginia Tech Safety Ratings & Reviews",
  description: "The definitive helmet safety database. Compare 281+ bicycle helmets with Virginia Tech STAR ratings, Amazon prices, and expert reviews. Find your safest helmet.",
  keywords: "helmet safety, bike helmet ratings, Virginia Tech STAR, cycling safety, helmet reviews, bicycle helmet comparison",
  authors: [{ name: "HelmetScore" }],
  openGraph: {
    title: "HelmetScore - The Ultimate Helmet Safety Database",
    description: "Compare 281+ bicycle helmets with Virginia Tech STAR safety ratings. Find the safest helmet for your rides.",
    url: "https://helmetscore.com",
    siteName: "HelmetScore",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HelmetScore - Helmet Safety Ratings",
    description: "The definitive database of Virginia Tech helmet safety ratings for cyclists.",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
