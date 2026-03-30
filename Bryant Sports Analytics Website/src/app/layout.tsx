import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Bryant Sports Analytics Hub",
  description:
    "A comprehensive sports analytics platform built by the Bryant University Sports Analytics Club, featuring data-driven insights, visualizations, and research.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <>{children}</>
      </body>
    </html>
  );
}
