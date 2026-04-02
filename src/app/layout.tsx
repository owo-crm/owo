import type { Metadata } from "next";
import "./globals.css";
import { LANDING_CONFIG } from "@/config/landing";

export const metadata: Metadata = {
  title: LANDING_CONFIG.productName,
  description:
    "OWO CRM turns Google Sheets and website leads into a clear pipeline with automated emails.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
