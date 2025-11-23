// Get Spotify user profile and account type

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const spotifyToken = request.cookies.get('spotify_access_token')?.value;

    if (!spotifyToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: `Bearer ${spotifyToken}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: response.status }
      );
    }

    const profile = await response.json();

    console.log('🔍 Spotify API returned:', {
      email: profile.email,
      product: profile.product,
      type: profile.type,
      explicit_content: profile.explicit_content,
      country: profile.country,
    });

    return NextResponse.json({
      id: profile.id,
      email: profile.email,
      displayName: profile.display_name,
      product: profile.product, // "premium" or "free"
      country: profile.country,
      isPremium: profile.product === 'premium',
      rawProfile: profile, // Send full profile for debugging
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

