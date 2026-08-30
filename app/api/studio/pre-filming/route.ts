import { NextResponse } from "next/server";
import { generatePreFilmingPlan, type FounderContext } from "../../../../lib/pre-filming-llm";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, history = [], context = {} } = body as {
      message: string;
      history?: Array<{ role: "user" | "assistant"; content: string }>;
      context?: FounderContext;
    };

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const result = await generatePreFilmingPlan(message, history, context);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/studio/pre-filming] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to brainstorm pre-filming content" },
      { status: 500 }
    );
  }
}
