"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save, Search, CheckCircle, Package } from "lucide-react";
import { createBundle } from "@/app/actions";

interface BundleFormClientProps {
  products: any[];
}

export function BundleFormClient({ products }: BundleFormClientProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku || "").toLowerCase().includes(search.toLowerCase())
  );

  const toggleProduct = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!name.trim()) return toast.error("Bundle name is required");
    if (selected.size === 0) return toast.error("Select at least one product");
    setLoading(true);
    try {
      const result = await createBundle({
        name,
        description: description || undefined,
        productIds: [...selected],
      });
      toast.success("Bundle created");
      router.push(`/bundles/${result.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create bundle");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl border border-border hover:bg-secondary transition-colors text-muted-foreground">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Create Bundle</h1>
          <p className="text-sm text-muted-foreground">Group products for combined compliance assessments</p>
        </div>
      </div>

      <div className="glass-card p-6 space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">
            Bundle Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Spice Starter Pack"
            className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-all"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description…"
            rows={2}
            className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-all resize-none"
          />
        </div>
      </div>

      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-foreground">
            Products <span className="text-muted-foreground font-normal">({selected.size} selected)</span>
          </label>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full pl-9 pr-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
          {filteredProducts.map((p) => {
            const isSelected = selected.has(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggleProduct(p.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                  isSelected ? "bg-primary/10 border-primary/40" : "bg-secondary/40 border-border hover:border-primary/30"
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                  <Package size={14} className="text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.sku || p.category?.name || "—"}</p>
                </div>
                {isSelected && <CheckCircle size={16} className="text-primary flex-shrink-0" />}
              </button>
            );
          })}
          {filteredProducts.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-full text-center py-8">No products found</p>
          )}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {loading ? "Creating…" : "Create Bundle"}
      </button>
    </div>
  );
}
