"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Globe, Package, ArrowRight, ArrowLeft, Loader2,
  Plus, X, ChevronDown, Search, CheckCircle,
} from "lucide-react";
import { createAssessment } from "@/app/actions";

interface NewAssessmentClientProps {
  countries: any[];
  products: any[];
  initialBundle?: { id: string; name: string; productIds: string[] } | null;
}

const STEPS = [
  { id: 1, label: "Destination", icon: Globe },
  { id: 2, label: "Products", icon: Package },
  { id: 3, label: "Review", icon: CheckCircle },
];

export function NewAssessmentClient({ countries, products, initialBundle }: NewAssessmentClientProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState(() => {
    const bundleProducts = initialBundle
      ? products
          .filter((p) => initialBundle.productIds.includes(p.id))
          .map((p) => ({ productId: p.id, quantity: 1, name: p.name }))
      : [];
    return {
      title: initialBundle ? `${initialBundle.name} Assessment` : "",
      destinationId: "",
      originId: "",
      bundleId: initialBundle?.id || "",
      selectedProducts: bundleProducts as Array<{ productId: string; quantity: number; name: string }>,
    };
  });

  const [productSearch, setProductSearch] = useState("");
  const [countrySearch, setCountrySearch] = useState("");

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.sku || "").toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredCountries = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.isoCode.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const selectedCountry = countries.find((c) => c.id === form.destinationId);
  const originCountry = countries.find((c) => c.id === form.originId);

  const addProduct = (product: any) => {
    if (form.selectedProducts.find((p) => p.productId === product.id)) return;
    setForm((f) => ({
      ...f,
      selectedProducts: [
        ...f.selectedProducts,
        { productId: product.id, quantity: 1, name: product.name },
      ],
    }));
  };

  const removeProduct = (productId: string) => {
    setForm((f) => ({
      ...f,
      selectedProducts: f.selectedProducts.filter((p) => p.productId !== productId),
    }));
  };

  const updateQuantity = (productId: string, qty: number) => {
    setForm((f) => ({
      ...f,
      selectedProducts: f.selectedProducts.map((p) =>
        p.productId === productId ? { ...p, quantity: Math.max(1, qty) } : p
      ),
    }));
  };

  const handleSubmit = async () => {
    if (!form.destinationId) return toast.error("Select a destination country");
    if (form.selectedProducts.length === 0) return toast.error("Add at least one product");

    setLoading(true);
    try {
      const result = await createAssessment({
        title: form.title || undefined,
        destinationId: form.destinationId,
        originId: form.originId || undefined,
        bundleId: form.bundleId || undefined,
        products: form.selectedProducts.map((p) => ({
          productId: p.productId,
          quantity: p.quantity,
        })),
      });
      if (!result.success) {
        throw new Error(result.error);
      }
      toast.success("Assessment completed!");
      router.push(`/assessment/${result.id}`);
    } catch (err: any) {
      toast.error(err.message || "Assessment failed");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">New Export Assessment</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Analyze compliance for your products in {form.selectedProducts.length} item(s)
          {selectedCountry && ` → ${selectedCountry.name}`}
        </p>
        {initialBundle && (
          <p className="text-xs text-primary mt-1 flex items-center gap-1">
            <Package size={12} /> Pre-filled from bundle "{initialBundle.name}"
          </p>
        )}
      </div>

      {/* Step Indicator */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2 flex-1">
              <button
                onClick={() => step > s.id && setStep(s.id)}
                className={`flex items-center gap-2 ${step > s.id ? "cursor-pointer" : "cursor-default"}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    step === s.id
                      ? "bg-primary text-white shadow-glow"
                      : step > s.id
                      ? "bg-emerald-500 text-white"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {step > s.id ? <CheckCircle size={16} /> : s.id}
                </div>
                <span
                  className={`text-sm font-medium hidden sm:block ${
                    step === s.id ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {s.label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-px mx-3 transition-colors ${
                    step > s.id ? "bg-emerald-500" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {/* Step 1: Country Selection */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {/* Assessment Title */}
            <div className="glass-card p-5">
              <label className="text-sm font-medium text-foreground block mb-2">
                Assessment Title (optional)
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Spice Bundle to UK - Q1 2024"
                className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-all"
              />
            </div>

            {/* Destination Country */}
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Destination Country <span className="text-red-400">*</span>
              </h3>
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search countries…"
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto">
                {filteredCountries.map((country) => (
                  <button
                    key={country.id}
                    onClick={() => setForm({ ...form, destinationId: country.id })}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${
                      form.destinationId === country.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="text-lg">{country.flag || "🌍"}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{country.name}</p>
                      <p className="text-[10px] text-muted-foreground">{country.isoCode}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Origin Country */}
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Origin Country
                <span className="text-xs text-muted-foreground font-normal ml-2">(optional, defaults to Sri Lanka)</span>
              </h3>
              <select
                value={form.originId}
                onChange={(e) => setForm({ ...form, originId: e.target.value })}
                className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary/60 transition-all"
              >
                <option value="">Sri Lanka (default)</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                if (!form.destinationId) return toast.error("Select a destination country");
                setStep(2);
              }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              Continue to Products <ArrowRight size={16} />
            </button>
          </motion.div>
        )}

        {/* Step 2: Product Selection */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Add Products <span className="text-red-400">*</span>
              </h3>
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search your products…"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-all"
                />
              </div>
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {filteredProducts.map((product) => {
                  const isSelected = form.selectedProducts.find((p) => p.productId === product.id);
                  return (
                    <button
                      key={product.id}
                      onClick={() => addProduct(product)}
                      disabled={!!isSelected}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-emerald-500/40 bg-emerald-500/5 opacity-60 cursor-not-allowed"
                          : "border-border hover:border-primary/40 hover:bg-secondary/50"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                        <Package size={14} className="text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.sku || product.category?.name || ""}</p>
                      </div>
                      {isSelected ? (
                        <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />
                      ) : (
                        <Plus size={16} className="text-muted-foreground flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No products found</p>
                )}
              </div>
            </div>

            {/* Selected Products */}
            {form.selectedProducts.length > 0 && (
              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Selected Products ({form.selectedProducts.length})
                </h3>
                <div className="space-y-2">
                  {form.selectedProducts.map((p) => (
                    <div
                      key={p.productId}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary/5 border border-primary/20"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <label className="text-xs text-muted-foreground">Qty:</label>
                        <input
                          type="number"
                          min="1"
                          value={p.quantity}
                          onChange={(e) => updateQuantity(p.productId, parseInt(e.target.value))}
                          className="w-16 px-2 py-1 bg-secondary border border-border rounded-lg text-sm text-center focus:outline-none focus:border-primary/60"
                        />
                      </div>
                      <button
                        onClick={() => removeProduct(p.productId)}
                        className="p-1 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-4 py-3 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button
                onClick={() => {
                  if (form.selectedProducts.length === 0) return toast.error("Add at least one product");
                  setStep(3);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                Review Assessment <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="glass-card p-5 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Assessment Summary</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                  <p className="text-xs text-muted-foreground">Destination</p>
                  <p className="text-sm font-medium text-foreground mt-1">
                    {selectedCountry?.flag} {selectedCountry?.name}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                  <p className="text-xs text-muted-foreground">Origin</p>
                  <p className="text-sm font-medium text-foreground mt-1">
                    {originCountry?.name || "🇱🇰 Sri Lanka"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Products ({form.selectedProducts.length})
                </p>
                <div className="space-y-1.5">
                  {form.selectedProducts.map((p) => (
                    <div key={p.productId} className="flex justify-between items-center text-sm">
                      <span className="text-foreground">{p.name}</span>
                      <span className="text-muted-foreground">×{p.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-400">
                ⚡ AI compliance analysis will run immediately after submission
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-4 py-3 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Analyzing compliance…
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Run Compliance Analysis
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
