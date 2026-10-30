import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { RbacProvider } from "@/context/RbacContext";
import { AppShell } from "@/components/AppShell";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ApaarNet | National Student Data & Quota Verification Mesh",
  description:
    "National Student Data & Statutory Quota Verification Mesh engineered for higher education institutions, aligning with statutory supernumerary quota ledgers, APAAR identity verification, and W3C digital credentials.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen font-sans text-[#232323] antialiased selection:bg-[#b9e303] selection:text-[#232323]">
        <LanguageProvider>
          <RbacProvider>
            <AppShell>{children}</AppShell>
          </RbacProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
