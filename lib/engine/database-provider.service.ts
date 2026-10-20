import { prisma } from "@/lib/db";
import { IRegulationProvider, CountryRegulations, RegulationData } from "./regulation-provider.interface";

export class DatabaseCustomsProvider implements IRegulationProvider {
  getProviderName(): string {
    return "JaffnaBasket_Internal_DB";
  }

  getCapabilityStatus(): "MANUAL" | "MOCK" | "OFFICIAL_API" | "COMMERCIAL_FEED" {
    return "MANUAL";
  }

  async fetchCountryRegulations(countryId: string): Promise<CountryRegulations> {
    const dbRegulations = await prisma.regulation.findMany({
      where: { countryId, isActive: true },
    });

    return {
      countryId,
      regulations: dbRegulations.map(r => ({
        category: r.category as any,
        productCategory: r.productCategory,
        title: r.title,
        description: r.description,
        requirement: r.requirement || undefined,
        severity: r.severity as any,
        isProhibition: r.isProhibition,
        version: r.version,
        provider: r.provider as any,
        confidence: r.confidence,
        authority: r.authority || undefined,
        status: r.status as any,
        effectiveDate: r.effectiveDate || undefined,
        expiryDate: r.expiryDate || undefined,
        sourceAuthority: r.sourceAuthority || undefined,
        sourceUrl: r.sourceUrl || undefined,
        notes: r.notes || undefined,
      }))
    };
  }
}
