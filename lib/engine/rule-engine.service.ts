import { RegulationData, CountryRegulations } from "./regulation-provider.interface";
import { Product, ProductIngredient, Ingredient } from "@prisma/client";

export interface EvaluationEvidence {
  authority: string;
  documentTitle: string;
  sourceUrl: string;
  version: string;
  confidence: number;
}

export interface RuleEvaluationResult {
  rulePassed: boolean;
  regulationTitle: string;
  category: string;
  severity: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  evidence: EvaluationEvidence;
  requirement?: string;
  failureReason?: string;
}

export interface ProductEvaluationResult {
  productId: string;
  status: "ALLOWED" | "ALLOWED_WITH_CONDITIONS" | "RESTRICTED" | "PROHIBITED" | "MANUAL_REVIEW_REQUIRED";
  score: number; // 0-100 compliance readiness
  evaluations: RuleEvaluationResult[];
  labelReadiness: number;
  packagingReadiness: number;
  documentReadiness: number;
}

export class RuleEngineService {
  
  public evaluateProduct(
    product: Product & { productIngredients?: (ProductIngredient & { ingredient: Ingredient })[] },
    regulations: CountryRegulations
  ): ProductEvaluationResult {
    const evals: RuleEvaluationResult[] = [];
    let score = 100;
    
    // 1. Country & General Prohibitions
    const prohibitions = regulations.regulations.filter(r => r.isProhibition);
    for (const prob of prohibitions) {
      if (prob.productCategory === "all" || prob.productCategory === product.foodCategory) {
        evals.push(this.mapEvaluation(prob, false, prob.description));
        return {
          productId: product.id,
          status: "PROHIBITED",
          score: 0,
          labelReadiness: 0,
          packagingReadiness: 0,
          documentReadiness: 0,
          evaluations: evals
        };
      }
    }

    // 2. Product Category Rules
    const categoryRules = regulations.regulations.filter(r => r.productCategory === product.foodCategory || r.productCategory === "all");
    
    for (const rule of categoryRules) {
      // Evaluate based on category
      let passed = true;
      let failureReason = "";

      if (rule.category === "LABELING") {
        // Label checks (simulated deterministic check)
        // If product doesn't have nutrition info but rule requires it
        if (rule.title.includes("Nutrition") && !product.nutritionInfo) {
          passed = false;
          failureReason = "Missing mandatory nutrition panel.";
        }
      }

      if (rule.category === "CERTIFICATION") {
        if (!product.isOrganic && rule.title.includes("Organic")) {
           // just an info/skip if it doesn't apply, but if mandatory:
           if (rule.severity === "CRITICAL") {
             passed = false;
             failureReason = "Mandatory organic certification missing.";
           }
        } else {
           // Needs certificate
           passed = false;
           failureReason = `Missing ${rule.requirement}`;
        }
      }

      if (rule.category === "DOCUMENTATION") {
         passed = false; // Initially assume documents aren't generated yet
         failureReason = `Required document: ${rule.requirement}`;
      }
      
      evals.push(this.mapEvaluation(rule, passed, passed ? undefined : failureReason));
      
      if (!passed) {
        if (rule.severity === "CRITICAL") score -= 30;
        else if (rule.severity === "HIGH") score -= 15;
        else if (rule.severity === "MEDIUM") score -= 5;
      }
    }

    // 3. Ingredient Level Analysis
    // (mock implementation of ingredient checks against restricted lists)
    if (product.productIngredients) {
      for (const pi of product.productIngredients) {
        const ingReg = regulations.regulations.find(r => r.category === "RESTRICTED_INGREDIENTS" && r.description.toLowerCase().includes(pi.ingredient.name.toLowerCase()));
        if (ingReg) {
          evals.push(this.mapEvaluation(ingReg, false, `Ingredient ${pi.ingredient.name} is restricted: ${ingReg.requirement}`));
          score -= (ingReg.severity === "CRITICAL" ? 40 : 20);
        }
      }
    }

    // Clamp score
    score = Math.max(0, Math.min(100, score));
    
    const labelEvals = evals.filter(e => e.category === "LABELING");
    const labelReadiness = labelEvals.length === 0 ? 100 : Math.round((labelEvals.filter(e => e.rulePassed).length / labelEvals.length) * 100);

    const docEvals = evals.filter(e => e.category === "DOCUMENTATION" || e.category === "CERTIFICATION");
    const documentReadiness = docEvals.length === 0 ? 100 : Math.round((docEvals.filter(e => e.rulePassed).length / docEvals.length) * 100);

    const pkgEvals = evals.filter(e => e.category === "PACKAGING");
    const packagingReadiness = pkgEvals.length === 0 ? 100 : Math.round((pkgEvals.filter(e => e.rulePassed).length / pkgEvals.length) * 100);

    let status: ProductEvaluationResult["status"] = "ALLOWED";
    if (score < 50) status = "RESTRICTED";
    else if (score < 100) status = "ALLOWED_WITH_CONDITIONS";

    return {
      productId: product.id,
      status,
      score,
      evaluations: evals,
      labelReadiness,
      packagingReadiness,
      documentReadiness
    };
  }

  private mapEvaluation(rule: RegulationData, passed: boolean, failureReason?: string): RuleEvaluationResult {
    return {
      rulePassed: passed,
      regulationTitle: rule.title,
      category: rule.category,
      severity: rule.severity,
      requirement: rule.requirement,
      failureReason,
      evidence: {
        authority: rule.authority || "Unknown Authority",
        documentTitle: rule.title,
        sourceUrl: rule.sourceUrl || "#",
        version: rule.version,
        confidence: rule.confidence
      }
    };
  }
}
