export interface CountryRegulations {
  countryId: string;
  regulations: RegulationData[];
}

export interface RegulationData {
  category: "FOOD_IMPORT" | "LABELING" | "PACKAGING" | "DOCUMENTATION" | "CERTIFICATION" | "CUSTOMS" | "PHYTOSANITARY" | "ANIMAL_HEALTH" | "ORGANIC" | "HALAL" | "RESTRICTED_INGREDIENTS" | "PROHIBITED" | "TARIFF";
  productCategory: string;
  title: string;
  description: string;
  requirement?: string;
  severity: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  isProhibition: boolean;
  version: string;
  provider: "MANUAL" | "MOCK" | "OFFICIAL_API" | "COMMERCIAL_FEED";
  confidence: number;
  authority?: string;
  status: "DRAFT" | "ACTIVE" | "RETIRED";
  effectiveDate?: Date;
  expiryDate?: Date;
  sourceAuthority?: string;
  sourceUrl?: string;
  notes?: string;
}

export interface IRegulationProvider {
  /**
   * Identifies the provider (e.g., 'WTO', 'FDA', 'MOCK')
   */
  getProviderName(): string;

  /**
   * Returns the capability status (e.g., 'OFFICIAL_API', 'MOCK')
   */
  getCapabilityStatus(): "MANUAL" | "MOCK" | "OFFICIAL_API" | "COMMERCIAL_FEED";

  /**
   * Fetch all regulations for a given country code (ISO)
   */
  fetchCountryRegulations(isoCode: string): Promise<CountryRegulations>;

  /**
   * Optional specific fetchers if needed
   */
  fetchFoodRequirements?(isoCode: string): Promise<RegulationData[]>;
  fetchCertificates?(isoCode: string): Promise<RegulationData[]>;
  fetchTariffs?(isoCode: string, hsCode: string): Promise<any>;
}
