// Radio Station - Always broadcasting, join mid-stream

import type { AudioBlock, MusicSegment, VoiceSegment } from './types';

/**
 * Calculate what should be playing RIGHT NOW based on real time
 */
export function getCurrentPlaybackPosition(block: AudioBlock): {
  currentSegment: MusicSegment | VoiceSegment | null;
  segmentType: 'music' | 'voice' | null;
  positionInSegment: number; // seconds into this segment
  totalElapsed: number; // seconds since block started
} {
  const blockStart = new Date(block.startTime);
  const now = new Date();
  const elapsedSeconds = Math.floor((now.getTime() - blockStart.getTime()) / 1000);

  // Block hasn't started yet
  if (elapsedSeconds < 0) {
    return {
      currentSegment: null,
      segmentType: null,
      positionInSegment: 0,
      totalElapsed: 0,
    };
  }

  // Block has ended
  const blockDuration = Math.floor(
    (new Date(block.endTime).getTime() - blockStart.getTime()) / 1000
  );
  if (elapsedSeconds >= blockDuration) {
    return {
      currentSegment: null,
      segmentType: null,
      positionInSegment: 0,
      totalElapsed: elapsedSeconds,
    };
  }

  // Combine all segments with their types
  const allSegments: Array<{
    type: 'music' | 'voice';
    segment: MusicSegment | VoiceSegment;
    startTime: number;
    endTime: number;
  }> = [];

  block.musicContent.forEach((music) => {
    allSegments.push({
      type: 'music',
      segment: music,
      startTime: music.timing,
      endTime: music.timing + music.duration,
    });
  });

  block.voiceContent.forEach((voice) => {
    allSegments.push({
      type: 'voice',
      segment: voice,
      startTime: voice.timing,
      endTime: voice.timing + voice.duration,
    });
  });

  // Sort by start time
  allSegments.sort((a, b) => a.startTime - b.startTime);

  // Find which segment should be playing now
  for (const item of allSegments) {
    if (elapsedSeconds >= item.startTime && elapsedSeconds < item.endTime) {
      return {
        currentSegment: item.segment,
        segmentType: item.type,
        positionInSegment: elapsedSeconds - item.startTime,
        totalElapsed: elapsedSeconds,
      };
    }
  }

  // Between segments (silence/transition)
  return {
    currentSegment: null,
    segmentType: null,
    positionInSegment: 0,
    totalElapsed: elapsedSeconds,
  };
}

/**
 * Get the current block based on real time
 */
export function getCurrentBlock(blocks: AudioBlock[]): AudioBlock | null {
  const now = new Date();

  for (const block of blocks) {
    const blockStart = new Date(block.startTime);
    const blockEnd = new Date(block.endTime);

    if (now >= blockStart && now < blockEnd) {
      return block;
    }
  }

  return null;
}

/**
 * Get upcoming segments (what's coming after current position)
 */
export function getUpcomingSegments(
  block: AudioBlock,
  currentElapsed: number
): Array<{ type: 'music' | 'voice'; segment: any; startTime: number }> {
  const allSegments: Array<{
    type: 'music' | 'voice';
    segment: any;
    startTime: number;
  }> = [];

  block.musicContent.forEach((music) => {
    allSegments.push({
      type: 'music',
      segment: music,
      startTime: music.timing,
    });
  });

  block.voiceContent.forEach((voice) => {
    allSegments.push({
      type: 'voice',
      segment: voice,
      startTime: voice.timing,
    });
  });

  // Filter to only future segments and sort
  return allSegments
    .filter((item) => item.startTime > currentElapsed)
    .sort((a, b) => a.startTime - b.startTime);
}

/**
 * Get past segments (what already played)
 */
export function getPastSegments(
  block: AudioBlock,
  currentElapsed: number
): Array<{ type: 'music' | 'voice'; segment: any; startTime: number }> {
  const allSegments: Array<{
    type: 'music' | 'voice';
    segment: any;
    startTime: number;
  }> = [];

  block.musicContent.forEach((music) => {
    allSegments.push({
      type: 'music',
      segment: music,
      startTime: music.timing,
    });
  });

  block.voiceContent.forEach((voice) => {
    allSegments.push({
      type: 'voice',
      segment: voice,
      startTime: voice.timing,
    });
  });

  // Filter to only past segments and sort
  return allSegments
    .filter((item) => item.startTime + (item.segment.duration || 0) <= currentElapsed)
    .sort((a, b) => a.startTime - b.startTime);
}

/**
 * Calculate time until next block
 */
export function getTimeUntilNextBlock(currentBlock: AudioBlock): number {
  const now = new Date();
  const blockEnd = new Date(currentBlock.endTime);
  return Math.floor((blockEnd.getTime() - now.getTime()) / 1000);
}

