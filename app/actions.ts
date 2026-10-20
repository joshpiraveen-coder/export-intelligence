"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { analyzeCompliance, saveComplianceResults } from "@/lib/compliance-engine";

// ─── PRODUCT ACTIONS ───────────────────────────────────────────────────────────

export async function createProduct(data: any) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const companyId = (session.user as any).companyId;

  const product = await prisma.product.create({
    data: {
      name: data.name,
      sku: data.sku || null,
      barcode: data.barcode || null,
      description: data.description || null,
      companyId: companyId || null,
      categoryId: data.categoryId || null,
      manufacturer: data.manufacturer || null,
      countryOfOrigin: data.countryOfOrigin || null,
      ingredients: data.ingredients || null,
      nutritionInfo: data.nutritionInfo ? JSON.stringify(data.nutritionInfo) : null,
      foodCategory: data.foodCategory || null,
      shelfLifeDays: data.shelfLifeDays ? parseInt(data.shelfLifeDays) : null,
      storageConditions: data.storageConditions || null,
      isOrganic: Boolean(data.isOrganic),
      isVegan: Boolean(data.isVegan),
      isHalal: Boolean(data.isHalal),
      isGlutenFree: Boolean(data.isGlutenFree),
      packageType: data.packageType || null,
      packageMaterial: data.packageMaterial || null,
      weightGrams: data.weightGrams ? parseFloat(data.weightGrams) : null,
      dimensionsCm: data.dimensionsCm ? JSON.stringify(data.dimensionsCm) : null,
      qtyPerCarton: data.qtyPerCarton ? parseInt(data.qtyPerCarton) : null,
      hsCode: data.hsCode || null,
      customsDesc: data.customsDesc || null,
      exportCategory: data.exportCategory || null,
    },
  });

  // Log audit
  await prisma.auditLog.create({
    data: {
      userId: session.user.id!,
      action: "CREATE",
      entity: "Product",
      entityId: product.id,
      newValues: JSON.stringify({ name: product.name }),
    },
  });

  revalidatePath("/products");
  return { success: true, id: product.id };
}

export async function updateProduct(id: string, data: any) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  await prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      sku: data.sku || null,
      description: data.description || null,
      categoryId: data.categoryId || null,
      manufacturer: data.manufacturer || null,
      countryOfOrigin: data.countryOfOrigin || null,
      ingredients: data.ingredients || null,
      isOrganic: Boolean(data.isOrganic),
      isVegan: Boolean(data.isVegan),
      isHalal: Boolean(data.isHalal),
      isGlutenFree: Boolean(data.isGlutenFree),
      hsCode: data.hsCode || null,
      customsDesc: data.customsDesc || null,
    },
  });

  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  return { success: true };
}

export async function deleteProduct(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  await prisma.product.delete({ where: { id } });
  revalidatePath("/products");
  return { success: true };
}

// ─── ASSESSMENT ACTIONS ────────────────────────────────────────────────────────

export async function createAssessment(data: {
  title?: string;
  destinationId: string;
  originId?: string;
  products: Array<{ productId: string; quantity: number }>;
  bundleId?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Not authenticated" };

    const assessment = await prisma.exportAssessment.create({
      data: {
        title: data.title || "Export Assessment",
        userId: session.user.id!,
        companyId: (session.user as any)?.companyId || null,
        destinationId: data.destinationId,
        originId: data.originId || null,
        bundleId: data.bundleId || null,
        status: "ANALYZING",
        items: {
          create: (data.products || []).map((p) => ({
            productId: p.productId,
            quantity: p.quantity || 1,
          })),
        },
      },
    });

    // Run compliance engine — checks per-product Restriction records, isHalal,
    // and all regulation categories (labeling, certification, documentation,
    // packaging, customs, food import, prohibitions, restricted ingredients).
    try {
      const results = await analyzeCompliance({
        assessmentId: assessment.id,
        destinationCountryId: data.destinationId,
        originCountryId: data.originId,
        products: data.products,
      });
      await saveComplianceResults(assessment.id, results);
    } catch (engineError) {
      console.error("Compliance Engine Error:", engineError);
      await prisma.exportAssessment.update({
        where: { id: assessment.id },
        data: {
          status: "FAILED",
          notes: (engineError as Error).message || "Unknown engine error"
        },
      });
      // Do not throw so we can at least show the failed state
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id!,
        action: "CREATE",
        entity: "ExportAssessment",
        entityId: assessment.id,
      },
    });

    revalidatePath("/reports");
    return { success: true, id: assessment.id };
  } catch (globalError) {
    console.error("Create Assessment Global Error:", globalError);
    return { success: false, error: (globalError as Error).message || "Failed to create assessment" };
  }
}

