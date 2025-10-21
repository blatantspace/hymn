// API route to fetch calendar events

import { NextRequest, NextResponse } from 'next/server';
import { getUpcomingEvents } from '@/lib/calendar';

export async function GET(request: NextRequest) {
  try {
    const googleToken = request.cookies.get('google_access_token')?.value;

    console.log('📅 Checking for Google token:', googleToken ? 'Found ✅' : 'Not found ❌');
    console.log('📅 All cookies:', request.cookies.getAll().map(c => c.name));

    if (!googleToken) {
      return NextResponse.json(
        { error: 'Not authenticated with Google Calendar' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const hoursAhead = parseInt(searchParams.get('hours') || '4', 10);

    const events = await getUpcomingEvents(googleToken, hoursAhead);

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Calendar fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}

