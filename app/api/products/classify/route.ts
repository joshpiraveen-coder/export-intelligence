import { NextResponse } from "next/server";
import { ProductClassificationService } from "@/lib/engine";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: "Missing product name" }, { status: 400 });
    }

    const service = new ProductClassificationService();
    const classification = await service.classifyProduct(name, description || "");

    return NextResponse.json({
      success: true,
      data: classification
    });
  } catch (error) {
    console.error("Classification Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
