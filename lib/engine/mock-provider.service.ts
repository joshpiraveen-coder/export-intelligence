import { IRegulationProvider, CountryRegulations, RegulationData } from "./regulation-provider.interface";

export class MockCustomsProvider implements IRegulationProvider {
  getProviderName(): string {
    return "MockCustoms_AU_LK";
  }

  getCapabilityStatus(): "MANUAL" | "MOCK" | "OFFICIAL_API" | "COMMERCIAL_FEED" {
    return "MOCK";
  }

  async fetchCountryRegulations(isoCode: string): Promise<CountryRegulations> {
    // Return mock realistic data for AU or any country to test engine
    return {
      countryId: "mock_id",
      regulations: [
        {
          category: "LABELING",
          productCategory: "all",
          title: "Mandatory Nutrition Panel",
          description: "All packaged food must bear a nutrition information panel.",
          requirement: "Nutrition Information Panel",
          severity: "HIGH",
          isProhibition: false,
          version: "2026.1",
          provider: "MOCK",
          confidence: 0.95,
          authority: "Food Standards Australia New Zealand",
          status: "ACTIVE",
          sourceUrl: "https://www.foodstandards.gov.au/code/Standard_1.2.8"
        },
        {
          category: "CERTIFICATION",
          productCategory: "spice",
          title: "Spice Import Requirements",
          description: "Spices require a phytosanitary certificate.",
          requirement: "Phytosanitary Certificate",
          severity: "HIGH",
          isProhibition: false,
          version: "2026.1",
          provider: "MOCK",
          confidence: 1.0,
          authority: "Department of Agriculture, Fisheries and Forestry",
          status: "ACTIVE"
        },
        {
          category: "DOCUMENTATION",
          productCategory: "all",
          title: "Standard Import Docs",
          description: "Basic documentation for clearance.",
          requirement: "Commercial Invoice",
          severity: "HIGH",
          isProhibition: false,
          version: "2026.1",
          provider: "MOCK",
          confidence: 1.0,
          authority: "Australian Border Force",
          status: "ACTIVE"
        }
      ]
    };
  }
}
