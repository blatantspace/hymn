// Spotify API utilities

const SPOTIFY_BASE_URL = 'https://api.spotify.com/v1';
const SPOTIFY_ACCOUNTS_URL = 'https://accounts.spotify.com';

export interface SpotifyPlaylist {
  id: string;
  name: string;
  images: { url: string }[];
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  uri: string;
  duration_ms: number;
}

/**
 * Get Spotify OAuth URL for authorization
 */
export function getSpotifyAuthUrl(): string {
  const scopes = [
    'user-read-email',
    'user-read-private',
    'streaming',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-library-read',
    'playlist-read-private',
    'playlist-read-collaborative',
    'app-remote-control',
    'user-top-read', // Read top artists and tracks
    'user-read-recently-played', // Read listening history
  ].join(' ');

  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    response_type: 'code',
    redirect_uri: process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI!,
    scope: scopes,
  });

  return `${SPOTIFY_ACCOUNTS_URL}/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function getSpotifyTokens(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const response = await fetch(`${SPOTIFY_ACCOUNTS_URL}/api/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI!,
    }),
  });

  if (!response.ok) {
    throw new Error(`Spotify token exchange failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Refresh Spotify access token
 */
export async function refreshSpotifyToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const response = await fetch(`${SPOTIFY_ACCOUNTS_URL}/api/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`Spotify token refresh failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get user's Spotify playlists
 */
export async function getUserPlaylists(
  accessToken: string
): Promise<SpotifyPlaylist[]> {
  const response = await fetch(`${SPOTIFY_BASE_URL}/me/playlists?limit=50`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch playlists: ${response.statusText}`);
  }

  const data = await response.json();
  return data.items;
}

/**
 * Get tracks for a specific mood/style
 * Uses Spotify's recommendation engine
 */
export async function getTracksForMood(
  accessToken: string,
  mood: string,
  limit: number = 20
): Promise<SpotifyTrack[]> {
  // Map moods to Spotify audio features
  const moodFeatures: Record<string, any> = {
    ambient: { target_energy: 0.3, target_valence: 0.4, target_instrumentalness: 0.8 },
    focus: { target_energy: 0.4, target_valence: 0.5, target_instrumentalness: 0.7 },
    energetic: { target_energy: 0.8, target_valence: 0.7, target_danceability: 0.7 },
    upbeat: { target_energy: 0.7, target_valence: 0.8, target_danceability: 0.6 },
    calm: { target_energy: 0.3, target_valence: 0.5, target_acousticness: 0.7 },
  };

  const features = moodFeatures[mood] || moodFeatures.focus;
  const params = new URLSearchParams({
    limit: limit.toString(),
    seed_genres: 'ambient,electronic,instrumental',
    ...features,
  });

  const response = await fetch(
    `${SPOTIFY_BASE_URL}/recommendations?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
  }

  const data = await response.json();
  return data.tracks;
}

/**
 * Get user profile
 */
export async function getUserProfile(accessToken: string) {
  const response = await fetch(`${SPOTIFY_BASE_URL}/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user profile: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get user's liked/saved tracks
 */
export async function getUserLikedTracks(
  accessToken: string,
  limit: number = 50
): Promise<SpotifyTrack[]> {
  const response = await fetch(`${SPOTIFY_BASE_URL}/me/tracks?limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch liked tracks: ${response.statusText}`);
  }

  const data = await response.json();
  return data.items.map((item: any) => ({
    id: item.track.id,
    name: item.track.name,
    artists: item.track.artists,
    uri: item.track.uri,
    duration_ms: item.track.duration_ms,
    album: item.track.album,
  }));
}

/**
 * Get user's recently played tracks
 */
export async function getRecentlyPlayed(
  accessToken: string,
  limit: number = 50
): Promise<SpotifyTrack[]> {
  const response = await fetch(
    `${SPOTIFY_BASE_URL}/me/player/recently-played?limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch recently played: ${response.statusText}`);
  }

  const data = await response.json();
  return data.items.map((item: any) => ({
    id: item.track.id,
    name: item.track.name,
    artists: item.track.artists,
    uri: item.track.uri,
    duration_ms: item.track.duration_ms,
    album: item.track.album,
  }));
}

/**
 * Get tracks from user's playlists
 */
export async function getTracksFromPlaylists(
  accessToken: string,
  limit: number = 100
): Promise<SpotifyTrack[]> {
  try {
    // Get user's playlists
    const playlists = await getUserPlaylists(accessToken);
    
    if (playlists.length === 0) return [];

    // Get tracks from first few playlists
    const playlistTracks: SpotifyTrack[] = [];
    
    for (const playlist of playlists.slice(0, 3)) {
      const response = await fetch(
        `${SPOTIFY_BASE_URL}/playlists/${playlist.id}/tracks?limit=30`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const tracks = data.items
          .filter((item: any) => item.track)
          .map((item: any) => ({
            id: item.track.id,
            name: item.track.name,
            artists: item.track.artists,
            uri: item.track.uri,
            duration_ms: item.track.duration_ms,
            album: item.track.album,
          }));
        
        playlistTracks.push(...tracks);
        
        if (playlistTracks.length >= limit) break;
      }
    }

    return playlistTracks.slice(0, limit);
  } catch (error) {
    console.error('Failed to get playlist tracks:', error);
    return [];
  }
}

/**
 * Build personalized music library from user's Spotify
 */
export async function buildPersonalizedLibrary(
  accessToken: string
): Promise<SpotifyTrack[]> {
  console.log('🎵 Building personalized music library...');

  try {
    const [liked, recent, playlists] = await Promise.all([
      getUserLikedTracks(accessToken, 50).catch(() => []),
      getRecentlyPlayed(accessToken, 30).catch(() => []),
      getTracksFromPlaylists(accessToken, 50).catch(() => []),
    ]);

    console.log('📚 Library built:', {
      liked: liked.length,
      recent: recent.length,
      playlists: playlists.length,
    });

    // Combine and deduplicate
    const allTracks = [...liked, ...recent, ...playlists];
    const uniqueTracks = Array.from(
      new Map(allTracks.map(track => [track.id, track])).values()
    );

    console.log(`✅ Personalized library: ${uniqueTracks.length} unique tracks`);
    return uniqueTracks;
  } catch (error) {
    console.error('Failed to build library:', error);
    return [];
  }
}

