// API route to get user's music profile

import { NextRequest, NextResponse } from 'next/server';
import { buildMusicProfile } from '@/lib/musicTaste';

export async function GET(request: NextRequest) {
  try {
    const spotifyToken = request.cookies.get('spotify_access_token')?.value;

    if (!spotifyToken) {
      return NextResponse.json(
        { error: 'Not authenticated with Spotify' },
        { status: 401 }
      );
    }

    const profile = await buildMusicProfile(spotifyToken);

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Music profile error:', error);
    return NextResponse.json(
      { error: 'Failed to build music profile' },
      { status: 500 }
    );
  }
}

