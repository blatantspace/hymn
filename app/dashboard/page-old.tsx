'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import SpotifyPlayer from '@/components/SpotifyPlayer';
import NowPlaying from '@/components/NowPlaying';
import UpcomingTracks from '@/components/UpcomingTracks';
import CalendarView from '@/components/CalendarView';
import type { AudioBlock, UserPreferences, CalendarEvent } from '@/lib/types';
import { selectMusicForContext, generateVoiceContent } from '@/lib/musicSelector';
import { getCurrentBlock, getCurrentPlaybackPosition } from '@/lib/radioStation';
import { getOrCreateSession, createNewSession } from '@/lib/broadcastSession';

export default function Dashboard() {
  const router = useRouter();
  const [currentBlock, setCurrentBlock] = useState<AudioBlock | null>(null);
  const [blocks, setBlocks] = useState<AudioBlock[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  const [demoMode, setDemoMode] = useState(true); // 30-second blocks for testing
  const [userLibrary, setUserLibrary] = useState<any[]>([]);
  const [livePosition, setLivePosition] = useState<any>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    // Load preferences
    const storedPrefs = localStorage.getItem('hymn_preferences');
    if (storedPrefs) {
      setPreferences(JSON.parse(storedPrefs));
    } else {
      // Default preferences
      setPreferences({
        newsCategories: ['technology'],
        musicMoods: ['focus'],
        interruptionLevel: 'moderate',
      });
    }
  }, []);

  useEffect(() => {
    if (!preferences) return;

    // Fetch user's music library FIRST, then generate blocks
    const initializeStation = async () => {
      await fetchUserLibrary(); // Wait for library
      await fetchCalendarEvents(); // Wait for calendar
      generateBlocks(); // Then generate blocks with loaded data
    };

    initializeStation();

    // Check calendar every 30 minutes and regenerate if changed
    const interval = setInterval(() => {
      console.log('⏰ 30-minute check: Refreshing calendar and checking for changes...');
      checkAndRegenerateIfNeeded();
    }, 30 * 60 * 1000); // Every 30 minutes

    return () => clearInterval(interval);
  }, [preferences]);

  const checkAndRegenerateIfNeeded = async () => {
    try {
      // Fetch latest calendar
      const response = await fetch('/api/calendar/events?hours=12');
      if (response.ok) {
        const data = await response.json();
        const newEvents = data.events || [];

        // Simple change detection: compare event count
        if (newEvents.length !== events.length) {
          console.log('📅 Calendar changed! Regenerating blocks...');
          setEvents(newEvents);
          await generateBlocks(); // Regenerate all blocks
        } else {
          console.log('✅ Calendar unchanged, blocks still valid');
        }
      }
    } catch (error) {
      console.error('Error checking calendar changes:', error);
    }
  };

  const fetchUserLibrary = async (): Promise<void> => {
    try {
      console.log('🎵 Fetching your music library...');
      const response = await fetch('/api/spotify/library');
      if (response.ok) {
        const data = await response.json();
        setUserLibrary(data.tracks || []);
        console.log('✅ Loaded your music library:', data.tracks?.length || 0, 'tracks');
        if (data.tracks && data.tracks.length > 0) {
          console.log('📚 Sample tracks:', data.tracks.slice(0, 3).map((t: any) => `${t.name} - ${t.artists[0].name}`));
        }
        return Promise.resolve();
      } else {
        console.error('❌ Failed to fetch library:', response.status);
        return Promise.resolve();
      }
    } catch (error) {
      console.error('❌ Library fetch error:', error);
      return Promise.resolve();
    }
  };

  const fetchCalendarEvents = async (): Promise<void> => {
    try {
      const response = await fetch('/api/calendar/events?hours=12');
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
        console.log('📅 Loaded calendar events:', data.events?.length || 0);
      }
      return Promise.resolve();
    } catch (error) {
      console.log('📅 No calendar connected yet');
      return Promise.resolve();
    }
  };

  const generateBlocks = async () => {
    setIsLoading(true);

    const now = new Date();
    console.log('📻 Radio Station - Current Time:', now.toLocaleTimeString());

    // STEP 1: Check if we have an existing broadcast session
    let session = getOrCreateSession([]);
    
    if (!session) {
      // No session exists - create the FIRST 12-hour broadcast
      console.log('✨ First time setup - Creating your 12-hour broadcast...');
      const newBlocks = createAllDemoBlocks();
      session = getOrCreateSession(newBlocks);
    }

    if (!session) {
      console.error('❌ Failed to create session');
      setIsLoading(false);
      return;
    }

    // STEP 2: Use persisted blocks from session
    const sessionBlocks = session.blocks;
    setBlocks(sessionBlocks);
    
    console.log('📻 Using broadcast session:', {
      sessionStart: new Date(session.startTime).toLocaleString(),
      age: Math.floor((now.getTime() - new Date(session.createdAt).getTime()) / 60000) + ' minutes old',
      blocks: sessionBlocks.length,
    });

    // STEP 3: Find which block should be playing RIGHT NOW
    const liveBlock = getCurrentBlock(sessionBlocks);
    if (liveBlock) {
      const position = getCurrentPlaybackPosition(liveBlock);
      
      console.log('📻 LIVE RADIO - Tuning In:', {
        currentTime: now.toLocaleTimeString(),
        blockStart: new Date(liveBlock.startTime).toLocaleTimeString(),
        elapsed: position.totalElapsed + 's since block started',
        playingNow: position.segmentType,
        positionInSegment: position.positionInSegment + 's into current segment',
      });
      
      if (position.segmentType === 'music') {
        console.log('🎵 You missed the first', position.positionInSegment, 'seconds of this song');
      } else if (position.segmentType === 'voice') {
        console.log('🎤 DJ is talking right now');
      }
      
      setCurrentBlock(liveBlock);
      setLivePosition(position);
    } else {
      // First block hasn't started yet
      console.log('📻 Broadcast starts soon, using first block');
      setCurrentBlock(sessionBlocks[0]);
      setLivePosition({ totalElapsed: 0, segmentType: null, positionInSegment: 0 });
    }

    setIsLoading(false);
  };

  const createSingleDemoBlock = (index: number): AudioBlock => {
    // ALWAYS use actual current time - no demo timestamps
    const now = new Date();
    const start = new Date(now);
    
    if (demoMode) {
      // Demo mode: 30-second blocks starting from current 30-second boundary
      const currentSecond = start.getSeconds();
      const boundarySecond = Math.floor(currentSecond / 30) * 30;
      start.setSeconds(boundarySecond, 0);
      start.setSeconds(start.getSeconds() + (index * 30));
    } else {
      // Production mode: 30-minute blocks starting from current 30-minute boundary
      const currentMinute = start.getMinutes();
      const boundaryMinute = Math.floor(currentMinute / 30) * 30;
      start.setMinutes(boundaryMinute, 0, 0);
      start.setMinutes(start.getMinutes() + (index * 30));
    }
    
    const end = new Date(start);
    if (demoMode) {
      end.setSeconds(end.getSeconds() + 30); // 30 seconds
    } else {
      end.setMinutes(end.getMinutes() + 30); // 30 minutes
    }

    if (index === 0) {
      console.log(`🎙️ Creating blocks... First block: ${start.toLocaleTimeString()} - ${end.toLocaleTimeString()}`);
      console.log(`🎵 User library available:`, userLibrary.length, 'tracks');
    }

    // Smart track selection - varies by time of day and block index
    const hour = start.getHours();
    const dayPart = hour < 8 ? 'early' : hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';
    
    // Different track pools for different times of day
    // Using popular tracks that are guaranteed to exist
    const trackPools: Record<string, string[]> = {
      early: [
        'spotify:track:3n3Ppam7vgaVa1iaRUc9Lp', // Mr. Blue Sky
        'spotify:track:60nZcImufyMA1MKQY3dcCH', // Somebody That I Used to Know  
        'spotify:track:1Je1IMUz1HqjHB5cA8aEVi', // Blinding Lights
      ],
      morning: [
        'spotify:track:0VjIjW4GlUZAMYd2vXMi3b', // Blinding Lights
        'spotify:track:5HCyWlXZPP0y6Gqq8TgA20', // Heat Waves
        'spotify:track:3WMj8moIAXJhHsyLaqIIHI', // Levitating
      ],
      afternoon: [
        'spotify:track:4cOdK2wGLETKBW3PvgPWqT', // Shivers
        'spotify:track:2Fxmhks0bxGSBdJ92vM42m', // As It Was
        'spotify:track:7qEHsqek33rTcFNT9PFqLf', // Someone Like You
      ],
      evening: [
        'spotify:track:3n3Ppam7vgaVa1iaRUc9Lp', // Mr. Blue Sky
        'spotify:track:6DCZcSspjsKoFjzjrWoCdn', // Sunflower
        'spotify:track:0DiWol3AO6WpXZgp0goxAV', // Stay
      ],
      night: [
        'spotify:track:60nZcImufyMA1MKQY3dcCH', // Somebody That I Used to Know
        'spotify:track:1Je1IMUz1HqjHB5cA8aEVi', // Shallow
        'spotify:track:3WMj8moIAXJhHsyLaqIIHI', // Perfect
      ],
    };

    // Use user's library if available, otherwise fallback tracks
    let selectedTracks: string[];
    
    if (userLibrary.length > 0) {
      // Use personalized music from user's library
      const track1Index = (index * 2) % userLibrary.length;
      const track2Index = (index * 2 + 1) % userLibrary.length;
      
      selectedTracks = [
        userLibrary[track1Index].uri,
        userLibrary[track2Index].uri,
      ];
      console.log(`🎵 Block ${index}: Using personalized tracks from your library`);
    } else {
      // Fallback to curated tracks
      const availableTracks = trackPools[dayPart] || trackPools.morning;
      const track1Index = (index * 2) % availableTracks.length;
      const track2Index = (index * 2 + 1) % availableTracks.length;
      
      selectedTracks = [
        availableTracks[track1Index],
        availableTracks[track2Index],
      ];
    }
    
    const demoTracks = selectedTracks;

    // Demo mode: 30-second format vs Production: 30-minute format
    // Start with VOICE, then music (like a radio DJ intro)
    const timings = demoMode 
      ? {
          voiceTiming: 0, // Voice FIRST
          voiceDuration: 3, // 3 seconds
          firstMusic: 3, // Then music
          firstMusicDuration: 12, // 12 seconds
          secondMusic: 15,
          secondMusicDuration: 15, // 15 seconds
        }
      : {
          voiceTiming: 0, // Voice FIRST
          voiceDuration: 30, // 30 seconds intro
          firstMusic: 30, // Then music
          firstMusicDuration: 800, // ~13 minutes
          secondMusic: 830,
          secondMusicDuration: 770, // Rest of block
        };

    // Smart mood selection based on time and context
    const moodRotation = ['focus', 'ambient', 'energetic', 'upbeat', 'calm'];
    const timeBasedMood = hour < 8 ? 'calm' : hour < 12 ? 'focus' : hour < 17 ? 'energetic' : hour < 21 ? 'ambient' : 'calm';
    const selectedMood = moodRotation[(index + hour) % moodRotation.length];

    // Get artist name from track (if available from library)
    const trackUri = selectedTracks[0];
    const trackFromLibrary = userLibrary.find(t => t.uri === trackUri);
    const artistName = trackFromLibrary?.artists?.[0]?.name;

    // Generate context-aware DJ voice content
    const voiceText = generateVoiceContent(
      {
        timeOfDay: start,
        events: events.filter(e => {
          const eventStart = new Date(e.start);
          return eventStart >= start && eventStart < end;
        }),
        preferences: preferences || { newsCategories: [], musicMoods: [], interruptionLevel: 'moderate' },
        blockIndex: index,
      },
      artistName
    );

    return {
      id: `demo-block-${index}`,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      strategy: {
        musicStyle: selectedMood as any,
        musicVolume: 0.7,
        voiceFrequency: 'moderate',
        interruptionLevel: 'low',
        reasoning: `${dayPart} ${selectedMood} session`,
      },
      voiceContent: [
        {
          id: `voice-intro-${index}`,
          timing: timings.voiceTiming, // Start of block
          content: voiceText,
          duration: timings.voiceDuration,
          priority: 'high' as const,
        },
        ...(demoMode ? [{
          id: `voice-transition-${index}`,
          timing: timings.firstMusic + timings.firstMusicDuration, // Between tracks
          content: `Coming up next - ${artistName || 'another great track'}!`,
          duration: 2,
          priority: 'medium' as const,
        }] : []),
      ],
      musicContent: [
        {
          timing: timings.firstMusic,
          duration: timings.firstMusicDuration,
          spotifyUri: demoTracks[0], // Use smart-selected tracks
          volume: 0.7,
          fadeIn: 1,
          fadeOut: 0.5,
        },
        {
          timing: timings.secondMusic,
          duration: timings.secondMusicDuration,
          spotifyUri: demoTracks[1] || demoTracks[0], // Fallback to first if only one
          volume: 0.7,
          fadeIn: 0.5,
          fadeOut: 1,
        }
      ],
      generatedAt: new Date().toISOString(),
    };
  };

  const createAllDemoBlocks = (): AudioBlock[] => {
    const demoBlocks: AudioBlock[] = [];

    // Generate 24 blocks of 30 minutes each (12 hours total)
    for (let i = 0; i < 24; i++) {
      demoBlocks.push(createSingleDemoBlock(i));
    }

    return demoBlocks;
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNextBlock = () => {
    const currentIndex = blocks.findIndex(b => b.id === currentBlock?.id);
    const nextIndex = (currentIndex + 1) % blocks.length;
    const nextBlock = blocks[nextIndex];
    
    console.log(`⏭️ Skipping to next block: ${currentIndex} → ${nextIndex}`);
    
    // Cancel any ongoing voice
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    // Calculate live position for next block
    const position = getCurrentPlaybackPosition(nextBlock);
    console.log('📻 Next block position:', {
      elapsed: position.totalElapsed + 's',
      segment: position.segmentType,
    });
    
    setCurrentBlock(nextBlock);
    setLivePosition(position);
  };

  const handleShuffleNextTrack = () => {
    if (!currentBlock || userLibrary.length === 0) return;

    console.log('🔀 Shuffling next track...');
    
    // Get a random track from library
    const randomTrack = userLibrary[Math.floor(Math.random() * userLibrary.length)];
    
    // Update the second music segment with random track
    const updatedBlock = {
      ...currentBlock,
      musicContent: currentBlock.musicContent.map((segment, idx) => 
        idx === 1 ? { ...segment, spotifyUri: randomTrack.uri } : segment
      ),
    };

    // Update blocks array
    const updatedBlocks = blocks.map(b => 
      b.id === currentBlock.id ? updatedBlock : b
    );

    setBlocks(updatedBlocks);
    setCurrentBlock(updatedBlock);
    console.log('✅ Next track shuffled to:', randomTrack.name);
  };


  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 text-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="text-6xl mb-4"
          >
            📻
          </motion.div>
          <p className="text-neutral-400">Tuning into your broadcast...</p>
          <p className="text-xs text-neutral-600 mt-2">Finding where you left off</p>
        </div>
      </main>
    );
  }

  // Show "Tune In" button if user hasn't interacted yet (browser autoplay restriction)
  if (!hasInteracted) {
    // Get current and next track info
    const getCurrentAndNextTracks = () => {
      if (!currentBlock) return null;

      const position = livePosition?.totalElapsed || 0;
      
      // Find current music segment
      const currentMusic = currentBlock.musicContent.find(m => 
        position >= m.timing && position < m.timing + m.duration
      );
      
      // Find next music segment
      const nextMusic = currentBlock.musicContent.find(m => m.timing > position);
      
      const getTrackInfo = (uri: string) => {
        const track = userLibrary.find(t => t.uri === uri);
        return track ? {
          name: track.name,
          artist: track.artists?.[0]?.name || 'Unknown',
          album: track.album?.name,
          image: track.album?.images?.[0]?.url,
        } : null;
      };

      return {
        current: currentMusic?.spotifyUri ? getTrackInfo(currentMusic.spotifyUri) : null,
        currentPosition: currentMusic ? position - currentMusic.timing : 0,
        currentDuration: currentMusic?.duration || 0,
        next: nextMusic?.spotifyUri ? getTrackInfo(nextMusic.spotifyUri) : null,
      };
    };

    const trackInfo = getCurrentAndNextTracks();

    return (
      <main className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 text-neutral-100 flex items-center justify-center p-4">
        <div className="text-center max-w-2xl w-full">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-8xl mb-6"
          >
            📻
          </motion.div>
          <h2 className="text-4xl font-light mb-2">Ready to Tune In?</h2>
          <p className="text-neutral-400 mb-8 text-lg">
            Your live broadcast is ready. Join wherever the music is right now.
          </p>

          {/* Currently Playing */}
          {trackInfo?.current && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6 p-6 bg-neutral-900 border border-neutral-800 rounded-2xl"
            >
              <div className="flex items-center gap-1.5 text-xs text-red-500 mb-3">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                </span>
                CURRENTLY PLAYING
              </div>
              
              <div className="flex items-center gap-4">
                {trackInfo.current.image && (
                  <img 
                    src={trackInfo.current.image} 
                    alt={trackInfo.current.name}
                    className="w-20 h-20 rounded-lg shadow-lg"
                  />
                )}
                <div className="flex-1 text-left">
                  <p className="font-medium text-lg mb-1">{trackInfo.current.name}</p>
                  <p className="text-neutral-400 text-sm">{trackInfo.current.artist}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-neutral-500">
                    <div className="flex-1 bg-neutral-800 rounded-full h-1 overflow-hidden">
                      <div 
                        className="h-full bg-neutral-100"
                        style={{ width: `${(trackInfo.currentPosition / trackInfo.currentDuration) * 100}%` }}
                      />
                    </div>
                    <span>{Math.floor(trackInfo.currentPosition)}s / {Math.floor(trackInfo.currentDuration)}s</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Up Next */}
          {trackInfo?.next && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-8 p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl"
            >
              <p className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Up Next</p>
              <div className="flex items-center gap-3">
                {trackInfo.next.image && (
                  <img 
                    src={trackInfo.next.image} 
                    alt={trackInfo.next.name}
                    className="w-12 h-12 rounded-lg"
                  />
                )}
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm">{trackInfo.next.name}</p>
                  <p className="text-neutral-500 text-xs">{trackInfo.next.artist}</p>
                </div>
              </div>
            </motion.div>
          )}

          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            onClick={() => setHasInteracted(true)}
            className="px-12 py-5 bg-neutral-100 text-neutral-900 rounded-full font-medium hover:bg-neutral-200 transition-all text-xl hover:scale-105 shadow-xl"
          >
            🎧 Tune In Now
          </motion.button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 text-neutral-100">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-light">Hymn</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={async () => {
                console.log('🔄 Force refreshing library and blocks...');
                await fetchUserLibrary();
                const newBlocks = createAllDemoBlocks();
                const session = createNewSession(newBlocks);
                if (session) {
                  setBlocks(session.blocks);
                  const liveBlock = getCurrentBlock(session.blocks);
                  if (liveBlock) {
                    setCurrentBlock(liveBlock);
                    setLivePosition(getCurrentPlaybackPosition(liveBlock));
                  }
                }
              }}
              className="text-xs px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
            >
              🔄 Refresh
            </button>
            <button
              onClick={handleNextBlock}
              className="text-xs px-3 py-1.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700 hover:bg-neutral-700 transition-colors"
            >
              ⏭️ Next
            </button>
            <button
              onClick={() => {
                const newDemoMode = !demoMode;
                setDemoMode(newDemoMode);
                // Force regenerate with new mode
                const newBlocks = createAllDemoBlocks();
                const session = createNewSession(newBlocks);
                if (session) {
                  setBlocks(session.blocks);
                  const liveBlock = getCurrentBlock(session.blocks);
                  if (liveBlock) {
                    setCurrentBlock(liveBlock);
                    setLivePosition(getCurrentPlaybackPosition(liveBlock));
                  }
                }
              }}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                demoMode 
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                  : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
              }`}
            >
              {demoMode ? '⚡ Demo' : '📻 Live'}
            </button>
            <button
              onClick={() => router.push('/setup')}
              className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              Settings
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Now Playing & Queue */}
          <div className="lg:col-span-2 space-y-6">
            {/* Now Playing */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <NowPlaying
                currentTrack={currentTrack}
                currentBlock={currentBlock}
                isPlaying={isPlaying}
                onPlayPause={handlePlayPause}
                deviceId={deviceId}
              />
            </motion.div>

            {/* Upcoming Tracks */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <UpcomingTracks 
                currentBlock={currentBlock} 
                userLibrary={userLibrary}
                onShuffleNext={handleShuffleNextTrack}
                livePosition={livePosition}
              />
            </motion.div>
          </div>

          {/* Right Column - Calendar View */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="sticky top-24"
            >
              <CalendarView
                blocks={blocks}
                events={events}
                currentBlockId={currentBlock?.id || null}
                userLibrary={userLibrary}
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Hidden Spotify Player for SDK functionality */}
      <div className="hidden">
        <SpotifyPlayer
          currentBlock={currentBlock}
          isPlaying={isPlaying}
          onPlayStateChange={setIsPlaying}
          onTrackChange={setCurrentTrack}
          onDeviceReady={setDeviceId}
          livePosition={livePosition}
          hasInteracted={hasInteracted}
        />
      </div>
    </main>
  );
}
