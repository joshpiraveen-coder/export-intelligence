import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Globe, Brain, BarChart3, CheckCircle, Zap } from "lucide-react";

export const metadata = {
  title: "Jaffna Basket Export Intelligence | Sri Lankan Export Compliance Platform",
  description: "AI-powered export compliance intelligence for Sri Lankan products. Analyze 190+ countries, generate compliance reports, and export with confidence.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">JB</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Jaffna Basket</p>
            <p className="text-[10px] text-muted-foreground">Export Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <button className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sign In
            </button>
          </Link>
          <Link href="/register">
            <button className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
              Get Started Free
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-8 overflow-hidden animated-gradient">
        {/* Grid background */}
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-30" />
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-medium mb-8">
            <Zap size={12} />
            AI-Powered Export Compliance for Sri Lanka
          </div>

          <h1 className="text-5xl sm:text-6xl font-black text-foreground mb-6 leading-tight">
            Export Sri Lankan Products{" "}
            <span className="gradient-text">Anywhere in the World</span>{" "}
            — Compliantly
          </h1>

          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Instantly analyze export compliance for any Sri Lankan product to 190+ countries.
            AI-powered regulation intelligence, automated document checklists, and real-time compliance scoring.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-white rounded-xl font-semibold text-base hover:bg-primary/90 transition-colors shadow-glow">
                Start Free Analysis <ArrowRight size={18} />
              </button>
            </Link>
            <Link href="/login">
              <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 border border-border text-foreground rounded-xl font-medium text-base hover:bg-secondary hover:border-primary/40 transition-colors">
                Sign In to Dashboard
              </button>
            </Link>
          </div>

          {/* Trust signals */}
          <div className="flex items-center justify-center gap-8 mt-12 flex-wrap">
            {["🇬🇧 United Kingdom", "🇺🇸 United States", "🇦🇺 Australia", "🇦🇪 UAE", "🇩🇪 Germany", "+185 more"].map((c) => (
              <span key={c} className="text-sm text-muted-foreground">{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-8 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Everything you need for compliant exports
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            A complete compliance intelligence platform built specifically for Sri Lankan exporters and Jaffna Basket sellers.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: <Brain size={24} className="text-primary" />,
              title: "AI Compliance Analysis",
              description: "Instant AI-powered compliance scoring for any product-country combination. Get red/yellow/green risk assessment in seconds.",
            },
            {
              icon: <Globe size={24} className="text-purple-400" />,
              title: "190+ Country Database",
              description: "Comprehensive, up-to-date regulations for all major export destinations. Food safety, labeling, customs, and certificate requirements.",
            },
            {
              icon: <Shield size={24} className="text-emerald-400" />,
              title: "Document Checklists",
              description: "Automatically generate required document lists: commercial invoices, certificates, customs declarations, and more.",
            },
            {
              icon: <BarChart3 size={24} className="text-amber-400" />,
              title: "Compliance Reports",
              description: "Professional PDF compliance reports for your shipments. Download, print, or share with your customs broker.",
            },
            {
              icon: <CheckCircle size={24} className="text-blue-400" />,
              title: "Bundle Analysis",
              description: "Analyze entire product bundles at once. Detects conflicts between products and aggregates all documentation requirements.",
            },
            {
              icon: <Zap size={24} className="text-red-400" />,
              title: "Real-time Alerts",
              description: "Stay notified when regulations change for your key markets. Never get caught off-guard by regulatory updates.",
            },
          ].map((feature, i) => (
            <div key={i} className="glass-card p-6 hover:border-primary/40 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Products Section */}
      <section className="py-16 px-8 bg-card/50 border-y border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Built for Jaffna Basket Products
          </h2>
          <p className="text-muted-foreground mb-8">
            Pre-loaded with 20+ authentic Sri Lankan products and their compliance profiles
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              "🌶️ Jaffna Curry Powder", "🐟 Dry Fish (Maldive)", "🫙 Pol Sambol",
              "🍵 Ceylon Tea", "🥥 Coconut Oil", "🍬 Kokis", "🌾 Samba Rice",
              "🧂 Turmeric Powder", "🌿 Ceylon Cinnamon", "🫙 Kithul Treacle",
            ].map((p) => (
              <span key={p} className="text-sm px-3 py-1.5 rounded-full bg-secondary border border-border text-muted-foreground">
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-8 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to export with confidence?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join Jaffna Basket exporters who use our platform to navigate international trade regulations.
          </p>
          <Link href="/register">
            <button className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-semibold text-base hover:bg-primary/90 transition-colors shadow-glow">
              Get Started Free <ArrowRight size={18} />
            </button>
          </Link>
          <p className="text-xs text-muted-foreground mt-4">No credit card required • Instant access</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-8 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          © 2024 Jaffna Basket Export Intelligence Platform •{" "}
          <span className="text-foreground font-medium">🇱🇰 Made for Sri Lankan Exporters</span>
        </p>
      </footer>
    </div>
  );
}
