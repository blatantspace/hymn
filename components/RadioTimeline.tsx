'use client';

import { motion } from 'framer-motion';
import type { TimelineItem } from '@/lib/types';

interface RadioTimelineProps {
  items: TimelineItem[];
  currentItemId: string | null;
  onSeek?: (timestamp: Date) => void;
}

export default function RadioTimeline({ items, currentItemId, onSeek }: RadioTimelineProps) {
  const now = new Date();

  return (
    <div className="space-y-1 max-h-[600px] overflow-y-auto pr-2">
      {items.map((item, index) => {
        const isPlaying = item.id === currentItemId;
        const isPast = item.locked;
        const isFuture = new Date(item.timestamp) > now;

        return (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, x: isPast ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(index * 0.02, 0.5) }}
            onClick={() => isPast && onSeek?.(new Date(item.timestamp))}
            disabled={!isPast || !onSeek}
            className={`w-full text-left p-3 rounded-lg transition-all ${
              isPlaying
                ? 'bg-green-500/20 border-2 border-green-500'
                : isPast
                ? 'bg-neutral-900/30 border border-neutral-800/50 hover:bg-neutral-900/50 cursor-pointer'
                : 'bg-neutral-900 border border-neutral-800'
            } ${isPast ? 'opacity-60' : 'opacity-100'}`}
          >
            <div className="flex items-center gap-3">
              {/* Time */}
              <div className="flex-shrink-0 w-16 text-xs text-neutral-500">
                {new Date(item.timestamp).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </div>

              {/* Icon */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                isPlaying ? 'bg-green-500' : isPast ? 'bg-neutral-800' : 'bg-neutral-700'
              }`}>
                {item.type === 'voice' ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  </svg>
                ) : item.type === 'live_stream' ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                  </svg>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${
                  isPlaying ? 'text-green-400' : isPast ? 'text-neutral-500' : 'text-neutral-200'
                }`}>
                  {item.title || 'Untitled'}
                </p>
                {item.artist && (
                  <p className="text-xs text-neutral-600 truncate">{item.artist}</p>
                )}
              </div>

              {/* Status Badge */}
              {isPlaying && (
                <div className="flex-shrink-0 text-xs px-2 py-1 bg-green-500 text-white rounded-full font-medium">
                  Now
                </div>
              )}
              {isPast && !isPlaying && (
                <div className="flex-shrink-0 text-xs text-neutral-600">
                  Missed
                </div>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

