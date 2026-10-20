import { ProductEvaluationResult } from "./rule-engine.service";

export interface GeneratedDocument {
  type: string;
  title: string;
  templateId: string;
  requiredFields: string[];
}

export class DocumentGeneratorService {
  public generateMissingDocuments(evaluation: ProductEvaluationResult): GeneratedDocument[] {
    const docs: GeneratedDocument[] = [];
    
    // Automatically generate templates for missing certificates/documents
    for (const evalResult of evaluation.evaluations) {
      if (!evalResult.rulePassed) {
        if (evalResult.category === "CERTIFICATION") {
          docs.push({
            type: "CERTIFICATE_REQUEST",
            title: `Request Template: ${evalResult.requirement || "Certificate"}`,
            templateId: `req_${evalResult.requirement?.replace(/\s+/g, "_").toLowerCase()}`,
            requiredFields: ["Exporter Name", "Product Details", "Destination Country"]
          });
        }
        if (evalResult.category === "DOCUMENTATION") {
          docs.push({
            type: "CUSTOMS_DOC",
            title: `Draft: ${evalResult.requirement || "Customs Document"}`,
            templateId: `doc_${evalResult.requirement?.replace(/\s+/g, "_").toLowerCase()}`,
            requiredFields: ["HS Code", "Net Weight", "Value"]
          });
        }
      }
    }

    return docs;
  }
}
