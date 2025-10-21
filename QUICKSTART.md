# Hymn - Quick Start Guide

Your personal AI DJ is ready! 🎵

## What You Built

Hymn is a context-aware audio companion that:
- ✅ Connects to Spotify for music playback
- ✅ Integrates with Google Calendar to understand your schedule  
- ✅ Uses AI (GPT-4) to analyze each hour and create perfect audio strategies
- ✅ Generates voice updates with OpenAI TTS
- ✅ Mixes news, calendar reminders, and music intelligently
- ✅ Preloads blocks 5 minutes before transitions

## Run Locally

1. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   # Fill in your API keys (see SETUP.md for details)
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open browser:**
   ```
   http://localhost:3000
   ```

## First Time Flow

1. **Landing Page** → Click "Get Started"
2. **Connect Spotify** → Authorize your account
3. **Connect Google Calendar** → Authorize calendar access
4. **Set Preferences** → Choose news categories, music moods
5. **Dashboard** → Your AI DJ is live!

## Dashboard Features

### Current Block Display
- Shows what's playing right now
- Audio visualizer that responds to playback
- Block reasoning from AI

### Spotify Player
- Album art and track info
- Play/pause controls
- Integrated with Web Playback SDK

### Day Timeline
- See all your blocks for the day
- Visual indicators for block types
- Click to preview future blocks

### Voice Updates
- Upcoming voice segments
- Priority indicators
- Timing information

## How Blocks Work

Every hour, the AI:

1. **Analyzes Context:**
   - Calendar events (meetings, focus time, breaks)
   - Time of day (morning energy vs evening calm)
   - Your preferences
   - Recent news

2. **Decides Strategy:**
   - Music style (ambient, focus, energetic, upbeat, calm, silent)
   - Music volume level
   - Voice update frequency
   - Interruption tolerance

3. **Generates Content:**
   - Voice segments with TTS
   - Spotify track selections
   - Timing and transitions

4. **Example Adaptations:**
   - **9 AM - Deep Work:** Ambient music, no interruptions
   - **11 AM - Team Meeting:** Quiet background, brief prep
   - **2 PM - Free Time:** Full DJ mode with news and energy
   - **8 PM - Evening:** Calm music, gentle wind-down

## Project Structure

```
hymn/
├── app/
│   ├── page.tsx              # Landing page
│   ├── setup/page.tsx        # Onboarding flow
│   ├── dashboard/page.tsx    # Main player interface
│   └── api/
│       ├── auth/             # OAuth handlers
│       ├── blocks/           # Block generation
│       ├── calendar/         # Calendar fetching
│       └── news/             # News fetching
├── components/
│   ├── SpotifyPlayer.tsx     # Spotify playback
│   ├── BlockTimeline.tsx     # Day overview
│   └── AudioVisualizer.tsx   # Visual feedback
├── lib/
│   ├── spotify.ts            # Spotify utilities
│   ├── calendar.ts           # Google Calendar utilities
│   ├── openai.ts             # GPT-4 & TTS
│   ├── news.ts               # News API
│   ├── blockEngine.ts        # Core orchestration
│   └── types.ts              # TypeScript interfaces
└── .env.local                # Your credentials
```

## API Keys You'll Need

| Service | Purpose | Cost | Get It |
|---------|---------|------|--------|
| **Spotify** | Music playback | Free (Premium required) | [developer.spotify.com](https://developer.spotify.com) |
| **Google Calendar** | Schedule integration | Free | [console.cloud.google.com](https://console.cloud.google.com) |
| **OpenAI** | AI analysis + voice | ~$0.50-2/day | [platform.openai.com](https://platform.openai.com) |
| **NewsAPI** | Headlines | Free (100 req/day) | [newsapi.org](https://newsapi.org) |

## Common Issues

**❌ "Missing credentials" error**
- Make sure `.env.local` exists and has all keys
- Restart dev server after adding keys

**❌ Spotify won't play**
- Requires Spotify Premium account
- Check browser autoplay settings
- Verify redirect URI matches exactly

**❌ Calendar not loading**
- Enable Google Calendar API in Cloud Console
- Check OAuth consent screen is configured
- Verify redirect URI is correct

**❌ Voice not generating**
- Check OpenAI API key is valid
- Verify you have API credits
- Check browser console for errors

## Next Steps

### Immediate Improvements
- [ ] Add real-time block regeneration every 5 minutes
- [ ] Implement token refresh for long sessions
- [ ] Add user database for persistent preferences
- [ ] Cache generated voice segments

### Future Features
- [ ] Mobile app with push notifications
- [ ] Podcast integration
- [ ] Weather-aware music selection
- [ ] Custom voice selection
- [ ] Shared blocks with friends
- [ ] Task management integration

## Deploy to Production

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel deploy

# Don't forget to:
# 1. Add env vars in Vercel dashboard
# 2. Update OAuth redirect URIs to production domain
# 3. Set up proper session management
```

## Tech Stack

- **Framework:** Next.js 15 + TypeScript
- **Styling:** Tailwind CSS 4
- **Animations:** Framer Motion
- **APIs:**
  - Spotify Web Playback SDK
  - Google Calendar API
  - OpenAI API (GPT-4 + TTS)
  - NewsAPI
- **Hosting:** Vercel

## Cost Breakdown

**Per User Per Day:**
- Voice generation: ~$0.30 (20 updates @ ~150 chars each)
- AI analysis: ~$0.20 (24 block analyses)
- Everything else: Free

**Total: ~$0.50/day or $15/month per active user**

## Tips for Best Experience

1. **Morning Setup:** Open Hymn when you start your day
2. **Calendar Hygiene:** Keep your calendar updated for best blocks
3. **Preference Tuning:** Adjust news/music preferences to match your mood
4. **Interruption Level:** Set to "minimal" during focus time
5. **Premium Audio:** Use good headphones/speakers!

---

Enjoy your personalized audio companion! 🎧

For detailed setup instructions, see `SETUP.md`

