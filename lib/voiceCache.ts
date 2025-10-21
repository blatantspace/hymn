// Voice file caching to avoid regenerating on every page load

/**
 * Generate and cache a voice file
 */
export async function getOrGenerateVoice(
  voiceId: string,
  text: string,
  voice: string = 'nova'
): Promise<string | null> {
  // Check if we have it cached in session
  const cached = getCachedVoice(voiceId);
  if (cached) {
    console.log('💾 Using cached voice:', voiceId);
    return cached;
  }

  // Generate new voice file
  try {
    console.log('🎤 Generating voice file:', voiceId);
    const response = await fetch('/api/voice/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice }),
    });

    if (response.ok) {
      const blob = await response.blob();
      // Convert to base64 for storage
      const base64 = await blobToBase64(blob);
      const dataUrl = `data:audio/mpeg;base64,${base64}`;
      
      // Cache it
      cacheVoice(voiceId, dataUrl);
      console.log('✅ Voice generated and cached:', voiceId);
      return dataUrl;
    }
  } catch (error) {
    console.error('Failed to generate voice:', error);
  }

  return null;
}

/**
 * Get cached voice from localStorage
 */
function getCachedVoice(voiceId: string): string | null {
  try {
    const key = `hymn_voice_${voiceId}`;
    return localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

/**
 * Cache voice file in localStorage
 */
function cacheVoice(voiceId: string, dataUrl: string) {
  try {
    const key = `hymn_voice_${voiceId}`;
    localStorage.setItem(key, dataUrl);
  } catch (error) {
    console.error('Failed to cache voice (localStorage full?):', error);
  }
}

/**
 * Convert blob to base64
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Clear all cached voice files
 */
export function clearVoiceCache() {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('hymn_voice_')) {
      localStorage.removeItem(key);
    }
  });
  console.log('🗑️ Cleared voice cache');
}

