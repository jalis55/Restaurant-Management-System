import { ArrowRight, Coffee, LoaderCircle, LockKeyhole, UserRound, UtensilsCrossed } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = location.state?.from?.pathname || "/";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(form);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.data?.detail || "Invalid credentials. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white">
      {/* Subtle background overlay – restaurant vibe */}
      <div className="pointer-events-none absolute inset-0 opacity-20 mix-blend-soft-light">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_25%,#f59e0b22,transparent_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_75%,#c026d31a,transparent_45%)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center gap-10 px-5 py-12 sm:px-8 lg:flex-row lg:gap-16 lg:px-12">
        {/* Left – Welcome / Branding */}
        <div className="w-full max-w-lg lg:max-w-xl">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 p-3.5 shadow-lg">
              <UtensilsCrossed className="h-8 w-8 text-white" />
            </div>
            <h1 className="bg-gradient-to-r from-amber-300 via-white to-amber-200 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
              Staff Portal
            </h1>
          </div>

          <p className="mt-6 text-xl font-medium text-amber-100/90 sm:text-2xl">
            Good to see you back in the kitchen.
          </p>

          <p className="mt-4 text-base leading-relaxed text-slate-300">
            Sign in to manage orders, update menu, track tables, and keep service running smoothly.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {[
              { icon: Coffee, text: "Real-time order flow" },
              { icon: UtensilsCrossed, text: "Menu & inventory control" },
              { icon: UserRound, text: "Staff clock-in ready" },
              { icon: ArrowRight, text: "Fast dashboard access" },
            ].map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-3 rounded-xl border border-slate-700/50 bg-slate-800/40 px-4 py-3 backdrop-blur-sm"
              >
                <item.icon className="h-5 w-5 text-amber-400" />
                <span className="text-sm font-medium text-slate-200">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right – Login Form – POS terminal style */}
        <div className="w-full max-w-md rounded-3xl border border-slate-700/60 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-8 shadow-2xl shadow-black/60 backdrop-blur-md sm:p-10">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 shadow-md">
              <UserRound className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-400/80">
                Restaurant Staff
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">Sign In</h2>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {/* Username */}
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium text-slate-300">
                Username / Staff ID
              </label>
              <div className="relative">
                <UserRound className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={form.username}
                  onChange={handleChange}
                  placeholder="staff001"
                  className="h-12 w-full rounded-xl border border-slate-600 bg-slate-800/60 pl-11 pr-4 text-white outline-none placeholder:text-slate-500 focus:border-amber-500/70 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="relative">
                <LockKeyhole className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="h-12 w-full rounded-xl border border-slate-600 bg-slate-800/60 pl-11 pr-4 text-white outline-none placeholder:text-slate-500 focus:border-amber-500/70 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-600/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            {isSubmitting && (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-400/25 bg-amber-400/10">
                    <LoaderCircle className="h-5 w-5 animate-spin text-amber-300" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-100">Authenticating your session</p>
                    <p className="text-xs text-amber-100/65">We&apos;re signing you in and loading the dashboard.</p>
                  </div>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-base font-semibold text-white shadow-lg hover:from-amber-500 hover:to-amber-600 disabled:cursor-not-allowed disabled:opacity-80"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Enter Kitchen</span>
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>

            <p className="pt-2 text-center text-xs text-slate-400">
              Secure access • HTTP-only session • Restaurant Ops
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export { LoginPage };
