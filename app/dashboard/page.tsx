'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import SpotifyPlayer from '@/components/SpotifyPlayer';
import NowPlaying from '@/components/NowPlaying';
import RadioTimeline from '@/components/RadioTimeline';
import type { TimelineItem, CalendarEvent, AudioBlock } from '@/lib/types';
import { calculateCurrentPlayhead, getUpcoming } from '@/lib/playhead';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [timeline, setTimeline] = useState<{
    id: string;
    items: TimelineItem[];
    currentPosition: Date;
  } | null>(null);
  const [currentItem, setCurrentItem] = useState<TimelineItem | null>(null);
  const [upcomingItems, setUpcomingItems] = useState<TimelineItem[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  const isNewUser = searchParams?.get('new_user') === 'true';
  const regenerationInterval = useRef<NodeJS.Timeout | null>(null);

  // Fetch timeline on mount
  useEffect(() => {
    fetchTimeline();
    fetchCalendarEvents();

    // Set up 5-minute regeneration
    regenerationInterval.current = setInterval(() => {
      console.log('🔄 Auto-regenerating timeline...');
      regenerateTimeline();
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      if (regenerationInterval.current) {
        clearInterval(regenerationInterval.current);
      }
    };
  }, []);

  const fetchTimeline = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/timeline/current');
      if (response.ok) {
        const data = await response.json();
        console.log('📻 Timeline loaded:', data);
        
        setTimeline({
          id: data.timeline.id,
          items: data.allItems.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp),
          })),
          currentPosition: new Date(data.timeline.currentPosition),
        });
        
        if (data.currentItem) {
          setCurrentItem({
            ...data.currentItem,
            timestamp: new Date(data.currentItem.timestamp),
          });
        }
        
        setUpcomingItems(data.upcomingItems.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        })));
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch timeline:', response.status, errorData);
        // Create demo timeline for now
        createDemoTimeline();
      }
    } catch (error) {
      console.error('Timeline error:', error);
      createDemoTimeline();
    } finally {
      setIsLoading(false);
    }
  };

  const createDemoTimeline = () => {
    console.log('📻 Creating demo timeline (fallback mode)');
    const now = new Date();
    const items: TimelineItem[] = [];
    
    // Create past items (8 AM to now)
    const start = new Date(now);
    start.setHours(8, 0, 0, 0);
    
    const demoTracks = [
      { uri: 'spotify:track:3n3Ppam7vgaVa1iaRUc9Lp', name: 'Mr. Brightside', artist: 'The Killers', image: 'https://i.scdn.co/image/ab67616d0000b273ccdddd46119a4ff53eaf1f5d' },
      { uri: 'spotify:track:5HCyWlXZPP0y6Gqq8TgA20', name: 'Somebody Told Me', artist: 'The Killers', image: 'https://i.scdn.co/image/ab67616d0000b273ccdddd46119a4ff53eaf1f5d' },
      { uri: 'spotify:track:0VjIjW4GlUZAMYd2vXMi3b', name: 'Blinding Lights', artist: 'The Weeknd', image: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36' },
      { uri: 'spotify:track:6DCZcSspjsKoFjzjrWoCdn', name: 'Levitating', artist: 'Dua Lipa', image: 'https://i.scdn.co/image/ab67616d0000b273be841ba4bc24340152e3a79a' },
      { uri: 'spotify:track:7qiZfU4dY1lWllzX7mPBI', name: 'Shape of You', artist: 'Ed Sheeran', image: 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96' },
      { uri: 'spotify:track:60nZcImufyMA1MKQY3dcCH', name: 'As It Was', artist: 'Harry Styles', image: 'https://i.scdn.co/image/ab67616d0000b2732e8ed79e177ff6011076f5f0' },
    ];
    
    let currentTime = new Date(start);
    let itemId = 0;
    
    while (currentTime < new Date(now.getTime() + 4 * 60 * 60 * 1000)) {
      const track = demoTracks[itemId % demoTracks.length];
      const isPast = currentTime < now;
      
      items.push({
        id: `demo-item-${itemId}`,
        type: 'spotify_track',
        timestamp: new Date(currentTime),
        duration: 204, // ~3:24 per song
        locked: isPast,
        title: track.name,
        artist: track.artist,
        imageUrl: track.image,
        spotifyUri: track.uri,
        volume: 0.7,
      });
      
      currentTime = new Date(currentTime.getTime() + 204 * 1000);
      itemId++;
    }
    
    console.log('✅ Created demo timeline with', items.length, 'items');
    
    setTimeline({
      id: 'demo-timeline',
      items,
      currentPosition: now,
    });
    
    // Use playhead calculator to find EXACTLY what should be playing now
    const { currentItem: current, positionInTrack, percentComplete } = calculateCurrentPlayhead(items);
    
    console.log('🎵 Playhead position:', {
      track: current?.title,
      positionMs: positionInTrack,
      percent: percentComplete.toFixed(1) + '%',
    });
    
    setCurrentItem(current);
    setUpcomingItems(getUpcoming(items, 10));
  };

  const fetchCalendarEvents = async () => {
    try {
      const response = await fetch('/api/calendar/events?hours=12');
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.log('📅 Calendar not connected');
    }
  };

  const regenerateTimeline = async () => {
    if (!timeline) return;
    
    try {
      await fetch('/api/timeline/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timelineId: timeline.id }),
      });
      
      // Refresh timeline data
      fetchTimeline();
    } catch (error) {
      console.error('Regeneration failed:', error);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (timestamp: Date) => {
    console.log('⏪ Seeking to:', timestamp.toLocaleTimeString());
    // Find item at this timestamp
    const item = timeline?.items.find(i => 
      new Date(i.timestamp) <= timestamp && 
      new Date(new Date(i.timestamp).getTime() + i.duration * 1000) > timestamp
    );
    if (item) {
      setCurrentItem(item);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 text-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="text-6xl mb-4"
          >
            📻
          </motion.div>
          <p className="text-neutral-400">Tuning into your radio station...</p>
          {isNewUser && (
            <p className="text-xs text-neutral-600 mt-2">
              Generating your personalized timeline
            </p>
          )}
        </div>
      </main>
    );
  }

  // Convert timeline to block format for SpotifyPlayer compatibility
  const currentBlock: AudioBlock | null = currentItem ? {
    id: 'current',
    startTime: currentItem.timestamp.toISOString(),
    endTime: new Date(currentItem.timestamp.getTime() + currentItem.duration * 1000).toISOString(),
    strategy: {
      musicStyle: (currentItem.mood as any) || 'focus',
      musicVolume: currentItem.volume,
      voiceFrequency: 'moderate',
      interruptionLevel: 'low',
      reasoning: `${currentItem.title} by ${currentItem.artist}`,
    },
    voiceContent: [],
    musicContent: currentItem.spotifyUri ? [{
      timing: 0,
      duration: currentItem.duration,
      spotifyUri: currentItem.spotifyUri,
      volume: currentItem.volume,
    }] : [],
    generatedAt: new Date().toISOString(),
  } : null;

  // Get stats for header
  const totalItems = timeline?.items.length || 0;
  const pastItems = timeline?.items.filter(i => i.locked).length || 0;
  const missedHours = pastItems > 0 ? Math.floor(pastItems / 12) : 0; // ~12 tracks/hour

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 text-neutral-100">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-light">Hymn</h1>
            <div className="flex items-center gap-4">
              {isNewUser && missedHours > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-xs px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded-full"
                >
                  You missed {missedHours}+ hours of amazing music! 🎵
                </motion.div>
              )}
              <button
                onClick={() => router.push('/setup')}
                className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                Settings
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Now Playing */}
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

            {/* Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Your Radio Timeline</h3>
                <p className="text-xs text-neutral-500">
                  {totalItems} segments • {pastItems} already aired
                </p>
              </div>
              {timeline && (
                <RadioTimeline
                  items={timeline.items}
                  currentItemId={currentItem?.id || null}
                  onSeek={handleSeek}
                />
              )}
            </motion.div>
          </div>

          {/* Right Column - Upcoming Items */}
          {upcomingItems.length > 0 && (
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="sticky top-24 bg-neutral-900 border border-neutral-800 rounded-2xl p-6"
              >
                <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wide mb-4">
                  Coming Up Next
                </h3>
                <div className="space-y-3">
                  {upcomingItems.slice(0, 10).map((item, index) => (
                    <div key={item.id} className="p-3 bg-neutral-950 rounded-lg border border-neutral-800">
                      <p className="text-sm font-medium text-neutral-200 truncate">{item.title}</p>
                      <p className="text-xs text-neutral-500 mt-1">
                        {new Date(item.timestamp).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
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
        />
      </div>
    </main>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 text-neutral-100 flex items-center justify-center">
        <div className="text-4xl">📻</div>
      </main>
    }>
      <DashboardContent />
    </Suspense>
  );
}

