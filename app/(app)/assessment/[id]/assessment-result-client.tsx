"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import {
  Download, Share2, MessageSquare, ChevronDown, ChevronUp,
  CheckCircle, AlertTriangle, XCircle, FileText, Tag,
  Package, Globe, Calendar, ArrowLeft, Printer,
} from "lucide-react";
import { ComplianceGauge } from "@/components/ui/compliance-gauge";
import { RiskBadge, WarningCard } from "@/components/ui/risk-badge";
import { formatDate, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

interface AssessmentResultClientProps {
  assessment: any;
}

// Dedupe a list of { text, regulationTitle, ... } requirement entries by
// their text, keeping the first (most specific) occurrence.
function dedupeByText(items: any[]): any[] {
  const seen = new Map<string, any>();
  for (const item of items) {
    if (!item) continue;
    const key = typeof item === "string" ? item.toLowerCase() : (item.text || "").toLowerCase();
    if (!seen.has(key)) seen.set(key, item);
  }
  return [...seen.values()];
}

// Renders one traceable requirement — the requirement text plus the law
// (regulationTitle) and, when applicable, the specific ingredient that
// triggered it. Falls back gracefully for legacy plain-string entries.
function RequirementItem({ item, icon }: { item: any; icon: React.ReactNode }) {
  if (typeof item === "string") {
    return (
      <li className="flex items-start gap-2 text-sm text-foreground">
        <span className="mt-0.5 flex-shrink-0">{icon}</span>
        {item}
      </li>
    );
  }
  return (
    <li className="flex items-start gap-2 text-sm text-foreground">
      <span className="mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <p>{item.text}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Under: <span className="font-medium text-foreground/80">{item.regulationTitle}</span>
          {item.matchedIngredient && (
            <> · Ingredient: <span className="font-medium text-foreground/80">{item.matchedIngredient}</span></>
          )}
          {item.authority && <> · {item.authority}</>}
        </p>
      </div>
    </li>
  );
}

export function AssessmentResultClient({ assessment }: AssessmentResultClientProps) {
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"results" | "documents" | "warnings" | "remediation">("results");

  const toggleProduct = (id: string) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Aggregate all required docs across results (dedupe by text, not identity —
  // these are now { text, regulationTitle, matchedIngredient? } objects)
  const allDocs = dedupeByText(assessment.results.flatMap((r: any) => r.requiredDocs));
  const allCerts = dedupeByText(assessment.results.flatMap((r: any) => r.certificates));
  const allLabel = dedupeByText(assessment.results.flatMap((r: any) => r.labelRequirements));
  const allCustoms = dedupeByText(assessment.results.flatMap((r: any) => r.customsNotes));
  const allRecs = [...new Set(assessment.results.flatMap((r: any) => r.recommendations))];
  const allRemediation = assessment.results.flatMap((r: any) => r.resolutionChecklist || []);

  const handleDownloadPDF = () => {
    toast.info("Opening PDF report…");
    window.open(`/api/reports/${assessment.id}/pdf`, '_blank');
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-5xl mx-auto space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/reports">
            <button className="p-2 rounded-xl border border-border hover:bg-secondary transition-colors text-muted-foreground flex-shrink-0">
              <ArrowLeft size={16} />
            </button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-foreground truncate">
              {assessment.title || `Assessment to ${assessment.destination?.name}`}
            </h1>
            <p className="text-sm text-muted-foreground">
              {formatDateTime(assessment.createdAt)} • {assessment.items?.length || 0} products
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyShareLink}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 py-2 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
          >
            <Share2 size={14} />
            Share
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Download size={14} />
            PDF Report
          </button>
        </div>
      </motion.div>

      {/* Score Overview */}
      <motion.div variants={itemVariants} className="glass-card p-6">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Gauge */}
          <div className="flex-shrink-0">
            <ComplianceGauge
              score={assessment.overallScore || 0}
              size={160}
            />
          </div>

          {/* Details */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-foreground">Compliance Report</h2>
              {assessment.riskLevel && (
                <RiskBadge level={assessment.riskLevel} size="lg" pulse={assessment.riskLevel === "RED"} />
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  icon: <Globe size={16} className="text-blue-400" />,
                  label: "Destination",
                  value: `${assessment.destination?.flag || ""} ${assessment.destination?.name}`,
                },
                {
                  icon: <Package size={16} className="text-purple-400" />,
                  label: "Products",
                  value: `${assessment.items?.length || 0} items`,
                },
                {
                  icon: <FileText size={16} className="text-amber-400" />,
                  label: "Documents",
                  value: `${allDocs.length} required`,
                },
                {
                  icon: <Calendar size={16} className="text-muted-foreground" />,
                  label: "Analyzed",
                  value: assessment.analyzedAt ? formatDate(assessment.analyzedAt) : "—",
                },
              ].map((item, i) => (
                <div key={i} className="p-3 rounded-xl bg-secondary/50 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    {item.icon}
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                {assessment.results.filter((r: any) => r.riskLevel === "GREEN").length} Compliant
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                {assessment.results.filter((r: any) => r.riskLevel === "YELLOW").length} Conditional
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                {assessment.results.filter((r: any) => r.riskLevel === "RED").length} Restricted
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <AlertTriangle size={12} className="text-amber-400" />
                {assessment.warnings.length} warnings
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div variants={itemVariants} className="flex border-b border-border gap-1 overflow-x-auto">
        {[
          { id: "results", label: "Product Results", count: assessment.results.length },
          { id: "documents", label: "Documents & Certs", count: allDocs.length + allCerts.length },
          { id: "warnings", label: "Warnings", count: assessment.warnings.length },
          { id: "remediation", label: "Remediation Plan", count: allRemediation.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex-shrink-0 whitespace-nowrap ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === tab.id ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </motion.div>

      {/* Tab Content */}
      {activeTab === "results" && (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3">
          {assessment.results.map((result: any) => (
            <motion.div key={result.id} variants={itemVariants} className="glass-card overflow-hidden">
              {/* Product Header */}
              <button
                onClick={() => toggleProduct(result.id)}
                className="w-full flex items-center gap-4 p-4 hover:bg-secondary/20 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                  <Package size={18} className="text-muted-foreground" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold text-foreground">{result.product?.name}</p>
                  <p className="text-xs text-muted-foreground">{result.product?.category?.name || "Uncategorized"}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-lg font-bold text-foreground">{result.score}</p>
                    <p className="text-xs text-muted-foreground">/ 100</p>
                  </div>
                  <RiskBadge level={result.riskLevel} />
                  {expandedProducts.has(result.id) ? (
                    <ChevronUp size={16} className="text-muted-foreground" />
                  ) : (
                    <ChevronDown size={16} className="text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Expanded Details */}
              {expandedProducts.has(result.id) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="border-t border-border p-4 space-y-4"
                >
                  {result.decisionExplanation?.evaluations?.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Rule Evaluations
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        {result.decisionExplanation.evaluations.map((ev: any, i: number) => (
                          <div key={i} className={`p-3 rounded-lg border flex items-start gap-3 ${ev.rulePassed ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                            {ev.rulePassed ? (
                              <CheckCircle size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                            ) : (
                              <XCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                            )}
                            <div>
                              <p className="text-sm font-medium text-foreground">{ev.regulationTitle}</p>
                              {!ev.rulePassed && ev.failureReason && (
                                <p className="text-sm text-red-400 font-medium mt-1">{ev.failureReason}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {ev.category} • {ev.evidence?.authority}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.warnings.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Warnings
                      </h4>
                      {result.warnings.map((w: any) => (
                        <WarningCard
                          key={w.id}
                          severity={w.severity}
                          title={w.title}
                          description={w.description}
                          remediation={w.remediation}
                        />
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {result.requiredDocs.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          Required Documents
                        </h4>
                        <ul className="space-y-2">
                          {result.requiredDocs.map((doc: any, i: number) => (
                            <RequirementItem key={i} item={doc} icon={<CheckCircle size={13} className="text-emerald-600" />} />
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.certificates.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          Certificates
                        </h4>
                        <ul className="space-y-2">
                          {result.certificates.map((cert: any, i: number) => (
                            <RequirementItem key={i} item={cert} icon={<Tag size={13} className="text-blue-600" />} />
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.labelRequirements.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          Label Requirements
                        </h4>
                        <ul className="space-y-2">
                          {result.labelRequirements.map((req: any, i: number) => (
                            <RequirementItem key={i} item={req} icon={<FileText size={13} className="text-purple-600" />} />
                          ))}
                        </ul>
                      </div>
                    )}

                    {(result.packagingNotes?.length > 0 || result.customsNotes?.length > 0) && (
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          Packaging &amp; Customs Notes
                        </h4>
                        <ul className="space-y-2">
                          {(result.packagingNotes || []).map((note: any, i: number) => (
                            <RequirementItem key={`pkg-${i}`} item={note} icon={<Package size={13} className="text-amber-600" />} />
                          ))}
                          {(result.customsNotes || []).map((note: any, i: number) => (
                            <RequirementItem key={`cust-${i}`} item={note} icon={<Globe size={13} className="text-amber-600" />} />
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.recommendations.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          Recommendations
                        </h4>
                        <ul className="space-y-1.5">
                          {result.recommendations.map((rec: string, i: number) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}

          {assessment.results.length === 0 && (
            <div className="glass-card p-12 text-center text-muted-foreground">
              <Package size={32} className="mx-auto mb-3 opacity-30" />
              <p>No compliance results available</p>
            </div>
          )}
        </motion.div>
      )}

      {activeTab === "documents" && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* Required Documents */}
          <motion.div variants={itemVariants} className="glass-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <FileText size={16} className="text-blue-600" />
              Required Documents ({allDocs.length})
            </h3>
            <div className="space-y-2">
              {allDocs.map((doc: any, i: number) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-secondary/50">
                  <CheckCircle size={14} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-foreground">{doc.text || doc}</p>
                    {doc.regulationTitle && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Under: <span className="font-medium text-foreground/80">{doc.regulationTitle}</span>
                        {doc.matchedIngredient && <> · Ingredient: <span className="font-medium text-foreground/80">{doc.matchedIngredient}</span></>}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {allDocs.length === 0 && (
                <p className="text-sm text-muted-foreground">No additional documents required</p>
              )}
            </div>
          </motion.div>

          {/* Certificates */}
          <motion.div variants={itemVariants} className="glass-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Tag size={16} className="text-purple-600" />
              Certificates Required ({allCerts.length})
            </h3>
            <div className="space-y-2">
              {allCerts.map((cert: any, i: number) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-secondary/50">
                  <div className="w-5 h-5 rounded-full bg-purple-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Tag size={10} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-foreground">{cert.text || cert}</p>
                    {cert.regulationTitle && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Under: <span className="font-medium text-foreground/80">{cert.regulationTitle}</span>
                        {cert.authority && <> · {cert.authority}</>}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {allCerts.length === 0 && (
                <p className="text-sm text-muted-foreground">No special certificates required</p>
              )}
            </div>
          </motion.div>

          {/* Label Requirements */}
          <motion.div variants={itemVariants} className="glass-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Tag size={16} className="text-amber-600" />
              Label Requirements ({allLabel.length})
            </h3>
            <div className="space-y-2">
              {allLabel.map((req: any, i: number) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-secondary/50">
                  <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-foreground">{req.text || req}</p>
                    {req.regulationTitle && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Under: <span className="font-medium text-foreground/80">{req.regulationTitle}</span>
                        {req.matchedIngredient && <> · {req.matchedIngredient}</>}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {allLabel.length === 0 && (
                <p className="text-sm text-muted-foreground">No specific label requirements</p>
              )}
            </div>
          </motion.div>

          {/* Packaging & Customs Notes */}
          <motion.div variants={itemVariants} className="glass-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Package size={16} className="text-orange-600" />
              Packaging &amp; Customs Notes ({allCustoms.length})
            </h3>
            <div className="space-y-2">
              {allCustoms.map((note: any, i: number) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-secondary/50">
                  <Package size={14} className="text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-foreground">{note.text || note}</p>
                    {note.regulationTitle && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Under: <span className="font-medium text-foreground/80">{note.regulationTitle}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {allCustoms.length === 0 && (
                <p className="text-sm text-muted-foreground">No packaging or customs notes</p>
              )}
            </div>
          </motion.div>

          {/* Recommendations */}
          <motion.div variants={itemVariants} className="glass-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Expert Recommendations ({allRecs.length})
            </h3>
            <div className="space-y-2">
              {allRecs.map((rec, i) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-2" />
                  <span className="text-sm text-foreground">{rec as string}</span>
                </div>
              ))}
              {allRecs.length === 0 && (
                <p className="text-sm text-muted-foreground">No recommendations</p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {activeTab === "warnings" && (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3">
          {assessment.warnings.length === 0 ? (
            <motion.div variants={itemVariants} className="glass-card p-12 text-center">
              <CheckCircle size={40} className="mx-auto mb-3 text-emerald-400" />
              <p className="text-sm font-medium text-foreground">No warnings detected</p>
              <p className="text-xs text-muted-foreground mt-1">
                This shipment has no significant compliance warnings
              </p>
            </motion.div>
          ) : (
            assessment.warnings.map((w: any) => (
              <motion.div key={w.id} variants={itemVariants}>
                <WarningCard
                  severity={w.severity}
                  title={w.title}
                  description={w.description}
                  remediation={w.remediation}
                />
              </motion.div>
            ))
          )}
        </motion.div>
      )}

      {activeTab === "remediation" && (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3">
          {allRemediation.length === 0 ? (
            <motion.div variants={itemVariants} className="glass-card p-12 text-center">
              <CheckCircle size={40} className="mx-auto mb-3 text-emerald-400" />
              <p className="text-sm font-medium text-foreground">No remediation required</p>
            </motion.div>
          ) : (
            allRemediation.map((action: any, i: number) => (
              <motion.div key={i} variants={itemVariants} className="glass-card p-5 border-l-4 border-amber-400">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{action.task}</h3>
                    <p className="text-xs text-muted-foreground mt-1">Ref: {action.relatedRegulation}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-xs bg-secondary px-2 py-1 rounded-md text-foreground">Priority: {action.priority}</span>
                      <span className="text-xs bg-secondary px-2 py-1 rounded-md text-foreground">Time: {action.estimatedDays} days</span>
                      <span className="text-xs bg-secondary px-2 py-1 rounded-md text-foreground">By: {action.responsibleParty}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      )}

      {/* AI Assistant Link */}
      <motion.div variants={itemVariants} className="glass-card p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <MessageSquare size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">AI Compliance Assistant</p>
            <p className="text-xs text-muted-foreground">
              Ask questions about this assessment, generate documents, or get expert guidance
            </p>
          </div>
        </div>
        <Link href={`/ai-assistant?assessmentId=${assessment.id}`}>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors whitespace-nowrap">
            <MessageSquare size={14} />
            Chat with AI
          </button>
        </Link>
      </motion.div>
    </motion.div>
  );
}
