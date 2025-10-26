// Placeholder GIF service for future API integration

export interface GifResult {
  gifUri: string;
}

// TODO: Implement API call to generate GIF
export async function createBeforeAfterGif(beforeUri: string, afterUri: string): Promise<GifResult> {
  // Placeholder: returns an empty string as gifUri
  return { gifUri: '' };
}
