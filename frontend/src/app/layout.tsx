import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
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

        {/* Institutional Architecture Footer (Without Copyright Claims) */}
        <footer className="border-t border-slate-200 bg-white text-xs text-slate-600">
          {/* Upper Footer with Mandates */}
          <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#003366]"></span>
                  <h4 className="font-bold text-[#003366] text-sm">
                    ApaarNet Verification Mesh
                  </h4>
                </div>
                <p className="text-xs text-slate-600 font-semibold mt-0.5">
                  National Student Data & Statutory Quota Verification Infrastructure
                </p>
                <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
                  Architected to enforce statutory quota carve-outs (APH 2024–27), Verhoeff D₅ checksums, and zero-exposure cryptographic verifiable credentials for higher education.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[#003366] text-xs uppercase tracking-wider">
                  Supported Statutory Standards
                </h4>
                <ul className="mt-2 space-y-1.5 text-[11px] text-slate-600">
                  <li className="flex items-center gap-1.5">
                    <span className="text-[#FF7A1A]">▪</span>
                    <span>Approval Process Handbook (APH 2024–27) Norms</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-[#FF7A1A]">▪</span>
                    <span>APAAR Verhoeff Dihedral D₅ Algorithmic Check</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-[#FF7A1A]">▪</span>
                    <span>Digital Personal Data Protection (DPDP) Act 2023</span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-[#003366] text-xs uppercase tracking-wider">
                  Cryptographic Mesh Infrastructure
                </h4>
                <div className="mt-2 space-y-1.5 text-[11px] font-mono text-slate-600">
                  <div>SHA-256 Merkle Multi-Node Ledger</div>
                  <div>W3C VC v2.0 Ed25519 Cryptographic Signatures</div>
                  <div>Zero-Exposure Selective Disclosure Protocol</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar without Copyright Claims */}
          <div className="mx-auto max-w-7xl px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
            <div>
              ApaarNet · National Student Data & Quota Verification Mesh
            </div>
            <div className="flex items-center gap-4">
              <span>Privacy-Preserving Verification</span>
              <span>•</span>
              <span>Statutory Compliance Architecture</span>
              <span>•</span>
              <span className="text-[#046A38] font-medium">Cryptographic Proof Active</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
