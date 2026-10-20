import { prisma } from "@/lib/db";
import { parseJsonSafe } from "@/lib/utils";

export interface AssessmentInput {
  assessmentId?: string;
  destinationCountryId: string;
  originCountryId?: string;
  products: Array<{
    productId: string;
    quantity: number;
  }>;
}

// Every requirement is traceable back to the specific law that produced it,
// and — when it was triggered by something in the product itself — the
// specific ingredient that matched.
export interface RequirementDetail {
  text: string;
  regulationTitle: string;
  authority?: string;
  severity: string;
  matchedIngredient?: string;
}

export interface ProductComplianceResult {
  productId: string;
  productName: string;
  score: number;
  riskLevel: "GREEN" | "YELLOW" | "RED";
  isAllowed: boolean;
  requiredDocs: RequirementDetail[];
  certificates: RequirementDetail[];
  labelRequirements: RequirementDetail[];
  packagingNotes: RequirementDetail[];
  customsNotes: RequirementDetail[];
  recommendations: string[];
  regulationRefs: string[];
  warnings: Array<{
    severity: string;
    title: string;
    description: string;
    remediation?: string;
    regulationTitle?: string;
    matchedIngredient?: string;
  }>;
}

export interface BundleComplianceResult {
  overallScore: number;
  overallRisk: "GREEN" | "YELLOW" | "RED";
  productResults: ProductComplianceResult[];
  combinedDocs: RequirementDetail[];
  combinedCertificates: RequirementDetail[];
  bundleWarnings: Array<{
    severity: string;
    title: string;
    description: string;
  }>;
  recommendations: string[];
}

/**
 * Core compliance analysis engine.
 * Analyzes products against destination country regulations.
 */
export async function analyzeCompliance(
  input: AssessmentInput
): Promise<BundleComplianceResult> {
  const { destinationCountryId, products } = input;

  // Fetch country with regulations, certificates, restrictions
  const country = await prisma.country.findUnique({
    where: { id: destinationCountryId },
    include: {
      regulations: { where: { isActive: true } },
      restrictions: true,
      certificates: {
        include: { certificate: true },
        where: { isMandatory: true },
      },
      tariffs: true,
    },
  });

  if (!country) throw new Error("Destination country not found");

  // Fetch all products with their details
  const productData = await Promise.all(
    products.map(async ({ productId, quantity }) => {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          category: true,
          productIngredients: { include: { ingredient: true } },
          allergens: true,
          restrictions: { where: { countryId: destinationCountryId } },
        },
      });
      return { product, quantity };
    })
  );

  // Analyze each product
  const productResults: ProductComplianceResult[] = [];

  for (const { product, quantity } of productData) {
    if (!product) continue;

    const result = analyzeProduct(product, country, quantity);
    productResults.push(result);
  }

  // Bundle-level analysis
  const bundleWarnings = detectBundleConflicts(productData.map((d) => d.product).filter(Boolean) as any[]);

  // Aggregate results
  const overallScore =
    productResults.length > 0
      ? Math.round(
          productResults.reduce((sum, r) => sum + r.score, 0) /
            productResults.length
        )
      : 100;

  const overallRisk = getOverallRisk(productResults.map((r) => r.riskLevel));

  // Combine unique docs and certificates (dedupe by text — each entry still
  // carries its own regulationTitle/matchedIngredient for traceability)
  const combinedDocs = dedupeByText(productResults.flatMap((r) => r.requiredDocs));
  const combinedCertificates = dedupeByText(productResults.flatMap((r) => r.certificates));

  const recommendations = generateBundleRecommendations(
    productResults,
    country,
    overallScore
  );

  return {
    overallScore,
    overallRisk,
    productResults,
    combinedDocs,
    combinedCertificates,
    bundleWarnings,
    recommendations,
  };
}

// Deduction weight by regulation severity — used everywhere a regulation
// contributes to the score, so a CRITICAL rule always outweighs a MEDIUM one.
const SEVERITY_PENALTY: Record<string, number> = {
  CRITICAL: 15,
  HIGH: 7,
  MEDIUM: 3,
  LOW: 1,
  INFO: 0,
};

// Common English stopwords/regulatory boilerplate to exclude when scanning a
// regulation's free text for ingredient keywords — keeps the match focused on
// substantive terms (e.g. "alcohol", "sulphite") rather than generic prose.
const INGREDIENT_SCAN_STOPWORDS = new Set([
  "which", "their", "after", "before", "under", "other", "shall", "where",
  "these", "those", "approved", "permitted", "comply", "compliant",
  "standard", "standards", "regulation", "regulations", "additive",
  "additives", "level", "levels", "limit", "limits", "substance",
  "substances", "product", "products", "import", "imports", "imported",
  "country", "countries", "authority", "authorities", "certificate",
  "certification", "document", "documentation", "requirement", "requires",
  "required", "customs", "declare", "declared", "declaration", "quantity",
  "package", "packaging", "labeling", "labelling", "labels", "label",
]);

