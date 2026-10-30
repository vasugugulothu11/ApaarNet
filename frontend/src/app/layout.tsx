import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { NavbarRoleSwitcher } from "@/components/NavbarRoleSwitcher";

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
      className={`${inter.variable} ${geistMono.variable} h-full bg-[#F8FAFC] text-[#0F172A] antialiased`}
    >
      <body className="flex min-h-screen flex-col bg-[#F8FAFC] font-sans text-[#0F172A] selection:bg-[#FF7A1A]/20 selection:text-[#003366]">
        {/* Authoritative Navigation Shell */}
        <NavbarRoleSwitcher />

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-x-hidden">{children}</main>

        {/* Dedicated High-Contrast Official Blue Footer */}
        <footer className="mt-auto bg-blue-950 text-slate-100 border-t-4 border-blue-600 shadow-inner">
          {/* Upper Footer with Statutory Mandates & Architecture */}
          <div className="border-b border-blue-900/60 bg-blue-950 px-4 py-9 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Pillar 1: Mesh Identity */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]"></span>
                  <h4 className="font-semibold text-white text-base tracking-wide">
                    ApaarNet Verification Mesh
                  </h4>
                </div>
                <p className="text-xs text-blue-200 font-semibold tracking-wide">
                  National Student Data & Statutory Quota Verification Infrastructure
                </p>
                <p className="text-xs text-slate-300 leading-relaxed pt-1">
                  Deterministic higher education infrastructure architected to enforce statutory quota carve-outs (APH 2024–27), Verhoeff D₅ algorithmic checksums, and zero-exposure cryptographic verifiable credentials.
                </p>
              </div>

              {/* Pillar 2: Standards & Compliance */}
              <div className="space-y-2.5">
                <h4 className="font-semibold text-white text-xs uppercase tracking-wide">
                  Statutory Standards & Operational Portals
                </h4>
                <ul className="space-y-2 text-xs text-slate-300 pt-1">
                  <li className="flex items-start gap-2">
                    <span className="text-[#FF7A1A] font-bold mt-0.5">▪</span>
                    <span>Approval Process Handbook (APH 2024–27) Supernumerary Quota Norms</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#FF7A1A] font-bold mt-0.5">▪</span>
                    <span>APAAR Verhoeff Dihedral D₅ Algorithmic Checksum Validation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#FF7A1A] font-bold mt-0.5">▪</span>
                    <span>Digital Personal Data Protection (DPDP) Act 2023 Selective Disclosure</span>
                  </li>
                </ul>
                <div className="pt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-blue-200">
                  <Link href="/landing" className="hover:text-white transition-colors underline-offset-2 hover:underline">
                    Portal Overview
                  </Link>
                  <Link href="/" className="hover:text-white transition-colors underline-offset-2 hover:underline">
                    National Command
                  </Link>
                  <Link href="/institution-portal" className="hover:text-white transition-colors underline-offset-2 hover:underline">
                    Institution Registrar
                  </Link>
                  <Link href="/intelligence-chamber" className="hover:text-white transition-colors underline-offset-2 hover:underline">
                    Intelligence Chamber
                  </Link>
                  <Link href="/consent-wallet" className="hover:text-white transition-colors underline-offset-2 hover:underline">
                    Consent Wallet
                  </Link>
                  <Link href="/degree-studio" className="hover:text-white transition-colors underline-offset-2 hover:underline">
                    Degree Studio
                  </Link>
                </div>
              </div>

              {/* Pillar 3: Cryptographic Mesh */}
              <div className="space-y-2.5">
                <h4 className="font-semibold text-white text-xs uppercase tracking-wide">
                  Cryptographic Mesh Infrastructure
                </h4>
                <div className="space-y-2 text-xs font-mono text-slate-200 pt-1">
                  <div className="rounded-md bg-blue-900/50 border border-blue-800/80 p-2.5 shadow-xs">
                    <span className="text-blue-200 font-bold">SHA-256</span> Merkle Multi-Node Audit Ledger
                  </div>
                  <div className="rounded-md bg-blue-900/50 border border-blue-800/80 p-2.5 shadow-xs">
                    <span className="text-blue-200 font-bold">W3C VC v2.0</span> Ed25519 Cryptographic Signatures
                  </div>
                  <div className="rounded-md bg-blue-900/50 border border-blue-800/80 p-2.5 shadow-xs">
                    <span className="text-emerald-300 font-bold">Zero-Exposure</span> Predicate Verification Protocol
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lower Sub-Bar with Links & Status */}
          <div className="bg-[#021024] px-4 py-4 sm:px-6 lg:px-8 border-t border-blue-900/50">
            <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-300">
              <div className="font-medium text-slate-200">
                ApaarNet · National Student Data & Quota Verification Mesh
              </div>
              <div className="flex flex-wrap items-center gap-4 text-slate-300">
                <span className="text-slate-300">Privacy-Preserving Verification</span>
                <span className="text-blue-800">•</span>
                <span className="text-slate-300">Statutory Compliance Architecture</span>
                <span className="text-blue-800">•</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
                  Cryptographic Proof Active
                </span>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
