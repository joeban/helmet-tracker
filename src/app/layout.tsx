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
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "HelmetScore",
    "description": "The definitive database of Virginia Tech bicycle helmet safety ratings",
    "url": "https://helmetscore.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://helmetscore.com/?search={search_term_string}",
      "query-input": "required name=search_term_string"
    },
    "about": {
      "@type": "Organization",
      "name": "HelmetScore",
      "description": "Bicycle helmet safety database providing Virginia Tech STAR ratings",
      "url": "https://helmetscore.com",
      "sameAs": [
        "https://helmetscore.com/about",
        "https://helmetscore.com/methodology"
      ]
    },
    "mainEntity": {
      "@type": "Dataset",
      "name": "Virginia Tech Bicycle Helmet Safety Ratings",
      "description": "Comprehensive database of 281+ bicycle helmets tested using Virginia Tech STAR methodology",
      "creator": {
        "@type": "Organization",
        "name": "Virginia Tech Helmet Lab"
      },
      "license": "https://creativecommons.org/licenses/by/4.0/",
      "temporalCoverage": "2020/2025"
    }
  };

  return (
    <html lang="en">
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://amazon.com" />

        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
                    page_title: document.title,
                    page_location: window.location.href,
                  });
                `,
              }}
            />
          </>
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
        {/* AvantLink Affiliate Verification */}
        <script
          async
          type="text/javascript"
          src="http://classic.avantlink.com/affiliate_app_confirm.php?mode=js&authResponse=0b7c0a9a6210d902e8394b526c8e2c05e76e0d96"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
