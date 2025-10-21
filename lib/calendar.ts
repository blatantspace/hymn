// Google Calendar API utilities

import { google } from 'googleapis';
import type { CalendarEvent } from './types';

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

/**
 * Get Google OAuth URL for authorization
 */
export function getGoogleAuthUrl(): string {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function getGoogleTokens(code: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * Refresh Google access token
 */
export async function refreshGoogleToken(refreshToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials;
}

/**
 * Get calendar events for a specific time range
 */
export async function getCalendarEvents(
  accessToken: string,
  startTime: Date,
  endTime: Date
): Promise<CalendarEvent[]> {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: startTime.toISOString(),
    timeMax: endTime.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  const events = response.data.items || [];

  return events.map((event) => ({
    id: event.id!,
    summary: event.summary || 'Untitled Event',
    description: event.description || undefined,
    start: event.start?.dateTime || event.start?.date || '',
    end: event.end?.dateTime || event.end?.date || '',
    location: event.location || undefined,
    attendees: event.attendees?.map((a) => a.email!).filter(Boolean) || [],
  }));
}

/**
 * Get events for the next N hours from now
 */
export async function getUpcomingEvents(
  accessToken: string,
  hoursAhead: number = 1
): Promise<CalendarEvent[]> {
  const now = new Date();
  const future = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

  return getCalendarEvents(accessToken, now, future);
}

/**
 * Analyze calendar event type and characteristics
 */
export function analyzeEventType(event: CalendarEvent): {
  type: 'meeting' | 'focus' | 'break' | 'personal' | 'unknown';
  hasAttendees: boolean;
  duration: number; // minutes
} {
  const start = new Date(event.start);
  const end = new Date(event.end);
  const duration = (end.getTime() - start.getTime()) / (1000 * 60);
  const hasAttendees = (event.attendees?.length || 0) > 0;

  // Simple heuristic to categorize events
  const summary = event.summary.toLowerCase();
  let type: 'meeting' | 'focus' | 'break' | 'personal' | 'unknown' = 'unknown';

  if (hasAttendees || summary.includes('meeting') || summary.includes('call')) {
    type = 'meeting';
  } else if (
    summary.includes('focus') ||
    summary.includes('deep work') ||
    summary.includes('coding')
  ) {
    type = 'focus';
  } else if (
    summary.includes('lunch') ||
    summary.includes('break') ||
    summary.includes('coffee')
  ) {
    type = 'break';
  } else if (
    summary.includes('personal') ||
    summary.includes('appointment') ||
    summary.includes('gym')
  ) {
    type = 'personal';
  }

  return { type, hasAttendees, duration };
}

