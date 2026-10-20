import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { streamComplianceChat } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { messages, countryId, assessmentId } = body;

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
  }

  try {
    // Check if AI is configured
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey === "sk-or-v1-your-key-here") {
      // Return a helpful fallback response
      return NextResponse.json({
        content: `I'm the Jaffna Basket compliance assistant. To enable AI-powered responses, please add your OpenRouter API key in Settings.\n\nYou can get a free API key at: https://openrouter.ai\n\nFor now, I can tell you that the compliance data shown in your assessment is pulled directly from our regulation database. Please review the warnings and required documents in your assessment report.`,
      });
    }

    const stream = await streamComplianceChat(messages, countryId, assessmentId);

    // Stream the response
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || "";
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("AI chat error:", error);
    return NextResponse.json(
      { error: "AI service unavailable", content: "Unable to connect to AI service. Please check your API key in Settings." },
      { status: 500 }
    );
  }
}
