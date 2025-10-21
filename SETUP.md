# Hymn Setup Guide

Welcome to Hymn! This guide will walk you through setting up your AI DJ companion.

## Prerequisites

- Node.js 18+ installed
- Spotify account
- Google account with Calendar access
- OpenAI API key
- NewsAPI key (free tier available)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your credentials:

### Spotify Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click "Create App"
3. Fill in:
   - App name: "Hymn"
   - App description: "Personal AI DJ"
   - Redirect URI: `http://localhost:3000/api/auth/spotify/callback`
   - Check "Web Playback SDK"
4. Copy your Client ID and Client Secret to `.env.local`

### Google Calendar Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Calendar API:
   - Go to "APIs & Services" → "Library"
   - Search for "Google Calendar API"
   - Click "Enable"
4. Create credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Authorized redirect URIs: `http://localhost:3000/api/auth/google/callback`
5. Copy Client ID and Client Secret to `.env.local`

### OpenAI Setup

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Click "Create new secret key"
3. Copy the key to `.env.local` as `OPENAI_API_KEY`

### NewsAPI Setup

1. Go to [NewsAPI](https://newsapi.org/)
2. Click "Get API Key"
3. Sign up for free tier
4. Copy your API key to `.env.local` as `NEWS_API_KEY`

### NextAuth Secret

Generate a random secret:
```bash
openssl rand -base64 32
```

Copy the output to `.env.local` as `NEXTAUTH_SECRET`

## Step 3: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 4: Connect Your Accounts

1. Click "Get Started"
2. Connect Spotify (you'll be redirected to Spotify to authorize)
3. Connect Google Calendar (you'll be redirected to Google to authorize)
4. Set your preferences (news categories, music moods, etc.)
5. Start your day!

## How It Works

### Hour Blocks

Hymn divides your day into hour-long blocks. Each block is intelligently crafted based on:
- Your calendar events during that hour
- Time of day (morning energy vs evening calm)
- Your preferences
- Current news in your selected categories

### Block Generation

5 minutes before each new hour, Hymn:
1. Checks your calendar for upcoming events
2. Fetches latest news
3. Sends context to GPT-4 to analyze
4. GPT-4 decides the optimal audio strategy
5. Generates voice content using OpenAI TTS
6. Selects Spotify tracks matching the mood
7. Assembles the block and starts playback

### Smart Adaptations

- **Deep work block** → Ambient music, minimal interruptions
- **Before meeting** → Brief prep, then quiet background
- **Free time** → Full DJ mode with news and music
- **Late evening** → Calm music, gentle reminders

## Troubleshooting

### Spotify Playback Issues

- Make sure you have Spotify Premium (Web Playback SDK requires it)
- Check that your browser allows autoplay
- Try refreshing your Spotify access token by logging out and back in

### Calendar Not Showing

- Verify Google Calendar API is enabled in Cloud Console
- Check that redirect URI matches exactly (including http vs https)
- Try revoking access and reconnecting

### Voice Generation Failing

- Verify your OpenAI API key is valid
- Check you have credits available in your OpenAI account
- OpenAI TTS costs approximately $0.015 per 1,000 characters

### Build Errors

If you get module resolution errors:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Production Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel dashboard
3. Add all environment variables
4. Update redirect URIs to use your production domain
5. Deploy!

### Important Production Notes

- Add your production domain to Spotify redirect URIs
- Add your production domain to Google OAuth redirect URIs
- Consider using a database to store user sessions and preferences
- Implement token refresh logic for long-lived sessions
- Consider caching generated blocks to reduce API costs

## Cost Estimates

- **Spotify**: Free (requires Premium account for playback)
- **Google Calendar**: Free
- **OpenAI**: ~$0.50-2/day per user (depending on usage)
- **NewsAPI**: Free tier (100 requests/day)
- **Hosting**: Free on Vercel

## Future Enhancements

Ideas for v2:
- Database integration for user preferences
- Multiple news sources beyond NewsAPI
- Custom voice selection
- Mobile app with background playback
- Shared playlists/blocks with friends
- Integration with task management tools
- Sleep tracking integration for bedtime blocks
- Podcast integration
- Weather-aware music selection

## Support

Questions? Check out:
- [Next.js Documentation](https://nextjs.org/docs)
- [Spotify Web Playback SDK](https://developer.spotify.com/documentation/web-playback-sdk)
- [Google Calendar API](https://developers.google.com/calendar)
- [OpenAI API](https://platform.openai.com/docs)

Enjoy your personalized audio experience! 🎵

