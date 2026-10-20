// Populates manufacturer-specific product catalogs for the Jaffna Basket platform.
// Phase 1 (this file): Akshayam Food Products — sample batch for review.
// QA/certification fields are intentionally left PENDING — they represent real
// inspection/certification outcomes that must be entered once actually issued.

import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const MANUFACTURER = "Akshayam Food Products";

// ─── Shared JSON block builders ────────────────────────────────────────────────

function pendingCertifications() {
  const pending = { status: "PENDING", certNumber: null, issuedDate: null, expiryDate: null };
  return JSON.stringify({
    HEALTH: { ...pending },
    PHYTOSANITARY: { ...pending },
    CERT_OF_ORIGIN: { ...pending },
    HALAL: { ...pending },
    ORGANIC: { status: "NOT_APPLICABLE", certNumber: null, issuedDate: null, expiryDate: null },
    ISO_22000: { ...pending },
    HACCP: { ...pending },
    GMP: { ...pending },
    SLS: { ...pending },
    FDA: { ...pending },
    EU: { ...pending },
    UK: { ...pending },
    US: { ...pending },
    AUSTRALIA: { ...pending },
    CANADA: { ...pending },
    MIDDLE_EAST: { ...pending },
  });
}

function exportLogistics(opts: { riskLevel: "LOW" | "MEDIUM"; notes: string }) {
  return JSON.stringify({
    riskLevel: opts.riskLevel,
    shippingMethod: "Sea freight (LCL/FCL) or air freight for small orders",
    containerType: "Standard dry container, moisture-controlled",
    incoterms: "FOB Colombo (negotiable: CIF, EXW on request)",
    unNumber: null,
    dangerousGoods: false,
    exportNotes: opts.notes,
  });
}

function aiMetadata(opts: {
  scientificName: string;
  customsKeywords: string[];
  tradeKeywords: string[];
  eNumbers?: string[];
  nutritionSummary: string;
  restrictedIngredients: string[];
  suggestedMarkets: string[];
  likelyRejectedCountries: string[];
  docsNeededCountries: string[];
  shelfStabilityScore: number;
  complianceConfidenceScore: number;
  aiSummary: string;
  commonAllergens: string[];
}) {
  return JSON.stringify({
    commonAllergens: opts.commonAllergens,
    riskIngredients: opts.restrictedIngredients,
    customsKeywords: opts.customsKeywords,
    tradeKeywords: opts.tradeKeywords,
    scientificIngredientNames: [opts.scientificName],
    foodAdditiveENumbers: opts.eNumbers || [],
    ingredientPercentages: { [opts.scientificName]: "100%" },
    nutritionSummary: opts.nutritionSummary,
    potentialRestrictedIngredients: opts.restrictedIngredients,
    suggestedExportMarkets: opts.suggestedMarkets,
    likelyRejectedCountries: opts.likelyRejectedCountries,
    countriesNeedingAdditionalDocuments: opts.docsNeededCountries,
    shelfStabilityScore: opts.shelfStabilityScore,
    complianceConfidenceScore: opts.complianceConfidenceScore,
    aiGeneratedSummary: opts.aiSummary,
  });
}

// ─── Per-product spec ───────────────────────────────────────────────────────────

interface Spec {
  name: string;
  sku: string;
  barcode: string;
  hsCode: string;
  customsDesc: string;
  scientificName: string;
  categorySlug: "spices" | "flours";
  weightGrams: number;
  retailPriceLKR: number;
  wholesalePriceLKR: number;
  exportFobPriceUsd: number;
  allergenNames?: string[];
  isVegan?: boolean;
  ingredients: string;
  description: string;
  shelfLifeDays: number;
  isFlourOrMix?: boolean;
}

const SPICE_MARKETS = ["United Kingdom", "United States", "Canada", "Germany", "United Arab Emirates", "Singapore"];

