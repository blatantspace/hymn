// Refresh Spotify access token

import { NextRequest, NextResponse } from 'next/server';
import { refreshSpotifyToken } from '@/lib/spotify';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('spotify_refresh_token')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token available' },
        { status: 401 }
      );
    }

    // Get new access token
    const tokens = await refreshSpotifyToken(refreshToken);

    const response = NextResponse.json({ success: true });

    // Update access token cookie
    response.cookies.set('spotify_access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: tokens.expires_in,
      sameSite: 'lax',
      path: '/',
    });

    console.log('✅ Spotify token refreshed successfully');

    return response;
  } catch (error) {
    console.error('Failed to refresh Spotify token:', error);
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 }
    );
  }
}


