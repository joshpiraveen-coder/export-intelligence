"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ClipboardCheck, Trash2, Loader2 } from "lucide-react";
import { deleteBundle } from "@/app/actions";

export function BundleDetailClient({ bundleId, bundleName }: { bundleId: string; bundleName: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handleDelete = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setDeleting(true);
    try {
      await deleteBundle(bundleId);
      toast.success(`"${bundleName}" deleted`);
      router.push("/bundles");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete bundle");
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <Link href={`/assessment/new?bundleId=${bundleId}`}>
        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
          <ClipboardCheck size={14} />
          Assess this Bundle
        </button>
      </Link>
      <button
        onClick={handleDelete}
        disabled={deleting}
        onBlur={() => setConfirming(false)}
        className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-colors disabled:opacity-60 ${
          confirming
            ? "bg-red-500/10 text-red-700 border-red-500/30"
            : "border-border text-muted-foreground hover:text-red-700 hover:border-red-500/30"
        }`}
      >
        {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        {confirming ? "Confirm delete?" : ""}
      </button>
    </div>
  );
}
