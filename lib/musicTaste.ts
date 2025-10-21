// User music taste analysis

const SPOTIFY_BASE_URL = 'https://api.spotify.com/v1';

export interface UserMusicProfile {
  topArtists: Array<{ id: string; name: string; genres: string[] }>;
  topTracks: Array<{ id: string; name: string; artist: string; uri: string }>;
  recentlyPlayed: Array<{ id: string; name: string; uri: string }>;
  savedTracks: Array<{ id: string; name: string; uri: string }>;
}

/**
 * Get user's top artists
 */
export async function getUserTopArtists(
  accessToken: string,
  limit: number = 10
): Promise<any[]> {
  const response = await fetch(
    `${SPOTIFY_BASE_URL}/me/top/artists?limit=${limit}&time_range=medium_term`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch top artists: ${response.statusText}`);
  }

  const data = await response.json();
  return data.items;
}

/**
 * Get user's top tracks
 */
export async function getUserTopTracks(
  accessToken: string,
  limit: number = 20
): Promise<any[]> {
  const response = await fetch(
    `${SPOTIFY_BASE_URL}/me/top/tracks?limit=${limit}&time_range=medium_term`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch top tracks: ${response.statusText}`);
  }

  const data = await response.json();
  return data.items;
}

/**
 * Get user's recently played tracks
 */
export async function getRecentlyPlayed(
  accessToken: string,
  limit: number = 20
): Promise<any[]> {
  const response = await fetch(
    `${SPOTIFY_BASE_URL}/me/player/recently-played?limit=${limit}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch recently played: ${response.statusText}`);
  }

  const data = await response.json();
  return data.items.map((item: any) => item.track);
}

/**
 * Build a comprehensive music profile for the user
 */
export async function buildMusicProfile(
  accessToken: string
): Promise<UserMusicProfile> {
  const [topArtists, topTracks, recentlyPlayed] = await Promise.all([
    getUserTopArtists(accessToken, 10),
    getUserTopTracks(accessToken, 20),
    getRecentlyPlayed(accessToken, 20),
  ]);

  return {
    topArtists: topArtists.map((artist) => ({
      id: artist.id,
      name: artist.name,
      genres: artist.genres,
    })),
    topTracks: topTracks.map((track) => ({
      id: track.id,
      name: track.name,
      artist: track.artists[0].name,
      uri: track.uri,
    })),
    recentlyPlayed: recentlyPlayed.map((track) => ({
      id: track.id,
      name: track.name,
      uri: track.uri,
    })),
    savedTracks: [], // Can add saved tracks later
  };
}

/**
 * Get recommendations based on user's taste and desired mood
 */
export async function getPersonalizedRecommendations(
  accessToken: string,
  musicProfile: UserMusicProfile,
  mood: string,
  explorationLevel: 'familiar' | 'balanced' | 'explorative' = 'balanced',
  limit: number = 20
): Promise<any[]> {
  // Use top artists/tracks as seeds
  const seedArtists = musicProfile.topArtists.slice(0, 2).map((a) => a.id);
  const seedTracks = musicProfile.topTracks.slice(0, 3).map((t) => t.id);

  // Map moods to Spotify audio features
  const moodFeatures: Record<string, any> = {
    ambient: { target_energy: 0.3, target_valence: 0.4, target_instrumentalness: 0.8 },
    focus: { target_energy: 0.4, target_valence: 0.5, target_instrumentalness: 0.7 },
    energetic: { target_energy: 0.8, target_valence: 0.7, target_danceability: 0.7 },
    upbeat: { target_energy: 0.7, target_valence: 0.8, target_danceability: 0.6 },
    calm: { target_energy: 0.3, target_valence: 0.5, target_acousticness: 0.7 },
  };

  const features = moodFeatures[mood] || moodFeatures.focus;

  // Adjust based on exploration level
  let popularity = 50;
  if (explorationLevel === 'familiar') {
    popularity = 70; // More popular = more familiar
  } else if (explorationLevel === 'explorative') {
    popularity = 30; // Less popular = more discovery
  }

  const params = new URLSearchParams({
    limit: limit.toString(),
    seed_artists: seedArtists.join(','),
    seed_tracks: seedTracks.join(','),
    target_popularity: popularity.toString(),
    ...features,
  });

  const response = await fetch(
    `${SPOTIFY_BASE_URL}/recommendations?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get recommendations: ${response.statusText}`);
  }

  const data = await response.json();
  return data.tracks;
}

