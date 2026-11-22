import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Denge — Kişisel Not & Görev",
  description:
    "İş ve özel hayatı tek yerde ama birbirine karıştırmadan organize eden kişisel Not ve Görev uygulaması.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Denge",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#FAF9F6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="h-full antialiased">
      <body className="min-h-full bg-[#FAF9F6] text-[#1C1917] flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
        {children}
      </body>
    </html>
  );
}
