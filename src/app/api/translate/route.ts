import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { LANGUAGES } from "@/lib/languages";

const MODEL = process.env.GROQ_MODEL ?? "qwen/qwen3.8-27b";

export async function POST(request: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "伺服器未設定 GROQ_API_KEY,請在 .env.local 填入 API 金鑰" },
      { status: 500 }
    );
  }

  let body: { q?: string; source?: string; target?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "無效的請求格式" }, { status: 400 });
  }

  const { q, source, target } = body;
  if (!q || !source || !target) {
    return NextResponse.json(
      { error: "缺少必要參數 q / source / target" },
      { status: 400 }
    );
  }

  const langName = (code: string) =>
    LANGUAGES.find((l) => l.code === code)?.name ?? code;

  const sourceDesc =
    source === "auto" ? "the detected source language" : langName(source);
  const systemPrompt = [
    `You are a professional translation engine. Translate the user's text from ${sourceDesc} into ${langName(target)}.`,
    "Preserve the original formatting, line breaks, and tone.",
    "Output the translated text only. No explanations, no notes, no quotes.",
  ].join(" ");

  try {
    const groq = new Groq({ apiKey });
    const stream = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.3,
      max_completion_tokens: 2048,
      top_p: 1,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: q },
      ],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? "";
            if (text) controller.enqueue(encoder.encode(text));
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    const status = err instanceof Groq.APIError ? err.status : 502;
    const message = err instanceof Error ? err.message : "無法連線至翻譯服務";
    return NextResponse.json({ error: message }, { status });
  }
}
