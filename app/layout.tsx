import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "출퇴근 버스 도착",
  description: "정류장 ETA 순으로 버스 도착예정을 빠르게 확인하는 모바일 웹앱",
  applicationName: "출퇴근 버스 도착",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "출퇴근 버스 도착",
  },
  icons: {
    icon: [{ url: "/icon", type: "image/png" }],
    apple: [{ url: "/apple-icon", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="min-h-screen bg-dashboard-glow font-body text-zinc-50 antialiased">
        {children}
      </body>
    </html>
  );
}
