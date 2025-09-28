import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
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
  keywords: [
    "helmet safety", "bike helmet ratings", "Virginia Tech STAR", "cycling safety",
    "helmet reviews", "bicycle helmet comparison", "MIPS helmet", "road bike helmet",
    "mountain bike helmet", "helmet safety scores", "bicycle safety", "helmet testing",
    "safest bike helmet", "helmet database", "cycling protection", "helmet buying guide"
  ].join(", "),
  authors: [{ name: "HelmetScore", url: "https://helmetscore.com" }],
  creator: "HelmetScore",
  publisher: "HelmetScore",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://helmetscore.com'),
  alternates: {
    canonical: 'https://helmetscore.com',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://helmetscore.com",
    siteName: "HelmetScore",
    title: "HelmetScore - The Ultimate Helmet Safety Database",
    description: "Compare 281+ bicycle helmets with Virginia Tech STAR safety ratings. Find the safest helmet for your rides with comprehensive safety data and real-time pricing.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "HelmetScore - Bicycle Helmet Safety Database",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@helmetscore",
    creator: "@helmetscore",
    title: "HelmetScore - Helmet Safety Ratings",
    description: "The definitive database of Virginia Tech helmet safety ratings for cyclists. Compare 281+ helmets with STAR safety scores.",
    images: ["/twitter-image.jpg"],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
  },
  category: "Sports & Recreation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://helmetscore.com/#website",
        "url": "https://helmetscore.com",
        "name": "HelmetScore",
        "description": "The definitive database of Virginia Tech bicycle helmet safety ratings",
        "publisher": {
          "@id": "https://helmetscore.com/#organization"
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://helmetscore.com/?search={search_term_string}"
          },
          "query-input": "required name=search_term_string"
        },
        "inLanguage": "en-US"
      },
      {
        "@type": "Organization",
        "@id": "https://helmetscore.com/#organization",
        "name": "HelmetScore",
        "url": "https://helmetscore.com",
        "description": "Bicycle helmet safety database providing Virginia Tech STAR ratings and comprehensive safety comparisons",
        "logo": {
          "@type": "ImageObject",
          "url": "https://helmetscore.com/logo.png",
          "width": 512,
          "height": 512
        },
        "sameAs": [
          "https://helmetscore.com/about",
          "https://helmetscore.com/methodology"
        ],
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "customer service",
          "url": "https://helmetscore.com/contact"
        }
      },
      {
        "@type": "Dataset",
        "@id": "https://helmetscore.com/#dataset",
        "name": "Virginia Tech Bicycle Helmet Safety Ratings Database",
        "description": "Comprehensive database of 281+ bicycle helmets tested using Virginia Tech STAR methodology with safety scores, pricing, and availability data",
        "url": "https://helmetscore.com",
        "creator": {
          "@type": "Organization",
          "name": "Virginia Tech Helmet Lab",
          "url": "https://www.helmet.beam.vt.edu"
        },
        "publisher": {
          "@id": "https://helmetscore.com/#organization"
        },
        "license": "https://creativecommons.org/licenses/by/4.0/",
        "temporalCoverage": "2020/2025",
        "spatialCoverage": "Worldwide",
        "keywords": [
          "bicycle helmet safety",
          "Virginia Tech STAR ratings",
          "helmet testing",
          "cycling safety",
          "MIPS technology",
          "road bike helmets",
          "mountain bike helmets"
        ],
        "distribution": {
          "@type": "DataDownload",
          "encodingFormat": "application/json",
          "contentUrl": "https://helmetscore.com/api/helmets"
        }
      },
      {
        "@type": "WebPage",
        "@id": "https://helmetscore.com/#webpage",
        "url": "https://helmetscore.com",
        "name": "HelmetScore - Virginia Tech Safety Ratings & Reviews",
        "isPartOf": {
          "@id": "https://helmetscore.com/#website"
        },
        "about": {
          "@id": "https://helmetscore.com/#dataset"
        },
        "description": "Compare 281+ bicycle helmets with Virginia Tech STAR safety ratings, pricing, and expert reviews. Find the safest helmet for your cycling needs.",
        "breadcrumb": {
          "@id": "https://helmetscore.com/#breadcrumb"
        },
        "inLanguage": "en-US",
        "potentialAction": [
          {
            "@type": "ReadAction",
            "target": ["https://helmetscore.com"]
          }
        ]
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://helmetscore.com/#breadcrumb",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://helmetscore.com"
          }
        ]
      }
    ]
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
        <link rel="dns-prefetch" href="https://m.media-amazon.com" />
        <link rel="dns-prefetch" href="https://images-na.ssl-images-amazon.com" />
        <link rel="dns-prefetch" href="https://www.helmet.beam.vt.edu" />
        <link rel="dns-prefetch" href="https://classic.avantlink.com" />

        {/* Performance hints */}
        <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#2563eb" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1e40af" media="(prefers-color-scheme: dark)" />

        {/* Favicon and App Icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />

        {/* Theme and App Configuration */}
        <meta name="color-scheme" content="light" />
        <meta name="application-name" content="HelmetScore" />
        <meta name="apple-mobile-web-app-title" content="HelmetScore" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />

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
          type="text/javascript"
          src="https://classic.avantlink.com/affiliate_app_confirm.php?mode=js&authResponse=0b7c0a9a6210d902e8394b526c8e2c05e76e0d96"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
        <SpeedInsights />
        {/* AvantLink Verification - Body Position */}
        <script
          type="text/javascript"
          src="https://classic.avantlink.com/affiliate_app_confirm.php?mode=js&authResponse=0b7c0a9a6210d902e8394b526c8e2c05e76e0d96"
        />
      </body>
    </html>
  );
}
