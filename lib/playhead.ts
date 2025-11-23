// Playhead - Calculate exact position in the timeline

import type { TimelineItem } from './types';

/**
 * Calculate what should be playing RIGHT NOW based on real-world time
 */
export function calculateCurrentPlayhead(items: TimelineItem[]): {
  currentItem: TimelineItem | null;
  positionInTrack: number; // Milliseconds into the current track
  percentComplete: number; // 0-100
} {
  const now = new Date();
  
  // Find the item that should be playing at this exact moment
  for (const item of items) {
    const itemStart = new Date(item.timestamp);
    const itemEnd = new Date(itemStart.getTime() + item.duration * 1000);
    
    // Check if NOW falls within this item's timespan
    if (now >= itemStart && now < itemEnd) {
      const elapsedMs = now.getTime() - itemStart.getTime();
      const durationMs = item.duration * 1000;
      const percentComplete = (elapsedMs / durationMs) * 100;
      
      console.log('🎯 Playhead:', {
        track: item.title,
        position: formatMs(elapsedMs),
        total: formatMs(durationMs),
        percent: percentComplete.toFixed(1) + '%',
      });
      
      return {
        currentItem: item,
        positionInTrack: elapsedMs,
        percentComplete,
      };
    }
  }
  
  // No item playing right now (between tracks or end of timeline)
  return {
    currentItem: null,
    positionInTrack: 0,
    percentComplete: 0,
  };
}

/**
 * Get upcoming items (what's next in the timeline)
 */
export function getUpcoming(items: TimelineItem[], limit: number = 10): TimelineItem[] {
  const now = new Date();
  return items
    .filter(item => new Date(item.timestamp) > now)
    .slice(0, limit);
}

/**
 * Get past items (what already "aired")
 */
export function getPast(items: TimelineItem[]): TimelineItem[] {
  const now = new Date();
  return items.filter(item => item.locked);
}

/**
 * Format milliseconds to MM:SS
 */
function formatMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Calculate time until next item
 */
export function getTimeUntilNext(items: TimelineItem[]): number | null {
  const { currentItem } = calculateCurrentPlayhead(items);
  
  if (!currentItem) return null;
  
  const itemEnd = new Date(
    new Date(currentItem.timestamp).getTime() + currentItem.duration * 1000
  );
  const now = new Date();
  
  return itemEnd.getTime() - now.getTime();
}