function buildSpec(spec: Spec) {
  const isMustard = spec.name.toLowerCase().includes("mustard");
  const isFlourGroup = spec.isFlourOrMix ?? false;
  const containsEgg = spec.name.toLowerCase().includes("egg");

  return {
    prismaProduct: {
      name: spec.name,
      sku: spec.sku,
      barcode: spec.barcode,
      description: spec.description,
      manufacturer: MANUFACTURER,
      countryOfOrigin: "LK",
      categorySlugRef: spec.categorySlug,

      ingredients: spec.ingredients,
      nutritionInfo: JSON.stringify({
        servingSize: "5g",
        note: "Estimated typical values for dried spice/flour products; confirm via lab analysis before final label printing.",
        energyKcal: isFlourGroup ? 340 : 270,
        proteinG: isFlourGroup ? 22 : 10,
        fatG: isFlourGroup ? 2 : 8,
        carbohydrateG: isFlourGroup ? 60 : 45,
        fibreG: isFlourGroup ? 12 : 30,
        sodiumMg: 15,
      }),
      foodCategory: spec.categorySlug,
      shelfLifeDays: spec.shelfLifeDays,
      storageConditions: "Store in a cool, dry place away from direct sunlight. Keep container tightly sealed after opening.",
      isOrganic: false,
      isVegan: spec.isVegan ?? !containsEgg,
      isHalal: true,
      isGlutenFree: !isFlourGroup || !spec.name.toLowerCase().includes("wheat"),

      packageType: isFlourGroup ? "Heat-sealed stand-up pouch" : "Heat-sealed foil pouch",
      packageMaterial: "Food-grade laminated plastic (PET/Aluminium/PE)",
      weightGrams: spec.weightGrams,
      grossWeightGrams: spec.weightGrams + 12,
      dimensionsCm: JSON.stringify({ l: 14, w: 9, h: 3 }),
      qtyPerCarton: spec.weightGrams <= 100 ? 100 : spec.weightGrams <= 250 ? 48 : 24,
      cartonDimensionsCm: JSON.stringify({ l: 40, w: 30, h: 25 }),
      cartonWeightKg: Math.round(((spec.weightGrams + 12) * (spec.weightGrams <= 100 ? 100 : spec.weightGrams <= 250 ? 48 : 24)) / 1000 * 10) / 10,
      palletQuantity: 60,
      stackingInstructions: "Max 8 cartons per stack. Do not stack pallets. Keep away from moisture and direct heat.",
      tamperSeal: true,
      vacuumPacked: false,
      labelLanguages: JSON.stringify(["English", "Tamil"]),
      recyclable: false,
      recyclingCode: null,

      containsArtificialColours: false,
      containsArtificialFlavours: false,
      containsPreservatives: false,

      hsCode: spec.hsCode,
      customsDesc: spec.customsDesc,
      exportCategory: isFlourGroup ? "Flours & Traditional Food Mixes" : "Spices & Seasonings",
      temperatureRequirement: "Ambient / Room Temperature",
      isSuitableForExport: true,
      countryRestrictionsNote: "No country-specific import bans identified for this product category as of the last regulation review. Verify against destination country's current biosecurity and food-import rules before shipment.",
      importRestrictionsNote: isMustard
        ? "Mustard is a regulated allergen in the EU, UK, and several other markets — must be declared prominently on the label."
        : "No special import restrictions identified beyond standard food-safety documentation.",

      certifications: pendingCertifications(),
      exportLogistics: exportLogistics({
        riskLevel: isMustard || containsEgg ? "MEDIUM" : "LOW",
        notes: containsEgg
          ? "Contains egg — verify egg-product import rules for the destination country; some markets require additional veterinary/health documentation for egg-containing food products."
          : "Standard dried spice/flour shipment — low biosecurity risk profile.",
      }),
      aiMetadata: aiMetadata({
        scientificName: spec.scientificName,
        customsKeywords: [spec.name.toLowerCase(), "sri lanka", "spice export", spec.hsCode],
        tradeKeywords: ["Ceylon", "Jaffna", "wholesale spice", "bulk export", "Sri Lankan food product"],
        nutritionSummary: isFlourGroup
          ? "High in fibre and plant protein, low in fat. Typical of legume/pulse-based traditional flours."
          : "Concentrated source of flavour compounds; used in small quantities. Naturally low in sugar.",
        restrictedIngredients: isMustard ? ["Mustard (EU/UK/US regulated allergen)"] : containsEgg ? ["Egg (regulated allergen)"] : [],
        suggestedMarkets: SPICE_MARKETS,
        likelyRejectedCountries: [],
        docsNeededCountries: ["Saudi Arabia", "United Arab Emirates", "Qatar"],
        shelfStabilityScore: isFlourGroup ? 82 : 92,
        complianceConfidenceScore: 58,
        aiSummary: `${spec.name} by ${MANUFACTURER} — a shelf-stable, export-ready Sri Lankan ${isFlourGroup ? "traditional flour" : "spice"} product. Core food-safety data is in place; formal certifications (Halal, ISO 22000, HACCP, destination-market compliance) are pending and should be completed before first export shipment.`,
        commonAllergens: spec.allergenNames || [],
      }),
    },
    pricing: {
      retailPriceLKR: spec.retailPriceLKR,
      wholesalePriceLKR: spec.wholesalePriceLKR,
      distributorPriceLKR: Math.round(spec.wholesalePriceLKR * 0.88),
      exportFobPriceUsd: spec.exportFobPriceUsd,
      cifPriceUsd: Math.round(spec.exportFobPriceUsd * 1.22 * 100) / 100,
      moq: spec.categorySlug === "flours" ? "200 kg" : "100 kg",
      currency: "LKR",
      vatRate: 18,
      productionCost: Math.round(spec.wholesalePriceLKR * 0.62),
      profitMargin: 35,
      seasonalAvailability: "Year-round",
      leadTimeDays: 14,
      monthlyCapacity: "5,000 kg",
      annualCapacity: "60,000 kg",
      paymentTerms: "30% advance, 70% against shipping documents",
      acceptedPaymentMethods: JSON.stringify(["Bank transfer (T/T)", "Letter of Credit (L/C)"]),
      supplierCode: `SUP-${spec.sku}`,
      batchCost: Math.round(spec.wholesalePriceLKR * 0.62 * 100),
      marketSegment: "Export",
    },
    allergenNames: spec.allergenNames || [],
  };
}

