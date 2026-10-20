export interface ProductClassification {
  foodCategory: string;
  ingredients: string[];
  allergens: string[];
  hsCode: string;
  hsCodeConfidence: number;
  shelfLifeDays: number;
  packagingType: string;
}

export class ProductClassificationService {
  /**
   * Automatically classify product parameters from unstructured description
   * In a real implementation, this calls an LLM strictly for extraction.
   */
  async classifyProduct(name: string, description: string): Promise<ProductClassification> {
    // Simulated AI Extraction
    const isSpice = name.toLowerCase().includes("spice") || name.toLowerCase().includes("curry") || name.toLowerCase().includes("turmeric");
    const isFish = name.toLowerCase().includes("fish") || name.toLowerCase().includes("seafood");
    
    let hsCode = "0000.00";
    if (isSpice) hsCode = "0910.99"; // Spices
    if (isFish) hsCode = "0305.59"; // Dried fish

    return {
      foodCategory: isSpice ? "spice" : isFish ? "dry_seafood" : "general_food",
      ingredients: isSpice ? ["Coriander", "Cumin", "Turmeric", "Chili"] : isFish ? ["Fish", "Salt"] : [],
      allergens: isFish ? ["Fish"] : [],
      hsCode,
      hsCodeConfidence: 0.88,
      shelfLifeDays: isFish ? 180 : 365,
      packagingType: "sealed_plastic",
    };
  }
}
