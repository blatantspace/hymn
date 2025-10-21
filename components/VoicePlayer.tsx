'use client';

import { useEffect, useRef } from 'react';
import type { VoiceSegment } from '@/lib/types';

interface VoicePlayerProps {
  voiceSegment: VoiceSegment | null;
  onComplete: () => void;
}

export default function VoicePlayer({ voiceSegment, onComplete }: VoicePlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!voiceSegment) return;

    console.log('🎤 Playing voice:', voiceSegment.content);

    // Use browser's built-in speech synthesis for now
    // (OpenAI TTS would be better but requires API setup)
    const speech = new SpeechSynthesisUtterance(voiceSegment.content);
    speech.rate = 1.0;
    speech.pitch = 1.0;
    speech.volume = 1.0;

    speech.onend = () => {
      console.log('✅ Voice complete');
      onComplete();
    };

    speech.onerror = (error) => {
      console.error('Voice playback error:', error);
      onComplete(); // Still continue even if voice fails
    };

    // Play the voice
    window.speechSynthesis.cancel(); // Cancel any ongoing speech
    window.speechSynthesis.speak(speech);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [voiceSegment?.id]);

  return null; // This is a headless component
}

