// API route to generate audio blocks

import { NextRequest, NextResponse } from 'next/server';
import { generateAudioBlock, getBlockTimeRange } from '@/lib/blockEngine';
import type { UserPreferences } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // Get tokens from cookies
    const spotifyToken = request.cookies.get('spotify_access_token')?.value;
    const googleToken = request.cookies.get('google_access_token')?.value;

    if (!spotifyToken || !googleToken) {
      return NextResponse.json(
        { error: 'Missing authentication tokens' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { blockIndex, preferences } = body as {
      blockIndex?: number;
      preferences: UserPreferences;
    };

    // Determine block time range
    const currentBlockIndex = blockIndex ?? new Date().getHours();
    const { start, end } = getBlockTimeRange(currentBlockIndex);

    // Generate the audio block
    const block = await generateAudioBlock(
      start,
      end,
      spotifyToken,
      googleToken,
      preferences
    );

    return NextResponse.json({ block });
  } catch (error) {
    console.error('Block generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate audio block', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

