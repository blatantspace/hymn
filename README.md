# Hymn 🎵

Your personal AI DJ companion that adapts to your day.

## What is Hymn?

Hymn is a context-aware audio companion that intelligently mixes music, news, and calendar updates based on what you're actually doing. It analyzes your calendar in hour-long blocks and creates the perfect audio experience - whether you're in deep focus, heading to a meeting, or just need some energy.

## Features

- 🎵 **Smart Audio Blocks**: AI analyzes your calendar and creates hour-long audio experiences
- 🗓️ **Calendar Integration**: Connects to Google Calendar to understand your day
- 🎧 **Spotify Playback**: Full Spotify integration with context-aware music selection
- 🤖 **AI Voice**: OpenAI-powered voice briefings for news, calendar updates, and check-ins
- 📰 **News Integration**: Curated news based on your interests
- ⏰ **Smart Preloading**: Prepares next block 5 minutes before transition

## Tech Stack

- **Next.js 14** with TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Spotify Web Playback SDK**
- **OpenAI API** (GPT-4 + TTS)
- **Google Calendar API**
- **NewsAPI**

## Getting Started

### Prerequisites

You'll need API keys for:
- Spotify Developer Account
- Google Cloud Console (Calendar API)
- OpenAI API
- NewsAPI

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.local.example` to `.env.local` and fill in your API credentials:
   ```bash
   cp .env.local.example .env.local
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

### Setting Up API Credentials

#### Spotify
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add `http://localhost:3000/api/auth/spotify/callback` to Redirect URIs
4. Copy Client ID and Client Secret to `.env.local`

#### Google Calendar
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Add `http://localhost:3000/api/auth/google/callback` to authorized redirect URIs
6. Copy Client ID and Client Secret to `.env.local`

#### OpenAI
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy to `.env.local`

#### NewsAPI
1. Go to [NewsAPI](https://newsapi.org/)
2. Sign up for a free account
3. Copy your API key to `.env.local`

## How It Works

1. **Authentication**: Connect Spotify and Google Calendar
2. **Preferences**: Set your news categories and music preferences
3. **AI Analysis**: Every hour, GPT-4 analyzes your calendar to determine the best audio strategy
4. **Playback**: Spotify plays music while AI-generated voice provides updates
5. **Smart Transitions**: Blocks preload 5 minutes early for seamless transitions

## Deployment

Deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/hymn)

Make sure to add all environment variables in Vercel dashboard.

## License

MIT

## Credits

Built with ❤️ for a smarter, more musical day.
