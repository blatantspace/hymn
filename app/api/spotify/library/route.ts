// API route to fetch user's personalized music library

import { NextRequest, NextResponse } from 'next/server';
import { buildPersonalizedLibrary } from '@/lib/spotify';

export async function GET(request: NextRequest) {
  try {
    const spotifyToken = request.cookies.get('spotify_access_token')?.value;

    if (!spotifyToken) {
      return NextResponse.json(
        { error: 'Not authenticated with Spotify' },
        { status: 401 }
      );
    }

    const library = await buildPersonalizedLibrary(spotifyToken);

    return NextResponse.json({ tracks: library });
  } catch (error) {
    console.error('Library fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch music library' },
      { status: 500 }
    );
  }
}

