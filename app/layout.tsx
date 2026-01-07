import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mediant",
  description:
    "MEDIANT Releases on Labels - Pleasure Records, Deepsessions Recordings.",
  openGraph: {
    title: "Mediant",
    description:
      "MEDIANT Releases on Labels - Pleasure Records, Deepsessions Recordings.",
    images: [
      {
        url: "/meta.png",
        width: 1200,
        height: 630,
        alt: "Mediant Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mediant",
    description:
      "MEDIANT Releases on Labels - Pleasure Records, Deepsessions Recordings.",
    images: ["/meta.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
