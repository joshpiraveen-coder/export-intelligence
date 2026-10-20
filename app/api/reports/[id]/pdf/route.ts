import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseJsonSafe, formatDate, formatDateTime } from "@/lib/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const assessment = await prisma.exportAssessment.findUnique({
    where: { id: resolvedParams.id },
    include: {
      destination: true,
      origin: true,
      user: { select: { name: true, email: true } },
      company: true,
      results: {
        include: {
          product: { include: { category: true } },
          warnings: true,
        },
      },
      warnings: true,
      items: true,
    },
  });

  if (!assessment) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  // Generate simple HTML report (converted to PDF in browser via print)
  // For server-side PDF we use a simple structured HTML response
  const html = generateReportHTML(assessment);

  return new Response(html, {
    headers: {
      "Content-Type": "text/html",
      "Content-Disposition": `attachment; filename="compliance-report-${assessment.id.slice(0, 8)}.html"`,
    },
  });
}

// Renders one requirement entry — plain string (legacy data) or a
// { text, regulationTitle, matchedIngredient?, authority? } detail object —
// with the source law and matched ingredient shown as a sub-line.
function detailItemHTML(item: any): string {
  if (typeof item === "string") return item;
  const meta: string[] = [];
  if (item.regulationTitle) meta.push(`Under: <strong>${item.regulationTitle}</strong>`);
  if (item.matchedIngredient) meta.push(`Ingredient: <strong>${item.matchedIngredient}</strong>`);
  if (item.authority) meta.push(item.authority);
  return `${item.text}${meta.length > 0 ? `<div style="font-size:11px;color:#64748b;margin-top:2px;">${meta.join(" · ")}</div>` : ""}`;
}

