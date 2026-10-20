import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { countryFlag, formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Globe, Shield, FileText, AlertTriangle, ClipboardCheck,
  Search, Landmark, ScrollText, Ban, Sparkles,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { ComplianceGauge } from "@/components/ui/compliance-gauge";

export default async function CountryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const country = await prisma.country.findUnique({
    where: { id: resolvedParams.id },
    include: {
      authorities: true,
      regulations: { where: { isActive: true }, orderBy: { severity: "desc" } },
      restrictions: { include: { product: true, ingredient: true } },
      certificates: { include: { certificate: true } },
      tariffs: { include: { hsCodeRef: true }, take: 10 },
    },
  });

  if (!country) notFound();

  // Previous / next country navigation (alphabetical, real data)
  const allCountries = await prisma.country.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  const currentIndex = allCountries.findIndex((c) => c.id === country.id);
  const prevCountry = currentIndex > 0 ? allCountries[currentIndex - 1] : null;
  const nextCountry = currentIndex >= 0 && currentIndex < allCountries.length - 1 ? allCountries[currentIndex + 1] : null;

  const regulationsByCategory = country.regulations.reduce((acc: any, reg) => {
    if (!acc[reg.category]) acc[reg.category] = [];
    acc[reg.category].push(reg);
    return acc;
  }, {});

  const customsRegs = country.regulations.filter((r) => r.category === "DOCUMENTATION" || r.category === "CUSTOMS");
  const prohibitedRegs = country.regulations.filter((r) => r.isProhibition || r.category === "PROHIBITED");
  const mandatoryCerts = country.certificates.filter((c) => c.isMandatory);

  // Data-driven regulatory complexity estimate (not a certification — an analytical estimate)
  let complexityScore = 100;
  for (const reg of country.regulations) {
    if (reg.severity === "CRITICAL") complexityScore -= 12;
    else if (reg.severity === "HIGH") complexityScore -= 6;
    else if (reg.severity === "MEDIUM") complexityScore -= 2;
  }
  for (const r of country.restrictions) {
    if (r.riskLevel === "RED") complexityScore -= 10;
    else if (r.riskLevel === "YELLOW") complexityScore -= 4;
  }
  complexityScore = Math.max(15, Math.min(100, complexityScore));

  const dutyValues = country.tariffs.map((t) => t.importDuty).filter((v): v is number => v != null);
  const summaryBullets: string[] = [
    `${country.regulations.length} active regulation${country.regulations.length === 1 ? "" : "s"} across ${Object.keys(regulationsByCategory).length} categories`,
    mandatoryCerts.length > 0
      ? `${mandatoryCerts.length} mandatory certificate${mandatoryCerts.length === 1 ? "" : "s"} required for export`
      : "No mandatory certificates on file for this destination",
    country.restrictions.length > 0
      ? `${country.restrictions.length} product-specific import restriction${country.restrictions.length === 1 ? "" : "s"} on record`
      : "No product-specific restrictions on file",
  ];
  if (dutyValues.length > 0) {
    summaryBullets.push(`Import duty rates range from ${Math.min(...dutyValues)}% to ${Math.max(...dutyValues)}% depending on HS code`);
  }
  if (country.regulations.some((r) => r.category === "HALAL")) {
    summaryBullets.push("Halal certification applies to relevant product categories");
  }
  if (prohibitedRegs.length > 0) {
    summaryBullets.push(`${prohibitedRegs.length} explicit prohibition rule${prohibitedRegs.length === 1 ? "" : "s"} — review before shipping`);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Editorial hero banner */}
      <div
        className="relative rounded-2xl overflow-hidden p-8 sm:p-10"
        style={{ background: "linear-gradient(135deg, hsl(var(--luxury-navy)) 0%, #4a3a1e 55%, hsl(var(--primary)) 130%)" }}
      >
        <div className="absolute inset-0 flex items-end opacity-20 pointer-events-none">
          {[38, 58, 44, 72, 50, 64, 40, 55, 48].map((h, i) => (
            <div key={i} className="flex-1 bg-white/40" style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="relative">
          <p className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2">Country Analysis</p>
          <h1 className="text-3xl sm:text-5xl font-bold text-white" style={{ fontFamily: "var(--font-playfair), serif" }}>
            {country.name}
          </h1>
          <p className="text-white/70 text-sm mt-2">Premium export intelligence for global compliance</p>
        </div>
      </div>

      {/* Floating country selector card */}
      <div className="glass-card p-4 flex flex-col sm:flex-row sm:items-center gap-4 -mt-10 relative z-10 mx-2 sm:mx-6">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="text-4xl flex-shrink-0">{country.flag || countryFlag(country.isoCode)}</div>
          <div className="min-w-0">
            <p className="text-lg font-bold text-foreground truncate" style={{ fontFamily: "var(--font-playfair), serif" }}>
              {country.name}
            </p>
            <p className="text-xs text-muted-foreground">
              Analysis for Jaffna Basket exports to {country.name} (as of {formatDate(new Date())})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href="/countries">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
              Change Country
            </button>
          </Link>
          <Link href="/countries">
            <button className="p-2.5 rounded-xl border border-border hover:bg-secondary transition-colors text-muted-foreground">
              <Search size={16} />
            </button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* 3-card summary grid */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card p-5">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center mb-3">
              <Landmark size={18} className="text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2" style={{ fontFamily: "var(--font-playfair), serif" }}>
              Tariffs &amp; Duties
            </h3>
            {country.tariffs.length > 0 ? (
              <ul className="space-y-2">
                {country.tariffs.slice(0, 4).map((t) => (
                  <li key={t.id} className="text-xs text-muted-foreground border-t border-border pt-2 first:border-t-0 first:pt-0">
                    <span className="font-mono text-foreground">{t.hsCodeRef?.code || t.hsCode}</span>
                    {t.importDuty != null && <> · Duty {t.importDuty}%</>}
                    {t.vat != null && <> · VAT {t.vat}%</>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">No tariff schedule on file yet — verify with {country.customsAuthority || "the destination customs authority"}.</p>
            )}
          </div>

          <div className="glass-card p-5">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center mb-3">
              <ScrollText size={18} className="text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2" style={{ fontFamily: "var(--font-playfair), serif" }}>
              Customs Regulations
            </h3>
            {customsRegs.length > 0 ? (
              <ul className="space-y-2">
                {customsRegs.slice(0, 4).map((r) => (
                  <li key={r.id} className="text-xs text-muted-foreground border-t border-border pt-2 first:border-t-0 first:pt-0">
                    {r.requirement || r.title}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">No specific documentation rules on file — standard customs documentation applies.</p>
            )}
          </div>

          <div className="glass-card p-5">
            <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center mb-3">
              <Ban size={18} className="text-red-700" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2" style={{ fontFamily: "var(--font-playfair), serif" }}>
              Prohibited Items
            </h3>
            {prohibitedRegs.length > 0 || country.prohibitedItems ? (
              <ul className="space-y-2">
                {prohibitedRegs.slice(0, 3).map((r) => (
                  <li key={r.id} className="text-xs text-muted-foreground border-t border-border pt-2 first:border-t-0 first:pt-0">
                    {r.title}
                  </li>
                ))}
                {country.prohibitedItems && (
                  <li className="text-xs text-muted-foreground border-t border-border pt-2 first:border-t-0 first:pt-0">
                    {country.prohibitedItems}
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">No blanket prohibitions on file for this destination.</p>
            )}
          </div>
        </div>

        {/* AI sidebar */}
        <div className="glass-card p-5 flex flex-col">
          <h3 className="text-sm font-semibold text-foreground text-center mb-1">AI Compliance Score</h3>
          <p className="text-[11px] text-muted-foreground text-center mb-3">Estimated regulatory complexity</p>
          <div className="flex justify-center mb-4">
            <ComplianceGauge score={complexityScore} size={130} />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={13} className="text-primary" />
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">AI Analysis Summary</h4>
          </div>
          <ul className="space-y-1.5 flex-1 mb-4">
            {summaryBullets.map((b, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                <span className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                {b}
              </li>
            ))}
          </ul>
          <Link href="/assessment/new">
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
              <ClipboardCheck size={14} />
              Start Export Assessment
            </button>
          </Link>
        </div>
      </div>

      {/* Authorities */}
      {(country.customsAuthority || country.foodAuthority || country.importAuthority) && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Regulatory Authorities</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {country.customsAuthority && (
              <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground">Customs Authority</p>
                <p className="text-sm font-medium text-foreground mt-1">{country.customsAuthority}</p>
              </div>
            )}
            {country.foodAuthority && (
              <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground">Food Safety Authority</p>
                <p className="text-sm font-medium text-foreground mt-1">{country.foodAuthority}</p>
              </div>
            )}
            {country.importAuthority && (
              <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground">Import Authority</p>
                <p className="text-sm font-medium text-foreground mt-1">{country.importAuthority}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Regulations by Category (full detail) */}
      {Object.entries(regulationsByCategory).map(([category, regs]: [string, any]) => (
        <div key={category} className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            {category.replace(/_/g, " ")}
            <span className="text-xs font-normal text-muted-foreground ml-2">({(regs as any[]).length})</span>
          </h3>
          <div className="space-y-3">
            {(regs as any[]).map((reg: any) => (
              <div key={reg.id} className="p-3 rounded-xl bg-secondary/40 border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                    reg.severity === "CRITICAL" ? "bg-red-500/15 text-red-700" :
                    reg.severity === "HIGH" ? "bg-orange-500/15 text-orange-700" :
                    reg.severity === "MEDIUM" ? "bg-amber-500/15 text-amber-700" :
                    "bg-blue-500/15 text-blue-700"
                  }`}>
                    {reg.severity}
                  </span>
                  <p className="text-sm font-medium text-foreground">{reg.title}</p>
                </div>
                <p className="text-xs text-muted-foreground">{reg.description}</p>
                {reg.requirement && (
                  <p className="text-xs text-foreground/70 mt-1.5 bg-background/50 px-2 py-1 rounded border border-border">
                    <strong>Required:</strong> {reg.requirement}
                  </p>
                )}
                {reg.sourceUrl ? (
                  <a
                    href={reg.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-primary hover:underline mt-1.5 inline-flex items-center gap-1"
                  >
                    Source: {reg.sourceAuthority || "View official source"} ↗
                  </a>
                ) : reg.sourceAuthority ? (
                  <p className="text-[11px] text-muted-foreground mt-1.5">Source: {reg.sourceAuthority}</p>
                ) : (
                  <p className="text-[11px] text-amber-700 mt-1.5">⚠ Unverified — no cited source on file</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Certificates Required */}
      {country.certificates.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Required Certificates</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {country.certificates.map((cc) => (
              <div key={cc.id} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/40 border border-border">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  cc.isMandatory ? "bg-primary/15" : "bg-blue-500/15"
                }`}>
                  <FileText size={14} className={cc.isMandatory ? "text-primary" : "text-blue-700"} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{cc.certificate.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {cc.isMandatory ? "Mandatory" : "Optional"}
                    {cc.productCategory && ` • ${cc.productCategory}`}
                  </p>
                  {cc.notes && <p className="text-xs text-muted-foreground mt-1">{cc.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Import Notes */}
      {country.importNotes && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Import Notes</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{country.importNotes}</p>
        </div>
      )}

      {/* Editorial prev/next footer */}
      <div className="flex items-center justify-between px-2 py-4 border-t border-border">
        {prevCountry ? (
          <Link href={`/countries/${prevCountry.id}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft size={14} />
            <span style={{ fontFamily: "var(--font-playfair), serif" }}>{prevCountry.name}</span>
          </Link>
        ) : <span />}
        {nextCountry ? (
          <Link href={`/countries/${nextCountry.id}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            <span style={{ fontFamily: "var(--font-playfair), serif" }}>{nextCountry.name}</span>
            <ArrowRight size={14} />
          </Link>
        ) : <span />}
      </div>
    </div>
  );
}
