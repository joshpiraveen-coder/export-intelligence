"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Save, ChevronRight, Package, Leaf, Box, BarChart3 } from "lucide-react";
import { createProduct, updateProduct } from "@/app/actions";

interface ProductFormClientProps {
  categories: any[];
  product?: any; // For editing
}

const STEPS = [
  { id: "basic", label: "Basic Info", icon: Package },
  { id: "food", label: "Food Info", icon: Leaf },
  { id: "packaging", label: "Packaging", icon: Box },
  { id: "export", label: "Export Info", icon: BarChart3 },
];

export function ProductFormClient({ categories, product }: ProductFormClientProps) {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState("basic");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: product?.name || "",
    sku: product?.sku || "",
    barcode: product?.barcode || "",
    categoryId: product?.categoryId || "",
    description: product?.description || "",
    manufacturer: product?.manufacturer || "Jaffna Basket Pvt Ltd",
    countryOfOrigin: product?.countryOfOrigin || "LK",
    ingredients: product?.ingredients || "",
    foodCategory: product?.foodCategory || "",
    shelfLifeDays: product?.shelfLifeDays || "",
    storageConditions: product?.storageConditions || "",
    isOrganic: product?.isOrganic || false,
    isVegan: product?.isVegan || false,
    isHalal: product?.isHalal || false,
    isGlutenFree: product?.isGlutenFree || false,
    packageType: product?.packageType || "Sealed pouch",
    packageMaterial: product?.packageMaterial || "Food-grade plastic",
    weightGrams: product?.weightGrams || "",
    qtyPerCarton: product?.qtyPerCarton || "",
    hsCode: product?.hsCode || "",
    customsDesc: product?.customsDesc || "",
    exportCategory: product?.exportCategory || "Food & Beverages",
  });

  const update = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    if (!form.name) return toast.error("Product name is required");
    setLoading(true);
    try {
      if (product) {
        await updateProduct(product.id, form);
        toast.success("Product updated successfully!");
        router.push(`/products/${product.id}`);
      } else {
        const result = await createProduct(form);
        toast.success("Product created successfully!");
        router.push(`/products/${result.id}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save product");
      setLoading(false);
    }
  };

  const Input = ({ label, id, value, onChange, placeholder, type = "text", required = false }: any) => (
    <div>
      <label className="text-xs font-medium text-muted-foreground block mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-all"
      />
    </div>
  );

  const Toggle = ({ label, id, checked, onChange, description }: any) => (
    <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-10 h-6 rounded-full transition-colors relative ${checked ? "bg-primary" : "bg-border"}`}
      >
        <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${checked ? "left-5" : "left-1"}`} />
      </button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl border border-border hover:bg-secondary transition-colors text-muted-foreground">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">{product ? "Edit Product" : "Add New Product"}</h1>
          <p className="text-sm text-muted-foreground">Fill in the product details</p>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="glass-card p-3 flex gap-1">
        {STEPS.map((step) => (
          <button
            key={step.id}
            onClick={() => setActiveStep(step.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeStep === step.id
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <step.icon size={14} />
            <span className="hidden sm:inline">{step.label}</span>
          </button>
        ))}
      </div>

      {/* Form Sections */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="glass-card p-6 space-y-4"
        >
          {activeStep === "basic" && (
            <>
              <Input label="Product Name" id="name" value={form.name} onChange={(v: string) => update("name", v)} placeholder="e.g. Jaffna Curry Powder" required />
              <div className="grid grid-cols-2 gap-4">
                <Input label="SKU" id="sku" value={form.sku} onChange={(v: string) => update("sku", v)} placeholder="JB-SP-001" />
                <Input label="Barcode" id="barcode" value={form.barcode} onChange={(v: string) => update("barcode", v)} placeholder="5900000000000" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Category</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => update("categoryId", e.target.value)}
                  className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary/60 transition-all"
                >
                  <option value="">Select category…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="Product description…"
                  rows={3}
                  className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-all resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Manufacturer" id="manufacturer" value={form.manufacturer} onChange={(v: string) => update("manufacturer", v)} placeholder="Manufacturer name" />
                <Input label="Country of Origin" id="origin" value={form.countryOfOrigin} onChange={(v: string) => update("countryOfOrigin", v)} placeholder="LK" />
              </div>
            </>
          )}

          {activeStep === "food" && (
            <>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Ingredients</label>
                <textarea
                  value={form.ingredients}
                  onChange={(e) => update("ingredients", e.target.value)}
                  placeholder="e.g. Coriander, Cumin, Chilli, Salt…"
                  rows={3}
                  className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-all resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Food Category" id="foodCat" value={form.foodCategory} onChange={(v: string) => update("foodCategory", v)} placeholder="spices, dry-fish…" />
                <Input label="Shelf Life (days)" id="shelf" type="number" value={form.shelfLifeDays} onChange={(v: string) => update("shelfLifeDays", v)} placeholder="365" />
              </div>
              <Input label="Storage Conditions" id="storage" value={form.storageConditions} onChange={(v: string) => update("storageConditions", v)} placeholder="Cool, dry place" />
              <div className="space-y-2">
                <Toggle label="Halal Certified" id="halal" checked={form.isHalal} onChange={(v: boolean) => update("isHalal", v)} description="Product meets Halal standards" />
                <Toggle label="Organic" id="organic" checked={form.isOrganic} onChange={(v: boolean) => update("isOrganic", v)} description="Certified organic product" />
                <Toggle label="Vegan" id="vegan" checked={form.isVegan} onChange={(v: boolean) => update("isVegan", v)} description="Contains no animal products" />
                <Toggle label="Gluten Free" id="gluten" checked={form.isGlutenFree} onChange={(v: boolean) => update("isGlutenFree", v)} description="Does not contain gluten" />
              </div>
            </>
          )}

          {activeStep === "packaging" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Package Type" id="pkgType" value={form.packageType} onChange={(v: string) => update("packageType", v)} placeholder="Sealed pouch" />
                <Input label="Package Material" id="pkgMat" value={form.packageMaterial} onChange={(v: string) => update("packageMaterial", v)} placeholder="Food-grade plastic" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Weight (grams)" id="weight" type="number" value={form.weightGrams} onChange={(v: string) => update("weightGrams", v)} placeholder="200" />
                <Input label="Qty per Carton" id="carton" type="number" value={form.qtyPerCarton} onChange={(v: string) => update("qtyPerCarton", v)} placeholder="24" />
              </div>
            </>
          )}

          {activeStep === "export" && (
            <>
              <Input label="HS Code" id="hs" value={form.hsCode} onChange={(v: string) => update("hsCode", v)} placeholder="e.g. 0904.22" />
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Customs Description</label>
                <textarea
                  value={form.customsDesc}
                  onChange={(e) => update("customsDesc", e.target.value)}
                  placeholder="Official customs product description for declaration…"
                  rows={3}
                  className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-all resize-none"
                />
              </div>
              <Input label="Export Category" id="exportCat" value={form.exportCategory} onChange={(v: string) => update("exportCategory", v)} placeholder="Food & Beverages" />
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {STEPS.findIndex((s) => s.id === activeStep) > 0 && (
          <button
            onClick={() => {
              const idx = STEPS.findIndex((s) => s.id === activeStep);
              setActiveStep(STEPS[idx - 1].id);
            }}
            className="px-4 py-2.5 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Previous
          </button>
        )}

        {STEPS.findIndex((s) => s.id === activeStep) < STEPS.length - 1 ? (
          <button
            onClick={() => {
              const idx = STEPS.findIndex((s) => s.id === activeStep);
              setActiveStep(STEPS[idx + 1].id);
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-secondary border border-border rounded-xl text-sm font-medium hover:border-primary/40 transition-colors"
          >
            Next: {STEPS[STEPS.findIndex((s) => s.id === activeStep) + 1].label} <ChevronRight size={14} />
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {loading ? "Saving…" : "Save Product"}
          </button>
        )}
      </div>
    </div>
  );
}
