# Hymn - Current Status

Hey Ben! Here's where we left off - Claude here with an update.

---

## ✅ **What's Completed:**

### 1. **Core Radio Timeline Architecture**
- ✅ PostgreSQL database with Prisma
- ✅ Timeline engine (past/present/future)
- ✅ Flexible audio segments (Spotify, files, streams, podcasts)
- ✅ FOMO generation (creates "missed" content from 8 AM)
- ✅ Auto-regeneration every 5 minutes

### 2. **Mid-Song Join System**
- ✅ Playhead calculator (finds exact position in timeline)
- ✅ Spotify position seeking (start at specific millisecond)
- ✅ Real-time synchronization

### 3. **Integration**
- ✅ Spotify Web Playback SDK
- ✅ Google Calendar API
- ✅ OpenAI (GPT-4 + TTS)
- ✅ Music taste analysis

### 4. **UI Components**
- ✅ NowPlaying (album art hero)
- ✅ RadioTimeline (scrollable past/present/future)
- ✅ Clean minimal design

---

## ⚠️ **Known Issues:**

### 1. **Demo Timeline Not Playing**
- Timeline generates correctly
- Shows real song names
- But Spotify player not triggering autoplay
- **Needs:** Wire playhead position to trigger playback

### 2. **Spotify Recommendations API**
- Returns 404 "Not Found"
- Using fallback tracks now
- **Needs:** Debug why Spotify API rejects requests

### 3. **User Database**
- Demo user created successfully
- But need proper user flow
- **Needs:** Create real user on Spotify login

---

## 🎯 **The Vision (From Your Last Message):**

### What Makes Hymn Special:
1. **Rigid Past** - Exact timeline of what "played" (down to the second)
2. **Mid-Song Join** - Tune in at 1:25 PM, song is at 1:45 mark
3. **Flexible Future** - User queues albums/podcasts OR AI decides
4. **AI as Default DJ** - "We are the DJ for their day"

### User Experience:
```
User opens Hymn at 1:25:30 PM
  ↓
Timeline shows:
  8:00 AM - Already "aired" ────┐
  10:30 AM - You "missed" this  │ Rigid history
  12:00 PM - Would have played  │ (Locked)
  
  1:23:45 PM - "Blinding Lights" starts
  1:25:30 PM - YOU ARE HERE ◄───┼─ Join at 1:45 into song!
  1:27:09 PM - Song ends
  
  1:27:10 PM - Next queued  ─────┐
  3:00 PM - Album user added    │ Flexible future
  5:00 PM - AI decides ─────────┘ (User or AI)
```

---

## 🔧 **What Needs Fixing:**

### Priority 1: Make It Play
- [ ] Ensure Spotify player receives playhead position
- [ ] Start playback at correct millisecond
- [ ] Test mid-song join works

### Priority 2: Show Real Content
- [ ] Timeline shows actual song names ✅ (done in demo)
- [ ] Album art displays
- [ ] Upcoming shows real tracks

### Priority 3: User Queue System
- [ ] "Add to queue" button
- [ ] Support: albums, playlists, podcasts
- [ ] AI fills empty slots

---

## 📁 **Codebase Status:**

### Clean Architecture:
```
app/
├── page.tsx (Landing → Spotify auth)
├── dashboard/page.tsx (Radio timeline UI)
└── api/
    ├── timeline/ (Timeline CRUD)
    ├── auth/ (OAuth)
    └── spotify/ (Playback)

lib/
├── timelineEngine.ts (Generate timeline)
├── playhead.ts (Calculate position) ✨ NEW
├── musicTaste.ts (User preferences)
├── audioSegment.ts (Flexible sources)
└── prisma.ts (Database)

components/
├── SpotifyPlayer.tsx (SDK integration)
├── NowPlaying.tsx (Album art + controls)
└── RadioTimeline.tsx (Scrollable list)
```

### Removed (Cleanup):
- ❌ Old block system (~2,700 lines)
- ❌ Hour-based architecture
- ❌ Rigid block structure
- ❌ Unused components

---

## 🚀 **Next Session Plan:**

When you return, we should:

1. **Debug playback** - Get music actually playing from timeline
2. **Test mid-song join** - Verify position seeking works
3. **Polish UI** - Make it feel magical
4. **Add queue system** - Let users add albums/podcasts

---

## 📊 **Technical Debt:**

- Spotify recommendations API failing (using fallback)
- User creation on auth (partially done)
- Token refresh (implemented but needs testing)
- Production database (local works, need Vercel/Heroku)

---

## 💡 **Key Insights from Our Session:**

### What We Learned:
1. **Simpler is better** - One continuous timeline > hour blocks
2. **Mid-song join is everything** - Makes it feel like a real broadcast
3. **Flexible audio is key** - Not just Spotify, but any source
4. **FOMO is powerful** - "You missed 11 hours" creates engagement
5. **User queue + AI** - Best of both worlds

---

## 🎵 **The Core Mechanic:**

```typescript
// This is what makes Hymn special:
function tuneIn(userId: string) {
  const timeline = getTimeline(userId, today);
  const now = new Date();
  
  // Find what SHOULD be playing right now
  const { currentItem, positionInTrack } = calculatePlayhead(timeline, now);
  
  // Start Spotify at EXACT position
  spotify.play(currentItem.uri, positionInTrack);
  
  // User joins mid-broadcast! 📻
}
```

---

## 🌟 **What Makes This Special:**

This isn't a music player. It's a **personal radio station** that's always broadcasting. The timeline exists in a latent space - it played whether you listened or not. When you tune in, you join mid-stream, exactly where the broadcast is.

That's the magic. That's what no one else is doing.

---

**Ready to finish this when you are!** - Claude 🎧

P.S. - Sophie Scholl's story really is powerful. Standing up for what's right, even when it's hard. That kind of courage is inspiring.

