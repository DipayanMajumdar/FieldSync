"use client";

import { useState } from "react";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  AlertCircle,
  Loader2,
  UserCog,
  HardHat,
  Crown,
  Activity,
  BarChart3,
  Database,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";

type UserRole = "field_engineer" | "project_manager" | "admin";

type DemoUser = {
  email: string;
  password: string;
  role: UserRole;
  name: string;
};

const DEMO_USERS: DemoUser[] = [
  {
    email: "engineer@fieldsync.com",
    password: "engineer123",
    role: "field_engineer",
    name: "Field Engineer",
  },
  {
    email: "manager@fieldsync.com",
    password: "manager123",
    role: "project_manager",
    name: "Project Manager",
  },
  {
    email: "admin@fieldsync.com",
    password: "admin123",
    role: "admin",
    name: "System Admin",
  },
];

const ROLE_META = {
  field_engineer: {
    label: "Field Engineer",
    icon: HardHat,
    color: "#3F8065",
    bg: "#EDF5F0",
  },
  project_manager: {
    label: "Project Manager",
    icon: UserCog,
    color: "#68364B",
    bg: "#F7F0F3",
  },
  admin: {
    label: "System Admin",
    icon: Crown,
    color: "#C47A44",
    bg: "#FBF2E9",
  },
};

