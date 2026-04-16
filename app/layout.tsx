import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display, JetBrains_Mono, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dm-serif",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kungwi — AI Transcription",
  description:
    "Transform your audio and video into accurate, searchable transcripts powered by Google Gemini.",
  keywords: [
    "transcription",
    "AI",
    "audio",
    "video",
    "subtitle",
    "South Africa",
  ],
  openGraph: {
    title: "Kungwi — AI Transcription",
    description: "Transform audio and video into accurate transcripts.",
    type: "website",
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
      className={cn(dmSans.variable, dmSerif.variable, jetbrainsMono.variable, "font-sans", geist.variable)}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
