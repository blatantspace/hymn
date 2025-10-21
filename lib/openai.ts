// OpenAI API utilities

import OpenAI from 'openai';
import type { CalendarEvent, BlockStrategy, VoiceSegment, NewsItem, UserPreferences } from './types';
import type { UserMusicProfile } from './musicTaste';

// Lazy initialization to avoid build-time errors
let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

/**
 * Analyze calendar events and generate block strategy using GPT-4
 * Now includes music taste analysis
 */
export async function analyzeBlock(
  events: CalendarEvent[],
  news: NewsItem[],
  preferences: UserPreferences,
  timeOfDay: Date,
  musicProfile?: UserMusicProfile
): Promise<{ strategy: BlockStrategy; voiceContent: VoiceSegment[]; musicRecommendation: string }> {
  const hour = timeOfDay.getHours();
  const dayPart =
    hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';

  const prompt = `You are an AI DJ assistant analyzing the next hour of someone's day to create the perfect audio experience.

CONTEXT:
- Time: ${timeOfDay.toLocaleString()} (${dayPart})
- Calendar Events: ${events.length > 0 ? JSON.stringify(events, null, 2) : 'No events scheduled'}
- Recent News: ${news.slice(0, 3).map(n => `- ${n.title}`).join('\n')}
- User Preferences: ${JSON.stringify(preferences)}
- Music Taste: ${musicProfile ? `Top genres: ${musicProfile.topArtists.flatMap(a => a.genres).slice(0, 5).join(', ')}. Favorite artists: ${musicProfile.topArtists.slice(0, 3).map(a => a.name).join(', ')}` : 'Not available'}

TASK:
Decide the optimal audio strategy for this hour. Consider:
1. What's happening in their calendar (meetings, focus time, free time)
2. Time of day energy levels
3. News relevance
4. When to provide voice updates vs music

Return a JSON object with:
{
  "strategy": {
    "musicStyle": "ambient|focus|energetic|upbeat|calm|silent",
    "musicVolume": 0-1,
    "voiceFrequency": "none|minimal|moderate|active",
    "interruptionLevel": "none|low|medium|high",
    "reasoning": "brief explanation of strategy"
  },
  "musicRecommendation": "brief description of what type of music fits this block based on their taste and context",
  "voiceContent": [
    {
      "timing": seconds_from_start,
      "content": "what to say",
      "priority": "low|medium|high",
      "duration": estimated_seconds
    }
  ]
}

Examples:
- Deep work block → ambient music, no interruptions
- Before meeting → brief meeting prep, then quiet background
- Free morning time → upbeat music, news highlights, calendar preview
- Late evening → calm music, gentle reminders

Be concise, natural, and helpful. Voice content should sound like a friendly DJ, not a robot.`;

  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are an expert AI DJ assistant. Return only valid JSON.',
      },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  const result = JSON.parse(response.choices[0].message.content!);

  // Add IDs to voice segments
  const voiceContent: VoiceSegment[] = result.voiceContent.map(
    (segment: any, index: number) => ({
      id: `voice-${Date.now()}-${index}`,
      timing: segment.timing,
      content: segment.content,
      priority: segment.priority,
      duration: segment.duration,
    })
  );

  return {
    strategy: result.strategy,
    voiceContent,
    musicRecommendation: result.musicRecommendation || 'Music matching your mood',
  };
}

/**
 * Generate speech audio from text using OpenAI TTS
 */
export async function generateSpeech(
  text: string,
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'alloy'
): Promise<Buffer> {
  const openai = getOpenAI();
  const mp3 = await openai.audio.speech.create({
    model: 'tts-1-hd', // HD model for better quality
    voice: voice, // Options: alloy, echo, fable, onyx, nova, shimmer
    input: text,
    speed: 1.05, // Slightly faster for radio feel
  });

  const buffer = Buffer.from(await mp3.arrayBuffer());
  return buffer;
}

/**
 * Generate multiple speech segments at once
 */
export async function generateMultipleSpeechSegments(
  segments: VoiceSegment[]
): Promise<VoiceSegment[]> {
  const promises = segments.map(async (segment) => {
    try {
      const audioBuffer = await generateSpeech(segment.content);
      // In production, you'd upload this to cloud storage and return URL
      // For now, we'll convert to base64 data URL
      const base64Audio = audioBuffer.toString('base64');
      return {
        ...segment,
        audioUrl: `data:audio/mp3;base64,${base64Audio}`,
      };
    } catch (error) {
      console.error('Failed to generate speech for segment:', segment.id, error);
      return segment;
    }
  });

  return Promise.all(promises);
}

/**
 * Summarize news articles for voice delivery
 */
export async function summarizeNewsForVoice(news: NewsItem[]): Promise<string> {
  if (news.length === 0) return '';

  const prompt = `Summarize these news headlines into a brief, natural-sounding 30-second audio segment:

${news.map((n, i) => `${i + 1}. ${n.title} - ${n.description}`).join('\n')}

Make it conversational, like a DJ sharing interesting updates. Keep it under 100 words.`;

  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  });

  return response.choices[0].message.content || '';
}

