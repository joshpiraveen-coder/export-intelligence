"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save, AlertTriangle } from "lucide-react";
import { createRegulation } from "@/app/actions";

interface RegulationFormClientProps {
  countries: any[];
}

const CATEGORIES = [
  "FOOD_IMPORT", "LABELING", "PACKAGING", "DOCUMENTATION", "CERTIFICATION",
  "CUSTOMS", "PHYTOSANITARY", "ANIMAL_HEALTH", "ORGANIC", "HALAL",
  "RESTRICTED_INGREDIENTS", "PROHIBITED", "TARIFF",
];
const SEVERITIES = ["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"];

export function RegulationFormClient({ countries }: RegulationFormClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    countryId: "",
    category: "FOOD_IMPORT",
    productCategory: "all",
    title: "",
    description: "",
    requirement: "",
    severity: "MEDIUM",
    isProhibition: false,
    sourceAuthority: "",
    sourceUrl: "",
    notes: "",
  });

  const update = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    if (!form.countryId) return toast.error("Select a country");
    if (!form.title.trim()) return toast.error("Title is required");
    if (!form.description.trim()) return toast.error("Description is required");
    setLoading(true);
    try {
      await createRegulation(form);
      toast.success("Regulation added");
      router.push("/admin/regulations");
    } catch (err: any) {
      toast.error(err.message || "Failed to add regulation");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl border border-border hover:bg-secondary transition-colors text-muted-foreground">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Add Regulation</h1>
          <p className="text-sm text-muted-foreground">Every regulation should cite a real, checkable source</p>
        </div>
      </div>

      <div className="glass-card p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Country *</label>
            <select
              value={form.countryId}
              onChange={(e) => update("countryId", e.target.value)}
              className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary/60"
            >
              <option value="">Select country…</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>{c.flag} {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Category *</label>
            <select
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
              className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary/60"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Severity</label>
            <select
              value={form.severity}
              onChange={(e) => update("severity", e.target.value)}
              className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary/60"
            >
              {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Product Category</label>
            <input
              type="text"
              value={form.productCategory}
              onChange={(e) => update("productCategory", e.target.value)}
              placeholder="all, spices, dry-fish, meat…"
              className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g. FDA Prior Notice of Imported Foods"
            className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Description *</label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={3}
            placeholder="What the regulation actually requires…"
            className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 resize-none"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Requirement</label>
          <input
            type="text"
            value={form.requirement}
            onChange={(e) => update("requirement", e.target.value)}
            placeholder="The specific action an exporter must take"
            className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60"
          />
        </div>

        <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50 border border-border">
          <input
            type="checkbox"
            id="isProhibition"
            checked={form.isProhibition}
            onChange={(e) => update("isProhibition", e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="isProhibition" className="text-sm text-foreground cursor-pointer">
            This is a blanket prohibition (the compliance engine will only flag products whose ingredients/name match the prohibited substance)
          </label>
        </div>
      </div>

      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} className="text-amber-600" />
          <h3 className="text-sm font-semibold text-foreground">Source Citation</h3>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">
          Leaving these blank will mark the regulation "Unverified" on the country page. Cite the actual government/authority page you checked.
        </p>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Source Authority</label>
          <input
            type="text"
            value={form.sourceAuthority}
            onChange={(e) => update("sourceAuthority", e.target.value)}
            placeholder="e.g. U.S. Food and Drug Administration (FDA)"
            className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Source URL</label>
          <input
            type="url"
            value={form.sourceUrl}
            onChange={(e) => update("sourceUrl", e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            rows={2}
            placeholder="Any caveats, exceptions, or verification date…"
            className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 resize-none"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {loading ? "Saving…" : "Add Regulation"}
      </button>
    </div>
  );
}