const products: Spec[] = [
  { name: "Jaffna Curry Powder", sku: "AK-SP-001", barcode: "8901234500018", hsCode: "0910.91", customsDesc: "Mixed roasted spice powder blend for curry preparation", scientificName: "Mixed spice blend (Coriandrum sativum, Cuminum cyminum, Capsicum spp., et al.)", categorySlug: "spices", weightGrams: 100, retailPriceLKR: 380, wholesalePriceLKR: 300, exportFobPriceUsd: 2.4, ingredients: "Coriander, Cumin, Fennel, Dried Chilli, Black Pepper, Fenugreek, Curry Leaves, Rice (roasted)", description: "Traditional Jaffna-style roasted curry powder blend, ground fresh in small batches using time-honoured Northern Sri Lankan recipes. Adds deep, smoky flavour to meat, fish, and vegetable curries.", shelfLifeDays: 365 },
  { name: "Curry Powder", sku: "AK-SP-002", barcode: "8901234500025", hsCode: "0910.91", customsDesc: "Mixed spice powder blend for curry preparation", scientificName: "Mixed spice blend (Coriandrum sativum, Cuminum cyminum, et al.)", categorySlug: "spices", weightGrams: 100, retailPriceLKR: 340, wholesalePriceLKR: 270, exportFobPriceUsd: 2.1, ingredients: "Coriander, Cumin, Fennel, Turmeric, Black Pepper, Dried Chilli", description: "An everyday all-purpose curry powder blend, milder than the Jaffna-style roast, suited for a wide range of South Asian curry dishes.", shelfLifeDays: 365 },
  { name: "Chilli Powder", sku: "AK-SP-003", barcode: "8901234500032", hsCode: "0904.22", customsDesc: "Ground dried chilli pepper powder", scientificName: "Capsicum annuum", categorySlug: "spices", weightGrams: 100, retailPriceLKR: 320, wholesalePriceLKR: 255, exportFobPriceUsd: 2.0, ingredients: "100% Dried Red Chilli (ground)", description: "Fine-ground dried red chilli powder made from sun-ripened chillies, delivering consistent heat and vibrant colour for everyday cooking.", shelfLifeDays: 365 },
  { name: "Chilli Flakes", sku: "AK-SP-004", barcode: "8901234500049", hsCode: "0904.22", customsDesc: "Crushed dried chilli pepper flakes", scientificName: "Capsicum annuum", categorySlug: "spices", weightGrams: 100, retailPriceLKR: 340, wholesalePriceLKR: 270, exportFobPriceUsd: 2.15, ingredients: "100% Dried Red Chilli (crushed)", description: "Coarsely crushed dried chilli flakes for a visible-heat garnish and textured spice in cooking, pizzas, and condiments.", shelfLifeDays: 365 },
  { name: "Whole Dried Red Chilli", sku: "AK-SP-005", barcode: "8901234500056", hsCode: "0904.21", customsDesc: "Whole dried chilli pepper, unground", scientificName: "Capsicum annuum", categorySlug: "spices", weightGrams: 100, retailPriceLKR: 300, wholesalePriceLKR: 240, exportFobPriceUsd: 1.9, ingredients: "100% Whole Dried Red Chilli", description: "Sun-dried whole red chillies retaining full aroma and heat, ideal for tempering (tadka), pickling, and home grinding.", shelfLifeDays: 365 },
  { name: "Black Pepper", sku: "AK-SP-006", barcode: "8901234500063", hsCode: "0904.11", customsDesc: "Whole dried black peppercorns, unground", scientificName: "Piper nigrum", categorySlug: "spices", weightGrams: 50, retailPriceLKR: 260, wholesalePriceLKR: 205, exportFobPriceUsd: 1.7, ingredients: "100% Whole Black Peppercorns", description: "Premium whole black peppercorns sourced from Sri Lankan highland farms, prized for their bold, sharp aroma.", shelfLifeDays: 730 },
  { name: "Pepper Seeds", sku: "AK-SP-007", barcode: "8901234500070", hsCode: "0904.11", customsDesc: "Whole dried pepper seeds, unground", scientificName: "Piper nigrum", categorySlug: "spices", weightGrams: 50, retailPriceLKR: 250, wholesalePriceLKR: 198, exportFobPriceUsd: 1.65, ingredients: "100% Whole Pepper Seeds", description: "Whole dried pepper seeds for home grinding, retaining maximum aromatic oils until milled fresh.", shelfLifeDays: 730 },
  { name: "Cumin Seeds", sku: "AK-SP-008", barcode: "8901234500087", hsCode: "0909.31", customsDesc: "Whole cumin seeds, neither crushed nor ground", scientificName: "Cuminum cyminum", categorySlug: "spices", weightGrams: 100, retailPriceLKR: 280, wholesalePriceLKR: 220, exportFobPriceUsd: 1.85, ingredients: "100% Whole Cumin Seeds", description: "Aromatic whole cumin seeds, a kitchen staple for tempering and spice blends across South Asian cuisine.", shelfLifeDays: 730 },
  { name: "Fennel Seeds", sku: "AK-SP-009", barcode: "8901234500094", hsCode: "0909.61", customsDesc: "Whole fennel seeds, neither crushed nor ground", scientificName: "Foeniculum vulgare", categorySlug: "spices", weightGrams: 100, retailPriceLKR: 270, wholesalePriceLKR: 215, exportFobPriceUsd: 1.8, ingredients: "100% Whole Fennel Seeds", description: "Sweet, aromatic fennel seeds used in curries, teas, and as a post-meal digestive aid.", shelfLifeDays: 730 },
  { name: "Mustard Seeds", sku: "AK-SP-010", barcode: "8901234500100", hsCode: "1207.50", customsDesc: "Mustard seeds, whether or not broken", scientificName: "Brassica juncea", categorySlug: "spices", weightGrams: 100, retailPriceLKR: 230, wholesalePriceLKR: 182, exportFobPriceUsd: 1.5, allergenNames: ["Mustard"], ingredients: "100% Whole Mustard Seeds", description: "Small, pungent mustard seeds essential for South Indian and Sri Lankan tempering (tadka).", shelfLifeDays: 730 },
  { name: "Pepper Powder", sku: "AK-SP-011", barcode: "8901234500117", hsCode: "0904.12", customsDesc: "Ground black pepper powder", scientificName: "Piper nigrum", categorySlug: "spices", weightGrams: 50, retailPriceLKR: 290, wholesalePriceLKR: 230, exportFobPriceUsd: 1.9, ingredients: "100% Ground Black Pepper", description: "Finely ground black pepper, freshly milled for consistent heat and aroma in everyday cooking.", shelfLifeDays: 365 },
  { name: "Cumin Powder", sku: "AK-SP-012", barcode: "8901234500124", hsCode: "0909.32", customsDesc: "Ground cumin powder", scientificName: "Cuminum cyminum", categorySlug: "spices", weightGrams: 100, retailPriceLKR: 310, wholesalePriceLKR: 245, exportFobPriceUsd: 2.0, ingredients: "100% Ground Cumin Seeds", description: "Earthy, warm ground cumin powder milled from premium seeds for curries, marinades, and spice blends.", shelfLifeDays: 365 },
  { name: "Fennel Powder", sku: "AK-SP-013", barcode: "8901234500131", hsCode: "0909.62", customsDesc: "Ground fennel powder", scientificName: "Foeniculum vulgare", categorySlug: "spices", weightGrams: 100, retailPriceLKR: 300, wholesalePriceLKR: 238, exportFobPriceUsd: 1.95, ingredients: "100% Ground Fennel Seeds", description: "Sweet, mildly aniseed-flavoured fennel powder, ground fine for gravies and spice mixes.", shelfLifeDays: 365 },
  { name: "Coriander Powder", sku: "AK-SP-014", barcode: "8901234500148", hsCode: "0909.22", customsDesc: "Ground coriander powder", scientificName: "Coriandrum sativum", categorySlug: "spices", weightGrams: 100, retailPriceLKR: 290, wholesalePriceLKR: 230, exportFobPriceUsd: 1.85, ingredients: "100% Ground Coriander Seeds", description: "Citrusy, warm coriander powder — a foundational spice for South Asian curry bases.", shelfLifeDays: 365 },
  { name: "Fenugreek Powder", sku: "AK-SP-015", barcode: "8901234500155", hsCode: "0910.99", customsDesc: "Ground fenugreek powder", scientificName: "Trigonella foenum-graecum", categorySlug: "spices", weightGrams: 100, retailPriceLKR: 260, wholesalePriceLKR: 205, exportFobPriceUsd: 1.7, ingredients: "100% Ground Fenugreek Seeds", description: "Slightly bitter, aromatic fenugreek powder used in spice blends, pickles, and traditional remedies.", shelfLifeDays: 365 },
  { name: "Turmeric Powder", sku: "AK-SP-016", barcode: "8901234500162", hsCode: "0910.30", customsDesc: "Pure ground turmeric", scientificName: "Curcuma longa", categorySlug: "spices", weightGrams: 100, retailPriceLKR: 300, wholesalePriceLKR: 238, exportFobPriceUsd: 1.95, ingredients: "100% Ground Turmeric (Curcuma longa)", description: "Vivid golden turmeric powder, stone-ground from sun-dried rhizomes for maximum curcumin content and colour.", shelfLifeDays: 365 },
  { name: "Garlic Powder", sku: "AK-SP-017", barcode: "8901234500179", hsCode: "0712.90", customsDesc: "Dried and ground garlic powder", scientificName: "Allium sativum", categorySlug: "spices", weightGrams: 100, retailPriceLKR: 350, wholesalePriceLKR: 278, exportFobPriceUsd: 2.25, ingredients: "100% Dehydrated Garlic (ground)", description: "Convenient dehydrated garlic powder with concentrated flavour, ideal for seasoning blends and marinades.", shelfLifeDays: 365 },
  { name: "Ginger Powder", sku: "AK-SP-018", barcode: "8901234500186", hsCode: "0910.11", customsDesc: "Ginger, ground", scientificName: "Zingiber officinale", categorySlug: "spices", weightGrams: 100, retailPriceLKR: 330, wholesalePriceLKR: 262, exportFobPriceUsd: 2.1, ingredients: "100% Dried Ginger (ground)", description: "Warm, pungent ginger powder milled from mature dried rhizomes for cooking, baking, and herbal preparations.", shelfLifeDays: 365 },
  { name: "Tomato Powder", sku: "AK-SP-019", barcode: "8901234500193", hsCode: "0712.90", customsDesc: "Dehydrated tomato powder", scientificName: "Solanum lycopersicum", categorySlug: "spices", weightGrams: 100, retailPriceLKR: 380, wholesalePriceLKR: 300, exportFobPriceUsd: 2.4, ingredients: "100% Dehydrated Tomato (ground)", description: "Concentrated dehydrated tomato powder for instant sauces, soups, and seasoning blends without refrigeration needs.", shelfLifeDays: 365 },
  { name: "Roasted Urid Flour", sku: "AK-FL-001", barcode: "8901234500209", hsCode: "1106.10", customsDesc: "Flour of roasted dried leguminous vegetables (black gram)", scientificName: "Vigna mungo", categorySlug: "flours", weightGrams: 250, retailPriceLKR: 480, wholesalePriceLKR: 380, exportFobPriceUsd: 3.1, ingredients: "100% Roasted Urid Dal (Black Gram), milled", description: "Stone-milled flour from roasted black gram (urid dal), a traditional base for South Indian and Sri Lankan crepes, snacks, and batters.", shelfLifeDays: 180, isFlourOrMix: true },
  { name: "Unroasted Urid Flour", sku: "AK-FL-002", barcode: "8901234500216", hsCode: "1106.10", customsDesc: "Flour of dried leguminous vegetables (black gram)", scientificName: "Vigna mungo", categorySlug: "flours", weightGrams: 250, retailPriceLKR: 460, wholesalePriceLKR: 365, exportFobPriceUsd: 2.95, ingredients: "100% Unroasted Urid Dal (Black Gram), milled", description: "Raw-milled black gram flour, retaining a lighter flavour profile for batters, papadam, and fermented dishes.", shelfLifeDays: 180, isFlourOrMix: true },
  { name: "Roasted Green Gram Flour", sku: "AK-FL-003", barcode: "8901234500223", hsCode: "1106.10", customsDesc: "Flour of roasted dried leguminous vegetables (green gram)", scientificName: "Vigna radiata", categorySlug: "flours", weightGrams: 250, retailPriceLKR: 470, wholesalePriceLKR: 372, exportFobPriceUsd: 3.0, ingredients: "100% Roasted Green Gram (Moong Dal), milled", description: "Nutty, roasted green gram flour milled fresh for traditional sweets, health drinks, and confectionery.", shelfLifeDays: 180, isFlourOrMix: true },
  { name: "Egg Hosha Mix", sku: "AK-FL-004", barcode: "8901234500230", hsCode: "1901.90", customsDesc: "Prepared food mix (flour-based, contains egg) for traditional snack preparation", scientificName: "Wheat flour, egg powder, sugar blend", categorySlug: "flours", weightGrams: 250, retailPriceLKR: 550, wholesalePriceLKR: 435, exportFobPriceUsd: 3.5, allergenNames: ["Eggs"], isVegan: false, ingredients: "Wheat Flour, Egg Powder, Sugar, Cardamom, Baking Agent", description: "Ready-to-use flour mix for preparing traditional Jaffna-style egg hosha (a crisp, sweet festive snack) — just add water and fry.", shelfLifeDays: 120, isFlourOrMix: true },
];

