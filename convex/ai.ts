"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

async function groqChat(prompt: string): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error("GROQ_API_KEY is not set on the Convex deployment");
  }
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq API ${res.status}: ${body.slice(0, 400)}`);
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Groq API returned an empty response");
  return text;
}

// ─── AI Coach Chat ────────────────────────────────────────

export const chat = action({
  args: {
    message: v.string(),
    habitData: v.optional(v.any()),
  },
  handler: async (_ctx, args) => {
    const systemPrompt = `You are HabitForge AI Coach — a friendly, motivating, and insightful habit coach. You help users build and maintain positive habits.

Your personality:
- Warm, encouraging, but honest
- Use emojis sparingly but effectively
- Give practical, actionable advice
- Keep responses concise (2-4 paragraphs max)
- Reference the user's actual habit data when available

User's current habit data:
${args.habitData ? JSON.stringify(args.habitData, null, 2) : "No habits tracked yet."}

Respond to the user's message helpfully. If they ask for habit suggestions, give specific, actionable ones. If they're struggling, be empathetic but solutions-focused. If they're doing well, celebrate their progress genuinely.`;

    const fullPrompt = `${systemPrompt}\n\nUser: ${args.message}`;

    try {
      const response = await groqChat(fullPrompt);
      return { response };
    } catch (error) {
      console.error("Coach action error:", error);
      const message = error instanceof Error ? error.message : String(error);
      return {
        error: message.includes("401")
          ? "Groq rejected the API key (401). Set a valid key: `bunx convex env set GROQ_API_KEY=<key>` (get one at https://console.groq.com/keys)."
          : `AI request failed: ${message.slice(0, 300)}`,
      };
    }
  },
});

// ─── AI Habit Suggestions ─────────────────────────────────

export const suggest = action({
  args: {
    goal: v.string(),
    existingHabits: v.optional(v.array(v.object({ name: v.string() }))),
  },
  handler: async (_ctx, args) => {
    const prompt = `You are an AI habit coach. The user wants to achieve this goal: "${args.goal}"

Their existing habits: ${
      args.existingHabits && args.existingHabits.length > 0
        ? args.existingHabits.map((h) => h.name).join(", ")
        : "None yet"
    }

Suggest 3-5 specific, actionable daily habits that will help them reach their goal. For each habit, suggest the most appropriate category from: health, fitness, mindfulness, productivity, learning, social, creativity, other.

Return ONLY a JSON array (no markdown, no code blocks) with this structure:
[
  {
    "name": "<specific habit name>",
    "description": "<why this habit helps>",
    "category": "<category>"
  }
]`;

    try {
      const text = await groqChat(prompt);

      try {
        const cleaned = text
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();
        const suggestions = JSON.parse(cleaned);
        return { suggestions };
      } catch {
        return {
          suggestions: [
            {
              name: "Start small with your goal",
              description: "Begin with just 5 minutes a day",
              category: "productivity",
            },
            {
              name: "Track your progress daily",
              description: "Reflection helps build consistency",
              category: "mindfulness",
            },
            {
              name: "Stay hydrated",
              description: "Water improves focus and energy",
              category: "health",
            },
          ],
        };
      }
    } catch (error) {
      console.error("Suggest action error:", error);
      const message = error instanceof Error ? error.message : String(error);
      return {
        error: message.includes("401")
          ? "Groq rejected the API key (401). Set a valid key: `bunx convex env set GROQ_API_KEY=<key>`."
          : `Suggestion request failed: ${message.slice(0, 300)}`,
      };
    }
  },
});

// ─── AI Habit Analysis ────────────────────────────────────

export const analyze = action({
  args: {
    habits: v.any(),
    logs: v.any(),
  },
  handler: async (_ctx, args) => {
    const prompt = `You are an AI habit analyst. Analyze the following habit tracking data and provide a concise weekly report.

Habit Data:
${JSON.stringify(args.habits, null, 2)}

Completion Logs:
${JSON.stringify(args.logs, null, 2)}

Provide a JSON response with exactly this structure (no markdown, no code blocks, just pure JSON):
{
  "overallScore": <number 0-100>,
  "summary": "<2-3 sentence overall summary>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<area 1>", "<area 2>"],
  "tip": "<one actionable tip for next week>",
  "motivation": "<a short motivational message>"
}`;

    try {
      const text = await groqChat(prompt);

      try {
        const cleaned = text
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();
        const analysis = JSON.parse(cleaned);
        return { analysis };
      } catch {
        return {
          analysis: {
            overallScore: 50,
            summary: text,
            strengths: ["Getting started with tracking"],
            improvements: ["Keep building consistency"],
            tip: "Try to complete your habits at the same time each day.",
            motivation: "Every day is a new opportunity to grow! 🌱",
          },
        };
      }
    } catch (error) {
      console.error("Analyze action error:", error);
      const message = error instanceof Error ? error.message : String(error);
      return {
        error: message.includes("401")
          ? "Groq rejected the API key (401). Set a valid key: `bunx convex env set GROQ_API_KEY=<key>`."
          : `Analysis request failed: ${message.slice(0, 300)}`,
      };
    }
  },
});

