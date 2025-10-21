// Google Calendar OAuth callback handler

import { NextRequest, NextResponse } from 'next/server';
import { getGoogleTokens } from '@/lib/calendar';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}?error=google_auth_failed`);
  }

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}?error=no_code`);
  }

  try {
    const tokens = await getGoogleTokens(code);

    const response = NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/setup?google_connected=true`
    );

    // Set tokens in httpOnly cookies
    if (tokens.access_token) {
      response.cookies.set('google_access_token', tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600,
        sameSite: 'lax',
        path: '/',
      });
    }

    if (tokens.refresh_token) {
      response.cookies.set('google_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        sameSite: 'lax',
        path: '/',
      });
    }

    console.log('📅 Google Calendar tokens stored in cookies');

    return response;
  } catch (error) {
    console.error('Google auth error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}?error=google_token_failed`);
  }
}

