import { NextResponse } from "next/server";
import { analyzeCompliance } from "@/lib/compliance-engine";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, destinationCountryId } = body;

    if (!productId || !destinationCountryId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const results = await analyzeCompliance({
      destinationCountryId,
      products: [{ productId, quantity: 1 }],
    });

    return NextResponse.json({
      success: true,
      data: {
        result: results.productResults[0] || null,
        combinedDocs: results.combinedDocs,
        combinedCertificates: results.combinedCertificates,
        bundleWarnings: results.bundleWarnings,
        recommendations: results.recommendations,
      },
    });

  } catch (error) {
    console.error("Compliance Check Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
