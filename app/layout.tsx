import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR, Space_Grotesk } from "next/font/google";

import "./globals.css";

const bodyFont = Noto_Sans_KR({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "700", "900"],
});

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: "출퇴근 버스 도착",
  description: "정류장 ETA 순으로 버스 도착예정을 빠르게 확인하는 모바일 웹앱",
  applicationName: "출퇴근 버스 도착",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "출퇴근 버스 도착",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#06070a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${bodyFont.variable} ${displayFont.variable} min-h-screen bg-dashboard-glow font-body text-zinc-50 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
