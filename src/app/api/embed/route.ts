import { NextResponse } from "next/server";

export const maxDuration = 60;

type Extractor = (
  texts: string[],
  options: { pooling: "mean"; normalize: boolean },
) => Promise<{ tolist(): number[][] }>;

let extractorPromise: Promise<Extractor> | null = null;

function getExtractor(): Promise<Extractor> {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      const { pipeline, env } = await import("@huggingface/transformers");
      env.cacheDir = `${process.cwd()}/.cache/transformers`;
      const pipe = await pipeline(
        "feature-extraction",
        "Xenova/multilingual-e5-small",
        { dtype: "q8" },
      );
      return pipe as unknown as Extractor;
    })().catch((error) => {
      extractorPromise = null;
      throw error;
    });
  }
  return extractorPromise;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const query =
    typeof (body as { query?: unknown })?.query === "string"
      ? ((body as { query: string }).query ?? "").trim()
      : "";
  if (query.length < 2 || query.length > 500) {
    return NextResponse.json(
      { error: "Query must be between 2 and 500 characters" },
      { status: 400 },
    );
  }

  try {
    const extractor = await getExtractor();
    const output = await extractor([`query: ${query}`], {
      pooling: "mean",
      normalize: true,
    });
    const embedding = output.tolist()[0];
    if (!Array.isArray(embedding) || embedding.length !== 384) {
      return NextResponse.json(
        { error: "Unexpected embedding shape" },
        { status: 500 },
      );
    }
    return NextResponse.json({ embedding, dimensions: embedding.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Embedding failed: ${message.slice(0, 300)}` },
      { status: 500 },
    );
  }
}
