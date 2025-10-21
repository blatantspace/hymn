'use client';

import { motion } from 'framer-motion';
import type { AudioBlock } from '@/lib/types';

interface BlockTimelineProps {
  blocks: AudioBlock[];
  currentBlockId: string | null;
  onBlockSelect?: (block: AudioBlock) => void;
}

export default function BlockTimeline({
  blocks,
  currentBlockId,
  onBlockSelect,
}: BlockTimelineProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">
        Your Day
      </h3>

      <div className="space-y-2">
        {blocks.map((block, index) => {
          const isActive = block.id === currentBlockId;
          const isPast = new Date(block.endTime) < new Date();
          const isFuture = new Date(block.startTime) > new Date();

          return (
            <motion.button
              key={block.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onBlockSelect?.(block)}
              className={`w-full text-left p-4 rounded-xl transition-colors ${
                isActive
                  ? 'bg-neutral-100 text-neutral-900'
                  : isPast
                  ? 'bg-neutral-900/50 text-neutral-600'
                  : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">
                  {formatTime(block.startTime)} - {formatTime(block.endTime)}
                </span>
                {isActive && (
                  <span className="text-xs px-2 py-1 bg-neutral-900 text-neutral-100 rounded-full">
                    Now Playing
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="capitalize">{getMoodEmoji(block.strategy.musicStyle)}</span>
                <span className="text-neutral-500 capitalize">
                  {block.strategy.musicStyle}
                </span>
                {block.voiceContent.length > 0 && (
                  <>
                    <span className="text-neutral-600">•</span>
                    <span className="text-neutral-500">
                      {block.voiceContent.length} voice updates
                    </span>
                  </>
                )}
              </div>
            </motion.button>
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

