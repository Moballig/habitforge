import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

let client: ConvexHttpClient | null = null;

export function getConvexClient(): ConvexHttpClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
    if (!url) {
      throw new Error(
        "Missing NEXT_PUBLIC_CONVEX_URL environment variable for Next.js backend",
      );
    }
    client = new ConvexHttpClient(url);
  }
  return client;
}

export { api };

