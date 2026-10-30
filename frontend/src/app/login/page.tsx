"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Scan,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { useRbac } from "@/context/RbacContext";
import { Logo } from "@/components/Logo";
import { CelestialMeshBackground } from "@/components/CelestialMeshBackground";

const DEMO_PERSONAS = [
  {
    role: "National Administrator",
    title: "AICTE National Vigilance Director",
    email: "admin@aicte-india.org",
    password: "password123",
    targetRoute: "/dashboard/admin",
    badge: "National Command",
    badgeBg: "#b9e303",
  },
  {
    role: "Institution Registrar",
    title: "Nodal Registrar, Apex Institute",
    email: "registrar@apex-inst.ac.in",
    password: "password123",
    targetRoute: "/dashboard/registrar",
    badge: "Institution Portal",
    badgeBg: "#b5d5e1",
  },
  {
    role: "Student Data Principal",
    title: "Aarav Sharma (B.Tech CSE)",
    email: "aarav.sharma@student.apaar.in",
    password: "password123",
    targetRoute: "/dashboard/student",
    badge: "Consent Wallet",
    badgeBg: "#a88ed4",
  },
  {
    role: "University Controller",
    title: "Controller of Examinations",
    email: "coe@tech-univ.ac.in",
    password: "password123",
    targetRoute: "/dashboard/coe",
    badge: "Degree Studio",
    badgeBg: "#b9e303",
  },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithCredentials, isLoading: contextLoading } = useRbac();

  const [email, setEmail] = useState("admin@aicte-india.org");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSubmittingEmail, setActiveSubmittingEmail] = useState<string | null>(null);

  // Auto-fill role if provided via query param e.g. /login?role=Institution%20Registrar
  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam) {
      const match = DEMO_PERSONAS.find((p) =>
        p.role.toLowerCase().includes(roleParam.toLowerCase())
      );
      if (match) {
        setEmail(match.email);
        setPassword(match.password);
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e?: React.FormEvent, overrideEmail?: string, overridePass?: string, targetRoute?: string) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const submitEmail = overrideEmail || email;
    const submitPass = overridePass || password;

    if (!submitEmail.trim() || !submitPass.trim()) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);
    setActiveSubmittingEmail(submitEmail);

    try {
      const resp = await loginWithCredentials(submitEmail.trim(), submitPass.trim());
      
      // Save JWT session token strictly to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("apaarnet_session_token", resp.access_token);
        localStorage.setItem("apaarnet_role", resp.role);
        localStorage.setItem("apaarnet_email", submitEmail.trim());
        if (resp.allowed_dashboard_path) {
          localStorage.setItem("apaarnet_dashboard_path", resp.allowed_dashboard_path);
        }
      }

      // Strictly redirect user to their role's specific dashboard route
      const roleDashboardMap: Record<string, string> = {
        NATIONAL_ADMIN: "/dashboard/admin",
        INSTITUTION_REGISTRAR: "/dashboard/registrar",
        STUDENT_DATA_PRINCIPAL: "/dashboard/student",
        UNIVERSITY_CONTROLLER: "/dashboard/coe",
      };
      const destination = targetRoute || roleDashboardMap[resp.role] || resp.allowed_dashboard_path || "/dashboard/admin";
      router.push(destination);
    } catch (err: any) {
      setErrorMessage(
        err.message?.includes("401") || err.message?.includes("Invalid")
          ? "Invalid email or password. Please use the 1-click demo buttons below."
          : `Authentication failed: ${err.message}`
      );
    } finally {
      setIsSubmitting(false);
      setActiveSubmittingEmail(null);
    }
  };

  const handleDemoPillClick = (persona: typeof DEMO_PERSONAS[0]) => {
    setEmail(persona.email);
    setPassword(persona.password);
    handleSubmit(undefined, persona.email, persona.password, persona.targetRoute);
  };

  const isLoading = isSubmitting || contextLoading;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#232323] flex flex-col justify-between p-4 sm:p-8 relative isolate overflow-hidden">
      {/* Animated Wireframe Celestial Sphere & Topographic Waves (Deconflicted Style) */}
      <CelestialMeshBackground variant="login" spherePosition="left" />

      {/* Top Header Strip */}
      <div className="mx-auto w-full max-w-xl flex items-center justify-between pb-6 relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#232323] bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to ApaarNet Overview</span>
        </Link>

        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="h-2 w-2 rounded-full bg-[#b9e303] animate-pulse" />
          <span className="text-[11px] font-mono text-slate-600 font-semibold">
            Statutory Auth Engine Active
          </span>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="mx-auto w-full max-w-xl relative z-10">
        <div className="rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-xl p-7 sm:p-10 shadow-2xl shadow-slate-300/40 space-y-7">

          {/* Brand Crest & Heading */}
          <div className="space-y-3 text-center">
            <div className="flex justify-center pb-1">
              <Logo size="lg" href="/" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#232323]">
              Stakeholder Portal Login
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Enter your statutory multi-tenant credentials to access your authorized portal.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Official Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@agency.gov.in"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 pl-10 pr-4 py-3 text-xs sm:text-sm text-[#232323] placeholder-slate-400 focus:border-[#232323] focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  Demo Pass: password123
                </span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 pl-10 pr-11 py-3 text-xs sm:text-sm text-[#232323] placeholder-slate-400 focus:border-[#232323] focus:bg-white focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#b9e303] py-3.5 text-sm font-bold text-[#232323] shadow-md hover:shadow-lg hover:bg-[#a6ce02] hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying Credentials & Merkle Proof...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* 1-Click Evaluation Credentials for Jury */}
          <div className="pt-3 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                1-Click Persona Fast-Logins
              </span>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-600 font-bold">
                Verified Personas
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DEMO_PERSONAS.map((persona) => {
                const isThisSubmitting = isSubmitting && activeSubmittingEmail === persona.email;
                return (
                  <button
                    key={persona.email}
                    type="button"
                    onClick={() => handleDemoPillClick(persona)}
                    disabled={isLoading}
                    className="flex flex-col text-left rounded-2xl border border-slate-200 bg-slate-50/70 p-3 hover:border-[#232323] hover:bg-white transition-all shadow-2xs group"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className="rounded-full px-2 py-0.2 text-[9.5px] font-bold border border-slate-300"
                        style={{ backgroundColor: persona.badgeBg, color: "#232323" }}
                      >
                        {persona.badge}
                      </span>
                      {isThisSubmitting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-700" />
                      ) : (
                        <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#232323] group-hover:translate-x-0.5 transition-all" />
                      )}
                    </div>
                    <div className="text-xs font-bold text-[#232323] mt-2 truncate">
                      {persona.role}
                    </div>
                    <div className="text-[10.5px] text-slate-500 truncate mt-0.5 font-mono">
                      {persona.email}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Legal / Footnote */}
      <div className="mx-auto w-full max-w-xl text-center pt-6 text-[11px] text-slate-400">
        AICTE Approval Process Handbook (APH 2024–27) Clause 4.2 • Secure Cryptographic Session
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-xs text-slate-400 font-mono">Loading authentication portal...</div>}>
      <LoginForm />
    </React.Suspense>
  );
}
