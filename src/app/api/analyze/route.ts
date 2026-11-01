import { NextRequest, NextResponse } from 'next/server';
import { generateCoachResponse } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { habits, logs } = await req.json();

    const prompt = `You are an AI habit analyst. Analyze the following habit tracking data and provide a concise weekly report.

Habit Data:
${JSON.stringify(habits, null, 2)}

Completion Logs:
${JSON.stringify(logs, null, 2)}

Provide a JSON response with exactly this structure (no markdown, no code blocks, just pure JSON):
{
  "overallScore": <number 0-100>,
  "summary": "<2-3 sentence overall summary>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<area 1>", "<area 2>"],
  "tip": "<one actionable tip for next week>",
  "motivation": "<a short motivational message>"
}`;

    const response = await generateCoachResponse(prompt);
    
    // Try to parse JSON from the response
    try {
      // Remove potential markdown code blocks
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const analysis = JSON.parse(cleaned);
      return NextResponse.json({ analysis });
    } catch {
      return NextResponse.json({
        analysis: {
          overallScore: 50,
          summary: response,
          strengths: ['Getting started with tracking'],
          improvements: ['Keep building consistency'],
          tip: 'Try to complete your habits at the same time each day.',
          motivation: 'Every day is a new opportunity to grow! 🌱',
        },
      });
    }
  } catch (error) {
    console.error('Analyze API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze habits.' },
      { status: 500 }
    );
  }
}
