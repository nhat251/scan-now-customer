import type { Metadata } from "next";

import { SITE_CONFIG } from "@/constants/site";

export const APP_LAYOUT_METADATA: Metadata = {
  applicationName: "ScanNow",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  metadataBase: new URL(SITE_CONFIG.baseUrl),
  title: {
    default: "ScanNow | Nền tảng quản lý nhà hàng",
    template: "%s | ScanNow",
  },
  icons: {
    icon: "/icons/logo-transparent.webp",
    apple: "/icons/logo-transparent.webp",
  },
  description:
    "ScanNow giúp nhà hàng quản lý gọi món, bàn, nhân sự, thanh toán và vận hành chi nhánh trên một nền tảng.",
  keywords: [
    "ScanNow",
    "quản lý nhà hàng",
    "gọi món tại bàn",
    "quản lý chi nhánh",
    "quản lý nhân sự",
    "thanh toán nhà hàng",
  ],
  authors: [{ name: "ScanNow", url: SITE_CONFIG.baseUrl }],
  creator: "ScanNow",
  publisher: "ScanNow",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_CONFIG.baseUrl,
  },
  verification: {
    google: "4kSLgxKYQK5ZZt3GmGs-sfQAlRNqRXBNTM3KPm56-Kc",
  },
  openGraph: {
    title: "ScanNow | Nền tảng quản lý nhà hàng",
    description: "Quản lý gọi món, bàn, nhân sự, thanh toán và vận hành nhà hàng với ScanNow.",
    url: SITE_CONFIG.baseUrl,
    siteName: "ScanNow",
    images: [
      {
        url: "/images/avatar.png",
        width: 1200,
        height: 630,
        alt: "Nền tảng quản lý nhà hàng ScanNow",
      },
    ],
    locale: SITE_CONFIG.defaultLocale === "vi" ? "vi_VN" : "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ScanNow | Nền tảng quản lý nhà hàng",
    description: "Quản lý gọi món, bàn, nhân sự, thanh toán và vận hành nhà hàng với ScanNow.",
    images: ["/images/avatar.png"],
    creator: "@scannow",
  },
  appleWebApp: {
    title: "ScanNow",
    statusBarStyle: "default",
    capable: true,
  },
};
