import { NextRequest, NextResponse } from 'next/server';
import { generateCoachResponse } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { goal, existingHabits } = await req.json();

    const prompt = `You are an AI habit coach. The user wants to achieve this goal: "${goal}"

Their existing habits: ${existingHabits?.length > 0 ? existingHabits.map((h: { name: string }) => h.name).join(', ') : 'None yet'}

Suggest 3-5 specific, actionable daily habits that will help them reach their goal. For each habit, suggest the most appropriate category from: health, fitness, mindfulness, productivity, learning, social, creativity, other.

Return ONLY a JSON array (no markdown, no code blocks) with this structure:
[
  {
    "name": "<specific habit name>",
    "description": "<why this habit helps>",
    "category": "<category>"
  }
]`;

    const response = await generateCoachResponse(prompt);
    
    try {
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const suggestions = JSON.parse(cleaned);
      return NextResponse.json({ suggestions });
    } catch {
      return NextResponse.json({
        suggestions: [
          { name: 'Start small with your goal', description: 'Begin with just 5 minutes a day', category: 'productivity' },
          { name: 'Track your progress daily', description: 'Reflection helps build consistency', category: 'mindfulness' },
          { name: 'Stay hydrated', description: 'Water improves focus and energy', category: 'health' },
        ],
      });
    }
  } catch (error) {
    console.error('Suggest API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions.' },
      { status: 500 }
    );
  }
}