function extractSignificantWords(text: string): string[] {
  return (text.toLowerCase().match(/[a-z]{5,}/g) || []).filter(
    (w) => !INGREDIENT_SCAN_STOPWORDS.has(w)
  );
}

function categoryMatches(regulationCategory: string | null | undefined, productCategory: string): boolean {
  const normalized = (regulationCategory || "all").toLowerCase();
  return normalized === "all" || normalized === productCategory.toLowerCase();
}

function dedupeByText(items: RequirementDetail[]): RequirementDetail[] {
  const seen = new Map<string, RequirementDetail>();
  for (const item of items) {
    const key = item.text.toLowerCase();
    if (!seen.has(key)) seen.set(key, item);
  }
  return [...seen.values()];
}

function analyzeProduct(
  product: any,
  country: any,
  quantity: number
): ProductComplianceResult {
  let score = 100;
  const warnings: ProductComplianceResult["warnings"] = [];
  const requiredDocs: RequirementDetail[] = [];
  const certificates: RequirementDetail[] = [];
  const labelRequirements: RequirementDetail[] = [];
  const packagingNotes: RequirementDetail[] = [];
  const customsNotes: RequirementDetail[] = [];
  const recommendations: string[] = [];
  const regulationRefs: string[] = [];

  // Builds a requirement entry traced back to the regulation (law) that
  // produced it, and — when relevant — the specific ingredient that matched.
  const detailFrom = (text: string, regulation: any, matchedIngredient?: string): RequirementDetail => ({
    text,
    regulationTitle: regulation.title,
    authority: regulation.sourceAuthority || regulation.authority || undefined,
    severity: regulation.severity,
    matchedIngredient,
  });

  // Check product-level restrictions
  for (const restriction of product.restrictions || []) {
    if (restriction.riskLevel === "RED") {
      score -= 40;
      warnings.push({
        severity: "CRITICAL",
        title: "Import Restriction",
        description: restriction.reason,
        remediation: restriction.condition || "Contact authorities for special permits",
        regulationTitle: "Product-specific import restriction on file",
      });
    } else if (restriction.riskLevel === "YELLOW") {
      score -= 15;
      warnings.push({
        severity: "MEDIUM",
        title: "Conditional Import",
        description: restriction.reason,
        remediation: restriction.condition,
        regulationTitle: "Product-specific import restriction on file",
      });
      if (restriction.requiresPermit && restriction.permitAuthority) {
        requiredDocs.push({
          text: `Import permit from ${restriction.permitAuthority}`,
          regulationTitle: "Product-specific import restriction on file",
          severity: "MEDIUM",
        });
      }
    }
  }

  // Check regulations against product category — "all" (case-insensitive)
  // or an empty value always applies; otherwise the category must match.
  const productCategory = product.category?.slug || product.foodCategory || "";

  for (const regulation of country.regulations || []) {
    if (!categoryMatches(regulation.productCategory, productCategory)) continue;

    regulationRefs.push(regulation.title);
    const penalty = SEVERITY_PENALTY[regulation.severity] ?? SEVERITY_PENALTY.MEDIUM;

    switch (regulation.category) {
      case "DOCUMENTATION":
        if (regulation.requirement) {
          requiredDocs.push(detailFrom(regulation.requirement, regulation));
        }
        if (regulation.severity === "CRITICAL" || regulation.severity === "HIGH") {
          score -= penalty;
          warnings.push({
            severity: regulation.severity,
            title: `Documentation required: ${regulation.title}`,
            description: regulation.description,
            remediation: regulation.requirement,
            regulationTitle: regulation.title,
          });
        }
        break;

      case "FOOD_IMPORT":
        if (regulation.requirement) {
          requiredDocs.push(detailFrom(regulation.requirement, regulation));
        }
        if (regulation.severity === "CRITICAL" || regulation.severity === "HIGH") {
          score -= penalty;
          warnings.push({
            severity: regulation.severity,
            title: `Food import rule: ${regulation.title}`,
            description: regulation.description,
            remediation: regulation.requirement,
            regulationTitle: regulation.title,
          });
        }
        break;

      case "LABELING":
        if (regulation.requirement) {
          labelRequirements.push(detailFrom(regulation.requirement, regulation));
        }
        if (regulation.severity === "MEDIUM" || regulation.severity === "HIGH" || regulation.severity === "CRITICAL") {
          score -= penalty;
          warnings.push({
            severity: regulation.severity,
            title: `Labeling required: ${regulation.title}`,
            description: regulation.description,
            remediation: regulation.requirement,
            regulationTitle: regulation.title,
          });
        }
        break;

      case "CERTIFICATION":
        if (regulation.requirement) {
          certificates.push(detailFrom(regulation.requirement, regulation));
        }
        if (regulation.severity === "MEDIUM" || regulation.severity === "HIGH" || regulation.severity === "CRITICAL") {
          score -= penalty;
          warnings.push({
            severity: regulation.severity,
            title: `Certification required: ${regulation.title}`,
            description: regulation.description,
            remediation: regulation.requirement,
            regulationTitle: regulation.title,
          });
        }
        break;

      case "PACKAGING":
        if (regulation.requirement) {
          packagingNotes.push(detailFrom(regulation.requirement, regulation));
        }
        if (regulation.severity === "CRITICAL" || regulation.severity === "HIGH") {
          score -= penalty;
          warnings.push({
            severity: regulation.severity,
            title: `Packaging rule: ${regulation.title}`,
            description: regulation.description,
            remediation: regulation.requirement,
            regulationTitle: regulation.title,
          });
        }
        break;

      case "CUSTOMS":
      case "TARIFF":
        if (regulation.requirement) {
          customsNotes.push(detailFrom(regulation.requirement, regulation));
        }
        if (regulation.severity === "CRITICAL" || regulation.severity === "HIGH") {
          score -= penalty;
        }
        break;

      case "PHYTOSANITARY":
      case "ANIMAL_HEALTH":
        if (regulation.requirement) {
          requiredDocs.push(detailFrom(regulation.requirement, regulation));
        }
        score -= penalty;
        warnings.push({
          severity: regulation.severity,
          title: `${regulation.category === "PHYTOSANITARY" ? "Phytosanitary" : "Animal health"} rule: ${regulation.title}`,
          description: regulation.description,
          remediation: regulation.requirement,
          regulationTitle: regulation.title,
        });
        break;

      case "ORGANIC":
        if (!product.isOrganic) {
          if (regulation.requirement) certificates.push(detailFrom(regulation.requirement, regulation));
        }
        break;

      case "PROHIBITED": {
        // A blanket "isProhibition" regulation (e.g. "pork and alcohol
        // banned") should only penalize products that actually reference
        // the prohibited substance — not every product shipped to that
        // country regardless of ingredients.
        const ingredientsAndName = `${product.ingredients || ""} ${product.name || ""}`.toLowerCase();
        const prohibitedKeywords = extractSignificantWords(regulation.description);
        const matchedProhibited = prohibitedKeywords.find((kw) => ingredientsAndName.includes(kw));

        if (regulation.isProhibition && matchedProhibited) {
          score -= 60;
          warnings.push({
            severity: "CRITICAL",
            title: `Prohibited under: ${regulation.title}`,
            description: `Ingredients reference "${matchedProhibited}" — prohibited by ${country.name || "this destination"}'s "${regulation.title}" regulation: ${regulation.description}`,
            regulationTitle: regulation.title,
            matchedIngredient: matchedProhibited,
          });
        } else if (!regulation.isProhibition) {
          score -= penalty;
          warnings.push({
            severity: regulation.severity,
            title: regulation.title,
            description: regulation.description,
            remediation: regulation.requirement,
            regulationTitle: regulation.title,
          });
        }
        break;
      }

      case "RESTRICTED_INGREDIENTS": {
        // Prefer structured ingredient links if present, but fall back to the
        // free-text ingredients field — which is what real products actually
        // have populated — so this check isn't a no-op in practice.
        const structuredNames: string[] = (product.productIngredients || []).map(
          (pi: any) => pi.ingredient.name.toLowerCase()
        );
        const ingredientsText = (product.ingredients || "").toLowerCase();
        const regulationKeywords = extractSignificantWords(
          `${regulation.description} ${regulation.requirement || ""}`
        );
        const matchedKeyword = regulationKeywords.find(
          (kw) =>
            ingredientsText.includes(kw) ||
            structuredNames.some((n) => n.includes(kw) || kw.includes(n))
        );

        if (matchedKeyword) {
          score -= penalty;
          warnings.push({
            severity: regulation.severity,
            title: `Restricted ingredient under: ${regulation.title}`,
            description: `Ingredients reference "${matchedKeyword}" — flagged by ${country.name || "this destination"}'s "${regulation.title}" regulation: ${regulation.description}`,
            remediation: regulation.requirement,
            regulationTitle: regulation.title,
            matchedIngredient: matchedKeyword,
          });
        }
        break;
      }

      case "HALAL":
        if (!product.isHalal && (regulation.severity === "CRITICAL" || regulation.severity === "HIGH")) {
          score -= penalty;
          warnings.push({
            severity: regulation.severity,
            title: `Halal certification required: ${regulation.title}`,
            description: `Product is not marked Halal-certified. ${country.name || "This destination"}'s "${regulation.title}" regulation states: ${regulation.description}`,
            remediation: "Obtain Halal certification from an accredited body",
            regulationTitle: regulation.title,
          });
          certificates.push(detailFrom("Halal Certificate", regulation));
        }
        break;
    }
  }

  // Cross-check destination-mandatory certificates that weren't already
  // picked up by a specific CERTIFICATION regulation above.
  for (const cc of country.certificates || []) {
    if (!categoryMatches(cc.productCategory, productCategory)) continue;
    const alreadyCovered = certificates.some((c) =>
      c.text.toLowerCase().includes(cc.certificate.name.toLowerCase())
    );
    if (!alreadyCovered) {
      const scopeNote = cc.productCategory && cc.productCategory !== "all" ? ` for ${cc.productCategory} products` : " for all food products";
      certificates.push({
        text: cc.certificate.name,
        regulationTitle: `Mandatory certificate requirement (${country.name || "destination"})`,
        authority: cc.certificate.issuedBy || undefined,
        severity: "HIGH",
      });
      score -= SEVERITY_PENALTY.HIGH;
      warnings.push({
        severity: "HIGH",
        title: `Missing mandatory certificate: ${cc.certificate.name}`,
        description: `${country.name || "This destination"} requires a mandatory ${cc.certificate.name}${scopeNote}.`,
        remediation: cc.notes || `Obtain ${cc.certificate.name} from an accredited issuing body before shipment.`,
        regulationTitle: `Mandatory certificate requirement (${country.name || "destination"})`,
      });
    }
  }

  // Allergen checks
  if (product.allergens?.length > 0) {
    const allergenNames = product.allergens.map((a: any) => a.name).join(", ");
    labelRequirements.push({
      text: "Allergen declaration required on label",
      regulationTitle: "Mandatory allergen labeling",
      severity: "HIGH",
      matchedIngredient: allergenNames,
    });
    recommendations.push(`Declare allergens: ${allergenNames}`);
  }

  // Organic check
  if (product.isOrganic) {
    recommendations.push("Organic certification documentation may be required");
  }

  // HS Code check
  if (!product.hsCode) {
    score -= 5;
    warnings.push({
      severity: "LOW",
      title: "Missing HS Code",
      description: "No HS (Harmonized System) code assigned to this product",
      remediation: "Assign correct HS code for customs classification",
      regulationTitle: "Customs classification requirement",
    });
    customsNotes.push({
      text: "HS code classification required",
      regulationTitle: "Customs classification requirement",
      severity: "LOW",
    });
  }

  // Standard docs always needed
  const standardDoc = (text: string): RequirementDetail => ({
    text,
    regulationTitle: "Standard export documentation (all shipments)",
    severity: "INFO",
  });
  requiredDocs.push(standardDoc("Commercial Invoice"));
  requiredDocs.push(standardDoc("Packing List"));
  requiredDocs.push(standardDoc("Bill of Lading / Airway Bill"));

  if (product.countryOfOrigin) {
    requiredDocs.push(standardDoc("Certificate of Origin"));
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  const riskLevel: "GREEN" | "YELLOW" | "RED" =
    score >= 80 ? "GREEN" : score >= 50 ? "YELLOW" : "RED";

  const isAllowed = !warnings.some((w) => w.title.startsWith("Prohibited under:"));

  return {
    productId: product.id,
    productName: product.name,
    score,
    riskLevel,
    isAllowed,
    requiredDocs: dedupeByText(requiredDocs),
    certificates: dedupeByText(certificates),
    labelRequirements: dedupeByText(labelRequirements),
    packagingNotes: dedupeByText(packagingNotes),
    customsNotes: dedupeByText(customsNotes),
    recommendations: [...new Set(recommendations)],
    regulationRefs: [...new Set(regulationRefs)],
    warnings,
  };
}

function detectBundleConflicts(products: any[]): BundleComplianceResult["bundleWarnings"] {
  const warnings: BundleComplianceResult["bundleWarnings"] = [];

  const hasFreshFood = products.some(
    (p) => p?.foodCategory?.toLowerCase().includes("fresh")
  );
  const hasDryFood = products.some(
    (p) =>
      p?.foodCategory?.toLowerCase().includes("dry") ||
      p?.foodCategory?.toLowerCase().includes("spice")
  );
  const hasAnimalProducts = products.some(
    (p) =>
      p?.foodCategory?.toLowerCase().includes("fish") ||
      p?.foodCategory?.toLowerCase().includes("meat") ||
      p?.foodCategory?.toLowerCase().includes("dairy")
  );

  if (hasFreshFood && hasDryFood) {
    warnings.push({
      severity: "MEDIUM",
      title: "Mixed Storage Requirements",
      description:
        "Bundle contains fresh and dry products with different storage requirements",
    });
  }

  if (hasAnimalProducts) {
    warnings.push({
      severity: "HIGH",
      title: "Animal Products — Additional Inspection",
      description:
        "Animal-derived products in this bundle may require veterinary health certificate and additional customs inspection",
    });
  }

  if (products.length > 10) {
    warnings.push({
      severity: "LOW",
      title: "Large Bundle",
      description:
        "Large bundles with many SKUs may require itemised customs declaration",
    });
  }

  return warnings;
}

function getOverallRisk(
  risks: ("GREEN" | "YELLOW" | "RED")[]
): "GREEN" | "YELLOW" | "RED" {
  if (risks.includes("RED")) return "RED";
  if (risks.includes("YELLOW")) return "YELLOW";
  return "GREEN";
}

function generateBundleRecommendations(
  results: ProductComplianceResult[],
  country: any,
  score: number
): string[] {
  const recs: string[] = [];

  if (score < 60) {
    recs.push(
      "Consider consulting a licensed customs broker for this shipment"
    );
  }

  if (results.some((r) => !r.isAllowed)) {
    recs.push(
      "Remove prohibited products before proceeding with this shipment"
    );
  }

  const allCerts = dedupeByText(results.flatMap((r) => r.certificates));
  if (allCerts.length > 3) {
    recs.push(
      `Prepare ${allCerts.length} certificates in advance — this may take 2–4 weeks`
    );
  }

  recs.push(
    `Verify latest regulations with ${country.customsAuthority || "destination customs authority"} before shipping`
  );

  return recs;
}

/**
 * Save compliance results back to database.
 */
export async function saveComplianceResults(
  assessmentId: string,
  results: BundleComplianceResult
): Promise<void> {
  // Update assessment with overall score
  await prisma.exportAssessment.update({
    where: { id: assessmentId },
    data: {
      overallScore: results.overallScore,
      riskLevel: results.overallRisk,
      status: "COMPLETED",
      analyzedAt: new Date(),
    },
  });

  // Save per-product results
  for (const pr of results.productResults) {
    const saved = await prisma.complianceResult.create({
      data: {
        assessmentId,
        productId: pr.productId,
        score: pr.score,
        riskLevel: pr.riskLevel,
        isAllowed: pr.isAllowed,
        requiredDocs: JSON.stringify(pr.requiredDocs),
        certificates: JSON.stringify(pr.certificates),
        labelRequirements: JSON.stringify(pr.labelRequirements),
        packagingNotes: JSON.stringify(pr.packagingNotes),
        customsNotes: JSON.stringify(pr.customsNotes),
        recommendations: JSON.stringify(pr.recommendations),
        regulationRefs: JSON.stringify(pr.regulationRefs),
      },
    });

    // Save warnings
    for (const w of pr.warnings) {
      await prisma.complianceWarning.create({
        data: {
          assessmentId,
          resultId: saved.id,
          severity: w.severity as any,
          title: w.title,
          description: w.description,
          remediation: w.remediation,
        },
      });
    }
  }

  // Save bundle warnings
  for (const w of results.bundleWarnings) {
    await prisma.complianceWarning.create({
      data: {
        assessmentId,
        severity: w.severity as any,
        title: w.title,
        description: w.description,
      },
    });
  }

  // Log the generated compliance report as a Document, so it shows up on
  // the Documents page instead of only being reachable from the assessment.
  const assessment = await prisma.exportAssessment.findUnique({
    where: { id: assessmentId },
    include: { destination: { select: { name: true } } },
  });
  await prisma.document.create({
    data: {
      assessmentId,
      type: "COMPLIANCE_REPORT",
      title: assessment?.title || `Compliance Report — ${assessment?.destination?.name || "Export Assessment"}`,
      fileUrl: `/api/reports/${assessmentId}/pdf`,
      format: "html",
    },
  });
}
