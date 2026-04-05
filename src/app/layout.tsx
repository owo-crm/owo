import type { Metadata } from "next";
import "./globals.css";
import { getLandingConfig } from "@/config/landing";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const DEFAULT_LANDING = getLandingConfig("pl");

export const metadata: Metadata = {
  title: DEFAULT_LANDING.productName,
  description:
    "OWO CRM helps teams handle inquiries, offers, contracts, and follow-up in one operational flow.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className={cn("h-full antialiased", "font-sans", geist.variable)}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
