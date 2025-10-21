'use client';

import { motion } from 'framer-motion';
import type { AudioBlock } from '@/lib/types';

interface CurrentQueueProps {
  currentBlock: AudioBlock | null;
}

export default function CurrentQueue({ currentBlock }: CurrentQueueProps) {
  if (!currentBlock) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wide mb-4">
          Queue
        </h3>
        <p className="text-sm text-neutral-500">No active block</p>
      </div>
    );
  }

  // Combine music and voice content into a single timeline
  const queueItems: Array<{
    type: 'music' | 'voice';
    timing: number;
    content: any;
  }> = [];

  // Add music segments
  currentBlock.musicContent.forEach((music) => {
    queueItems.push({
      type: 'music',
      timing: music.timing,
      content: music,
    });
  });

  // Add voice segments
  currentBlock.voiceContent.forEach((voice) => {
    queueItems.push({
      type: 'voice',
      timing: voice.timing,
      content: voice,
    });
  });

  // Sort by timing
  queueItems.sort((a, b) => a.timing - b.timing);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
      <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wide mb-4">
        Coming Up
      </h3>

      {queueItems.length === 0 ? (
        <p className="text-sm text-neutral-500">No items in queue</p>
      ) : (
        <div className="space-y-3">
          {queueItems.slice(0, 5).map((item, index) => (
            <motion.div
              key={`${item.type}-${item.timing}-${index}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-start gap-3 p-3 bg-neutral-950 rounded-lg border border-neutral-800"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-neutral-800 rounded-lg flex items-center justify-center">
                {item.type === 'music' ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
                  </svg>
                )}
              </div>

              <div className="flex-1 min-w-0">
                {item.type === 'music' ? (
                  <>
                    <p className="text-sm font-medium text-neutral-200 truncate">
                      Track {index + 1}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {formatTime(item.timing)} • {Math.floor(item.content.duration / 60)}:{String(item.content.duration % 60).padStart(2, '0')}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-neutral-200">
                      Voice Update
                    </p>
                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                      {item.content.content}
                    </p>
                    <p className="text-xs text-neutral-600 mt-1">
                      {formatTime(item.timing)}
                    </p>
                  </>
                )}
              </div>

              {item.type === 'voice' && (
                <span className={`flex-shrink-0 px-2 py-0.5 rounded text-xs ${
                  item.content.priority === 'high'
                    ? 'bg-red-500/20 text-red-400'
                    : item.content.priority === 'medium'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {item.content.priority}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}


