// Google Calendar OAuth initiation

import { NextResponse } from 'next/server';
import { getGoogleAuthUrl } from '@/lib/calendar';

export async function GET() {
  const authUrl = getGoogleAuthUrl();
  return NextResponse.redirect(authUrl);
}

