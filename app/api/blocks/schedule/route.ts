// API route to generate full 12-hour block schedule

import { NextRequest, NextResponse } from 'next/server';
import { generateBlockSchedule } from '@/lib/blockScheduler';
import type { UserPreferences } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const spotifyToken = request.cookies.get('spotify_access_token')?.value;
    const googleToken = request.cookies.get('google_access_token')?.value;

    console.log('🎙️ Schedule generation request - Spotify:', !!spotifyToken, 'Google:', !!googleToken);

    if (!spotifyToken) {
      return NextResponse.json(
        { error: 'Missing Spotify authentication' },
        { status: 401 }
      );
    }

    // Google calendar is optional
    const body = await request.json();
    const { preferences } = body as { preferences: UserPreferences };

    // Generate full schedule
    const blocks = await generateBlockSchedule(
      spotifyToken,
      googleToken || '',
      preferences
    );

    return NextResponse.json({ blocks });
  } catch (error) {
    console.error('Schedule generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate schedule',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

