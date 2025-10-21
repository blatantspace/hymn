// Persistent broadcast session management

import type { AudioBlock } from './types';

interface BroadcastSession {
  id: string;
  startTime: string; // When this 12-hour broadcast started
  blocks: AudioBlock[];
  voiceFiles: Record<string, string>; // voiceId -> base64 audio data URL
  createdAt: string;
  expiresAt: string; // 12 hours from creation
}

const SESSION_KEY = 'hymn_broadcast_session';
const SESSION_DURATION_HOURS = 12;

/**
 * Get or create broadcast session
 * Returns existing session if still valid, otherwise creates new one
 */
export function getOrCreateSession(
  blocks: AudioBlock[]
): BroadcastSession | null {
  const stored = localStorage.getItem(SESSION_KEY);

  if (stored) {
    try {
      const session: BroadcastSession = JSON.parse(stored);
      const expiresAt = new Date(session.expiresAt);
      const now = new Date();

      // Check if session is still valid
      if (now < expiresAt) {
        console.log('📻 Found existing broadcast session:', {
          startedAt: new Date(session.startTime).toLocaleString(),
          expiresAt: expiresAt.toLocaleString(),
          blocksCount: session.blocks.length,
        });
        return session;
      } else {
        console.log('⏰ Broadcast session expired, creating new one');
      }
    } catch (error) {
      console.error('Failed to parse session:', error);
    }
  }

  // Create new session
  if (blocks.length > 0) {
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setHours(expiresAt.getHours() + SESSION_DURATION_HOURS);

    const session: BroadcastSession = {
      id: `session-${now.getTime()}`,
      startTime: blocks[0].startTime, // Use first block's start time
      blocks,
      voiceFiles: {}, // Will be populated as voice files are generated
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    
    console.log('✨ Created new broadcast session:', {
      startTime: new Date(session.startTime).toLocaleString(),
      expiresAt: expiresAt.toLocaleString(),
      blocks: blocks.length,
    });

    return session;
  }

  return null;
}

/**
 * Force create a new broadcast session (regenerate)
 */
export function createNewSession(blocks: AudioBlock[]): BroadcastSession {
  console.log('🔄 Force creating new broadcast session');
  localStorage.removeItem(SESSION_KEY);
  return getOrCreateSession(blocks)!;
}

/**
 * Store a voice file in the session
 */
export function storeVoiceFile(voiceId: string, audioDataUrl: string) {
  const stored = localStorage.getItem(SESSION_KEY);
  if (!stored) return;

  try {
    const session: BroadcastSession = JSON.parse(stored);
    session.voiceFiles[voiceId] = audioDataUrl;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    console.log('💾 Stored voice file:', voiceId);
  } catch (error) {
    console.error('Failed to store voice file:', error);
  }
}

/**
 * Get a voice file from the session
 */
export function getVoiceFile(voiceId: string): string | null {
  const stored = localStorage.getItem(SESSION_KEY);
  if (!stored) return null;

  try {
    const session: BroadcastSession = JSON.parse(stored);
    return session.voiceFiles[voiceId] || null;
  } catch (error) {
    console.error('Failed to get voice file:', error);
    return null;
  }
}

/**
 * Clear the current session
 */
export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  console.log('🗑️ Cleared broadcast session');
}

/**
 * Check if session should be regenerated (calendar changed, etc.)
 */
export function shouldRegenerateSession(
  session: BroadcastSession,
  calendarEventCount: number
): boolean {
  // For now, simple check based on time
  // Later: compare calendar events, news, etc.
  const expiresAt = new Date(session.expiresAt);
  const now = new Date();
  
  return now >= expiresAt;
}