async function main() {
  console.log(`🌱 Seeding manufacturer: ${MANUFACTURER}…`);

  // Ensure required categories exist
  const spicesCategory = await prisma.productCategory.upsert({
    where: { slug: "spices" }, update: {},
    create: { name: "Spices & Seasonings", slug: "spices", icon: "🌶️" },
  });
  const floursCategory = await prisma.productCategory.upsert({
    where: { slug: "flours" }, update: {},
    create: { name: "Flours & Traditional Food Mixes", slug: "flours", icon: "🌾" },
  });
  const categoryBySlug: Record<string, string> = {
    spices: spicesCategory.id,
    flours: floursCategory.id,
  };

  // Ensure required allergens exist (extends the base set from prisma/seed.ts)
  const allergenRecords: Record<string, { id: string }> = {};
  for (const name of ["Mustard", "Eggs", "Milk", "Soybeans", "Wheat", "Sulphites"]) {
    allergenRecords[name] = await prisma.allergen.upsert({
      where: { name },
      update: {},
      create: { name, euRegulated: true },
    });
  }

  // Use the existing Jaffna Basket company as the owning/exporting entity —
  // Akshayam is a sourcing partner brand, matching how "manufacturer" is
  // already used as descriptive text elsewhere in this catalog.
  const company = await prisma.company.findUnique({ where: { slug: "jaffna-basket" } });

  let created = 0;
  for (const spec of products) {
    const built = buildSpec(spec);
    const existing = await prisma.product.findUnique({ where: { sku: spec.sku } });

    const productData: any = {
      ...built.prismaProduct,
      companyId: company?.id || null,
      categoryId: categoryBySlug[spec.categorySlug],
    };
    delete productData.categorySlugRef;

    const product = existing
      ? await prisma.product.update({ where: { id: existing.id }, data: productData })
      : await prisma.product.create({ data: productData });

    if (built.allergenNames.length > 0) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          allergens: {
            set: built.allergenNames.map((name) => ({ id: allergenRecords[name].id })),
          },
        },
      });
    }

    await prisma.productPricing.upsert({
      where: { productId: product.id },
      update: built.pricing,
      create: { productId: product.id, ...built.pricing },
    });

    created++;
  }

  console.log(`✅ Seeded ${created} ${MANUFACTURER} products with pricing.`);
}

main()
  .catch((e) => { console.error("❌ Manufacturer seed error:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
