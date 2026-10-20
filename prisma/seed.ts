import { PrismaClient, UserRole } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import path from "path";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding Jaffna Basket Export Intelligence Platform…");

  // ─── PRODUCT CATEGORIES ──────────────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.productCategory.upsert({ where: { slug: "spices" }, update: {}, create: { name: "Spices & Seasonings", slug: "spices", icon: "🌶️" } }),
    prisma.productCategory.upsert({ where: { slug: "dry-fish" }, update: {}, create: { name: "Dry Fish & Seafood", slug: "dry-fish", icon: "🐟" } }),
    prisma.productCategory.upsert({ where: { slug: "sweets" }, update: {}, create: { name: "Sweets & Confectionery", slug: "sweets", icon: "🍬" } }),
    prisma.productCategory.upsert({ where: { slug: "rice-grains" }, update: {}, create: { name: "Rice & Grains", slug: "rice-grains", icon: "🌾" } }),
    prisma.productCategory.upsert({ where: { slug: "sauces" }, update: {}, create: { name: "Sauces & Condiments", slug: "sauces", icon: "🫙" } }),
    prisma.productCategory.upsert({ where: { slug: "tea" }, update: {}, create: { name: "Tea & Beverages", slug: "tea", icon: "🍵" } }),
    prisma.productCategory.upsert({ where: { slug: "snacks" }, update: {}, create: { name: "Snacks & Ready Foods", slug: "snacks", icon: "🍿" } }),
    prisma.productCategory.upsert({ where: { slug: "coconut" }, update: {}, create: { name: "Coconut Products", slug: "coconut", icon: "🥥" } }),
  ]);

  // ─── CERTIFICATES ────────────────────────────────────────────────────────────
  const certs = {
    coo: await prisma.certificate.upsert({ where: { code: "COO" }, update: {}, create: { name: "Certificate of Origin", code: "COO", issuedBy: "Export Development Board of Sri Lanka", validity: "Per shipment", description: "Certifies that goods are of Sri Lankan origin" } }),
    health: await prisma.certificate.upsert({ where: { code: "HC" }, update: {}, create: { name: "Health Certificate", code: "HC", issuedBy: "Ministry of Health Sri Lanka", validity: "Per shipment", description: "Certifies product meets health standards" } }),
    phyto: await prisma.certificate.upsert({ where: { code: "PC" }, update: {}, create: { name: "Phytosanitary Certificate", code: "PC", issuedBy: "Dept. of Agriculture Sri Lanka", validity: "Per shipment", description: "Required for plant-based products" } }),
    halal: await prisma.certificate.upsert({ where: { code: "HALAL" }, update: {}, create: { name: "Halal Certificate", code: "HALAL", issuedBy: "All Ceylon Jamiyyathul Ulama", validity: "1 year", description: "Certifies product is Halal-compliant" } }),
    organic: await prisma.certificate.upsert({ where: { code: "ORGANIC" }, update: {}, create: { name: "Organic Certificate", code: "ORGANIC", issuedBy: "Sri Lanka Standards Institution", validity: "1 year", description: "Certifies organic production standards" } }),
    fda: await prisma.certificate.upsert({ where: { code: "FDA_REG" }, update: {}, create: { name: "FDA Prior Notice", code: "FDA_REG", issuedBy: "US FDA", validity: "Per shipment", description: "Required for all food imports to USA" } }),
    fsanz: await prisma.certificate.upsert({ where: { code: "FSANZ" }, update: {}, create: { name: "FSANZ Compliance Declaration", code: "FSANZ", issuedBy: "Food Standards Australia NZ", validity: "Per product", description: "Compliance with FSANZ food standards" } }),
  };

  // ─── ALLERGENS ────────────────────────────────────────────────────────────────
  await Promise.all([
    prisma.allergen.upsert({ where: { name: "Gluten" }, update: {}, create: { name: "Gluten", code: "GLU", euRegulated: true } }),
    prisma.allergen.upsert({ where: { name: "Peanuts" }, update: {}, create: { name: "Peanuts", code: "PEA", euRegulated: true } }),
    prisma.allergen.upsert({ where: { name: "Tree Nuts" }, update: {}, create: { name: "Tree Nuts", code: "NUT", euRegulated: true } }),
    prisma.allergen.upsert({ where: { name: "Sesame" }, update: {}, create: { name: "Sesame", code: "SES", euRegulated: true } }),
    prisma.allergen.upsert({ where: { name: "Mustard" }, update: {}, create: { name: "Mustard", code: "MUS", euRegulated: true } }),
    prisma.allergen.upsert({ where: { name: "Celery" }, update: {}, create: { name: "Celery", code: "CEL", euRegulated: true } }),
    prisma.allergen.upsert({ where: { name: "Fish" }, update: {}, create: { name: "Fish", code: "FSH", euRegulated: true } }),
    prisma.allergen.upsert({ where: { name: "Crustaceans" }, update: {}, create: { name: "Crustaceans", code: "CRU", euRegulated: true } }),
  ]);

  // ─── COMPANY ─────────────────────────────────────────────────────────────────
  const company = await prisma.company.upsert({
    where: { slug: "jaffna-basket" },
    update: {},
    create: {
      name: "Jaffna Basket Pvt Ltd",
      slug: "jaffna-basket",
      website: "https://jaffnabasket.com",
      country: "LK",
      email: "export@jaffnabasket.com",
      phone: "+94 21 222 3333",
      address: "Stanley Road, Jaffna, Sri Lanka",
      description: "Premium Sri Lankan food products marketplace and exporter",
    },
  });

  // ─── USERS ───────────────────────────────────────────────────────────────────
  const pw = await bcrypt.hash("Admin123!", 12);
  await Promise.all([
    prisma.user.upsert({ where: { email: "admin@jaffnabasket.com" }, update: {}, create: { name: "Super Admin", email: "admin@jaffnabasket.com", password: pw, role: "SUPER_ADMIN", companyId: company.id } }),
    prisma.user.upsert({ where: { email: "manager@jaffnabasket.com" }, update: {}, create: { name: "Arun Kumar", email: "manager@jaffnabasket.com", password: pw, role: "COMPANY_ADMIN", companyId: company.id } }),
    prisma.user.upsert({ where: { email: "export@jaffnabasket.com" }, update: {}, create: { name: "Priya Selvam", email: "export@jaffnabasket.com", password: pw, role: "EXPORT_MANAGER", companyId: company.id } }),
    prisma.user.upsert({ where: { email: "viewer@jaffnabasket.com" }, update: {}, create: { name: "Ravi Nair", email: "viewer@jaffnabasket.com", password: pw, role: "VIEWER", companyId: company.id } }),
  ]);

  // ─── HS CODES ────────────────────────────────────────────────────────────────
  await Promise.all([
    prisma.hSCode.upsert({ where: { code: "0904.22" }, update: {}, create: { code: "0904.22", description: "Crushed or ground dried chillies", category: "Spices" } }),
    prisma.hSCode.upsert({ where: { code: "0910.11" }, update: {}, create: { code: "0910.11", description: "Ginger, ground", category: "Spices" } }),
    prisma.hSCode.upsert({ where: { code: "0910.20" }, update: {}, create: { code: "0910.20", description: "Saffron", category: "Spices" } }),
    prisma.hSCode.upsert({ where: { code: "0910.30" }, update: {}, create: { code: "0910.30", description: "Turmeric (Curcuma)", category: "Spices" } }),
    prisma.hSCode.upsert({ where: { code: "0905.00" }, update: {}, create: { code: "0905.00", description: "Vanilla", category: "Spices" } }),
    prisma.hSCode.upsert({ where: { code: "0902.10" }, update: {}, create: { code: "0902.10", description: "Green tea, not fermented", category: "Tea" } }),
    prisma.hSCode.upsert({ where: { code: "0902.40" }, update: {}, create: { code: "0902.40", description: "Black tea, fermented", category: "Tea" } }),
    prisma.hSCode.upsert({ where: { code: "0305.59" }, update: {}, create: { code: "0305.59", description: "Other dried fish", category: "Seafood" } }),
    prisma.hSCode.upsert({ where: { code: "1006.30" }, update: {}, create: { code: "1006.30", description: "Semi-milled or wholly milled rice", category: "Grains" } }),
    prisma.hSCode.upsert({ where: { code: "1701.99" }, update: {}, create: { code: "1701.99", description: "Other cane sugar", category: "Sugar" } }),
    prisma.hSCode.upsert({ where: { code: "1804.00" }, update: {}, create: { code: "1804.00", description: "Cocoa butter, fat and oil", category: "Confectionery" } }),
    prisma.hSCode.upsert({ where: { code: "2103.90" }, update: {}, create: { code: "2103.90", description: "Sauces and preparations therefor", category: "Condiments" } }),
    prisma.hSCode.upsert({ where: { code: "1511.10" }, update: {}, create: { code: "1511.10", description: "Palm oil, crude", category: "Oils" } }),
    prisma.hSCode.upsert({ where: { code: "1513.21" }, update: {}, create: { code: "1513.21", description: "Coconut oil, crude", category: "Oils" } }),
    prisma.hSCode.upsert({ where: { code: "2104.10" }, update: {}, create: { code: "2104.10", description: "Soups and broths", category: "Prepared Foods" } }),
  ]);

  // ─── PRODUCTS ────────────────────────────────────────────────────────────────
  const productData = [
    { name: "Jaffna Curry Powder", sku: "JB-SP-001", hsCode: "0904.22", foodCategory: "spices", isHalal: true, categoryId: categories[0].id, ingredients: "Coriander, Cumin, Fennel, Cardamom, Cloves, Cinnamon, Chilli, Turmeric, Curry Leaves", countryOfOrigin: "LK", weightGrams: 200, customsDesc: "Mixed dried spice powder", description: "Authentic Jaffna-style curry powder blend. 14 spices. Traditional recipe." },
    { name: "Jaffna Chilli Powder", sku: "JB-SP-002", hsCode: "0904.22", foodCategory: "spices", isHalal: true, categoryId: categories[0].id, ingredients: "Dried Red Chilli", countryOfOrigin: "LK", weightGrams: 100, customsDesc: "Ground dried chilli pepper" },
    { name: "Turmeric Powder", sku: "JB-SP-003", hsCode: "0910.30", foodCategory: "spices", isHalal: true, isOrganic: true, isVegan: true, categoryId: categories[0].id, ingredients: "Turmeric (Curcuma longa)", countryOfOrigin: "LK", weightGrams: 100, customsDesc: "Pure ground turmeric" },
    { name: "Dry Fish (Sprats)", sku: "JB-DF-001", hsCode: "0305.59", foodCategory: "dry-fish", isHalal: false, categoryId: categories[1].id, ingredients: "Dried sprats (Stolephorus), Salt", countryOfOrigin: "LK", weightGrams: 250, shelfLifeDays: 180, storageConditions: "Cool, dry place", customsDesc: "Dried marine fish, salted" },
    { name: "Dry Fish (Mullet)", sku: "JB-DF-002", hsCode: "0305.59", foodCategory: "dry-fish", isHalal: false, categoryId: categories[1].id, ingredients: "Dried Mullet fish, Salt", countryOfOrigin: "LK", weightGrams: 500, shelfLifeDays: 120, storageConditions: "Cool, dry place", customsDesc: "Sun-dried mullet fish" },
    { name: "Murukku (Rice Snack)", sku: "JB-SN-001", hsCode: "1904.20", foodCategory: "snacks", isVegan: true, isGlutenFree: true, categoryId: categories[6].id, ingredients: "Rice flour, Urad dal flour, Cumin, Salt, Oil", countryOfOrigin: "LK", weightGrams: 200, shelfLifeDays: 90, customsDesc: "Fried rice and lentil snack" },
    { name: "Kokis (Traditional Sweet)", sku: "JB-SW-001", hsCode: "1904.20", foodCategory: "sweets", isVegan: false, categoryId: categories[2].id, ingredients: "Rice flour, Coconut milk, Eggs, Sugar, Salt, Turmeric", countryOfOrigin: "LK", weightGrams: 200, shelfLifeDays: 30, customsDesc: "Deep fried traditional Sri Lankan sweet" },
    { name: "Aluwa (Sesame Sweet)", sku: "JB-SW-002", hsCode: "1704.90", foodCategory: "sweets", isVegan: true, categoryId: categories[2].id, ingredients: "Sesame seeds, Jaggery, Cardamom", countryOfOrigin: "LK", weightGrams: 250, shelfLifeDays: 60, customsDesc: "Sesame seed confectionery" },
    { name: "Ceylon Black Tea (BOPF)", sku: "JB-TE-001", hsCode: "0902.40", foodCategory: "tea", isVegan: true, isHalal: true, isOrganic: true, categoryId: categories[5].id, ingredients: "Ceylon black tea (Camellia sinensis)", countryOfOrigin: "LK", weightGrams: 100, shelfLifeDays: 730, customsDesc: "Black tea, fermented, packaged" },
    { name: "Green Tea Ceylon", sku: "JB-TE-002", hsCode: "0902.10", foodCategory: "tea", isVegan: true, isHalal: true, isOrganic: true, categoryId: categories[5].id, ingredients: "Ceylon green tea (Camellia sinensis)", countryOfOrigin: "LK", weightGrams: 50, shelfLifeDays: 548, customsDesc: "Green tea, not fermented" },
    { name: "Pol Sambol Paste", sku: "JB-SC-001", hsCode: "2103.90", foodCategory: "sauces", isVegan: true, isHalal: true, categoryId: categories[4].id, ingredients: "Coconut (fresh grated), Red chilli, Lime juice, Salt, Shallots", countryOfOrigin: "LK", weightGrams: 200, shelfLifeDays: 14, storageConditions: "Refrigerate after opening", customsDesc: "Coconut and chilli condiment paste" },
    { name: "Coconut Oil (Virgin)", sku: "JB-CO-001", hsCode: "1513.21", foodCategory: "coconut", isVegan: true, isHalal: true, isOrganic: true, categoryId: categories[7].id, ingredients: "100% Pure Virgin Coconut Oil (Cocos nucifera)", countryOfOrigin: "LK", weightGrams: 500, shelfLifeDays: 730, storageConditions: "Room temperature, away from sunlight", customsDesc: "Virgin coconut oil, cold-pressed, unrefined" },
    { name: "Coconut Milk Powder", sku: "JB-CO-002", hsCode: "2106.90", foodCategory: "coconut", isVegan: true, isHalal: true, categoryId: categories[7].id, ingredients: "Coconut cream, Maltodextrin", countryOfOrigin: "LK", weightGrams: 200, shelfLifeDays: 365, customsDesc: "Spray dried coconut milk powder" },
    { name: "Samba Rice (Red)", sku: "JB-RG-001", hsCode: "1006.30", foodCategory: "rice-grains", isVegan: true, isHalal: true, isGlutenFree: true, categoryId: categories[3].id, ingredients: "Red Samba Rice (Oryza sativa)", countryOfOrigin: "LK", weightGrams: 1000, shelfLifeDays: 365, customsDesc: "Polished red rice, Sri Lankan variety" },
    { name: "Papadam (Plain)", sku: "JB-SN-002", hsCode: "1905.90", foodCategory: "snacks", isVegan: true, isGlutenFree: true, categoryId: categories[6].id, ingredients: "Black gram (Urad dal) flour, Salt, Sodium bicarbonate, Cumin", countryOfOrigin: "LK", weightGrams: 100, shelfLifeDays: 180, customsDesc: "Thin crispy lentil wafers" },
    { name: "Kithul Treacle (Palm Syrup)", sku: "JB-SW-003", hsCode: "1702.90", foodCategory: "sweets", isVegan: true, isHalal: true, isOrganic: true, categoryId: categories[2].id, ingredients: "100% Kithul palm sap (Caryota urens)", countryOfOrigin: "LK", weightGrams: 300, shelfLifeDays: 365, customsDesc: "Natural palm tree syrup, kithul variety" },
    { name: "Jaggery (Palmyra)", sku: "JB-SW-004", hsCode: "1701.99", foodCategory: "sweets", isVegan: true, isHalal: true, categoryId: categories[2].id, ingredients: "Palmyra palm sugar (Borassus flabellifer)", countryOfOrigin: "LK", weightGrams: 500, shelfLifeDays: 365, customsDesc: "Unrefined palm sugar block" },
    { name: "Sri Lankan Cinnamon (Ceylon)", sku: "JB-SP-004", hsCode: "0906.11", foodCategory: "spices", isVegan: true, isHalal: true, isOrganic: true, categoryId: categories[0].id, ingredients: "Ceylon Cinnamon quills (Cinnamomum verum)", countryOfOrigin: "LK", weightGrams: 50, shelfLifeDays: 730, customsDesc: "True cinnamon bark quills, Ceylon variety" },
    { name: "Cardamom Pods", sku: "JB-SP-005", hsCode: "0908.31", foodCategory: "spices", isVegan: true, isHalal: true, categoryId: categories[0].id, ingredients: "Cardamom pods (Elettaria cardamomum)", countryOfOrigin: "LK", weightGrams: 50, shelfLifeDays: 365, customsDesc: "Whole green cardamom pods" },
    { name: "Maldive Fish (Umbalakada)", sku: "JB-DF-003", hsCode: "0305.59", foodCategory: "dry-fish", isHalal: false, categoryId: categories[1].id, ingredients: "Skipjack tuna (Katsuwonus pelamis), Salt", countryOfOrigin: "LK", weightGrams: 200, shelfLifeDays: 365, storageConditions: "Cool, dry, away from moisture", customsDesc: "Dried cured tuna fish flakes, Sri Lankan style" },
  ];

  for (const pd of productData) {
    await prisma.product.upsert({
      where: { sku: pd.sku },
      update: {},
      create: {
        ...pd,
        manufacturer: "Jaffna Basket Pvt Ltd",
        companyId: company.id,
        isActive: true,
        packageType: "Sealed pouch",
        packageMaterial: "Food-grade plastic",
        qtyPerCarton: 24,
        exportCategory: "Food & Beverages",
      },
    });
  }

  console.log("✅ Created products");

  // ─── COUNTRIES ───────────────────────────────────────────────────────────────
  const countryData = [
    { name: "United Kingdom", isoCode: "GB", iso3Code: "GBR", currency: "GBP", region: "Europe", subRegion: "Northern Europe", flag: "🇬🇧", customsAuthority: "HM Revenue & Customs (HMRC)", foodAuthority: "Food Standards Agency (FSA)", importAuthority: "Border Force", officialWebsite: "https://www.gov.uk/government/organisations/hm-revenue-customs", importNotes: "Post-Brexit food imports require pre-notification via IPAFFS system. Products must comply with UK food safety regulations (Food Safety Act 1990 and assimilated EU law). Import controls apply for certain categories." },
    { name: "United States", isoCode: "US", iso3Code: "USA", currency: "USD", region: "Americas", subRegion: "Northern America", flag: "🇺🇸", customsAuthority: "U.S. Customs and Border Protection (CBP)", foodAuthority: "Food and Drug Administration (FDA)", importAuthority: "CBP / FDA", officialWebsite: "https://www.fda.gov/food/importing-food", importNotes: "All food must be registered with FDA. Prior Notice required before shipment. Facility registration mandatory. FSMA compliance required. Some products may require FDA examination." },
    { name: "Canada", isoCode: "CA", iso3Code: "CAN", currency: "CAD", region: "Americas", subRegion: "Northern America", flag: "🇨🇦", customsAuthority: "Canada Border Services Agency (CBSA)", foodAuthority: "Canadian Food Inspection Agency (CFIA)", importAuthority: "CBSA / CFIA", officialWebsite: "https://www.inspection.gc.ca", importNotes: "Food imports governed by Safe Food for Canadians Act (SFCA). Import license may be required. Bilingual labeling (English and French) is mandatory for most products." },
    { name: "Australia", isoCode: "AU", iso3Code: "AUS", currency: "AUD", region: "Oceania", subRegion: "Australia and New Zealand", flag: "🇦🇺", customsAuthority: "Australian Border Force (ABF)", foodAuthority: "Food Standards Australia New Zealand (FSANZ)", importAuthority: "ABF / Department of Agriculture", officialWebsite: "https://www.agriculture.gov.au/biosecurity-trade/import", importNotes: "Australia has strict biosecurity laws. Many food items are prohibited or require permits. All food must meet Australia New Zealand Food Standards Code. Goods may be inspected on arrival." },
    { name: "United Arab Emirates", isoCode: "AE", iso3Code: "ARE", currency: "AED", region: "Asia", subRegion: "Western Asia", flag: "🇦🇪", customsAuthority: "Federal Customs Authority", foodAuthority: "Abu Dhabi Agriculture and Food Safety Authority (ADAFSA)", importAuthority: "Ministry of Climate Change and Environment", officialWebsite: "https://www.adafsa.gov.ae", importNotes: "Halal certification is mandatory for all meat and poultry products. Food labeling must be in Arabic. Products must have a minimum 6-month shelf life on arrival. Registration with MOIAT required for some products." },
    { name: "Germany", isoCode: "DE", iso3Code: "DEU", currency: "EUR", region: "Europe", subRegion: "Western Europe", flag: "🇩🇪", customsAuthority: "Zoll (German Customs)", foodAuthority: "Bundesamt für Verbraucherschutz und Lebensmittelsicherheit (BVL)", importAuthority: "German Customs / BVL", officialWebsite: "https://www.bvl.bund.de", importNotes: "As EU member, subject to EU food import regulations. Food must comply with EC regulations on food safety (178/2002). German language labeling required for retail products. EU novel food regulations apply." },
    { name: "Singapore", isoCode: "SG", iso3Code: "SGP", currency: "SGD", region: "Asia", subRegion: "South-eastern Asia", flag: "🇸🇬", customsAuthority: "Singapore Customs", foodAuthority: "Singapore Food Agency (SFA)", importAuthority: "SFA / Singapore Customs", officialWebsite: "https://www.sfa.gov.sg", importNotes: "All food imports must comply with Singapore Food Regulations. SFA import permit required for certain food products. Food additives must comply with Singapore Food Regulations. Halal certification accepted." },
    { name: "Japan", isoCode: "JP", iso3Code: "JPN", currency: "JPY", region: "Asia", subRegion: "Eastern Asia", flag: "🇯🇵", customsAuthority: "Japan Customs", foodAuthority: "Ministry of Health, Labour and Welfare (MHLW)", importAuthority: "Japan Customs / MHLW", officialWebsite: "https://www.mhlw.go.jp/english/topics/importedfoods/", importNotes: "Food imports governed by Food Sanitation Act. Notification to MHLW required. Japanese labeling required for all food products sold domestically. Strict pesticide residue standards apply." },
    { name: "India", isoCode: "IN", iso3Code: "IND", currency: "INR", region: "Asia", subRegion: "Southern Asia", flag: "🇮🇳", customsAuthority: "Central Board of Indirect Taxes and Customs (CBIC)", foodAuthority: "Food Safety and Standards Authority of India (FSSAI)", importAuthority: "CBIC / FSSAI", officialWebsite: "https://www.fssai.gov.in", importNotes: "All food imports require FSSAI import clearance. Importer must be FSSAI registered. All consignments tested at port of entry. Some products may face higher import duties (up to 100%). Labeling must meet FSSAI standards." },
    { name: "Qatar", isoCode: "QA", iso3Code: "QAT", currency: "QAR", region: "Asia", subRegion: "Western Asia", flag: "🇶🇦", customsAuthority: "General Customs Authority Qatar", foodAuthority: "Ministry of Public Health (MOPH)", importAuthority: "MOPH / General Customs Authority", officialWebsite: "https://www.moph.gov.qa", importNotes: "Halal certification mandatory for all meat and poultry. Products must have minimum 6 months shelf life. Arabic labeling required. Health certificate from origin country required for food products." },
    { name: "France", isoCode: "FR", iso3Code: "FRA", currency: "EUR", region: "Europe", subRegion: "Western Europe", flag: "🇫🇷", customsAuthority: "Direction Générale des Douanes (DGDDI)", foodAuthority: "Agence nationale de sécurité sanitaire (ANSES)", importAuthority: "DGDDI / ANSES", officialWebsite: "https://www.douane.gouv.fr", importNotes: "EU food safety regulations apply. French language labeling required for retail. Novel food authorization needed for new ingredients. Strict controls on plant-based products." },
    { name: "Netherlands", isoCode: "NL", iso3Code: "NLD", currency: "EUR", region: "Europe", subRegion: "Western Europe", flag: "🇳🇱", customsAuthority: "Dutch Customs (Douane)", foodAuthority: "Netherlands Food and Consumer Product Safety Authority (NVWA)", importAuthority: "NVWA / Dutch Customs", importNotes: "Major EU hub for food imports. EU food safety regulations fully apply. Port of Rotterdam is main entry point. Dutch labeling for retail. NVWA may inspect shipments." },
    { name: "Saudi Arabia", isoCode: "SA", iso3Code: "SAU", currency: "SAR", region: "Asia", subRegion: "Western Asia", flag: "🇸🇦", customsAuthority: "Zakat, Tax and Customs Authority (ZATCA)", foodAuthority: "Saudi Food & Drug Authority (SFDA)", importAuthority: "SFDA / ZATCA", officialWebsite: "https://www.sfda.gov.sa", importNotes: "Halal certification is MANDATORY for all food products. Must be certified by SFDA-approved Halal certification bodies. Arabic labeling required. Pork and alcohol prohibited. Products must comply with SFDA standards." },
    { name: "New Zealand", isoCode: "NZ", iso3Code: "NZL", currency: "NZD", region: "Oceania", subRegion: "Australia and New Zealand", flag: "🇳🇿", customsAuthority: "New Zealand Customs Service", foodAuthority: "Food Standards Australia New Zealand (FSANZ)", importAuthority: "MPI / NZ Customs", importNotes: "Strict biosecurity rules similar to Australia. MPI import permit required for many food items. Must comply with FSANZ Food Standards Code. Biosecurity declaration required. Some plant-based products require inspection." },
  ];

  const countryMap: Record<string, string> = {};
  for (const cd of countryData) {
    const c = await prisma.country.upsert({
      where: { isoCode: cd.isoCode },
      update: {},
      create: { ...cd, isActive: true },
    });
    countryMap[cd.isoCode] = c.id;
  }

  console.log("✅ Created countries");

  // Clear out the old, uncited regulation set for these countries before
  // reseeding — createRegs() below only adds rows that don't already exist
  // by title, so without this the old unsourced entries would linger
  // alongside the new cited ones instead of being replaced by them.
  await prisma.regulation.deleteMany({ where: { countryId: { in: Object.values(countryMap) } } });
  console.log("✅ Cleared previous regulation set (replacing with cited data)");

  // ─── REGULATIONS ─────────────────────────────────────────────────────────────
  // Every entry below is backed by a real, independently checkable source —
  // see sourceAuthority/sourceUrl on each regulation. Researched via live web
  // search; verify against the cited source before relying on this for an
  // actual shipment, as regulations change and this is not legal advice.

  // UK Regulations
  if (countryMap["GB"]) {
    await createRegs(countryMap["GB"], [
      { category: "LABELING", title: "UK Food Labelling and Packaging Requirements", description: "Pre-packaged food must display product name, ingredients list, net quantity, best-before/use-by date, storage conditions, name and address of the food business operator, and country of origin.", requirement: "Compliant label with all mandatory information in English", severity: "HIGH", sourceAuthority: "UK Government (GOV.UK)", sourceUrl: "https://www.gov.uk/food-labelling-and-packaging" },
      { category: "LABELING", title: "Allergen Labelling — 14 Regulated Allergens", description: "The 14 UK-regulated allergens (including gluten, crustaceans, eggs, fish, peanuts, soybeans, milk, nuts, celery, mustard, sesame, sulphites, lupin, molluscs) must be emphasised — bold, italic, or contrasting background — every time they appear in the ingredients list.", requirement: "Emphasise allergens in the ingredient list per FSA guidance", severity: "HIGH", sourceAuthority: "Food Standards Agency (FSA)", sourceUrl: "https://www.food.gov.uk/business-guidance/allergen-labelling-for-food-manufacturers" },
      { category: "DOCUMENTATION", title: "IPAFFS Pre-Notification for Food Imports", description: "Consignments of food and feed not of animal origin entering Great Britain must be pre-notified via IPAFFS (Import of Products, Animals, Food and Feed System) before arrival — at least 4 hours ahead for high-risk food/feed not of animal origin.", requirement: "Submit IPAFFS pre-notification before arrival", severity: "HIGH", sourceAuthority: "UK Government / DEFRA", sourceUrl: "https://www.gov.uk/guidance/import-of-products-animals-food-and-feed-system" },
      { category: "CUSTOMS", title: "Developing Countries Trading Scheme (DCTS)", description: "Sri Lanka is an Enhanced Preferences beneficiary under the UK's Developing Countries Trading Scheme (replaced GSP in 2023), giving zero-duty access on the large majority of tariff lines.", requirement: "Claim DCTS preference with valid proof of origin", severity: "LOW", sourceAuthority: "UK Parliament — House of Commons Library", sourceUrl: "https://researchbriefings.files.parliament.uk/documents/CBP-9994/CBP-9994.pdf" },
    ]);

    await prisma.countryCertificate.upsert({ where: { countryId_certificateId_productCategory: { countryId: countryMap["GB"], certificateId: certs.coo.id, productCategory: "all" } }, update: {}, create: { countryId: countryMap["GB"], certificateId: certs.coo.id, isMandatory: true } });
    await prisma.countryCertificate.upsert({ where: { countryId_certificateId_productCategory: { countryId: countryMap["GB"], certificateId: certs.health.id, productCategory: "dry-fish" } }, update: {}, create: { countryId: countryMap["GB"], certificateId: certs.health.id, isMandatory: true, productCategory: "dry-fish" } });
  }

  // USA Regulations
  if (countryMap["US"]) {
    await createRegs(countryMap["US"], [
      { category: "DOCUMENTATION", title: "FDA Prior Notice of Imported Foods", description: "Under the Public Health Security and Bioterrorism Preparedness and Response Act of 2002, FDA must receive advance Prior Notice of every food shipment before it arrives — no more than 15 days ahead via FDA's PNSI system, or 30 days via CBP ABI/ACE/ITDS.", requirement: "Submit FDA Prior Notice before shipment arrival", severity: "CRITICAL", sourceAuthority: "U.S. Food and Drug Administration (FDA)", sourceUrl: "https://www.fda.gov/industry/fda-import-process/prior-notice-imported-foods" },
      { category: "CERTIFICATION", title: "FDA Food Facility Registration (Biennial)", description: "Foreign facilities that manufacture, process, pack, or hold food for U.S. consumption must register with FDA and renew every two years (Oct 1 – Dec 31 of even-numbered years). An expired registration is treated as a failure to register.", requirement: "Maintain a current, unexpired FDA facility registration number", severity: "CRITICAL", sourceAuthority: "U.S. FDA", sourceUrl: "https://www.fda.gov/food/registration-food-facilities-and-other-submissions/online-registration-food-facilities" },
      { category: "LABELING", title: "FALCPA Allergen Labeling — 9 Major Allergens", description: "The Food Allergen Labeling and Consumer Protection Act requires declaration, by name, of milk, eggs, fish, crustacean shellfish, tree nuts, wheat, peanuts, soybeans, and (since Jan 2023, per the FASTER Act) sesame.", requirement: "Declare all 9 major allergens by name on the label", severity: "HIGH", sourceAuthority: "U.S. FDA", sourceUrl: "https://www.fda.gov/food/nutrition-food-labeling-and-critical-foods/food-allergies" },
      { category: "CUSTOMS", title: "US Tariff Classification (HTS)", description: "Goods must be classified under the correct Harmonized Tariff Schedule (HTS) code; Sri Lanka may qualify for preferential duty treatment on certain eligible product lines.", requirement: "Correct HTS classification and origin documentation", severity: "MEDIUM" },
    ]);

    await prisma.countryCertificate.upsert({ where: { countryId_certificateId_productCategory: { countryId: countryMap["US"], certificateId: certs.fda.id, productCategory: "all" } }, update: {}, create: { countryId: countryMap["US"], certificateId: certs.fda.id, isMandatory: true } });
    await prisma.countryCertificate.upsert({ where: { countryId_certificateId_productCategory: { countryId: countryMap["US"], certificateId: certs.coo.id, productCategory: "all" } }, update: {}, create: { countryId: countryMap["US"], certificateId: certs.coo.id, isMandatory: true } });
  }

  // Australia Regulations
  if (countryMap["AU"]) {
    await createRegs(countryMap["AU"], [
      { category: "PROHIBITED", title: "Khapra Beetle Urgent Actions — Seeds & Dried Chilli", description: "As an active biosecurity measure against khapra beetle, whole cumin, coriander, and fennel seeds, and dried chillies/capsicum, are NOT PERMITTED entry and will be destroyed on arrival — unless the goods are commercially manufactured/packaged and retorted, blanched, roasted, fried, boiled, malted, pasteurised, or frozen. Raw/whole dried product does not qualify for the exclusion.", requirement: "Product must meet a khapra beetle processing exclusion (commercially retorted/blanched/roasted/fried/boiled/malted/pasteurised) or it will be destroyed at the border", severity: "CRITICAL", isProhibition: true, productCategory: "spices", sourceAuthority: "Australian Department of Agriculture, Fisheries and Forestry (DAFF)", sourceUrl: "https://www.agriculture.gov.au/biosecurity-trade/pests-diseases-weeds/plant/identify/khapra-beetle/plant-products" },
      { category: "FOOD_IMPORT", title: "Biosecurity Import Conditions (BICON)", description: "All food imports are subject to the Biosecurity Act 2015. Conditions vary by product and must be checked individually in BICON (Biosecurity Import Conditions system); high-risk goods may be inspected, treated, or refused entry.", requirement: "Check current conditions in BICON before shipping; biosecurity declaration and import permit where required", severity: "CRITICAL", sourceAuthority: "DAFF", sourceUrl: "https://bicon.agriculture.gov.au/" },
      { category: "CERTIFICATION", title: "Phytosanitary Certificate for Herbs & Spices", description: "Herbs and dried, ground spices/spice mixes may require a phytosanitary certificate to be permitted entry — the exact requirement depends on the specific product per BICON.", requirement: "Phytosanitary certificate where BICON requires it", severity: "HIGH", sourceAuthority: "DAFF", sourceUrl: "https://www.agriculture.gov.au/biosecurity-trade/import/goods/food" },
      { category: "LABELING", title: "Australian Food Labelling Requirements", description: "Labels must be in English and include product name, ingredient list with allergens, country of origin, net quantity, best-before date, storage conditions, and nutrition information panel, per the FSANZ Food Standards Code.", requirement: "English label with Country of Origin Labelling (COOL)", severity: "HIGH", sourceAuthority: "Food Standards Australia New Zealand (FSANZ)" },
    ]);

    await prisma.countryCertificate.upsert({ where: { countryId_certificateId_productCategory: { countryId: countryMap["AU"], certificateId: certs.fsanz.id, productCategory: "all" } }, update: {}, create: { countryId: countryMap["AU"], certificateId: certs.fsanz.id, isMandatory: true } });
    await prisma.countryCertificate.upsert({ where: { countryId_certificateId_productCategory: { countryId: countryMap["AU"], certificateId: certs.coo.id, productCategory: "all" } }, update: {}, create: { countryId: countryMap["AU"], certificateId: certs.coo.id, isMandatory: true } });
    await prisma.countryCertificate.upsert({ where: { countryId_certificateId_productCategory: { countryId: countryMap["AU"], certificateId: certs.health.id, productCategory: "dry-fish" } }, update: {}, create: { countryId: countryMap["AU"], certificateId: certs.health.id, isMandatory: true, productCategory: "dry-fish", notes: "Required for all seafood imports" } });
  }

  // UAE Regulations
  if (countryMap["AE"]) {
    await createRegs(countryMap["AE"], [
      { category: "HALAL", title: "Halal Certification (Meat, Poultry & Animal-Derived Ingredients)", description: "Halal certification is mandatory for all meat and poultry products, and for products containing animal-derived ingredients (including gelatine, enzymes, certain colourings) or marketed as halal. Cabinet Resolution No. 10 of 2014 requires a certificate from an MOIAT-recognized certification body.", requirement: "Valid Halal certificate from an MOIAT-recognized certification body", severity: "CRITICAL", productCategory: "meat", sourceAuthority: "UAE Ministry of Industry and Advanced Technology (MOIAT)", sourceUrl: "https://moiat.gov.ae/en/programs/halal" },
      { category: "PROHIBITED", title: "Pork and Alcohol Restrictions", description: "Import of live swine is strictly prohibited; pork-containing products require special permits and are confined to designated non-Muslim retail sections. Alcohol is generally not permitted as a food additive except where naturally occurring. Trading in pork/alcohol products without a licence is a criminal offence under UAE Sharia-based food law.", requirement: "No pork or alcohol content without an explicit special-category permit", severity: "CRITICAL", isProhibition: true, sourceAuthority: "UAE Federal Food Safety Law", sourceUrl: "https://food.chemlinked.com/foodpedia/united-arab-emirates-uae-food-regulation" },
      { category: "FOOD_IMPORT", title: "Prior Ministry Approval for First-Time Food Imports", description: "Article 8 of the UAE Food Safety Law prohibits importing any food product into the UAE for the first time unless it has been approved by the competent Ministry, and every food product must be registered on the ZAD system before market handling.", requirement: "ZAD product registration and ministry approval before first import", severity: "HIGH", sourceAuthority: "UAE Federal Food Safety Law / MOIAT ZAD system", sourceUrl: "https://moiat.gov.ae/en/programs/halal" },
      { category: "LABELING", title: "Arabic + English Labeling", description: "Food labels must carry Arabic text (Dubai Municipality accepts Arabic stickers) for product name, ingredient list, nutritional information, expiry date, country of origin, and storage instructions.", requirement: "Arabic label (sticker acceptable) alongside other languages", severity: "HIGH" },
    ]);

    await prisma.countryCertificate.upsert({ where: { countryId_certificateId_productCategory: { countryId: countryMap["AE"], certificateId: certs.halal.id, productCategory: "all" } }, update: {}, create: { countryId: countryMap["AE"], certificateId: certs.halal.id, isMandatory: true, notes: "Required for meat, poultry, and animal-derived ingredients" } });
    await prisma.countryCertificate.upsert({ where: { countryId_certificateId_productCategory: { countryId: countryMap["AE"], certificateId: certs.health.id, productCategory: "all" } }, update: {}, create: { countryId: countryMap["AE"], certificateId: certs.health.id, isMandatory: true } });
    await prisma.countryCertificate.upsert({ where: { countryId_certificateId_productCategory: { countryId: countryMap["AE"], certificateId: certs.coo.id, productCategory: "all" } }, update: {}, create: { countryId: countryMap["AE"], certificateId: certs.coo.id, isMandatory: true } });
  }

  // Canada Regulations
  if (countryMap["CA"]) {
    await createRegs(countryMap["CA"], [
      { category: "FOOD_IMPORT", title: "Safe Food for Canadians (SFC) Licence", description: "Commercial importers of food (manufactured foods sector included since 15 July 2020) must hold a valid Safe Food for Canadians licence, and the licence number must appear on the import declaration.", requirement: "Valid SFC licence number on import declaration", severity: "CRITICAL", sourceAuthority: "Canadian Food Inspection Agency (CFIA)", sourceUrl: "https://inspection.canada.ca/food-safety-for-industry/toolkit-for-food-businesses/licensing-of-food-businesses/eng/1427300844139/1427300914872" },
      { category: "LABELING", title: "Bilingual Labelling (English & French)", description: "The Consumer Packaging and Labelling Act and Safe Food for Canadians Regulations require mandatory label information in both English and French on pre-packaged food sold anywhere in Canada, subject to limited exemptions.", requirement: "Bilingual English/French label", severity: "HIGH", sourceAuthority: "CFIA", sourceUrl: "https://inspection.canada.ca/en/food-labels/labelling/labelling-legislative-framework" },
      { category: "DOCUMENTATION", title: "Import Documentation", description: "Commercial invoice, packing list, and Certificate of Origin required; CFIA may request additional documentation depending on food category.", requirement: "Complete customs and CFIA documentation package", severity: "MEDIUM" },
    ]);

    await prisma.countryCertificate.upsert({ where: { countryId_certificateId_productCategory: { countryId: countryMap["CA"], certificateId: certs.coo.id, productCategory: "all" } }, update: {}, create: { countryId: countryMap["CA"], certificateId: certs.coo.id, isMandatory: true } });
  }

  // Singapore Regulations
  if (countryMap["SG"]) {
    await createRegs(countryMap["SG"], [
      { category: "FOOD_IMPORT", title: "SFA Import Licence", description: "Importers must hold a Singapore Food Agency (SFA) licence to import food for sale; specific licences/registrations apply depending on food category.", requirement: "Valid SFA import licence", severity: "HIGH", sourceAuthority: "Singapore Food Agency (SFA)", sourceUrl: "https://www.sfa.gov.sg/food-import-export/commercial-imports/import-requirements-for-food-food-products" },
      { category: "LABELING", title: "SFA Food Labelling Requirements", description: "Imported food must meet SFA labelling requirements; where a manufacturer's label doesn't comply (common for multi-country packaging), importers may apply compliant sticker labels. The Food (Amendment) Regulations 2025 (effective 30 Jan 2026) updated labelling and additive requirements.", requirement: "SFA-compliant label, sticker labels permitted where needed", severity: "MEDIUM", sourceAuthority: "SFA", sourceUrl: "https://www.sfa.gov.sg/regulatory-standards-frameworks-guidelines/food-labelling-packaging-guidelines/labelling-requirements-for-food" },
    ]);
  }

  // Japan Regulations
  if (countryMap["JP"]) {
    await createRegs(countryMap["JP"], [
      { category: "RESTRICTED_INGREDIENTS", title: "Positive List System for Agricultural Chemical Residues", description: "Under the MHLW's Positive List System, foods containing agricultural chemical (pesticide, feed additive, veterinary drug) residues above established Maximum Residue Limits are barred from distribution. Where no MRL is set for a commodity, a uniform default limit of 0.01 mg/kg applies.", requirement: "Residues within established or 0.01 mg/kg default MRL", severity: "HIGH", sourceAuthority: "Japan Ministry of Health, Labour and Welfare (MHLW)", sourceUrl: "https://www.mhlw.go.jp/english/topics/foodsafety/positivelist060228/introduction.html" },
      { category: "FOOD_IMPORT", title: "Food Sanitation Act — Import Notification", description: "Every food import consignment must be notified to the quarantine station at the port of entry; consignments in violation of MRLs or other Food Sanitation Act standards are barred from entering Japan at the port.", requirement: "Import notification to quarantine station before/at arrival", severity: "HIGH", sourceAuthority: "MHLW" },
      { category: "LABELING", title: "Japanese Language Labeling", description: "Food sold at retail in Japan must be labelled in Japanese, including product name, ingredient list, allergens, nutrition information, expiry date, and storage conditions.", requirement: "Japanese-language label for retail sale", severity: "HIGH" },
    ]);
  }

  // India Regulations
  if (countryMap["IN"]) {
    await createRegs(countryMap["IN"], [
      { category: "FOOD_IMPORT", title: "FSSAI Central License (Importer)", description: "Every food importer must hold a valid FSSAI Central License with 'Importer' as the registered Kind of Business — there is no exemption for small or one-time imports. Each consignment is cleared individually through the Food Import Clearance System (FICS).", requirement: "FSSAI Central License (Importer) + FICS clearance per consignment", severity: "CRITICAL", sourceAuthority: "Food Safety and Standards Authority of India (FSSAI)", sourceUrl: "https://www.india-briefing.com/news/food-import-procedure-india-fssai-steps-reforms-29980.html/" },
      { category: "DOCUMENTATION", title: "Phytosanitary Certificate for Spice Consignments", description: "Spice shipments require a Phytosanitary Certificate issued by India's National Plant Protection Organisation (NPPO) confirming the consignment is free of regulated pests — required by virtually all importing countries, and required for FSSAI clearance on the India side for products of plant origin.", requirement: "NPPO Phytosanitary Certificate for spice/plant-origin consignments", severity: "HIGH", sourceAuthority: "FSSAI / India NPPO", sourceUrl: "https://www.drabaventures.com/blog/how-to-import-spices-from-india-documentation" },
      { category: "CUSTOMS", title: "Basic Customs Duty + IGST", description: "Basic Customs Duty on food products ranges from 0% to 100% depending on HS classification, with IGST and Social Welfare Surcharge assessed additionally.", requirement: "Budget for BCD (0–100%) + IGST + Social Welfare Surcharge based on HS code", severity: "HIGH", sourceAuthority: "India Central Board of Indirect Taxes and Customs (CBIC)" },
    ]);
  }

  // Saudi Arabia Regulations
  if (countryMap["SA"]) {
    await createRegs(countryMap["SA"], [
      { category: "FOOD_IMPORT", title: "SFDA Food Product Registration", description: "All food products must be registered with the Saudi Food and Drug Authority prior to import; registration is the importer's responsibility and is valid for 5 years, renewable on expiry. Required submission includes ingredients, country of origin, shelf life, label, testing report, and Halal certificate.", requirement: "Valid SFDA product registration (5-year validity)", severity: "CRITICAL", sourceAuthority: "Saudi Food and Drug Authority (SFDA)", sourceUrl: "https://www.sfda.gov.sa/en/imported-food" },
      { category: "HALAL", title: "Halal Certification — Animal-Derived Foods", description: "Halal certification is mandatory for animal-derived foods, beverages, and additives, and must originate from a certification body designated by the SFDA's Halal Center.", requirement: "Halal certificate from an SFDA-designated certification body", severity: "CRITICAL", sourceAuthority: "SFDA", sourceUrl: "https://www.sfda.gov.sa/en/imported-food" },
      { category: "PROHIBITED", title: "Pork and Alcohol Prohibition", description: "Products containing pork, pork derivatives, or alcohol are prohibited from import into Saudi Arabia.", requirement: "Product must be free of pork and alcohol content", severity: "CRITICAL", isProhibition: true, sourceAuthority: "SFDA", sourceUrl: "https://www.sfda.gov.sa/sites/default/files/2022-03/SFDAFood4654E.pdf" },
      { category: "LABELING", title: "Arabic Labeling Required", description: "Food labels must be in Arabic; other languages may be included as a supplement but Arabic is mandatory.", requirement: "Arabic-language label with all mandatory information", severity: "HIGH" },
    ]);

    await prisma.countryCertificate.upsert({ where: { countryId_certificateId_productCategory: { countryId: countryMap["SA"], certificateId: certs.halal.id, productCategory: "all" } }, update: {}, create: { countryId: countryMap["SA"], certificateId: certs.halal.id, isMandatory: true, notes: "Required for animal-derived foods, beverages, and additives" } });
    await prisma.countryCertificate.upsert({ where: { countryId_certificateId_productCategory: { countryId: countryMap["SA"], certificateId: certs.health.id, productCategory: "all" } }, update: {}, create: { countryId: countryMap["SA"], certificateId: certs.health.id, isMandatory: true } });
  }

  // Germany Regulations (EU)
  if (countryMap["DE"]) {
    await createRegs(countryMap["DE"], [
      { category: "LABELING", title: "EU Food Information to Consumers (FIC) Regulation", description: "Regulation (EU) No 1169/2011 requires, at minimum: product name, ingredient declaration, emphasised allergens, nutrition declaration, net quantity, date of minimum durability, storage conditions, food business operator name/address, and country of origin where relevant. Retail labels must be in German.", requirement: "German-language label compliant with EU FIC Regulation 1169/2011", severity: "HIGH", sourceAuthority: "European Commission / EUR-Lex", sourceUrl: "https://eur-lex.europa.eu/eli/reg/2011/1169/oj/eng" },
      { category: "DOCUMENTATION", title: "CHED-D Pre-Notification via TRACES NT", description: "High-risk food/feed of non-animal origin from third countries requires a Common Health Entry Document (CHED-D), submitted via the EU's TRACES NT system, at least one day before the consignment's estimated arrival.", requirement: "CHED-D pre-notification via TRACES NT, ≥1 day before arrival", severity: "HIGH", sourceAuthority: "European Commission — Food Safety", sourceUrl: "https://food.ec.europa.eu/horizontal-topics/official-controls-and-enforcement/import-controls-food-and-feed-qas_en" },
      { category: "CUSTOMS", title: "EU GSP+ Preferential Tariff", description: "Sri Lanka is a beneficiary of the EU's GSP+ scheme, granting 0% duty on a wide range of eligible products including spices and tea, subject to correct classification and proof of origin.", requirement: "Correct HS classification and valid proof of origin", severity: "LOW" },
    ]);

    await prisma.countryCertificate.upsert({ where: { countryId_certificateId_productCategory: { countryId: countryMap["DE"], certificateId: certs.coo.id, productCategory: "all" } }, update: {}, create: { countryId: countryMap["DE"], certificateId: certs.coo.id, isMandatory: true } });
  }

  // France Regulations (EU)
  if (countryMap["FR"]) {
    await createRegs(countryMap["FR"], [
      { category: "LABELING", title: "EU FIC Regulation — French Labelling", description: "Regulation (EU) No 1169/2011 applies EU-wide; French retail labels must be in French and include product name, ingredients, emphasised allergens, net quantity, and dates.", requirement: "French-language label compliant with EU FIC Regulation", severity: "HIGH", sourceAuthority: "European Commission / EUR-Lex", sourceUrl: "https://eur-lex.europa.eu/eli/reg/2011/1169/oj/eng" },
      { category: "DOCUMENTATION", title: "CHED-D Pre-Notification via TRACES NT", description: "High-risk food/feed of non-animal origin from third countries requires a CHED-D submitted via TRACES NT at least one day before arrival at any EU border, including French ports.", requirement: "CHED-D pre-notification via TRACES NT, ≥1 day before arrival", severity: "HIGH", sourceAuthority: "European Commission — Food Safety", sourceUrl: "https://food.ec.europa.eu/horizontal-topics/official-controls-and-enforcement/import-controls-food-and-feed-qas_en" },
      { category: "CUSTOMS", title: "EU GSP+ Preferential Tariff", description: "Sri Lanka benefits from the EU GSP+ scheme, granting reduced or zero duty on many products with valid proof of origin.", requirement: "Correct HS classification and valid proof of origin", severity: "LOW" },
    ]);

    await prisma.countryCertificate.upsert({ where: { countryId_certificateId_productCategory: { countryId: countryMap["FR"], certificateId: certs.coo.id, productCategory: "all" } }, update: {}, create: { countryId: countryMap["FR"], certificateId: certs.coo.id, isMandatory: true } });
    await prisma.countryCertificate.upsert({ where: { countryId_certificateId_productCategory: { countryId: countryMap["FR"], certificateId: certs.phyto.id, productCategory: "spices" } }, update: {}, create: { countryId: countryMap["FR"], certificateId: certs.phyto.id, isMandatory: true, productCategory: "spices" } });
  }

  // Netherlands Regulations (EU)
  if (countryMap["NL"]) {
    await createRegs(countryMap["NL"], [
      { category: "LABELING", title: "EU FIC Regulation — Dutch Labelling", description: "Regulation (EU) No 1169/2011 applies; retail labels sold in the Netherlands must be in Dutch and include product name, ingredients with emphasised allergens, net quantity, and dates.", requirement: "Dutch-language label compliant with EU FIC Regulation", severity: "MEDIUM", sourceAuthority: "European Commission / EUR-Lex", sourceUrl: "https://eur-lex.europa.eu/eli/reg/2011/1169/oj/eng" },
      { category: "DOCUMENTATION", title: "CHED-D Pre-Notification via TRACES NT", description: "High-risk food/feed of non-animal origin from third countries requires a CHED-D submitted via TRACES NT at least one day before arrival — a large share of EU food imports clear through Rotterdam.", requirement: "CHED-D pre-notification via TRACES NT, ≥1 day before arrival", severity: "HIGH", sourceAuthority: "European Commission — Food Safety", sourceUrl: "https://food.ec.europa.eu/horizontal-topics/official-controls-and-enforcement/import-controls-food-and-feed-qas_en" },
      { category: "CUSTOMS", title: "EU GSP+ Preferential Tariff via Rotterdam", description: "As a major EU entry hub, standard EU tariff and VAT rules apply; Sri Lanka's GSP+ status may reduce or eliminate duty on qualifying products.", requirement: "Correct HS classification and valid proof of origin", severity: "LOW" },
    ]);

    await prisma.countryCertificate.upsert({ where: { countryId_certificateId_productCategory: { countryId: countryMap["NL"], certificateId: certs.coo.id, productCategory: "all" } }, update: {}, create: { countryId: countryMap["NL"], certificateId: certs.coo.id, isMandatory: true } });
  }

  // Qatar Regulations
  if (countryMap["QA"]) {
    await createRegs(countryMap["QA"], [
      { category: "HALAL", title: "Halal Certificate — Meat & Animal-Derived Products", description: "Imported meat requires a health certificate from the exporting country plus a Halal slaughter certificate from an approved Islamic centre; processed products with Halal claims (and their animal-derived raw materials) require a Halal certificate.", requirement: "Health certificate + Halal certificate for meat/animal-derived products", severity: "CRITICAL", productCategory: "meat", sourceAuthority: "Qatar Ministry of Public Health (MOPH)", sourceUrl: "https://qfrs.moph.gov.qa/Documents/Guideline%20for%20Importing%20Halal%20food%20English%202022.pdf" },
      { category: "FOOD_IMPORT", title: "GCC Shelf-Life Standard (GS 150)", description: "Qatar enforces GCC shelf-life standard GS 150/2013. Production and expiry dates must be printed on the original label by the manufacturer (stickers added after the fact are not accepted), and products must arrive with at least half of their shelf life remaining.", requirement: "Manufacturer-printed dates; ≥50% shelf life remaining on arrival", severity: "HIGH", sourceAuthority: "MOPH", sourceUrl: "https://qfrs.moph.gov.qa/Documents/Guideline%20for%20Importing%20Halal%20food%20English%202022.pdf" },
      { category: "LABELING", title: "Arabic Labeling Requirements", description: "Labels must be in Arabic (or Arabic/English) and include product/brand name, production and expiry dates in DD/MM/YYYY format (for shelf life ≤3 months), country of origin, manufacturer name/address, net weight in metric units, and ingredients in descending order.", requirement: "Arabic label with all mandatory fields, correct date format", severity: "HIGH", sourceAuthority: "Trade.gov — Qatar Country Commercial Guide", sourceUrl: "https://trade.gov/country-commercial-guides/qatar-labelingmarking-requirements" },
    ]);

    await prisma.countryCertificate.upsert({ where: { countryId_certificateId_productCategory: { countryId: countryMap["QA"], certificateId: certs.halal.id, productCategory: "all" } }, update: {}, create: { countryId: countryMap["QA"], certificateId: certs.halal.id, isMandatory: true, notes: "Required for meat and animal-derived products" } });
    await prisma.countryCertificate.upsert({ where: { countryId_certificateId_productCategory: { countryId: countryMap["QA"], certificateId: certs.health.id, productCategory: "all" } }, update: {}, create: { countryId: countryMap["QA"], certificateId: certs.health.id, isMandatory: true } });
  }

  // New Zealand Regulations
  if (countryMap["NZ"]) {
    await createRegs(countryMap["NZ"], [
      { category: "FOOD_IMPORT", title: "Import Health Standards (IHS)", description: "Unprocessed products cannot be imported into New Zealand unless an Import Health Standard has been developed and published by MPI, specifying the biosecurity requirements that must be met.", requirement: "Confirm an applicable Import Health Standard exists and is met", severity: "CRITICAL", sourceAuthority: "New Zealand Ministry for Primary Industries (MPI)", sourceUrl: "https://www.mpi.govt.nz/food-business/food-safety-codes-standards/australia-new-zealand-co-operation/developing-standards/" },
      { category: "CERTIFICATION", title: "Registered Food Importer Status", description: "Importers must be registered with MPI as a Registered Food Importer, meeting requirements for food safety, traceability, and record-keeping.", requirement: "MPI Registered Food Importer status", severity: "HIGH", sourceAuthority: "MPI" },
      { category: "FOOD_IMPORT", title: "FSANZ Food Standards Code", description: "Food sold in New Zealand must comply with the joint Australia New Zealand Food Standards Code (FSANZ), covering composition, contaminants, and microbiological limits.", requirement: "FSANZ compliance documentation", severity: "HIGH", sourceAuthority: "Food Standards Australia New Zealand (FSANZ)" },
    ]);

    await prisma.countryCertificate.upsert({ where: { countryId_certificateId_productCategory: { countryId: countryMap["NZ"], certificateId: certs.fsanz.id, productCategory: "all" } }, update: {}, create: { countryId: countryMap["NZ"], certificateId: certs.fsanz.id, isMandatory: true } });
    await prisma.countryCertificate.upsert({ where: { countryId_certificateId_productCategory: { countryId: countryMap["NZ"], certificateId: certs.coo.id, productCategory: "all" } }, update: {}, create: { countryId: countryMap["NZ"], certificateId: certs.coo.id, isMandatory: true } });
  }

  console.log("✅ Created regulations and certificates (real, cited sources)");

  // ─── TARIFFS ─────────────────────────────────────────────────────────────────
  const tariffData = [
    { countryIso: "GB", hsCode: "0904.22", importDuty: 0, vat: 20, notes: "UK DCTS - Sri Lanka eligible for 0% duty on spices" },
    { countryIso: "GB", hsCode: "0305.59", importDuty: 0, vat: 0, notes: "Dried fish zero-rated VAT in UK" },
    { countryIso: "US", hsCode: "0904.22", importDuty: 0, vat: 0, notes: "GSP eligible - 0% duty for qualifying Sri Lankan goods" },
    { countryIso: "US", hsCode: "0305.59", importDuty: 0, vat: 0, notes: "No federal sales tax" },
    { countryIso: "AU", hsCode: "0904.22", importDuty: 0, vat: 10, notes: "Free trade - 0% tariff. 10% GST applies" },
    { countryIso: "AE", hsCode: "0904.22", importDuty: 5, vat: 5, notes: "Standard 5% customs duty + 5% VAT" },
    { countryIso: "AE", hsCode: "1513.21", importDuty: 5, vat: 5, notes: "5% duty on vegetable oils" },
    { countryIso: "IN", hsCode: "0904.22", importDuty: 70, vat: 5, notes: "High import duty on processed spices + 5% GST" },
    { countryIso: "IN", hsCode: "0305.59", importDuty: 30, vat: 5, notes: "30% basic customs duty on dried fish" },
    { countryIso: "CA", hsCode: "0902.40", importDuty: 0, vat: 5, notes: "MFN rate 0% for tea. 5% GST" },
    { countryIso: "SG", hsCode: "0904.22", importDuty: 0, vat: 9, notes: "Singapore GST 9%. No import duty on spices" },
    { countryIso: "JP", hsCode: "0904.22", importDuty: 3, vat: 10, notes: "3% MFN duty + 10% consumption tax" },
    { countryIso: "SA", hsCode: "0904.22", importDuty: 5, vat: 15, notes: "5% customs duty + 15% VAT" },
  ];

  for (const t of tariffData) {
    const countryId = countryMap[t.countryIso];
    if (!countryId) continue;
    const existing = await prisma.tariff.findFirst({ where: { countryId, hsCode: t.hsCode } });
    if (!existing) {
      await prisma.tariff.create({
        data: { countryId, hsCode: t.hsCode, importDuty: t.importDuty, vat: t.vat, notes: t.notes },
      });
    }
  }

  console.log("✅ Created tariffs");

  // ─── RESTRICTIONS (Product-level) ─────────────────────────────────────────────
  // Find dry fish product IDs
  const dryFishSprats = await prisma.product.findFirst({ where: { sku: "JB-DF-001" } });
  const dryFishMullet = await prisma.product.findFirst({ where: { sku: "JB-DF-002" } });
  const dryFishMaldive = await prisma.product.findFirst({ where: { sku: "JB-DF-003" } });

  if (countryMap["AU"] && dryFishSprats) {
    const existing = await prisma.restriction.findFirst({ where: { countryId: countryMap["AU"], productId: dryFishSprats.id } });
    if (!existing) {
      await prisma.restriction.create({ data: { countryId: countryMap["AU"], productId: dryFishSprats.id, riskLevel: "YELLOW", reason: "Dried fish imports to Australia require specific biosecurity permits and health certificates from competent authorities", condition: "Import permit from DAFF required. Must be accompanied by health certificate from Sri Lankan Ministry of Fisheries", requiresPermit: true, permitAuthority: "Department of Agriculture, Fisheries and Forestry (DAFF)" } });
    }
  }

  if (countryMap["JP"] && dryFishMaldive) {
    const existing = await prisma.restriction.findFirst({ where: { countryId: countryMap["JP"], productId: dryFishMaldive.id } });
    if (!existing) {
      await prisma.restriction.create({ data: { countryId: countryMap["JP"], productId: dryFishMaldive.id, riskLevel: "YELLOW", reason: "Dried fish to Japan subject to inspection under Food Sanitation Act. May require official laboratory testing", condition: "Quarantine notification required. Product may be detained for inspection", requiresPermit: false } });
    }
  }

  console.log("✅ Created restrictions");

  // ─── REGULATION UPDATES ──────────────────────────────────────────────────────
  const gbReg = await prisma.regulation.findFirst({ where: { countryId: countryMap["GB"] } });
  const usReg = await prisma.regulation.findFirst({ where: { countryId: countryMap["US"] } });
  const aeReg = await prisma.regulation.findFirst({ where: { countryId: countryMap["AE"] } });

  if (gbReg) {
    await prisma.regulationUpdate.create({ data: { regulationId: gbReg.id, title: "UK IPAFFS Mandatory for Third Countries", description: "From January 2024, UK requires pre-notification via IPAFFS for all food of non-animal origin from third countries", changeType: "MODIFIED", source: "HMRC", effectiveDate: new Date("2024-01-31") } });
  }
  if (usReg) {
    await prisma.regulationUpdate.create({ data: { regulationId: usReg.id, title: "FSMA Foreign Supplier Verification Program Update", description: "FDA updated FSVP requirements. Importers must now maintain updated supplier records and conduct annual compliance reviews", changeType: "MODIFIED", source: "FDA", effectiveDate: new Date("2024-05-15") } });
  }
  if (aeReg) {
    await prisma.regulationUpdate.create({ data: { regulationId: aeReg.id, title: "UAE Halal Standard UAE.S 2055 Update", description: "UAE updated Halal food standards. New requirements for supply chain traceability for Halal products", changeType: "MODIFIED", source: "ESMA", effectiveDate: new Date("2024-03-01") } });
  }

  console.log("✅ Created regulation updates");
  console.log("\n🎉 Seed completed successfully!");
  console.log("\n📧 Demo login credentials:");
  console.log("  admin@jaffnabasket.com / Admin123! (Super Admin)");
  console.log("  manager@jaffnabasket.com / Admin123! (Company Admin)");
  console.log("  export@jaffnabasket.com / Admin123! (Export Manager)");
  console.log("  viewer@jaffnabasket.com / Admin123! (Viewer)");
}

async function createRegs(countryId: string, regulations: any[]) {
  for (const reg of regulations) {
    const existing = await prisma.regulation.findFirst({
      where: { country: { id: countryId }, title: reg.title },
    });
    if (!existing) {
      await prisma.regulation.create({
        data: {
          ...reg,
          productCategory: reg.productCategory || "all",
          country: { connect: { id: countryId } }
        },
      });
    }
  }
}

main()
  .catch((e) => { console.error("❌ Seed error:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
