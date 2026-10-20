"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Plus, Trash2, ShieldCheck, X } from "lucide-react";
import { createQualityRecord, deleteQualityRecord } from "@/app/actions";
import { formatDate } from "@/lib/utils";

interface QualityFormClientProps {
  product: any;
  records: any[];
}

const emptyForm = {
  batchNumber: "",
  manufacturingDate: "",
  expiryDate: "",
  bestBeforeDate: "",
  productionLine: "",
  factoryLocation: "",
  plantRegistrationNumber: "",
  inspectionStatus: "PENDING",
  qaInspector: "",
  microbiologicalResults: "",
  heavyMetalResults: "",
  pesticideResidueResults: "",
  moistureContent: "",
  waterActivity: "",
  phValue: "",
  brix: "",
  packagingInspection: "",
  metalDetectionStatus: "",
  recallStatus: "NONE",
  traceabilityQrCode: "",
  supplierTraceability: "",
  rawMaterialSource: "",
  internalAuditStatus: "",
  externalAuditStatus: "",
  qaNotes: "",
};

export function QualityFormClient({ product, records }: QualityFormClientProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(records.length === 0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const update = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    setLoading(true);
    try {
      await createQualityRecord(product.id, form);
      toast.success("Batch record added");
      setForm(emptyForm);
      setShowForm(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to add batch record");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteQualityRecord(id, product.id);
      toast.success("Batch record removed");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove batch record");
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

  const statusColor = (status: string) =>
    status === "PASSED" ? "bg-emerald-500/10 text-emerald-400" :
    status === "FAILED" ? "bg-red-500/10 text-red-400" :
    status === "IN_PROGRESS" ? "bg-blue-500/10 text-blue-400" :
    "bg-amber-500/10 text-amber-400";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-xl border border-border hover:bg-secondary transition-colors text-muted-foreground flex-shrink-0">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Quality & Traceability — {product.name}</h1>
            <p className="text-sm text-muted-foreground">{product.sku || "No SKU"} • {product.manufacturer || "Unknown manufacturer"}</p>
          </div>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={14} /> Add Batch Record
          </button>
        )}
      </div>

      {/* Existing batch records */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <ShieldCheck size={14} className="text-blue-400" /> Batch Records ({records.length})
        </h3>
        {records.length === 0 ? (
          <p className="text-sm text-muted-foreground">No batch records yet. Add one to start tracking QA and traceability for this product.</p>
        ) : (
          <div className="space-y-3">
            {records.map((r) => (
              <div key={r.id} className="p-3 rounded-xl bg-secondary/40 border border-border">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-foreground">{r.batchNumber || "Unassigned batch"}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${statusColor(r.inspectionStatus)}`}>
                        {r.inspectionStatus}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Mfg: {r.manufacturingDate ? formatDate(r.manufacturingDate) : "—"} • Exp: {r.expiryDate ? formatDate(r.expiryDate) : "—"} • {r.factoryLocation || "Location not set"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add batch record form */}
      {showForm && (
        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">New Batch Record</h3>
            {records.length > 0 && (
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
                <X size={16} />
              </button>
            )}
          </div>

          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Batch Identification</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Batch Number" value={form.batchNumber} onChange={(v: string) => update("batchNumber", v)} placeholder="Assigned at production" />
              <Field label="Manufacturing Date" type="date" value={form.manufacturingDate} onChange={(v: string) => update("manufacturingDate", v)} />
              <Field label="Expiry Date" type="date" value={form.expiryDate} onChange={(v: string) => update("expiryDate", v)} />
              <Field label="Best Before Date" type="date" value={form.bestBeforeDate} onChange={(v: string) => update("bestBeforeDate", v)} />
              <Field label="Production Line" value={form.productionLine} onChange={(v: string) => update("productionLine", v)} placeholder="Line 2" />
              <Field label="Factory Location" value={form.factoryLocation} onChange={(v: string) => update("factoryLocation", v)} placeholder="Jaffna, Sri Lanka" />
              <Field label="Plant Registration Number" value={form.plantRegistrationNumber} onChange={(v: string) => update("plantRegistrationNumber", v)} placeholder="Not yet recorded" />
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Inspection & Testing</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Inspection Status</label>
                <select
                  value={form.inspectionStatus}
                  onChange={(e) => update("inspectionStatus", e.target.value)}
                  className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary/60"
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="PASSED">Passed</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>
              <Field label="QA Inspector" value={form.qaInspector} onChange={(v: string) => update("qaInspector", v)} placeholder="Not yet assigned" />
              <Field label="Microbiological Test Results" value={form.microbiologicalResults} onChange={(v: string) => update("microbiologicalResults", v)} placeholder="Not yet recorded" />
              <Field label="Heavy Metal Test Results" value={form.heavyMetalResults} onChange={(v: string) => update("heavyMetalResults", v)} placeholder="Not yet recorded" />
              <Field label="Pesticide Residue Test" value={form.pesticideResidueResults} onChange={(v: string) => update("pesticideResidueResults", v)} placeholder="Not yet recorded" />
              <Field label="Moisture Content (%)" type="number" value={form.moistureContent} onChange={(v: string) => update("moistureContent", v)} placeholder="—" />
              <Field label="Water Activity (Aw)" type="number" value={form.waterActivity} onChange={(v: string) => update("waterActivity", v)} placeholder="—" />
              <Field label="pH Value" type="number" value={form.phValue} onChange={(v: string) => update("phValue", v)} placeholder="—" />
              <Field label="Brix" type="number" value={form.brix} onChange={(v: string) => update("brix", v)} placeholder="—" />
              <Field label="Packaging Inspection" value={form.packagingInspection} onChange={(v: string) => update("packagingInspection", v)} placeholder="Not yet recorded" />
              <Field label="Metal Detection Status" value={form.metalDetectionStatus} onChange={(v: string) => update("metalDetectionStatus", v)} placeholder="Not yet recorded" />
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Traceability & Audit</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Recall Status</label>
                <select
                  value={form.recallStatus}
                  onChange={(e) => update("recallStatus", e.target.value)}
                  className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary/60"
                >
                  <option value="NONE">None</option>
                  <option value="INITIATED">Initiated</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>
              <Field label="Traceability QR Code" value={form.traceabilityQrCode} onChange={(v: string) => update("traceabilityQrCode", v)} placeholder="Generated on batch release" />
              <Field label="Supplier Traceability" value={form.supplierTraceability} onChange={(v: string) => update("supplierTraceability", v)} placeholder="Not yet recorded" />
              <Field label="Raw Material Source" value={form.rawMaterialSource} onChange={(v: string) => update("rawMaterialSource", v)} placeholder="Not yet recorded" />
              <Field label="Internal Audit Status" value={form.internalAuditStatus} onChange={(v: string) => update("internalAuditStatus", v)} placeholder="Not yet audited" />
              <Field label="External Audit Status" value={form.externalAuditStatus} onChange={(v: string) => update("externalAuditStatus", v)} placeholder="Not yet audited" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">QA Notes</label>
            <textarea
              value={form.qaNotes}
              onChange={(e) => update("qaNotes", e.target.value)}
              placeholder="Additional notes…"
              rows={3}
              className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 resize-none"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {loading ? "Saving…" : "Add Batch Record"}
          </button>
        </div>
      )}
    </div>
  );
}
