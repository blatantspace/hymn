'use client';

import { motion } from 'framer-motion';
import type { AudioBlock, CalendarEvent } from '@/lib/types';

interface CalendarViewProps {
  blocks: AudioBlock[];
  events: CalendarEvent[];
  currentBlockId: string | null;
  userLibrary: any[];
}

export default function CalendarView({ blocks, events, currentBlockId, userLibrary }: CalendarViewProps) {
  const now = new Date();
  const todayStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Group events by hour
  const eventsByHour: Record<number, CalendarEvent[]> = {};
  events.forEach((event) => {
    const eventStart = new Date(event.start);
    const hour = eventStart.getHours();
    if (!eventsByHour[hour]) eventsByHour[hour] = [];
    eventsByHour[hour].push(event);
  });

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wide mb-1">
          Today
        </h3>
        <p className="text-lg text-neutral-200">{todayStr}</p>
      </div>

      <div className="space-y-2">
        {blocks.map((block, index) => {
          const isActive = block.id === currentBlockId;
          const isPast = new Date(block.endTime) < now;
          const blockHour = new Date(block.startTime).getHours();
          const blockEvents = eventsByHour[blockHour] || [];

          // Get track info for this block
          const getTrackInfo = (uri: string) => {
            const track = userLibrary.find(t => t.uri === uri);
            return track ? { name: track.name, artist: track.artists?.[0]?.name } : null;
          };

          const blockTracks = block.musicContent.slice(0, 2); // First 2 tracks

          return (
            <motion.div
              key={block.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className={`rounded-xl transition-all ${
                isActive
                  ? 'bg-neutral-100 text-neutral-900'
                  : isPast
                  ? 'bg-neutral-900/30 text-neutral-600'
                  : 'bg-neutral-900 text-neutral-300'
              } ${!isPast ? 'border border-neutral-800' : ''}`}
            >
              {/* Time Header */}
              <div className={`p-3 flex items-center justify-between ${(blockEvents.length > 0 || blockTracks.length > 0) ? 'border-b' : ''} ${
                isActive ? 'border-neutral-300' : 'border-neutral-800'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {formatTime(block.startTime)}
                  </span>
                  {isActive && (
                    <span className="text-xs px-2 py-0.5 bg-red-600 text-white rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                      LIVE
                    </span>
                  )}
                </div>
                <span className="text-xs">
                  {getMoodEmoji(block.strategy.musicStyle)}
                </span>
              </div>

              {/* Content (Events + Music) */}
              {(blockEvents.length > 0 || blockTracks.length > 0) && (
                <div className={`p-3 space-y-2 ${isActive ? 'bg-neutral-100' : 'bg-neutral-950/50'}`}>
                  {/* Calendar Events */}
                  {blockEvents.map((event) => (
                    <div key={event.id} className="flex items-start gap-2">
                      <div className={`w-1 h-full rounded-full mt-1 ${
                        isActive ? 'bg-blue-600' : 'bg-blue-700/50'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          isActive ? 'text-neutral-900' : 'text-neutral-300'
                        }`}>
                          📅 {event.summary}
                        </p>
                        <p className={`text-xs truncate ${
                          isActive ? 'text-neutral-600' : 'text-neutral-500'
                        }`}>
                          {formatEventTime(event.start)} - {formatEventTime(event.end)}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {/* All Segments (Music + Voice in chronological order) */}
                  {(() => {
                    const segments: Array<{type: 'music' | 'voice', data: any, timing: number}> = [];
                    
                    blockTracks.forEach(track => {
                      segments.push({ type: 'music', data: track, timing: track.timing });
                    });
                    
                    block.voiceContent.forEach(voice => {
                      segments.push({ type: 'voice', data: voice, timing: voice.timing });
                    });
                    
                    segments.sort((a, b) => a.timing - b.timing);
                    
                    return segments.map((segment, idx) => {
                      if (segment.type === 'music') {
                        const trackInfo = getTrackInfo(segment.data.spotifyUri);
                        return (
                          <div key={`music-${idx}`} className="flex items-start gap-2">
                            <div className={`w-1 h-full rounded-full mt-1 ${
                              isActive ? 'bg-green-600' : 'bg-green-700/50'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate ${
                                isActive ? 'text-neutral-900' : 'text-neutral-300'
                              }`}>
                                🎵 {trackInfo?.name || 'Loading...'}
                              </p>
                              <p className={`text-xs truncate ${
                                isActive ? 'text-neutral-600' : 'text-neutral-500'
                              }`}>
                                {trackInfo?.artist || '...'}
                              </p>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div key={`voice-${idx}`} className="flex items-start gap-2">
                            <div className={`w-1 h-full rounded-full mt-1 ${
                              isActive ? 'bg-purple-600' : 'bg-purple-700/50'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate ${
                                isActive ? 'text-neutral-900' : 'text-neutral-300'
                              }`}>
                                🎤 DJ Update
                              </p>
                              <p className={`text-xs truncate ${
                                isActive ? 'text-neutral-600' : 'text-neutral-500'
                              }`}>
                                {segment.data.content.substring(0, 30)}...
                              </p>
                            </div>
                          </div>
                        );
                      }
                    });
                  })()}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatEventTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function getMoodEmoji(mood: string): string {
  const emojiMap: Record<string, string> = {
    ambient: '🌙',
    focus: '🎯',
    energetic: '⚡',
    upbeat: '🎉',
    calm: '☁️',
    silent: '🔇',
  };
  return emojiMap[mood] || '🎵';
}




