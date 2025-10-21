'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';

function SetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [preferences, setPreferences] = useState<{
    newsCategories: string[];
    musicMoods: string[];
    interruptionLevel: 'minimal' | 'moderate' | 'active';
    voiceType: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  }>({
    newsCategories: ['technology'],
    musicMoods: ['focus'],
    interruptionLevel: 'moderate',
    voiceType: 'nova',
  });

  useEffect(() => {
    // Check if OAuth callbacks set connection flags
    if (searchParams.get('spotify_connected')) {
      setSpotifyConnected(true);
      setStep(2);
    }
    if (searchParams.get('google_connected')) {
      setGoogleConnected(true);
      fetchCalendarPreview();
    }
  }, [searchParams]);

  const fetchCalendarPreview = async () => {
    setLoadingEvents(true);
    try {
      const response = await fetch('/api/calendar/events?hours=24');
      console.log('📅 Calendar API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📅 Calendar data:', data);
        setCalendarEvents(data.events || []);
        setStep(3);
      } else {
        const errorData = await response.json();
        console.error('📅 Failed to fetch calendar events:', response.status, errorData);
        setStep(3); // Still advance even if fetch fails
      }
    } catch (error) {
      console.error('📅 Error fetching calendar:', error);
      setStep(3);
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleSpotifyConnect = () => {
    window.location.href = '/api/auth/spotify';
  };

  const handleGoogleConnect = () => {
    window.location.href = '/api/auth/google';
  };

  const handleComplete = () => {
    // Store preferences and navigate to dashboard
    localStorage.setItem('hymn_preferences', JSON.stringify(preferences));
    router.push('/dashboard');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 text-neutral-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Progress indicator */}
        <div className="mb-12">
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= step ? 'bg-neutral-100' : 'bg-neutral-800'
                }`}
              />
            ))}
          </div>
          <p className="text-center text-neutral-400 text-sm">
            Step {Math.min(step, 4)} of 4
          </p>
        </div>

        {/* Step 1: Spotify */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="text-6xl mb-6">🎵</div>
            <h2 className="text-4xl font-light mb-4">Connect Spotify</h2>
            <p className="text-neutral-400 mb-8 text-lg">
              Hymn needs access to your Spotify account to play music and understand
              your preferences.
            </p>
            <button
              onClick={handleSpotifyConnect}
              disabled={spotifyConnected}
              className={`px-8 py-4 rounded-full font-medium text-lg transition-colors ${
                spotifyConnected
                  ? 'bg-green-600 text-white cursor-not-allowed'
                  : 'bg-[#1DB954] text-white hover:bg-[#1ed760]'
              }`}
            >
              {spotifyConnected ? '✓ Connected to Spotify' : 'Connect Spotify'}
            </button>
          </motion.div>
        )}

        {/* Step 2: Google Calendar */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="text-6xl mb-6">🗓️</div>
            <h2 className="text-4xl font-light mb-4">Connect Calendar</h2>
            <p className="text-neutral-400 mb-8 text-lg">
              Let Hymn see your calendar so it can adapt your audio experience to
              your schedule.
            </p>
            <button
              onClick={handleGoogleConnect}
              disabled={googleConnected}
              className={`px-8 py-4 rounded-full font-medium text-lg transition-colors ${
                googleConnected
                  ? 'bg-green-600 text-white cursor-not-allowed'
                  : 'bg-[#4285F4] text-white hover:bg-[#5a95f5]'
              }`}
            >
              {googleConnected ? '✓ Connected to Google' : 'Connect Google Calendar'}
            </button>
          </motion.div>
        )}

        {/* Step 3: Calendar Confirmation */}
        {step === 3 && loadingEvents && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="text-6xl mb-6">📅</div>
            <h2 className="text-4xl font-light mb-4">Loading Your Calendar...</h2>
            <p className="text-neutral-400">Just a moment</p>
          </motion.div>
        )}

        {step === 3 && !loadingEvents && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {calendarEvents.length > 0 ? (
              <>
                <div className="text-center mb-8">
                  <div className="text-6xl mb-6">✅</div>
                  <h2 className="text-4xl font-light mb-4">Calendar Connected!</h2>
                  <p className="text-neutral-400 text-lg">
                    Here's what's coming up
                  </p>
                </div>

                {/* Show next few events */}
                <div className="space-y-3 max-w-md mx-auto">
                  {calendarEvents.slice(0, 5).map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-neutral-900 rounded-xl border border-neutral-800"
                    >
                      <p className="font-medium">{event.summary}</p>
                      <p className="text-sm text-neutral-400 mt-1">
                        {new Date(event.start).toLocaleString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </motion.div>
                  ))}
                </div>

                <button
                  onClick={() => setStep(4)}
                  className="w-full max-w-md mx-auto block px-8 py-4 bg-neutral-100 text-neutral-900 rounded-full font-medium hover:bg-neutral-200 transition-colors text-lg"
                >
                  Continue
                </button>
              </>
            ) : (
              <>
                <div className="text-center mb-8">
                  <div className="text-6xl mb-6">📅</div>
                  <h2 className="text-4xl font-light mb-4">Calendar Connected!</h2>
                  <p className="text-neutral-400 text-lg">
                    No events found for the next 24 hours
                  </p>
                </div>

                <button
                  onClick={() => setStep(4)}
                  className="w-full max-w-md mx-auto block px-8 py-4 bg-neutral-100 text-neutral-900 rounded-full font-medium hover:bg-neutral-200 transition-colors text-lg"
                >
                  Continue
                </button>
              </>
            )}
          </motion.div>
        )}

        {/* Step 4: Preferences */}
        {step === 4 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="text-center mb-8">
              <div className="text-6xl mb-6">⚙️</div>
              <h2 className="text-4xl font-light mb-4">Set Your Preferences</h2>
              <p className="text-neutral-400 text-lg">
                Customize your Hymn experience
              </p>
            </div>

            {/* News Categories */}
            <div>
              <label className="block text-lg mb-3">News Categories</label>
              <div className="flex flex-wrap gap-2">
                {['technology', 'business', 'science', 'health', 'sports'].map(
                  (cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setPreferences((prev) => ({
                          ...prev,
                          newsCategories: prev.newsCategories.includes(cat)
                            ? prev.newsCategories.filter((c) => c !== cat)
                            : [...prev.newsCategories, cat],
                        }));
                      }}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        preferences.newsCategories.includes(cat)
                          ? 'bg-neutral-100 text-neutral-900'
                          : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      }`}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Music Moods */}
            <div>
              <label className="block text-lg mb-3">Music Preferences</label>
              <div className="flex flex-wrap gap-2">
                {['ambient', 'focus', 'energetic', 'upbeat', 'calm'].map((mood) => (
                  <button
                    key={mood}
                    onClick={() => {
                      setPreferences((prev) => ({
                        ...prev,
                        musicMoods: prev.musicMoods.includes(mood)
                          ? prev.musicMoods.filter((m) => m !== mood)
                          : [...prev.musicMoods, mood],
                      }));
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      preferences.musicMoods.includes(mood)
                        ? 'bg-neutral-100 text-neutral-900'
                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                    }`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            {/* Interruption Level */}
            <div>
              <label className="block text-lg mb-3">Voice Update Frequency</label>
              <div className="flex gap-2">
                {(['minimal', 'moderate', 'active'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() =>
                      setPreferences((prev) => ({ ...prev, interruptionLevel: level }))
                    }
                    className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      preferences.interruptionLevel === level
                        ? 'bg-neutral-100 text-neutral-900'
                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Type Selection */}
            <div>
              <label className="block text-lg mb-3">DJ Voice</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'nova', name: 'Nova', desc: 'Warm & Natural' },
                  { id: 'alloy', name: 'Alloy', desc: 'Balanced' },
                  { id: 'echo', name: 'Echo', desc: 'Clear Male' },
                  { id: 'fable', name: 'Fable', desc: 'British' },
                  { id: 'onyx', name: 'Onyx', desc: 'Deep Male' },
                  { id: 'shimmer', name: 'Shimmer', desc: 'Soft Female' },
                ].map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() =>
                      setPreferences((prev) => ({ ...prev, voiceType: voice.id as any }))
                    }
                    className={`px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                      preferences.voiceType === voice.id
                        ? 'bg-neutral-100 text-neutral-900'
                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                    }`}
                  >
                    <div className="font-medium">{voice.name}</div>
                    <div className="text-xs opacity-70">{voice.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleComplete}
              className="w-full px-8 py-4 bg-neutral-100 text-neutral-900 rounded-full font-medium hover:bg-neutral-200 transition-colors text-lg"
            >
              Start Your Day
            </button>
          </motion.div>
        )}

        {/* Navigation */}
        {step > 1 && step < 4 && (
          <div className="text-center mt-8">
            <button
              onClick={() => setStep(step + 1)}
              className="text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              Skip for now →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function Setup() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 text-neutral-100 flex items-center justify-center">
        <div className="text-4xl">Loading...</div>
      </main>
    }>
      <SetupContent />
    </Suspense>
  );
}

