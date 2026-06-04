import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionWatcher } from "@/components/auth/SessionWatcher";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SimBank - Mobile Banking UI Simulator",
  description: "Mobile Banking UI Simulator for Portfolio",
  manifest: "/manifest.json",
  themeColor: "#0066FF",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SimBank",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <SessionWatcher />
        {children}
      </body>
    </html>
  );
}
