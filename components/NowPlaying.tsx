'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { AudioBlock } from '@/lib/types';

interface NowPlayingProps {
  currentTrack: any;
  currentBlock: AudioBlock | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  deviceId: string;
}

export default function NowPlaying({
  currentTrack,
  currentBlock,
  isPlaying,
  onPlayPause,
  deviceId,
}: NowPlayingProps) {
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isVoicePlaying, setIsVoicePlaying] = useState(false);

  useEffect(() => {
    if (currentTrack) {
      setDuration(currentTrack.duration_ms);
      setIsVoicePlaying(false); // Music is playing, voice is not
    }
  }, [currentTrack]);

  // Detect voice playback (simulate for now since browser TTS is unreliable)
  useEffect(() => {
    if (!currentBlock) return;

    const hasVoiceFirst = currentBlock.voiceContent.length > 0 && currentBlock.voiceContent[0].timing === 0;
    
    if (hasVoiceFirst && !currentTrack) {
      // Show voice indicator while waiting for music
      setIsVoicePlaying(true);
      
      const voiceDuration = currentBlock.voiceContent[0].duration;
      const timer = setTimeout(() => {
        setIsVoicePlaying(false);
      }, voiceDuration * 1000 + 1000);

      return () => clearTimeout(timer);
    }
  }, [currentBlock?.id, currentTrack]);

  // Mock progress for now (we'd get this from Spotify player state in production)
  useEffect(() => {
    if (!isPlaying || !duration) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= duration) return 0;
        return prev + 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-neutral-400">Now Playing</span>
        <span className="flex items-center gap-1.5 text-xs text-red-500">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
          </span>
          LIVE
        </span>
      </div>

      {isVoicePlaying ? (
        <div className="space-y-6">
          {/* Voice Playing Indicator */}
          <div className="flex justify-center">
            <div className="w-48 h-48 bg-neutral-800 rounded-xl shadow-2xl flex items-center justify-center">
              <div className="text-center">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-6xl mb-2"
                >
                  🎤
                </motion.div>
                <p className="text-sm text-neutral-400">Voice Update</p>
              </div>
            </div>
          </div>

          {/* Voice Content Preview */}
          {currentBlock?.voiceContent[0] && (
            <div className="text-center max-w-md mx-auto">
              <p className="text-neutral-300 text-sm leading-relaxed">
                {currentBlock.voiceContent[0].content}
              </p>
            </div>
          )}
        </div>
      ) : currentTrack ? (
        <div className="space-y-6">
          {/* Album Art - Star of the Show */}
          <div className="flex justify-center">
            <img
              src={currentTrack.album.images[0]?.url}
              alt={currentTrack.name}
              className="w-80 h-80 rounded-2xl shadow-2xl"
            />
          </div>

          {/* Track Info */}
          <div className="text-center">
            <h3 className="text-2xl font-semibold mb-2">{currentTrack.name}</h3>
            <p className="text-neutral-400 text-lg">
              {currentTrack.artists.map((a: any) => a.name).join(', ')}
            </p>
            <p className="text-neutral-600 text-sm mt-2">{currentTrack.album.name}</p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
              <motion.div
                className="h-full bg-neutral-100"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="flex justify-between text-xs text-neutral-500">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Play Button */}
          <div className="flex justify-center">
            <button
              onClick={onPlayPause}
              disabled={!deviceId}
              className="w-16 h-16 bg-neutral-100 text-neutral-900 rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg disabled:opacity-50"
            >
              {isPlaying ? (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center">
          <div className="w-48 h-48 bg-neutral-800 rounded-xl mx-auto mb-6 flex items-center justify-center">
            <svg className="w-16 h-16 text-neutral-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
          <p className="text-neutral-500">Loading your music...</p>
          <p className="text-xs text-neutral-600 mt-1">Connecting to Spotify</p>
        </div>
      )}
    </div>
  );
}




