import type { Metadata } from "next";
import "./globals.css";
import { SolaceProvider } from "@/lib/solace/store";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

export const metadata: Metadata = {
  title: "Solace · Employee Wellbeing",
  description: "The consultant workspace for healthier, more connected teams.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${GeistSans.className} antialiased`}>
        <SolaceProvider>{children}</SolaceProvider>
      </body>
    </html>
  );
}