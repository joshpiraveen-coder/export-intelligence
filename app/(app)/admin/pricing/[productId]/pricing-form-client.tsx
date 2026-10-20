"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { upsertProductPricing } from "@/app/actions";

interface PricingFormClientProps {
  product: any;
  pricing: any;
}

export function PricingFormClient({ product, pricing }: PricingFormClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    retailPriceLKR: pricing?.retailPriceLKR ?? "",
    wholesalePriceLKR: pricing?.wholesalePriceLKR ?? "",
    distributorPriceLKR: pricing?.distributorPriceLKR ?? "",
    exportFobPriceUsd: pricing?.exportFobPriceUsd ?? "",
    cifPriceUsd: pricing?.cifPriceUsd ?? "",
    moq: pricing?.moq || "",
    currency: pricing?.currency || "LKR",
    vatRate: pricing?.vatRate ?? "",
    productionCost: pricing?.productionCost ?? "",
    profitMargin: pricing?.profitMargin ?? "",
    seasonalAvailability: pricing?.seasonalAvailability || "",
    leadTimeDays: pricing?.leadTimeDays ?? "",
    monthlyCapacity: pricing?.monthlyCapacity || "",
    annualCapacity: pricing?.annualCapacity || "",
    paymentTerms: pricing?.paymentTerms || "",
    acceptedPaymentMethods: pricing?.acceptedPaymentMethods ? JSON.parse(pricing.acceptedPaymentMethods).join(", ") : "",
    supplierCode: pricing?.supplierCode || "",
    batchCost: pricing?.batchCost ?? "",
    marketSegment: pricing?.marketSegment || "",
  });

  const update = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    setLoading(true);
    try {
      await upsertProductPricing(product.id, {
        ...form,
        acceptedPaymentMethods: form.acceptedPaymentMethods
          ? form.acceptedPaymentMethods.split(",").map((s: string) => s.trim()).filter(Boolean)
          : [],
      });
      toast.success("Pricing information saved");
      router.push("/admin/pricing");
    } catch (err: any) {
      toast.error(err.message || "Failed to save pricing");
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, id, value, onChange, type = "text", placeholder }: any) => (
    <div>
      <label className="text-xs font-medium text-muted-foreground block mb-1.5">{label}</label>
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl border border-border hover:bg-secondary transition-colors text-muted-foreground">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Pricing — {product.name}</h1>
          <p className="text-sm text-muted-foreground">{product.sku || "No SKU"} • {product.manufacturer || "Unknown manufacturer"}</p>
        </div>
      </div>

      <div className="glass-card p-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Price Tiers</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Retail Price (LKR)" value={form.retailPriceLKR} onChange={(v: string) => update("retailPriceLKR", v)} type="number" placeholder="450" />
            <Field label="Wholesale Price (LKR)" value={form.wholesalePriceLKR} onChange={(v: string) => update("wholesalePriceLKR", v)} type="number" placeholder="360" />
            <Field label="Distributor Price (LKR)" value={form.distributorPriceLKR} onChange={(v: string) => update("distributorPriceLKR", v)} type="number" placeholder="320" />
            <Field label="Export FOB Price (USD)" value={form.exportFobPriceUsd} onChange={(v: string) => update("exportFobPriceUsd", v)} type="number" placeholder="2.50" />
            <Field label="CIF Price (USD)" value={form.cifPriceUsd} onChange={(v: string) => update("cifPriceUsd", v)} type="number" placeholder="3.10" />
            <Field label="Currency" value={form.currency} onChange={(v: string) => update("currency", v)} placeholder="LKR" />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Costs & Margins</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Production Cost (LKR)" value={form.productionCost} onChange={(v: string) => update("productionCost", v)} type="number" placeholder="220" />
            <Field label="Batch Cost (LKR)" value={form.batchCost} onChange={(v: string) => update("batchCost", v)} type="number" placeholder="18000" />
            <Field label="Profit Margin (%)" value={form.profitMargin} onChange={(v: string) => update("profitMargin", v)} type="number" placeholder="35" />
            <Field label="VAT / Tax Rate (%)" value={form.vatRate} onChange={(v: string) => update("vatRate", v)} type="number" placeholder="18" />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Order & Production</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Minimum Order Quantity" value={form.moq} onChange={(v: string) => update("moq", v)} placeholder="500 units" />
            <Field label="Lead Time (days)" value={form.leadTimeDays} onChange={(v: string) => update("leadTimeDays", v)} type="number" placeholder="14" />
            <Field label="Monthly Production Capacity" value={form.monthlyCapacity} onChange={(v: string) => update("monthlyCapacity", v)} placeholder="10,000 units" />
            <Field label="Annual Production Capacity" value={form.annualCapacity} onChange={(v: string) => update("annualCapacity", v)} placeholder="120,000 units" />
            <Field label="Seasonal Availability" value={form.seasonalAvailability} onChange={(v: string) => update("seasonalAvailability", v)} placeholder="Year-round" />
            <Field label="Market Segment" value={form.marketSegment} onChange={(v: string) => update("marketSegment", v)} placeholder="Retail / Wholesale / Export" />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Payment & Supplier</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Preferred Payment Terms" value={form.paymentTerms} onChange={(v: string) => update("paymentTerms", v)} placeholder="50% advance, 50% on shipment" />
            <Field label="Accepted Payment Methods" value={form.acceptedPaymentMethods} onChange={(v: string) => update("acceptedPaymentMethods", v)} placeholder="Bank transfer, LC, PayPal" />
            <Field label="Supplier Code" value={form.supplierCode} onChange={(v: string) => update("supplierCode", v)} placeholder="SUP-0012" />
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {loading ? "Saving…" : "Save Pricing"}
      </button>
    </div>
  );
}
