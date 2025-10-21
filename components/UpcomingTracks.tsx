'use client';

import { motion } from 'framer-motion';
import type { AudioBlock } from '@/lib/types';

interface UpcomingTracksProps {
  currentBlock: AudioBlock | null;
  userLibrary: any[];
  onShuffleNext?: () => void;
  livePosition?: any;
}

export default function UpcomingTracks({ currentBlock, userLibrary, onShuffleNext, livePosition }: UpcomingTracksProps) {
  if (!currentBlock) return null;

  // Combine all segments and mark past/current/future
  const allSegments: Array<{
    type: 'music' | 'voice';
    segment: any;
    timing: number;
    status: 'past' | 'current' | 'future';
  }> = [];

  const elapsed = livePosition?.totalElapsed || 0;

  currentBlock.musicContent.forEach((music) => {
    const status = 
      elapsed > music.timing + music.duration ? 'past' :
      elapsed >= music.timing && elapsed < music.timing + music.duration ? 'current' :
      'future';
    
    allSegments.push({ type: 'music', segment: music, timing: music.timing, status });
  });

  currentBlock.voiceContent.forEach((voice) => {
    const status =
      elapsed > voice.timing + voice.duration ? 'past' :
      elapsed >= voice.timing && elapsed < voice.timing + voice.duration ? 'current' :
      'future';
    
    allSegments.push({ type: 'voice', segment: voice, timing: voice.timing, status });
  });

  // Sort by timing
  allSegments.sort((a, b) => a.timing - b.timing);

  // Show current and next 3 items
  const visibleItems = allSegments.filter(item => item.status !== 'past').slice(0, 4);

  // Get track info from library
  const getTrackInfo = (uri: string) => {
    if (!uri) return null;
    const track = userLibrary.find(t => t.uri === uri);
    if (track) {
      return {
        name: track.name,
        artist: track.artists?.[0]?.name || 'Unknown Artist',
      };
    }
    // If not in library yet, show placeholder
    return {
      name: 'Loading track...',
      artist: 'Fetching from Spotify',
    };
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">
          Up Next
        </h3>
        {onShuffleNext && (
          <button
            onClick={onShuffleNext}
            className="text-xs px-2 py-1 bg-neutral-800 hover:bg-neutral-700 rounded-full text-neutral-400 transition-colors"
          >
            🔀 Shuffle
          </button>
        )}
      </div>

      {visibleItems.length === 0 ? (
        <p className="text-sm text-neutral-500">No upcoming items</p>
      ) : (
        <div className="space-y-3">
          {visibleItems.map((item, index) => {
            const isVoice = item.type === 'voice';
            const trackInfo = !isVoice ? getTrackInfo(item.segment.spotifyUri) : null;
            const isCurrent = item.status === 'current';
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  isCurrent 
                    ? 'bg-neutral-100/10 border-neutral-100/30 ring-1 ring-neutral-100/20' 
                    : 'bg-neutral-950 border-neutral-800'
                }`}
              >
                {isCurrent && (
                  <div className="absolute -left-1 w-1 h-8 bg-green-500 rounded-r-full animate-pulse" />
                )}
                <div className="flex-shrink-0 w-8 h-8 bg-neutral-800 rounded-lg flex items-center justify-center">
                  {isVoice ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                    </svg>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {isVoice ? (
                    <>
                      <p className={`text-sm font-medium ${isCurrent ? 'text-green-400' : 'text-neutral-200'}`}>
                        {isCurrent ? '🔴 DJ Update' : 'DJ Update'}
                      </p>
                      <p className="text-xs text-neutral-500 line-clamp-2">{item.segment.content}</p>
                    </>
                  ) : trackInfo ? (
                    <>
                      <p className={`text-sm font-medium truncate ${isCurrent ? 'text-green-400' : 'text-neutral-200'}`}>
                        {isCurrent ? '🔴 ' : ''}{trackInfo.name}
                      </p>
                      <p className="text-xs text-neutral-500 truncate">{trackInfo.artist}</p>
                    </>
                  ) : (
                    <>
                      <p className={`text-sm font-medium ${isCurrent ? 'text-green-400' : 'text-neutral-200'}`}>
                        {isCurrent ? '🔴 ' : ''}Next Track
                      </p>
                      <p className="text-xs text-neutral-500">Loading...</p>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}




