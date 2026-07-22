import type { Metadata } from "next";
import type { Viewport } from "next";
import PwaServiceWorker from "@/components/PwaServiceWorker";
import "./globals.css";

export const metadata: Metadata = {
  title: "난임길잡이 AI",
  description: "여성 생식건강과 난임 시술 상담 준비를 돕는 AI 서비스",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "건강상담",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#047857",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <PwaServiceWorker />
        {children}
      </body>
    </html>
  );
}
