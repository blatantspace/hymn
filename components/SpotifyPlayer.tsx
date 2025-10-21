'use client';

import { useEffect, useRef, useState } from 'react';
import type { AudioBlock, MusicSegment } from '@/lib/types';

interface SpotifyPlayerProps {
  currentBlock: AudioBlock | null;
  isPlaying: boolean;
  onPlayStateChange: (playing: boolean) => void;
  onTrackChange?: (track: any) => void;
  onDeviceReady?: (deviceId: string) => void;
  livePosition?: any; // Position to start from (for joining mid-broadcast)
  hasInteracted?: boolean; // User has clicked to start
}

export default function SpotifyPlayer({
  currentBlock,
  isPlaying,
  onPlayStateChange,
  onTrackChange,
  onDeviceReady,
  livePosition,
  hasInteracted,
}: SpotifyPlayerProps) {
  const [player, setPlayer] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [voiceComplete, setVoiceComplete] = useState(false);
  const playerInitialized = useRef(false);

  useEffect(() => {
    // Load Spotify Web Playback SDK
    if (playerInitialized.current) return;

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    (window as any).onSpotifyWebPlaybackSDKReady = () => {
      initializePlayer();
    };

    playerInitialized.current = true;

    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, []);

  const initializePlayer = async () => {
    console.log('🎵 Initializing Spotify player...');
    
    // Get access token - will auto-refresh if expired
    const token = await getSpotifyAccessToken();

    if (!token) {
      console.error('❌ No Spotify access token available');
      return;
    }

    console.log('✅ Got Spotify token, creating player...');

    const spotifyPlayer = new (window as any).Spotify.Player({
      name: 'Hymn Web Player',
      getOAuthToken: async (cb: (token: string) => void) => {
        // Always get fresh token (will use cached if still valid)
        const freshToken = await getSpotifyAccessToken();
        cb(freshToken || token);
      },
      volume: 0.5,
    });

    // Player event handlers
    spotifyPlayer.addListener('ready', ({ device_id }: { device_id: string }) => {
      console.log('✅ Spotify player ready with Device ID:', device_id);
      
      // Small delay to ensure device is fully ready, then trigger play
      setTimeout(() => {
        setDeviceId(device_id);
        onDeviceReady?.(device_id);
        console.log('📻 Device ready, triggering autoplay...');
        
        // Force the player to be active (helps with browser autoplay restrictions)
        spotifyPlayer.activateElement();
      }, 500);
    });

    spotifyPlayer.addListener('not_ready', ({ device_id }: { device_id: string }) => {
      console.log('⚠️ Device ID has gone offline:', device_id);
    });

    spotifyPlayer.addListener('player_state_changed', (state: any) => {
      if (!state) return;

      const track = state.track_window.current_track;
      const previousTrack = currentTrack;
      
      // Track changed - new song started
      if (track && previousTrack && track.id !== previousTrack.id) {
        console.log('🎵 Track changed:', previousTrack.name, '→', track.name);
      }
      
      // Track ended - queue next track
      if (state.position === 0 && state.paused && previousTrack) {
        console.log('✅ Track ended, checking for next track...');
        queueNextTrack();
      }
      
      setCurrentTrack(track);
      onTrackChange?.(track);
      onPlayStateChange(!state.paused);
    });

    // Error handling
    spotifyPlayer.addListener('initialization_error', ({ message }: any) => {
      console.error('❌ Initialization error:', message);
    });

    spotifyPlayer.addListener('authentication_error', ({ message }: any) => {
      console.error('❌ Authentication error:', message);
    });

    spotifyPlayer.addListener('account_error', ({ message }: any) => {
      console.error('❌ Account error:', message);
    });

    spotifyPlayer.addListener('playback_error', ({ message }: any) => {
      console.error('❌ Playback error:', message);
    });

    console.log('🔌 Connecting player...');
    const connected = await spotifyPlayer.connect();
    
    if (connected) {
      console.log('✅ Player connected successfully!');
    } else {
      console.error('❌ Player failed to connect');
    }
    
    setPlayer(spotifyPlayer);
  };

  const getSpotifyAccessToken = async (): Promise<string | null> => {
    // In production, this would call an API route that returns the token
    // For now, we'll try to get it from a cookie or localStorage
    try {
      const response = await fetch('/api/spotify/token');
      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error('Failed to get Spotify token:', error);
      return null;
    }
  };

  const playTrack = async (uri: string, positionMs: number = 0, retryCount = 0) => {
    if (!deviceId) {
      console.error('No device ID available');
      return;
    }

    const token = await getSpotifyAccessToken();
    if (!token) return;

    try {
      console.log('🎵 Playing track on device:', deviceId, 'at position:', positionMs + 'ms');
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          uris: [uri],
          position_ms: positionMs, // Start at specific position (for joining mid-song)
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        
        // If 403 and haven't retried yet, try refreshing token
        if (response.status === 403 && retryCount === 0) {
          console.log('🔄 Token might be expired, refreshing...');
          
          // Refresh token
          const refreshResponse = await fetch('/api/spotify/refresh', {
            method: 'POST',
          });
          
          if (refreshResponse.ok) {
            console.log('✅ Token refreshed, retrying playback...');
            // Retry with new token
            setTimeout(() => playTrack(uri, retryCount + 1), 500);
            return;
          }
        }
        
        console.error('Playback failed:', response.status, error);
      } else {
        console.log('✅ Playback started successfully');
      }
    } catch (error) {
      console.error('Failed to play track:', error);
    }
  };

  const queueNextTrack = () => {
    if (!currentBlock) return;

    // Find current track in block
    const currentUri = currentTrack?.uri;
    const currentSegmentIndex = currentBlock.musicContent.findIndex(
      m => m.spotifyUri === currentUri
    );

    // Get next music segment
    const nextSegment = currentBlock.musicContent[currentSegmentIndex + 1];
    
    if (nextSegment) {
      console.log('⏭️ Auto-playing next track:', nextSegment.spotifyUri);
      
      // Check if there's a voice update before next track
      const nextSegmentStart = nextSegment.timing;
      const voiceBeforeNext = currentBlock.voiceContent.find(
        v => v.timing < nextSegmentStart && v.timing > (currentBlock.musicContent[currentSegmentIndex]?.timing || 0)
      );

      if (voiceBeforeNext) {
        console.log('🎤 DJ update before next track');
        playVoiceAndThenMusic(voiceBeforeNext, nextSegment.spotifyUri);
      } else {
        // No voice, just play next track
        setTimeout(() => {
          playTrack(nextSegment.spotifyUri, 0);
        }, 500);
      }
    } else {
      console.log('📻 End of block reached');
    }
  };

  const playVoiceAndThenMusic = async (voiceSegment: any, nextTrackUri: string) => {
    try {
      const storedPrefs = localStorage.getItem('hymn_preferences');
      const voiceType = storedPrefs ? JSON.parse(storedPrefs).voiceType || 'nova' : 'nova';

      const response = await fetch('/api/voice/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: voiceSegment.content,
          voice: voiceType,
        }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        audio.onplay = () => {
          console.log('🎤 DJ voice playing between tracks');
          if (player) player.setVolume(0.15); // Duck music
        };

        audio.onended = () => {
          console.log('✅ Voice done, playing next track');
          URL.revokeObjectURL(audioUrl);
          if (player) player.setVolume(0.7); // Restore volume
          playTrack(nextTrackUri, 0);
        };

        audio.volume = 1.0;
        audio.play();
      } else {
        // Voice failed, just play music
        playTrack(nextTrackUri, 0);
      }
    } catch (error) {
      console.error('Voice generation error:', error);
      playTrack(nextTrackUri, 0);
    }
  };

  const togglePlayPause = () => {
    if (!player || !deviceId) return;

    if (currentTrack) {
      // If we have a track loaded, toggle it
      player.togglePlay();
    } else {
      // If no track is loaded yet, trigger the initial play
      onPlayStateChange(!isPlaying);
    }
  };

  useEffect(() => {
    console.log('🔍 Checking playback conditions:', {
      hasBlock: !!currentBlock,
      hasDevice: !!deviceId,
      hasInteracted: !!hasInteracted,
      blockId: currentBlock?.id,
      voiceCount: currentBlock?.voiceContent?.length || 0,
      musicCount: currentBlock?.musicContent?.length || 0,
    });

    if (!currentBlock || !deviceId || !hasInteracted) {
      console.log('⏸️ Waiting for block/device/user interaction...');
      return;
    }

    // Check if we should be in a voice segment right now based on live position
    const currentElapsed = livePosition?.totalElapsed || 0;
    const currentVoice = currentBlock.voiceContent.find(
      v => currentElapsed >= v.timing && currentElapsed < v.timing + v.duration
    );

    if (currentVoice) {
      console.log('🎤 Currently in voice segment, skipping to next music...');
      // User joined during voice - skip to next music segment
      const nextMusic = currentBlock.musicContent.find(m => m.timing >= currentElapsed);
      if (nextMusic) {
        const timer = setTimeout(() => {
          playTrack(nextMusic.spotifyUri, 0);
        }, (currentVoice.timing + currentVoice.duration - currentElapsed) * 1000);
        return () => clearTimeout(timer);
      }
    }

    // Check if block starts with voice (and we're at the beginning)
    const hasVoiceFirst = currentBlock.voiceContent.length > 0 && currentBlock.voiceContent[0].timing === 0 && currentElapsed < 5;
    const firstVoice = hasVoiceFirst ? currentBlock.voiceContent[0] : null;

    if (hasVoiceFirst && firstVoice) {
      console.log('🎤 Block starts with voice intro:', firstVoice.content);
      
      const musicSegment = currentBlock.musicContent[0];
      
      // Use OpenAI TTS for natural voice with music ducking
      const playVoiceAndMusic = async () => {
        try {
          // Get user's preferred voice from localStorage
          const storedPrefs = localStorage.getItem('hymn_preferences');
          const voiceType = storedPrefs ? JSON.parse(storedPrefs).voiceType || 'nova' : 'nova';

          // Check if voice is already cached
          const cachedVoice = localStorage.getItem(`hymn_voice_${firstVoice.id}`);
          let audioUrl: string;

          if (cachedVoice) {
            console.log('💾 Using cached voice:', firstVoice.id);
            audioUrl = cachedVoice;
          } else {
            console.log('🎤 Generating new voice file:', firstVoice.id);
            // Generate voice with OpenAI
            const response = await fetch('/api/voice/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: firstVoice.content,
                voice: voiceType,
              }),
            });

            if (!response.ok) {
              throw new Error('Voice generation failed');
            }

            const blob = await response.blob();
            audioUrl = URL.createObjectURL(blob);
            
            // Cache it for future use (convert to base64 for localStorage)
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = reader.result as string;
              localStorage.setItem(`hymn_voice_${firstVoice.id}`, base64);
              console.log('💾 Cached voice file:', firstVoice.id);
            };
            reader.readAsDataURL(blob);
          }

          // Play the cached or new audio
          const audio = cachedVoice ? new Audio(cachedVoice) : new Audio(audioUrl);

          // Fade down music before voice starts (if music is already playing)
            const fadeDownMusic = async () => {
              if (!player) return;
              
              const currentVolume = 0.7;
              const targetVolume = 0.15;
              const steps = 10;
              const stepDuration = 300 / steps; // 300ms fade

              for (let i = 0; i < steps; i++) {
                const volume = currentVolume - ((currentVolume - targetVolume) * (i / steps));
                player.setVolume(volume);
                await new Promise(resolve => setTimeout(resolve, stepDuration));
              }
              player.setVolume(targetVolume);
            };

            const fadeUpMusic = async () => {
              if (!player) return;
              
              const currentVolume = 0.15;
              const targetVolume = 0.7;
              const steps = 10;
              const stepDuration = 300 / steps; // 300ms fade

              for (let i = 0; i < steps; i++) {
                const volume = currentVolume + ((targetVolume - currentVolume) * (i / steps));
                player.setVolume(volume);
                await new Promise(resolve => setTimeout(resolve, stepDuration));
              }
              player.setVolume(targetVolume);
          };

          audio.onplay = async () => {
              console.log('🎤 OpenAI voice playing - ducking music...');
              await fadeDownMusic();
          };

          audio.onended = async () => {
              console.log('✅ Voice complete, restoring music volume...');
              URL.revokeObjectURL(audioUrl);
              
              await fadeUpMusic();
              
              if (musicSegment?.spotifyUri) {
                setTimeout(() => {
                  playTrack(musicSegment.spotifyUri);
                }, 300);
              }
          };

          audio.onerror = (error) => {
              console.error('🎤 Audio playback error:', error);
              URL.revokeObjectURL(audioUrl);
              // Start music anyway
              if (musicSegment?.spotifyUri) {
                playTrack(musicSegment.spotifyUri);
              }
          };

          // Play the audio
          audio.volume = 1.0;
          audio.play().catch(err => {
            console.error('Failed to play audio:', err);
            // Fallback to music
            if (musicSegment?.spotifyUri) {
              playTrack(musicSegment.spotifyUri, 0);
            }
          });
        } catch (error) {
          console.error('Voice generation error:', error);
          // Fallback to music
          if (musicSegment?.spotifyUri) {
            playTrack(musicSegment.spotifyUri);
          }
        }
      };

      // Delay the whole voice sequence to ensure device is ready
      const timer = setTimeout(playVoiceAndMusic, 1000);

      return () => {
        clearTimeout(timer);
        window.speechSynthesis.cancel();
      };
    } else {
      // No voice, start music at live position (like tuning into radio mid-song)
      
      // Find which music segment should be playing right now
      let targetSegment = currentBlock.musicContent[0];
      let positionMs = 0;

      if (livePosition && livePosition.totalElapsed > 0) {
        // Find the music segment that should be playing
        for (const segment of currentBlock.musicContent) {
          const segmentStart = segment.timing;
          const segmentEnd = segment.timing + segment.duration;
          
          if (livePosition.totalElapsed >= segmentStart && livePosition.totalElapsed < segmentEnd) {
            targetSegment = segment;
            positionMs = (livePosition.totalElapsed - segmentStart) * 1000;
            console.log('📻 Found live segment:', {
              trackUri: segment.spotifyUri,
              segmentStart: segmentStart + 's',
              currentPosition: livePosition.totalElapsed + 's',
              seekTo: positionMs + 'ms',
            });
            break;
          }
        }
      }

      if (targetSegment?.spotifyUri) {
        if (positionMs > 0) {
          console.log('📻 Joining live broadcast mid-song at', Math.floor(positionMs / 1000) + 's');
        } else {
          console.log('🎵 Starting from beginning of block');
        }

        const timer = setTimeout(() => {
          playTrack(targetSegment.spotifyUri, positionMs);
        }, 1000);

        return () => clearTimeout(timer);
      } else {
        console.log('⚠️ No music found in block:', currentBlock);
      }
    }
  }, [currentBlock?.id, deviceId, hasInteracted, livePosition?.totalElapsed]);

  // This component is now just for Spotify SDK functionality
  // UI is handled by NowPlaying component
  return null;
}

