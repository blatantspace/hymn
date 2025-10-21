// Spotify OAuth callback handler

import { NextRequest, NextResponse } from 'next/server';
import { getSpotifyTokens } from '@/lib/spotify';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}?error=spotify_auth_failed`);
  }

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}?error=no_code`);
  }

  try {
    const tokens = await getSpotifyTokens(code);

    // Store tokens and redirect back to setup flow
    const response = NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/setup?spotify_connected=true`
    );

    // Set tokens in httpOnly cookies
    response.cookies.set('spotify_access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: tokens.expires_in,
      sameSite: 'lax',
      path: '/',
    });

    response.cookies.set('spotify_refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: 'lax',
      path: '/',
    });
    
    console.log('Spotify tokens stored in cookies');

    return response;
  } catch (error) {
    console.error('Spotify auth error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}?error=spotify_token_failed`);
  }
}