export async function deleteAssessment(id: string) {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Not authenticated" };

    await prisma.exportAssessment.delete({ where: { id } });
    revalidatePath("/reports");
    return { success: true };
  } catch (error) {
    console.error("Delete Assessment Error:", error);
    return { success: false, error: (error as Error).message || "Failed to delete assessment" };
  }
}

// ─── REGISTER USER ─────────────────────────────────────────────────────────────

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
}) {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing) throw new Error("Email already registered");

  const hashedPassword = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: "VIEWER",
    },
  });

  return { success: true, id: user.id };
}

// ─── ADMIN ACTIONS ─────────────────────────────────────────────────────────────

export async function createRegulation(data: any) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");
  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN" && role !== "COMPANY_ADMIN") {
    throw new Error("Insufficient permissions");
  }

  const regulation = await prisma.regulation.create({
    data: {
      countryId: data.countryId,
      category: data.category,
      productCategory: data.productCategory || null,
      title: data.title,
      description: data.description,
      requirement: data.requirement || null,
      severity: data.severity || "MEDIUM",
      isProhibition: Boolean(data.isProhibition),
      effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : null,
      sourceAuthority: data.sourceAuthority || null,
      sourceUrl: data.sourceUrl || null,
      notes: data.notes || null,
    },
  });

  revalidatePath("/admin/regulations");
  return { success: true, id: regulation.id };
}

export async function createCountry(data: any) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");
  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN") throw new Error("Insufficient permissions");

  const country = await prisma.country.create({
    data: {
      name: data.name,
      isoCode: data.isoCode.toUpperCase(),
      iso3Code: data.iso3Code?.toUpperCase() || null,
      currency: data.currency || null,
      region: data.region || null,
      subRegion: data.subRegion || null,
      customsAuthority: data.customsAuthority || null,
      foodAuthority: data.foodAuthority || null,
      importAuthority: data.importAuthority || null,
      officialWebsite: data.officialWebsite || null,
      importNotes: data.importNotes || null,
      prohibitedItems: data.prohibitedItems || null,
    },
  });

  revalidatePath("/countries");
  revalidatePath("/admin/countries");
  return { success: true, id: country.id };
}

// ─── PRICING & COMMERCIAL INFO ─────────────────────────────────────────────────

export async function upsertProductPricing(productId: string, data: any) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");
  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN" && role !== "COMPANY_ADMIN") {
    throw new Error("Insufficient permissions");
  }

  const num = (v: any) => (v === "" || v === undefined || v === null ? null : parseFloat(v));
  const int = (v: any) => (v === "" || v === undefined || v === null ? null : parseInt(v));

  await prisma.productPricing.upsert({
    where: { productId },
    update: {
      retailPriceLKR: num(data.retailPriceLKR),
      wholesalePriceLKR: num(data.wholesalePriceLKR),
      distributorPriceLKR: num(data.distributorPriceLKR),
      exportFobPriceUsd: num(data.exportFobPriceUsd),
      cifPriceUsd: num(data.cifPriceUsd),
      moq: data.moq || null,
      bulkDiscountTiers: data.bulkDiscountTiers ? JSON.stringify(data.bulkDiscountTiers) : null,
      currency: data.currency || "LKR",
      vatRate: num(data.vatRate),
      productionCost: num(data.productionCost),
      profitMargin: num(data.profitMargin),
      seasonalAvailability: data.seasonalAvailability || null,
      leadTimeDays: int(data.leadTimeDays),
      monthlyCapacity: data.monthlyCapacity || null,
      annualCapacity: data.annualCapacity || null,
      paymentTerms: data.paymentTerms || null,
      acceptedPaymentMethods: data.acceptedPaymentMethods ? JSON.stringify(data.acceptedPaymentMethods) : null,
      supplierCode: data.supplierCode || null,
      batchCost: num(data.batchCost),
      lastPriceUpdated: new Date(),
      marketSegment: data.marketSegment || null,
    },
    create: {
      productId,
      retailPriceLKR: num(data.retailPriceLKR),
      wholesalePriceLKR: num(data.wholesalePriceLKR),
      distributorPriceLKR: num(data.distributorPriceLKR),
      exportFobPriceUsd: num(data.exportFobPriceUsd),
      cifPriceUsd: num(data.cifPriceUsd),
      moq: data.moq || null,
      bulkDiscountTiers: data.bulkDiscountTiers ? JSON.stringify(data.bulkDiscountTiers) : null,
      currency: data.currency || "LKR",
      vatRate: num(data.vatRate),
      productionCost: num(data.productionCost),
      profitMargin: num(data.profitMargin),
      seasonalAvailability: data.seasonalAvailability || null,
      leadTimeDays: int(data.leadTimeDays),
      monthlyCapacity: data.monthlyCapacity || null,
      annualCapacity: data.annualCapacity || null,
      paymentTerms: data.paymentTerms || null,
      acceptedPaymentMethods: data.acceptedPaymentMethods ? JSON.stringify(data.acceptedPaymentMethods) : null,
      supplierCode: data.supplierCode || null,
      batchCost: num(data.batchCost),
      lastPriceUpdated: new Date(),
      marketSegment: data.marketSegment || null,
    },
  });

  revalidatePath("/admin/pricing");
  revalidatePath(`/admin/pricing/${productId}`);
  return { success: true };
}

