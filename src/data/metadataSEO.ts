import type { Metadata } from "next";

import { SITE_CONFIG } from "@/constants/site";

export const APP_LAYOUT_METADATA: Metadata = {
  applicationName: "Scan Now",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  metadataBase: new URL(SITE_CONFIG.baseUrl),
  title: {
    default: "Scan Now — Phần mềm gọi món QR thông minh cho nhà hàng",
    template: "%s | Scan Now",
  },
  icons: {
    icon: "/icons/logo-transparent.webp",
    apple: "/icons/logo-transparent.webp",
  },
  description:
    "Scan Now giúp hơn 300.000 nhà hàng F&B tăng tốc phục vụ, giảm thất thoát và tạo trải nghiệm gọi món hiện đại. Khách quét QR tại bàn, gọi món và thanh toán trực tiếp — setup chỉ 15 phút.",
  keywords: [
    "Scan Now",
    "QR ordering software",
    "restaurant ordering system",
    "F&B management software",
    "QR menu",
    "digital menu",
    "table ordering",
    "restaurant POS",
    "online ordering",
    "restaurant management",
    "contactless ordering",
    "food and beverage software",
    "phần mềm gọi món",
    "quét mã QR nhà hàng",
    "quản lý nhà hàng",
    "thực đơn số",
  ],
  authors: [{ name: "Scan Now", url: SITE_CONFIG.baseUrl }],
  creator: "Scan Now",
  publisher: "Scan Now",
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
    title: "Scan Now — Giải pháp gọi món thông minh cho nhà hàng hiện đại",
    description: "Tăng tốc phục vụ, giảm thất thoát và nâng cao trải nghiệm khách hàng với phần mềm gọi món QR Scan Now. Dùng thử miễn phí 14 ngày.",
    url: SITE_CONFIG.baseUrl,
    siteName: "Scan Now",
    images: [
      {
        url: "/icons/logo-transparent.webp",
        width: 1200,
        height: 630,
        alt: "Scan Now — Phần mềm gọi món QR thông minh cho nhà hàng",
      },
    ],
    locale: SITE_CONFIG.defaultLocale === "vi" ? "vi_VN" : "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Scan Now — Giải pháp gọi món thông minh cho nhà hàng hiện đại",
    description: "Tăng tốc phục vụ, giảm thất thoát và nâng cao trải nghiệm khách hàng với phần mềm gọi món QR Scan Now. Dùng thử miễn phí 14 ngày.",
    images: ["/icons/logo-transparent.webp"],
    creator: "@scannow",
  },
  appleWebApp: {
    title: "Scan Now",
    statusBarStyle: "default",
    capable: true,
  },
};
