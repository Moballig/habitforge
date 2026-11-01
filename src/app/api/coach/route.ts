import { NextRequest, NextResponse } from 'next/server';
import { generateCoachResponse } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { message, habitData } = await req.json();

    const systemPrompt = `You are HabitForge AI Coach — a friendly, motivating, and insightful habit coach. You help users build and maintain positive habits.

Your personality:
- Warm, encouraging, but honest
- Use emojis sparingly but effectively
- Give practical, actionable advice
- Keep responses concise (2-4 paragraphs max)
- Reference the user's actual habit data when available

User's current habit data:
${habitData ? JSON.stringify(habitData, null, 2) : 'No habits tracked yet.'}

Respond to the user's message helpfully. If they ask for habit suggestions, give specific, actionable ones. If they're struggling, be empathetic but solutions-focused. If they're doing well, celebrate their progress genuinely.`;

    const fullPrompt = `${systemPrompt}\n\nUser: ${message}`;
    const response = await generateCoachResponse(fullPrompt);

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Coach API error:', error);
    return NextResponse.json(
      { error: 'Failed to get AI response. Please check your API key.' },
      { status: 500 }
    );
  }
}
