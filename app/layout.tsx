import type { Metadata } from "next";
import {
  DM_Sans,
  DM_Serif_Display,
  JetBrains_Mono,
  Geist,
} from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

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
  title: "PLAIN — AI Transcription for Audio & Video",
  description:
    "Fast, accurate AI transcription for audio and video. Upload files, get structured text with timestamps, speaker labels, and export-ready formats.",
  keywords: [
    "AI transcription",
    "audio transcription",
    "video transcription",
    "speech to text",
    "automatic transcription",
    "meeting transcription",
    "subtitle generator",
  ],
  openGraph: {
    title: "PLAIN — AI Transcription for Audio & Video",
    description:
      "Upload audio or video and get accurate transcripts with timestamps and speaker labels.",
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
      className={cn(
        dmSans.variable,
        dmSerif.variable,
        jetbrainsMono.variable,
        "font-sans",
        geist.variable,
      )}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
