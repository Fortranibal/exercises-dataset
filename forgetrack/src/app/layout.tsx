import type { Metadata } from "next";
import { Outfit, Syne } from "next/font/google";
import { AppNav } from "@/components/app-nav";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "ForgeTrack — train, fuel, track",
  description:
    "Log meals with Grok vision, track macros, MMP, strength, and physique progress.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${syne.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans text-[15px] leading-relaxed">
        <AppNav />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-16">
          {children}
        </main>
      </body>
    </html>
  );
}
