import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Forgecart — describe a store, launch it", template: "%s · Forgecart" },
  description: "Demo: an AI-native commerce platform. Describe a store in a sentence and run it from one admin.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
