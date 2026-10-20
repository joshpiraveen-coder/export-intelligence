"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Shield, Mail, Lock } from "lucide-react";
import { toast } from "sonner";

function SkylineColumn({ heights, tone }: { heights: number[]; tone: string }) {
  return (
    <div className="flex items-end gap-1.5 h-full">
      {heights.map((h, i) => (
        <div
          key={i}
          className="w-6 sm:w-8 rounded-t-sm"
          style={{ height: `${h}%`, background: tone, opacity: 0.15 + (i % 3) * 0.08 }}
        />
      ))}
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error === "CredentialsSignin" ? "Invalid email or password" : result.error);
      } else {
        toast.success("Welcome back!");
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden animated-gradient">
      {/* Decorative skyline collage on the edges */}
      <div className="hidden lg:flex absolute left-0 top-0 bottom-0 w-64 items-end pointer-events-none">
        <SkylineColumn heights={[40, 65, 50, 80, 55, 70, 45]} tone="hsl(var(--luxury-navy))" />
      </div>
      <div className="hidden lg:flex absolute right-0 top-0 bottom-0 w-64 items-end justify-end pointer-events-none">
        <SkylineColumn heights={[55, 75, 45, 90, 60, 40, 70]} tone="hsl(var(--primary))" />
      </div>

      {/* Decorative watermark initial */}
      <div
        className="hidden sm:block absolute -left-6 -bottom-10 select-none pointer-events-none"
        style={{ fontFamily: "var(--font-playfair), serif", fontSize: "16rem", color: "hsl(var(--luxury-navy))", opacity: 0.05, lineHeight: 1 }}
      >
        J
      </div>

      {/* Brand */}
      <div className="relative z-10 flex items-center gap-3 px-6 sm:px-10 py-6">
        <div>
          <p className="text-lg font-semibold text-foreground" style={{ fontFamily: "var(--font-playfair), serif" }}>
            Jaffna Basket
          </p>
          <p className="text-xs text-muted-foreground tracking-wide uppercase">Export Intelligence</p>
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center px-6 pb-16 pt-4 sm:pt-10">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mb-10"
        >
          <h1
            className="text-4xl sm:text-6xl font-bold text-foreground leading-tight"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            Export with <span className="gradient-text">Confidence</span>
          </h1>
          <p className="text-muted-foreground mt-4 text-sm sm:text-base max-w-lg mx-auto">
            AI-powered compliance intelligence to help Sri Lankan exporters ship globally with regulatory confidence.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="w-full max-w-md"
        >
          <div className="glass-card p-8">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-playfair), serif" }}>
                Welcome back
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Sign in to your compliance dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-700"
                >
                  {error}
                </motion.div>
              )}

              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2 text-white"
                style={{ background: "hsl(var(--luxury-navy))" }}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
                {loading ? "Signing in…" : "Sign In"}
              </button>

              <p className="text-center">
                <Link href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                  Forgot your password?
                </Link>
              </p>
            </form>

            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-primary hover:underline font-medium">
                  Create account
                </Link>
              </p>
            </div>

            {/* Demo credentials */}
            <div className="mt-5 p-3 rounded-xl bg-secondary/60 border border-border">
              <p className="text-xs font-medium text-muted-foreground mb-2">Demo credentials:</p>
              <div className="space-y-1">
                <p className="text-xs text-foreground font-mono">admin@jaffnabasket.com</p>
                <p className="text-xs text-foreground font-mono">Admin123!</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
