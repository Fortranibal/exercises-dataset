import type { Metadata } from "next";
import { Outfit, Fraunces } from "next/font/google";
import { AppNav } from "@/components/app-nav";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "caltrack — nutrition & physique",
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
      className={`${outfit.variable} ${fraunces.variable} h-full antialiased`}
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
