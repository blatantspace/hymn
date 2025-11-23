# Hymn Architecture - Personal Radio Timeline

## 🎯 Core Concept

Hymn is a **persistent radio station** that's always broadcasting, whether you're listening or not. It creates a **latent space timeline** - did the music play if no one was listening?

---

## 🏗️ Architecture Overview

### The Timeline System

```
Timeline Generation (First Login at 1:23 PM):

8:00 AM ────────────────────┐
8:03 AM - Track A           │ PAST (locked)
9:15 AM - Voice update      │ "Already aired"
10:30 AM - Track B          │ FOMO content
12:00 PM - Track C ─────────┤ User "missed" this

1:23 PM - Track D ◄─────────┼─ YOU TUNE IN (starts playing)

1:27 PM - Track E           │ FUTURE (unlocked)
2:00 PM - Voice update      │ Flexible
3:30 PM - Track F           │ Can regenerate
5:00 PM ────────────────────┘
```

### Key Principles

1. **Persistent Timeline:** Stored in database, survives sessions
2. **Locked Past:** Items before "now" are immutable (FOMO)
3. **Flexible Future:** Next 4 hours can regenerate based on calendar
4. **Latent Space:** Timeline exists whether you listen or not
5. **Mid-Stream Join:** Start playing wherever the timeline currently is

---

## 🗄️ Database Schema

### Tables

**User**
- Auth tokens (Spotify, Google)
- One-to-many with Timelines

**Timeline**
- One per user per day
- Tracks: start time, current position, generated until
- One-to-many with TimelineItems

**TimelineItem** (Flexible Segments)
- Type: `spotify_track | audio_file | voice | live_stream | podcast`
- Timestamp: Exact moment it should play
- Locked: Boolean (past = true, future = false)
- Sources: spotifyUri, audioFileUrl, streamUrl, etc.

**MusicProfile**
- User's Spotify taste (top artists, genres)
- Updated periodically

**CalendarEvent**
- Cached calendar data
- Used for AI music selection

---

## 🎵 Flexible Audio System

### Supported Segment Types

1. **`spotify_track`** - Spotify Web Playback SDK
2. **`audio_file`** - Uploaded MP3s, hosted files
3. **`voice`** - AI-generated TTS segments
4. **`live_stream`** - RTMP/HLS streams (future)
5. **`podcast`** - Podcast episodes (future)

### Audio Segment Structure

```typescript
{
  id: "item-123",
  type: "spotify_track",
  timestamp: "2025-11-23T13:23:00",
  duration: 204,
  locked: false,
  
  // Universal fields
  title: "Mr. Brightside",
  artist: "The Killers",
  imageUrl: "https://...",
  
  // Source (only one used)
  spotifyUri: "spotify:track:...",
  // OR
  audioFileUrl: "https://cdn.../song.mp3",
  // OR  
  streamUrl: "rtmp://live.../stream",
  
  mood: "energetic",
  volume: 0.7,
}
```

---

## 🤖 AI Integration

### Music Selection Flow

```
Every hour:
  ↓
Fetch calendar events
  ↓
Fetch user's music profile
  ↓
Send to GPT-4:
  - Time of day
  - Calendar context (meeting vs free time)
  - User's favorite genres/artists
  - Recent listening history
  ↓
GPT-4 decides:
  - Mood (ambient, focus, energetic, etc.)
  - Music recommendation
  - Voice update content
  ↓
Get personalized Spotify recommendations
  ↓
Generate timeline segments
```

### Voice Generation

- **Content:** GPT-4 creates DJ-style updates
- **Audio:** OpenAI TTS (or browser Speech Synthesis)
- **Timing:** Strategic points (start of hour, before meetings, etc.)

---

## 📻 User Experience Flow

### First Time User

1. **Land on homepage** → Clean, minimal
2. **Click "Get Started"** → Redirects to Spotify auth
3. **Authorize Spotify** → Redirects directly to dashboard
4. **Dashboard loads:**
   - Timeline generates (8 AM → now + 4 hours)
   - Past is locked (FOMO: "you missed this!")
   - **Music starts playing immediately**
   - Shows current track mid-song if appropriate

### Returning User

1. **Open Hymn**
2. **Timeline loads from database**
3. **Gap filled:** If last login was yesterday, generates "missed" content
4. **Resumes at current timestamp**
5. **Music starts playing**

### The FOMO Effect

- User sees hours of "already aired" content
- Can scroll back and replay any past segment
- Creates feeling of missing out on personalized broadcast
- **But it never actually played** - it's latent space!

---

## ⏱️ Timeline Regeneration

### Every 5 Minutes

```
Check:
1. Is future timeline running low? (< 2 hours ahead)
2. Has calendar changed?
3. Should strategy adapt?

If YES:
  ↓
Delete unlocked future items
  ↓
Regenerate next 4 hours
  ↓
Update timeline.generatedUntil
```

### On Calendar Change

When user adds/changes calendar events:
- Future timeline regenerates immediately
- Past remains locked
- AI adapts music strategy

---

## 🎮 Playback System

### Spotify Web Playback SDK

- Primary playback method
- Requires Spotify Premium
- Full control over playback

### HTML5 Audio (Future)

- For audio files, podcasts
- Fallback for non-Spotify content

### Live Streams (Future)

- HLS/RTMP support
- Real-time streaming integration

---

## 🔄 State Management

### Timeline State

- **Source of Truth:** PostgreSQL database
- **Cache:** React state for current session
- **Sync:** Updates every 5 minutes

### Playhead Position

- **Calculated:** Based on real-world time
- **Persisted:** timeline.currentPosition in DB
- **Accurate:** Mid-song join works correctly

---

## 🚀 Future Features

### Shared Timelines

- **Tune into others:** Listen to someone else's timeline live
- **Notifications:** "Ben is listening to The Killers right now"
- **Social layer:** See what your friends "aired" today

### Audio Upload

- Users upload their own MP3s
- Mix personal tracks with Spotify
- Custom intro/outro jingles

### Exploration Dial

- **Familiar:** Mostly known tracks
- **Balanced:** Mix of familiar and new
- **Explorative:** Discovery mode

### Voice Customization

- Choose AI voice (alloy, nova, etc.)
- Adjust DJ personality
- Custom wake words

---

## 💰 Cost Structure

**Per Active User Per Day:**
- AI Analysis: ~$0.20 (24 hourly analyses)
- Voice Generation: ~$0.30 (20 updates)
- Spotify API: Free
- Google Calendar: Free
- Database: ~$0.01
- **Total: ~$0.51/day or $15/month per user**

---

## 🔐 Privacy & Data

- **Tokens:** Stored encrypted in database
- **Timeline:** Private by default
- **Sharing:** Opt-in only
- **Data:** User can export/delete anytime

---

## 🎨 Design Philosophy

- **Minimal:** Clean, zen interface
- **Subtle:** Muted colors, no visual noise
- **Responsive:** Mobile-first design
- **Smooth:** Framer Motion animations
- **Fast:** Optimized for instant load

---

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL + Prisma
- **Styling:** Tailwind CSS 4
- **Animation:** Framer Motion
- **APIs:** Spotify, Google Calendar, OpenAI
- **Deployment:** Vercel (or Heroku)

---

## 📦 Deployment

### Vercel (Recommended)
- Auto-deploys from GitHub
- Built-in Postgres
- Serverless functions
- Free hobby tier

### Heroku (Alternative)
- Heroku Postgres add-on
- Traditional server model
- Good for WebSockets later

---

This architecture supports **everything you envisioned** - persistent timelines, flexible audio sources, FOMO effect, and future social features!

