import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, Download, ExternalLink } from "lucide-react";
import { formatDateTime, countryFlag } from "@/lib/utils";

export const metadata = { title: "Documents" };

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  COMPLIANCE_REPORT: "Compliance Report",
  COMMERCIAL_INVOICE: "Commercial Invoice",
  PACKING_LIST: "Packing List",
  CUSTOMS_DECLARATION: "Customs Declaration",
  EXPORT_CHECKLIST: "Export Checklist",
  CERTIFICATE_SUMMARY: "Certificate Summary",
  AI_SUMMARY: "AI Summary",
};

export default async function DocumentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id!;
  const role = (session.user as any).role;

  const documents = await prisma.document.findMany({
    where: role === "SUPER_ADMIN" ? {} : { assessment: { userId } },
    include: {
      assessment: {
        include: { destination: { select: { name: true, isoCode: true, flag: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Documents</h1>
        <p className="text-sm text-muted-foreground">
          {documents.length} generated document{documents.length === 1 ? "" : "s"} from your compliance assessments
        </p>
      </div>

      <div className="glass-card overflow-hidden">
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FileText size={40} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No documents yet</p>
            <p className="text-xs mt-1">
              Documents are generated automatically when you complete an export assessment.
            </p>
            <Link href="/assessment/new">
              <button className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium">
                Create Assessment
              </button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Document</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Destination</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Generated</th>
                  <th className="text-right px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-secondary/30 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <FileText size={16} className="text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate max-w-[220px]">{doc.title}</p>
                          <p className="text-xs text-muted-foreground sm:hidden">{DOCUMENT_TYPE_LABELS[doc.type] || doc.type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs bg-secondary border border-border px-2 py-1 rounded-full text-muted-foreground">
                        {DOCUMENT_TYPE_LABELS[doc.type] || doc.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {doc.assessment?.destination ? (
                        <span className="text-sm text-foreground">
                          {doc.assessment.destination.flag || countryFlag(doc.assessment.destination.isoCode)} {doc.assessment.destination.name}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                      {formatDateTime(doc.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        {doc.assessmentId && (
                          <Link href={`/assessment/${doc.assessmentId}`}>
                            <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                              <ExternalLink size={14} />
                            </button>
                          </Link>
                        )}
                        {doc.fileUrl && (
                          <a href={doc.fileUrl} download>
                            <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                              <Download size={14} />
                            </button>
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
