import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono-var",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "NetWorth Studio — Certificate System",
  description: "Net Worth Certificate management for Chartered Accountants",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} h-full`}>
      <body className="min-h-full flex flex-col" style={{ fontFamily: "var(--font-inter, var(--font), system-ui, sans-serif)" }}>
        {children}
      </body>
    </html>
  );
}
