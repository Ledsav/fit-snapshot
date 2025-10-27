import * as FileSystem from 'expo-file-system';

// Use Expo's built-in environment variable support
const CLOUD_FUNCTION_URL = process.env.EXPO_PUBLIC_CLOUD_FUNCTION_URL || '';

export interface GifResult {
  gifUri: string;
  error?: string;
}

export interface GifGenerationOptions {
  duration?: number; // Show each image for X ms (default: 500)
  fadeFrames?: number; // Number of fade frames (default: 20)
  fadeDuration?: number; // Each fade frame duration in ms (default: 50)
}

/**
 * Create a before/after GIF from multiple images
 * Requires authentication - user must be signed in
 * Rate limited to 1 GIF per week per user
 *
 * @param imageUris - Array of image URIs (2-3 images)
 * @param idToken - Firebase ID token for authentication
 * @param options - Optional GIF generation settings
 */
export async function createBeforeAfterGif(
  imageUris: string[],
  idToken: string,
  options?: GifGenerationOptions
): Promise<GifResult> {
  try {
    if (!idToken) {
      return {
        gifUri: '',
        error: 'Authentication required. Please sign in.'
      };
    }

    if (imageUris.length < 2 || imageUris.length > 3) {
      return {
        gifUri: '',
        error: 'Please select 2-3 images for GIF generation.'
      };
    }

    // Convert images to base64
    const imagesBase64: string[] = [];
    for (const uri of imageUris) {
      try {
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        imagesBase64.push(base64);
      } catch (error) {
        console.error('Error reading image:', error);
        return {
          gifUri: '',
          error: 'Failed to read one or more images.'
        };
      }
    }

    // Prepare payload
    const payload = {
      images: imagesBase64,
      duration: options?.duration || 500,
      fade_frames: options?.fadeFrames || 20,
      fade_duration: options?.fadeDuration || 50,
    };

    // Call Cloud Function with authentication
    const response = await fetch(CLOUD_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 401) {
        return {
          gifUri: '',
          error: 'Authentication failed. Please sign in again.'
        };
      }

      if (response.status === 429) {
        return {
          gifUri: '',
          error: errorData.error || 'Rate limit exceeded. You can generate 1 GIF per week.'
        };
      }

      return {
        gifUri: '',
        error: errorData.error || `Server error: ${response.status}`
      };
    }

    const result = await response.json();

    if (!result.gif) {
      return {
        gifUri: '',
        error: 'Invalid response from server.'
      };
    }

    // Save the base64 GIF to a file
    const gifUri = `${FileSystem.cacheDirectory}generated_gif_${Date.now()}.gif`;
    await FileSystem.writeAsStringAsync(gifUri, result.gif, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return { gifUri };

  } catch (error: any) {
    console.error('Error creating GIF:', error);
    return {
      gifUri: '',
      error: error.message || 'Failed to generate GIF. Please try again.'
    };
  }
}
