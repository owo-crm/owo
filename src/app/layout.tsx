import type { Metadata } from "next";
import { Metrophobic, Public_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const publicSans = Public_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-public-sans",
  display: "swap",
});

const metrophobic = Metrophobic({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  variable: "--font-metrophobic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "OWO CRM",
  description:
    "OWO CRM unifies pipeline, AutoMail, tasks, and Telegram actions in one operational flow.",
  icons: {
    icon: "/favicon.png?v=3",
    shortcut: "/favicon.png?v=3",
    apple: "/favicon.png?v=3",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pl"
      suppressHydrationWarning
      className={cn("h-full antialiased font-sans", publicSans.variable, metrophobic.variable)}
    >
      <head>
        <link rel="icon" href="/favicon.png?v=3" />
        <link rel="shortcut icon" href="/favicon.png?v=3" />
        <link rel="apple-touch-icon" href="/favicon.png?v=3" />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