// ─── QUALITY ASSURANCE & TRACEABILITY ──────────────────────────────────────────

export async function createQualityRecord(productId: string, data: any) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");
  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN" && role !== "COMPANY_ADMIN") {
    throw new Error("Insufficient permissions");
  }

  const num = (v: any) => (v === "" || v === undefined || v === null ? null : parseFloat(v));
  const date = (v: any) => (v ? new Date(v) : null);

  const record = await prisma.productQualityRecord.create({
    data: {
      productId,
      batchNumber: data.batchNumber || null,
      manufacturingDate: date(data.manufacturingDate),
      expiryDate: date(data.expiryDate),
      bestBeforeDate: date(data.bestBeforeDate),
      productionLine: data.productionLine || null,
      factoryLocation: data.factoryLocation || null,
      plantRegistrationNumber: data.plantRegistrationNumber || null,
      inspectionStatus: data.inspectionStatus || "PENDING",
      qaInspector: data.qaInspector || null,
      microbiologicalResults: data.microbiologicalResults || null,
      heavyMetalResults: data.heavyMetalResults || null,
      pesticideResidueResults: data.pesticideResidueResults || null,
      moistureContent: num(data.moistureContent),
      waterActivity: num(data.waterActivity),
      phValue: num(data.phValue),
      brix: num(data.brix),
      packagingInspection: data.packagingInspection || null,
      metalDetectionStatus: data.metalDetectionStatus || null,
      recallStatus: data.recallStatus || "NONE",
      traceabilityQrCode: data.traceabilityQrCode || null,
      supplierTraceability: data.supplierTraceability || null,
      rawMaterialSource: data.rawMaterialSource || null,
      internalAuditStatus: data.internalAuditStatus || null,
      externalAuditStatus: data.externalAuditStatus || null,
      capaRecords: data.capaRecords ? JSON.stringify(data.capaRecords) : null,
      nonConformanceReports: data.nonConformanceReports ? JSON.stringify(data.nonConformanceReports) : null,
      labCertificateUrls: data.labCertificateUrls ? JSON.stringify(data.labCertificateUrls) : null,
      qaNotes: data.qaNotes || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id!,
      action: "CREATE",
      entity: "ProductQualityRecord",
      entityId: record.id,
    },
  });

  revalidatePath("/admin/quality");
  revalidatePath(`/admin/quality/${productId}`);
  return { success: true, id: record.id };
}

export async function deleteQualityRecord(id: string, productId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");
  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN" && role !== "COMPANY_ADMIN") {
    throw new Error("Insufficient permissions");
  }

  await prisma.productQualityRecord.delete({ where: { id } });
  revalidatePath(`/admin/quality/${productId}`);
  return { success: true };
}

// ─── ACCOUNT SETTINGS ───────────────────────────────────────────────────────────

export async function updateProfile(data: { name: string }) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");
  if (!data.name?.trim()) throw new Error("Name cannot be empty");

  await prisma.user.update({
    where: { id: session.user.id! },
    data: { name: data.name.trim() },
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function changePassword(data: { currentPassword: string; newPassword: string }) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  if (data.newPassword.length < 8) {
    throw new Error("New password must be at least 8 characters");
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id! } });
  if (!user?.password) throw new Error("No password set for this account");

  const isValid = await bcrypt.compare(data.currentPassword, user.password);
  if (!isValid) throw new Error("Current password is incorrect");

  const hashed = await bcrypt.hash(data.newPassword, 12);
  await prisma.user.update({
    where: { id: session.user.id! },
    data: { password: hashed },
  });

  return { success: true };
}

// ─── BUNDLES ────────────────────────────────────────────────────────────────────

export async function createBundle(data: {
  name: string;
  description?: string;
  productIds: string[];
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");
  if (!data.name?.trim()) throw new Error("Bundle name is required");
  if (!data.productIds || data.productIds.length === 0) {
    throw new Error("Select at least one product");
  }

  const companyId = (session.user as any).companyId;

  const bundle = await prisma.bundle.create({
    data: {
      name: data.name.trim(),
      description: data.description || null,
      companyId: companyId || null,
      items: {
        create: data.productIds.map((productId) => ({ productId, quantity: 1 })),
      },
    },
  });

  revalidatePath("/bundles");
  return { success: true, id: bundle.id };
}

export async function deleteBundle(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  await prisma.bundle.delete({ where: { id } });
  revalidatePath("/bundles");
  return { success: true };
}
