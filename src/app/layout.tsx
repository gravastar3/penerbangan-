import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Visualisasi Rute Penerbangan Indonesia",
  description: "Aplikasi interaktif untuk memvisualisasikan rute penerbangan antar bandara di Indonesia menggunakan LeafletJS dan OpenStreetMap.",
  keywords: ["Penerbangan", "Bandara", "Indonesia", "LeafletJS", "OpenStreetMap", "Rute Penerbangan", "Visualisasi"],
  authors: [{ name: "Flight Visualization Team" }],
  openGraph: {
    title: "Visualisasi Rute Penerbangan Indonesia",
    description: "Jelajahi rute penerbangan antar bandara di Indonesia dengan interaktif",
    url: "https://localhost:3000",
    siteName: "Flight Routes Indonesia",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Visualisasi Rute Penerbangan Indonesia",
    description: "Jelajahi rute penerbangan antar bandara di Indonesia dengan interaktif",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
