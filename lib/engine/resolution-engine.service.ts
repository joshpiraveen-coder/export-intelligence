import { ProductEvaluationResult } from "./rule-engine.service";

export interface RemediationAction {
  id: string;
  task: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  estimatedDays: number;
  estimatedCostMin: number;
  estimatedCostMax: number;
  responsibleParty: "EXPORTER" | "MANUFACTURER" | "IMPORTER" | "GOVERNMENT";
  relatedRegulation: string;
  sourceUrl: string;
}

export interface ResolutionPlan {
  productId: string;
  actions: RemediationAction[];
  totalEstimatedDays: number;
  totalEstimatedCostMin: number;
  totalEstimatedCostMax: number;
}

export class ResolutionEngineService {
  public generateResolutionPlan(evaluation: ProductEvaluationResult): ResolutionPlan {
    const actions: RemediationAction[] = [];
    
    for (const evalResult of evaluation.evaluations) {
      if (!evalResult.rulePassed) {
        let priority: RemediationAction["priority"] = "LOW";
        if (evalResult.severity === "CRITICAL") priority = "CRITICAL";
        else if (evalResult.severity === "HIGH") priority = "HIGH";
        else if (evalResult.severity === "MEDIUM") priority = "MEDIUM";

        let estDays = 1;
        let costMin = 0;
        let costMax = 0;
        let party: RemediationAction["responsibleParty"] = "EXPORTER";

        if (evalResult.category === "CERTIFICATION") {
          estDays = 5;
          costMin = 100;
          costMax = 500;
          party = "GOVERNMENT";
        } else if (evalResult.category === "LABELING") {
          estDays = 2;
          costMin = 50;
          costMax = 200;
          party = "MANUFACTURER";
        }

        actions.push({
          id: Math.random().toString(36).substr(2, 9),
          task: `Resolve ${evalResult.category}: ${evalResult.failureReason || evalResult.requirement}`,
          priority,
          estimatedDays: estDays,
          estimatedCostMin: costMin,
          estimatedCostMax: costMax,
          responsibleParty: party,
          relatedRegulation: evalResult.regulationTitle,
          sourceUrl: evalResult.evidence.sourceUrl
        });
      }
    }

    // Sort by priority (CRITICAL -> HIGH -> MEDIUM -> LOW)
    const priorityWeights = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    actions.sort((a, b) => priorityWeights[b.priority] - priorityWeights[a.priority]);

    const totalEstimatedDays = actions.reduce((sum, a) => sum + a.estimatedDays, 0);
    const totalEstimatedCostMin = actions.reduce((sum, a) => sum + a.estimatedCostMin, 0);
    const totalEstimatedCostMax = actions.reduce((sum, a) => sum + a.estimatedCostMax, 0);

    return {
      productId: evaluation.productId,
      actions,
      totalEstimatedDays,
      totalEstimatedCostMin,
      totalEstimatedCostMax
    };
  }
}