function generateReportHTML(assessment: any): string {
  const results = assessment.results.map((r: any) => ({
    ...r,
    requiredDocs: parseJsonSafe<any[]>(r.requiredDocs, []),
    certificates: parseJsonSafe<any[]>(r.certificates, []),
    labelRequirements: parseJsonSafe<any[]>(r.labelRequirements, []),
    packagingNotes: parseJsonSafe<any[]>(r.packagingNotes, []),
    customsNotes: parseJsonSafe<any[]>(r.customsNotes, []),
    recommendations: parseJsonSafe<string[]>(r.recommendations, []),
    decisionExplanation: parseJsonSafe<any>(r.decisionExplanation, {}),
    resolutionChecklist: parseJsonSafe<any[]>(r.resolutionChecklist, []),
  }));

  const riskColor = assessment.riskLevel === "GREEN" ? "#10b981" :
    assessment.riskLevel === "YELLOW" ? "#f59e0b" : "#ef4444";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Detailed Compliance Report - ${assessment.destination?.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', Arial, sans-serif; background: #fff; color: #1e293b; font-size: 13px; line-height: 1.5; }
    .header { background: linear-gradient(135deg, #0f172a, #1e1b4b); color: white; padding: 32px 40px; }
    .header h1 { font-size: 24px; font-weight: 700; margin-bottom: 6px; }
    .header p { color: rgba(255,255,255,0.8); font-size: 13px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .content { padding: 32px 40px; }
    .section { margin-bottom: 32px; }
    .section h2 { font-size: 16px; font-weight: 700; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.05em; }
    
    /* Overview Grid */
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
    .card .label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
    .card .value { font-size: 16px; font-weight: 700; color: #0f172a; }
    .score { font-size: 56px; font-weight: 800; color: ${riskColor}; line-height: 1; }
    
    /* Detailed Product Section */
    .product-block { border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 24px; overflow: hidden; page-break-inside: avoid; }
    .product-header { background: #f8fafc; padding: 16px 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .product-title { font-size: 18px; font-weight: 700; color: #0f172a; }
    .product-category { font-size: 12px; color: #64748b; margin-top: 4px; }
    .product-score { font-size: 20px; font-weight: 800; }
    
    .product-body { padding: 20px; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .detail-section h4 { font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
    .detail-section h4::before { content: ""; display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #3b82f6; }
    .detail-list { list-style: none; margin-bottom: 16px; }
    .detail-list li { padding: 6px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; padding-left: 20px; position: relative; }
    .detail-list li::before { content: "•"; color: #3b82f6; position: absolute; left: 6px; font-weight: bold; }
    
    /* Evaluations */
    .eval-box { background: #f8fafc; border-left: 3px solid #cbd5e1; padding: 10px 12px; margin-bottom: 8px; border-radius: 0 6px 6px 0; }
    .eval-box.pass { border-left-color: #10b981; background: #ecfdf5; }
    .eval-box.fail { border-left-color: #ef4444; background: #fef2f2; }
    .eval-title { font-weight: 600; font-size: 13px; color: #0f172a; margin-bottom: 4px; }
    .eval-reason { font-size: 12px; color: #b91c1c; font-weight: 500; }
    .eval-meta { font-size: 11px; color: #64748b; margin-top: 4px; }

    /* Colors */
    .risk-green { background: #d1fae5; color: #065f46; }
    .risk-yellow { background: #fef3c7; color: #92400e; }
    .risk-red { background: #fee2e2; color: #991b1b; }
    
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 40px; text-align: center; color: #94a3b8; font-size: 11px; margin-top: 40px; }
    
    @media print { 
      body { -webkit-print-color-adjust: exact; }
      .product-block { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <h1>🇱🇰 Jaffna Basket Export Intelligence</h1>
        <p>Comprehensive Export Compliance & Logistics Report</p>
      </div>
      <div style="text-align:right">
        <p style="font-size:12px;opacity:0.8">Generated: ${formatDateTime(new Date())}</p>
        <p style="font-size:12px;opacity:0.8">Report ID: ${assessment.id.slice(0, 12)}</p>
      </div>
    </div>
  </div>

  <div class="content">
    <!-- Executive Summary -->
    <div class="section">
      <h2>Executive Summary</h2>
      <div style="display:flex;align-items:center;gap:40px; margin-bottom: 24px;">
        <div style="text-align: center;">
          <div class="score">${assessment.overallScore ?? "—"}</div>
          <div style="color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-top:8px;">Readiness Score</div>
        </div>
        <div style="flex:1">
          <div class="grid">
            <div class="card"><div class="label">Destination</div><div class="value">${assessment.destination?.name}</div></div>
            <div class="card"><div class="label">Origin</div><div class="value">${assessment.origin?.name || "Sri Lanka"}</div></div>
            <div class="card"><div class="label">Total Products</div><div class="value">${assessment.items?.length || 0}</div></div>
            <div class="card"><div class="label">Overall Risk</div><div class="value" style="color:${riskColor}">${assessment.riskLevel || "N/A"}</div></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Detailed Product Analysis -->
    <div class="section">
      <h2>Detailed Product Analysis</h2>
      
      ${results.map((r: any) => `
      <div class="product-block">
        <div class="product-header">
          <div>
            <div class="product-title">${r.product?.name}</div>
            <div class="product-category">Category: ${r.product?.category?.name || "Uncategorized"} | HS Code: ${r.product?.hsCode || "N/A"}</div>
          </div>
          <div style="text-align: right;">
            <span class="badge risk-${r.riskLevel?.toLowerCase()}">${r.riskLevel} - ${r.isAllowed ? "Allowed" : "Restricted"}</span>
            <div class="product-score" style="color:${r.score >= 80 ? "#10b981" : r.score >= 50 ? "#f59e0b" : "#ef4444"}; margin-top: 6px;">
              ${r.score} / 100
            </div>
          </div>
        </div>
        
        <div class="product-body">
          <div class="detail-grid">
            <!-- Left Column: Logistics & Docs -->
            <div>
              ${r.requiredDocs.length > 0 || r.certificates.length > 0 ? `
              <div class="detail-section">
                <h4>Required Documentation</h4>
                <ul class="detail-list">
                  ${r.requiredDocs.map((d: any) => `<li>${detailItemHTML(d)}</li>`).join("")}
                  ${r.certificates.map((c: any) => `<li><strong>Certificate:</strong> ${detailItemHTML(c)}</li>`).join("")}
                </ul>
              </div>` : ''}

              ${r.packagingNotes.length > 0 ? `
              <div class="detail-section">
                <h4 style="color: #8b5cf6;"><span style="background:#8b5cf6;width:6px;height:6px;border-radius:50%;display:inline-block;"></span> Packaging & Shipping Instructions</h4>
                <ul class="detail-list">
                  ${r.packagingNotes.map((n: any) => `<li>${detailItemHTML(n)}</li>`).join("")}
                </ul>
              </div>` : ''}

              ${r.labelRequirements.length > 0 ? `
              <div class="detail-section">
                <h4 style="color: #f59e0b;"><span style="background:#f59e0b;width:6px;height:6px;border-radius:50%;display:inline-block;"></span> Labeling Requirements</h4>
                <ul class="detail-list">
                  ${r.labelRequirements.map((l: any) => `<li>${detailItemHTML(l)}</li>`).join("")}
                </ul>
              </div>` : ''}

              ${r.customsNotes.length > 0 ? `
              <div class="detail-section">
                <h4 style="color: #f97316;"><span style="background:#f97316;width:6px;height:6px;border-radius:50%;display:inline-block;"></span> Customs Notes</h4>
                <ul class="detail-list">
                  ${r.customsNotes.map((n: any) => `<li>${detailItemHTML(n)}</li>`).join("")}
                </ul>
              </div>` : ''}

              ${r.resolutionChecklist.length > 0 ? `
              <div class="detail-section">
                <h4 style="color: #ef4444;"><span style="background:#ef4444;width:6px;height:6px;border-radius:50%;display:inline-block;"></span> Remediation Action Plan</h4>
                <ul class="detail-list">
                  ${r.resolutionChecklist.map((act: any) => `<li><strong>${act.task}</strong> (Priority: ${act.priority})</li>`).join("")}
                </ul>
              </div>` : ''}
            </div>

            <!-- Right Column: Compliance Rule Evaluations -->
            <div>
              <div class="detail-section">
                <h4 style="color: #10b981;"><span style="background:#10b981;width:6px;height:6px;border-radius:50%;display:inline-block;"></span> Regulatory Analysis</h4>
                ${r.warnings?.length > 0 ? r.warnings.map((w: any) => `
                  <div class="eval-box fail">
                    <div class="eval-title">❌ ${w.title}</div>
                    <div class="eval-reason">${w.description}</div>
                    ${w.remediation ? `<div class="eval-meta">Remediation: ${w.remediation}</div>` : ''}
                    <div class="eval-meta">Severity: ${w.severity}</div>
                  </div>
                `).join("") : r.decisionExplanation?.evaluations ? r.decisionExplanation.evaluations.map((ev: any) => `
                  <div class="eval-box ${ev.rulePassed ? 'pass' : 'fail'}">
                    <div class="eval-title">${ev.rulePassed ? '✅' : '❌'} ${ev.regulationTitle}</div>
                    ${!ev.rulePassed && ev.failureReason ? `<div class="eval-reason">Reason: ${ev.failureReason}</div>` : ''}
                    <div class="eval-meta">Authority: ${ev.evidence?.authority || 'N/A'} | Category: ${ev.category}</div>
                  </div>
                `).join("") : '<div class="eval-box pass"><div class="eval-title">✅ No compliance issues detected</div></div>'}
              </div>
            </div>
          </div>
        </div>
      </div>
      `).join("")}
    </div>

    <!-- Disclaimer -->
    <div class="section" style="background:#f8fafc;border-radius:8px;padding:20px;border:1px solid #e2e8f0;margin-top:40px;">
      <h3 style="font-size:13px;color:#0f172a;margin-bottom:8px;">Important Disclaimer</h3>
      <p style="font-size:12px;color:#64748b;line-height:1.6;">
        This document is generated by the Jaffna Basket Export Intelligence engine. 
        The compliance rules, documentation requirements, and packaging guidelines are strictly based on our internal regulatory database 
        for <strong>${assessment.destination?.name}</strong>. Regulations are subject to change without prior notice. 
        This report is designed for logistical planning and does not constitute binding legal advice.
      </p>
    </div>
  </div>

  <div class="footer">
    <p>Jaffna Basket Export Intelligence Platform • Generated ${formatDateTime(new Date())}</p>
    <p style="margin-top:4px;">Authorized Export Compliance Document</p>
  </div>

  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;
}
