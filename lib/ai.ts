import OpenAI from "openai";
import { prisma } from "@/lib/db";

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || "sk-or-v1-placeholder",
  baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "X-Title": "Jaffna Basket Export Intelligence",
  },
});

const AI_MODEL =
  process.env.AI_MODEL || "meta-llama/llama-3.2-3b-instruct:free";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

/**
 * Build regulation context from DB for a given country + products.
 */
async function buildRegulationContext(
  countryId?: string,
  assessmentId?: string
): Promise<string> {
  let context = "";

  if (countryId) {
    const country = await prisma.country.findUnique({
      where: { id: countryId },
      include: {
        regulations: { where: { isActive: true }, take: 20 },
        certificates: { include: { certificate: true } },
        authorities: true,
      },
    });

    if (country) {
      context += `\n## Destination Country: ${country.name} (${country.isoCode})\n`;
      context += `Customs Authority: ${country.customsAuthority || "N/A"}\n`;
      context += `Food Safety Authority: ${country.foodAuthority || "N/A"}\n\n`;

      if (country.regulations.length > 0) {
        context += `### Active Regulations:\n`;
        for (const reg of country.regulations) {
          context += `- [${reg.category}] ${reg.title}: ${reg.description}\n`;
          if (reg.requirement) context += `  Requirement: ${reg.requirement}\n`;
        }
      }

      if (country.certificates.length > 0) {
        context += `\n### Required Certificates:\n`;
        for (const cc of country.certificates) {
          context += `- ${cc.certificate.name} (${cc.isMandatory ? "MANDATORY" : "OPTIONAL"})\n`;
        }
      }
    }
  }

  if (assessmentId) {
    const assessment = await prisma.exportAssessment.findUnique({
      where: { id: assessmentId },
      include: {
        items: true,
        results: {
          include: {
            product: true,
            warnings: true,
          },
        },
        warnings: true,
      },
    });

    if (assessment) {
      context += `\n## Current Assessment\n`;
      context += `Overall Score: ${assessment.overallScore || "N/A"}/100\n`;
      context += `Risk Level: ${assessment.riskLevel || "N/A"}\n\n`;

      if (assessment.results.length > 0) {
        context += `### Product Compliance:\n`;
        for (const result of assessment.results) {
          context += `- ${result.product.name}: Score ${result.score}/100, Risk: ${result.riskLevel}\n`;
          if (result.warnings.length > 0) {
            context += `  Warnings: ${result.warnings.map((w) => w.title).join(", ")}\n`;
          }
        }
      }
    }
  }

  return context;
}

/**
 * Stream a compliance chat response grounded in DB regulations.
 */
export async function streamComplianceChat(
  messages: ChatMessage[],
  countryId?: string,
  assessmentId?: string
) {
  const regulationContext = await buildRegulationContext(countryId, assessmentId);

  const systemPrompt = `You are an expert export compliance assistant for Jaffna Basket, a platform that helps Sri Lankan exporters understand international trade regulations.

IMPORTANT RULES:
1. ONLY use the regulation data provided below. Do NOT invent or assume regulations.
2. If information is not in the database context, say "I don't have that specific regulation in our database. Please verify with the relevant authority."
3. Be specific, practical, and cite the regulation when possible.
4. Format responses with clear sections when helpful.
5. Always recommend consulting a licensed customs broker for high-risk shipments.

## Database Context:
${regulationContext || "No specific country/assessment context provided. Answer general export compliance questions."}

You help exporters with:
- Understanding export regulations for specific countries
- Identifying required documents and certificates
- Explaining compliance scores and warnings
- Generating export document descriptions
- Answering customs and tariff questions`;

  const stream = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    stream: true,
    temperature: 0.3,
    max_tokens: 1000,
  });

  return stream;
}

/**
 * Generate AI explanation for a compliance result (non-streaming).
 */
export async function explainComplianceResult(
  assessmentId: string
): Promise<string> {
  const regulationContext = await buildRegulationContext(
    undefined,
    assessmentId
  );

  if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === "sk-or-v1-your-key-here") {
    return generateFallbackExplanation(regulationContext);
  }

  const response = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      {
        role: "system",
        content: `You are an export compliance expert. Generate a clear, professional summary of this compliance assessment. Use the data provided only.`,
      },
      {
        role: "user",
        content: `Please summarize this export compliance assessment and provide actionable recommendations:\n${regulationContext}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 800,
  });

  return (
    response.choices[0]?.message?.content ||
    "Unable to generate AI explanation."
  );
}

/**
 * Generate commercial invoice description using AI.
 */
export async function generateCommercialInvoiceDesc(
  productName: string,
  ingredients: string,
  hsCode: string,
  countryOfOrigin: string
): Promise<string> {
  if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === "sk-or-v1-your-key-here") {
    return `${productName} - ${countryOfOrigin} origin. HS: ${hsCode}. ${ingredients ? "Contains: " + ingredients : ""}`;
  }

  const response = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      {
        role: "system",
        content:
          "Generate a professional commercial invoice product description for customs purposes. Be concise, accurate, and professional.",
      },
      {
        role: "user",
        content: `Product: ${productName}\nIngredients: ${ingredients}\nHS Code: ${hsCode}\nCountry of Origin: ${countryOfOrigin}\n\nGenerate customs invoice description (max 100 words):`,
      },
    ],
    temperature: 0.2,
    max_tokens: 150,
  });

  return (
    response.choices[0]?.message?.content ||
    `${productName} - Food product from ${countryOfOrigin}`
  );
}

function generateFallbackExplanation(context: string): string {
  return `## Compliance Assessment Summary

This assessment has been analyzed based on the destination country's import regulations stored in our database.

${context}

**Recommendations:**
- Review all identified warnings before proceeding with shipment
- Ensure all required documents are prepared and certified
- Contact the destination country's customs authority for the most up-to-date requirements
- Consider engaging a licensed customs broker for complex shipments

*Note: To enable AI-powered explanations, add your OpenRouter API key in Settings.*`;
}