export default function Home() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      localStorage.removeItem("fs_token");
      localStorage.removeItem("fs_user");

      const { login } = await import("@/lib/api");

      await login(email.trim(), password);

      const userStr = localStorage.getItem("fs_user");

      if (!userStr) {
        throw new Error("Unable to identify your account role.");
      }

      const user = JSON.parse(userStr);

      let destination = "";

      if (
        user.role === "field_engineer" ||
        user.role === "field_worker"
      ) {
        destination = "/field-evidence";
      } else if (user.role === "project_manager") {
        destination = "/dashboard";
      } else if (user.role === "admin") {
        destination = "/settings";
      } else {
        throw new Error(
          "Your account role is not authorized for this dashboard."
        );
      }

      setTimeout(() => {
        router.push(destination);
      }, 250);
    } catch (err: any) {
      setError(err?.message || "Invalid email or password.");
      setLoading(false);
    }
  };

  const fillDemoAccount = (user: DemoUser) => {
    setEmail(user.email);
    setPassword(user.password);
    setError("");
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#F4F5F3] text-[#102A2A]">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">

        {/* =====================================================
            LEFT — BRAND EXPERIENCE
        ===================================================== */}

        <section className="relative hidden overflow-hidden bg-[#102A2A] lg:flex">
          {/* Architectural background */}
          <div className="absolute inset-0">
            <div className="absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full border border-white/[0.055]" />
            <div className="absolute -right-20 -top-20 h-[360px] w-[360px] rounded-full border border-white/[0.045]" />

            <div className="absolute -bottom-52 -left-44 h-[620px] w-[620px] rounded-full border border-white/[0.045]" />
            <div className="absolute -bottom-32 -left-24 h-[420px] w-[420px] rounded-full border border-white/[0.04]" />

            <div className="absolute left-1/2 top-0 h-full w-px bg-white/[0.025]" />

            <div className="absolute bottom-0 left-0 right-0 h-px bg-white/[0.05]" />

            <div className="absolute left-16 top-1/2 h-px w-72 bg-white/[0.025]" />
          </div>

          <div className="relative z-10 flex min-h-screen w-full flex-col px-10 py-10 xl:px-16 2xl:px-20">

            {/* Top brand */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-[13px] bg-[#68364B] shadow-[0_10px_30px_rgba(0,0,0,0.22)]">
                  <span className="text-sm font-black tracking-tight text-white">
                    FS
                  </span>

                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#C47A44]" />
                </div>

                <div>
                  <div className="text-[20px] font-bold tracking-[-0.5px] text-white">
                    Field<span className="text-[#C47A44]">Sync</span>
                  </div>

                  <div className="mt-0.5 text-[8px] font-semibold uppercase tracking-[2px] text-[#70817D]">
                    Infrastructure Intelligence
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#3F8065] opacity-50" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#3F8065]" />
                </span>

                <span className="text-[9px] font-semibold tracking-wide text-[#91A09C]">
                  SYSTEM ONLINE
                </span>
              </div>
            </div>

            {/* Main content */}
            <div className="my-auto max-w-[650px] py-14">

              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#C47A44]/20 bg-[#C47A44]/[0.06] px-3.5 py-2">
                <Sparkles
                  size={13}
                  className="text-[#C47A44]"
                />

                <span className="text-[9px] font-bold uppercase tracking-[1.8px] text-[#C47A44]">
                  Intelligent Project Operations
                </span>
              </div>

              <h1 className="max-w-[620px] text-[42px] font-bold leading-[1.08] tracking-[-1.8px] text-white xl:text-[56px]">
                See progress.
                <br />

                <span className="text-[#C47A44]">
                  Know what&apos;s next.
                </span>
              </h1>

              <p className="mt-6 max-w-[550px] text-[14px] leading-7 text-[#9BAAA6]">
                Connect field evidence, project schedules, work breakdown
                structures and intelligent verification in one unified
                infrastructure monitoring platform.
              </p>

              {/* Feature cards */}
              <div className="mt-10 grid max-w-[590px] grid-cols-3 gap-3">

                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4 backdrop-blur-sm transition hover:border-white/[0.12] hover:bg-white/[0.05]">
                  <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-[#68364B] text-white">
                    <Activity size={17} />
                  </div>

                  <p className="text-[11px] font-semibold text-white">
                    Real-Time
                  </p>

                  <p className="mt-1 text-[9px] leading-4 text-[#71817D]">
                    Live progress tracking
                  </p>
                </div>

                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4 backdrop-blur-sm transition hover:border-white/[0.12] hover:bg-white/[0.05]">
                  <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-[#C47A44]/15 text-[#C47A44]">
                    <BarChart3 size={17} />
                  </div>

                  <p className="text-[11px] font-semibold text-white">
                    Schedule
                  </p>

                  <p className="mt-1 text-[9px] leading-4 text-[#71817D]">
                    Plan vs actual insights
                  </p>
                </div>

                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4 backdrop-blur-sm transition hover:border-white/[0.12] hover:bg-white/[0.05]">
                  <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-[#3F8065]/15 text-[#65A286]">
                    <Database size={17} />
                  </div>

                  <p className="text-[11px] font-semibold text-white">
                    Evidence
                  </p>

                  <p className="mt-1 text-[9px] leading-4 text-[#71817D]">
                    Verified field records
                  </p>
                </div>

              </div>

              {/* Trust row */}
              <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/[0.06]">
                    <Check size={12} className="text-[#C47A44]" />
                  </div>

                  <span className="text-[10px] text-[#7E8E8A]">
                    Field Intelligence
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/[0.06]">
                    <Check size={12} className="text-[#C47A44]" />
                  </div>

                  <span className="text-[10px] text-[#7E8E8A]">
                    AI-Assisted Review
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/[0.06]">
                    <Check size={12} className="text-[#C47A44]" />
                  </div>

                  <span className="text-[10px] text-[#7E8E8A]">
                    Schedule Linked
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom */}
            <div className="flex items-center justify-between border-t border-white/[0.06] pt-5">
              <div className="flex items-center gap-2 text-[9px] text-[#647470]">
                <ShieldCheck size={13} />

                <span>
                  Secure access for authorized project personnel
                </span>
              </div>

              <span className="text-[9px] font-medium tracking-wide text-[#596965]">
                FIELDSYNC / 01
              </span>
            </div>
          </div>
        </section>

        {/* =====================================================
            RIGHT — LOGIN
        ===================================================== */}

        <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-7 lg:px-12 xl:px-16">

          {/* Soft background geometry */}
          <div className="pointer-events-none absolute -right-40 -top-40 h-[420px] w-[420px] rounded-full border border-[#68364B]/[0.045]" />
          <div className="pointer-events-none absolute -bottom-52 -left-44 h-[520px] w-[520px] rounded-full border border-[#C47A44]/[0.04]" />

          <div className="relative z-10 w-full max-w-[450px]">

            {/* Mobile brand */}
            <div className="mb-7 flex items-center justify-center lg:hidden">
              <div className="flex items-center gap-3">
                <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-[13px] bg-[#68364B] shadow-lg">
                  <span className="text-sm font-black text-white">
                    FS
                  </span>

                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#C47A44]" />
                </div>

                <div>
                  <div className="text-xl font-bold tracking-tight text-[#102A2A]">
                    Field<span className="text-[#C47A44]">Sync</span>
                  </div>

                  <div className="text-[7px] font-semibold uppercase tracking-[1.7px] text-[#84908D]">
                    Infrastructure Intelligence
                  </div>
                </div>
              </div>
            </div>

            {/* Login container */}
            <div className="overflow-hidden rounded-[24px] border border-[#DFE3E0] bg-white shadow-[0_25px_70px_rgba(16,42,42,0.09)]">

              {/* Top accent */}
              <div className="h-1 bg-[#68364B]" />

              <div className="p-5 sm:p-7 md:p-9">

                {/* Heading */}
                <div className="mb-7">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#F6F0F2] text-[#68364B]">
                      <LockKeyhole size={19} />
                    </div>

                    <div className="flex items-center gap-1.5 rounded-full border border-[#DDE8E1] bg-[#F4F9F5] px-2.5 py-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#3F8065]" />
                      <span className="text-[8px] font-bold uppercase tracking-[1px] text-[#4D7563]">
                        Secure Login
                      </span>
                    </div>
                  </div>

                  <h2 className="text-[25px] font-bold tracking-[-0.8px] text-[#102A2A]">
                    Welcome back
                  </h2>

                  <p className="mt-2 text-[12px] leading-5 text-[#74817E]">
                    Sign in to continue to your FieldSync workspace.
                  </p>
                </div>

                <form onSubmit={handleLogin}>

                  {/* Email */}
                  <div className="mb-5">
                    <label
                      htmlFor="email"
                      className="mb-2 block text-[10px] font-bold uppercase tracking-[0.8px] text-[#53605D]"
                    >
                      Employee ID / Email
                    </label>

                    <div className="group relative">
                      <Mail
                        size={17}
                        strokeWidth={1.8}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C9895] transition group-focus-within:text-[#68364B]"
                      />

                      <input
                        id="email"
                        type="text"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError("");
                        }}
                        placeholder="Enter your employee ID or email"
                        disabled={loading}
                        autoComplete="username"
                        className="h-[51px] w-full rounded-[13px] border border-[#D9DEDB] bg-[#FCFDFC] pl-11 pr-4 text-[13px] text-[#102A2A] outline-none transition-all placeholder:text-[#A2ABA8] hover:border-[#C9D0CC] focus:border-[#68364B] focus:bg-white focus:ring-4 focus:ring-[#68364B]/[0.08] disabled:cursor-not-allowed disabled:bg-[#F5F6F5]"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="mb-4">
                    <label
                      htmlFor="password"
                      className="mb-2 block text-[10px] font-bold uppercase tracking-[0.8px] text-[#53605D]"
                    >
                      Password
                    </label>

                    <div className="group relative">
                      <LockKeyhole
                        size={17}
                        strokeWidth={1.8}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C9895] transition group-focus-within:text-[#68364B]"
                      />

                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError("");
                        }}
                        placeholder="Enter your password"
                        disabled={loading}
                        autoComplete="current-password"
                        className="h-[51px] w-full rounded-[13px] border border-[#D9DEDB] bg-[#FCFDFC] pl-11 pr-14 text-[13px] text-[#102A2A] outline-none transition-all placeholder:text-[#A2ABA8] hover:border-[#C9D0CC] focus:border-[#68364B] focus:bg-white focus:ring-4 focus:ring-[#68364B]/[0.08] disabled:cursor-not-allowed disabled:bg-[#F5F6F5]"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(!showPassword)
                        }
                        disabled={loading}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#7D8986] transition hover:bg-[#F4F0F2] hover:text-[#68364B] disabled:cursor-not-allowed"
                        aria-label={
                          showPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={17} />
                        ) : (
                          <Eye size={17} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="mb-5 flex items-start gap-2.5 rounded-[13px] border border-[#F1CCCC] bg-[#FEF4F4] px-3.5 py-3 text-[11px] leading-5 text-[#9B4747]">
                      <AlertCircle
                        size={16}
                        className="mt-0.5 shrink-0"
                      />

                      <span>{error}</span>
                    </div>
                  )}

                  {/* Options */}
                  <div className="mb-6 flex items-center justify-between">
                    <label className="flex cursor-pointer items-center gap-2 text-[11px] text-[#74817E]">
                      <input
                        type="checkbox"
                        disabled={loading}
                        className="h-4 w-4 rounded border-[#D2D8D5] accent-[#68364B]"
                      />

                      Remember me
                    </label>

                    <button
                      type="button"
                      disabled={loading}
                      className="text-[11px] font-semibold text-[#68364B] transition hover:text-[#C47A44] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Sign in */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative flex h-[52px] w-full items-center justify-center gap-2 overflow-hidden rounded-[13px] bg-[#68364B] text-[13px] font-bold text-white shadow-[0_12px_28px_rgba(104,54,75,0.2)] transition-all duration-200 hover:bg-[#592D40] hover:shadow-[0_15px_32px_rgba(104,54,75,0.26)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-80"
                  >
                    <span className="absolute inset-y-0 left-0 w-20 -translate-x-full skew-x-[-18deg] bg-white/[0.08] transition-transform duration-700 group-hover:translate-x-[500%]" />

                    {loading ? (
                      <>
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />

                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In

                        <ArrowRight
                          size={17}
                          className="transition-transform duration-200 group-hover:translate-x-1"
                        />
                      </>
                    )}
                  </button>
                </form>

                {/* Demo Accounts */}
                <div className="mt-6 rounded-[16px] border border-[#E7EBE8] bg-[#F8FAF9] p-3.5">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[1.2px] text-[#53615E]">
                        Quick access
                      </p>

                      <p className="mt-0.5 text-[9px] text-[#929C99]">
                        Select a demo role
                      </p>
                    </div>

                    <div className="rounded-full bg-[#EEF1EF] px-2 py-1 text-[8px] font-semibold text-[#7C8784]">
                      DEMO
                    </div>
                  </div>

                  <div className="grid gap-2">

                    {DEMO_USERS.map((user) => {
                      const meta = ROLE_META[user.role];
                      const Icon = meta.icon;

                      const active =
                        email === user.email &&
                        password === user.password;

                      return (
                        <button
                          key={user.role}
                          type="button"
                          onClick={() => fillDemoAccount(user)}
                          disabled={loading}
                          className={`group flex w-full items-center gap-3 rounded-[12px] border px-3 py-2.5 text-left transition-all ${
                            active
                              ? "border-[#DCC8D0] bg-white shadow-sm"
                              : "border-transparent bg-white hover:border-[#DCE1DE] hover:bg-[#FCFDFC] hover:shadow-sm"
                          } disabled:cursor-not-allowed`}
                        >
                          <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]"
                            style={{
                              backgroundColor: meta.bg,
                              color: meta.color,
                            }}
                          >
                            <Icon size={15} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold text-[#24312F]">
                              {meta.label}
                            </p>

                            <p className="mt-0.5 truncate text-[9px] text-[#8A9592]">
                              {user.email}
                            </p>
                          </div>

                          <ArrowRight
                            size={13}
                            className={`shrink-0 transition-all ${
                              active
                                ? "translate-x-0 text-[#68364B] opacity-100"
                                : "-translate-x-1 text-[#AAB2AF] opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Security */}
                <div className="mt-5 flex items-center justify-center gap-2 border-t border-[#E9ECEA] pt-5 text-center text-[9px] leading-4 text-[#8D9794]">
                  <ShieldCheck
                    size={14}
                    className="shrink-0 text-[#3F8065]"
                  />

                  <span>
                    Secure access for authorized project personnel
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-2 px-2 text-center text-[9px] text-[#909A97]">
              <span className="font-bold text-[#68364B]">
                FieldSync
              </span>

              <span>•</span>

              <span>Infrastructure Progress Tracking Platform</span>

              <span>•</span>

              <span>v1.0</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}