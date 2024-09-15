import { useState, useCallback } from "react";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";

interface UsePhotoTransitionGifProps {
  oldestPhotoUri: string;
  newestPhotoUri: string;
  frames: number;
  duration: number;
}

export const usePhotoTransitionGif = () => {
  const [frameUris, setFrameUris] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateFrames = useCallback(
    async ({
      oldestPhotoUri,
      newestPhotoUri,
      frames = 10,
    }: UsePhotoTransitionGifProps) => {
      setIsGenerating(true);
      try {
        const generatedFrames: string[] = [];

        // Resize both images to the same dimensions
        const oldestResized = await manipulateAsync(
          oldestPhotoUri,
          [{ resize: { width: 300 } }],
          { format: SaveFormat.PNG }
        );
        const newestResized = await manipulateAsync(
          newestPhotoUri,
          [{ resize: { width: 300 } }],
          { format: SaveFormat.PNG }
        );

        const oldestContent = await FileSystem.readAsStringAsync(
          oldestResized.uri,
          { encoding: FileSystem.EncodingType.Base64 }
        );
        const newestContent = await FileSystem.readAsStringAsync(
          newestResized.uri,
          { encoding: FileSystem.EncodingType.Base64 }
        );

        for (let i = 0; i <= frames; i++) {
          const blendedUri = FileSystem.documentDirectory + `blended_${i}.png`;
          const blendFactor = i / frames;

          // Simple alpha blending
          const blendedContent = oldestContent
            .split(",")
            .map((oldByte, index) => {
              const newByte = newestContent.split(",")[index];
              const blended = Math.round(
                parseInt(oldByte) * (1 - blendFactor) +
                  parseInt(newByte) * blendFactor
              );
              return blended.toString();
            })
            .join(",");

          await FileSystem.writeAsStringAsync(blendedUri, blendedContent, {
            encoding: FileSystem.EncodingType.Base64,
          });

          generatedFrames.push(blendedUri);
        }

        // Clean up resized images
        await FileSystem.deleteAsync(oldestResized.uri, { idempotent: true });
        await FileSystem.deleteAsync(newestResized.uri, { idempotent: true });

        setFrameUris(generatedFrames);
      } catch (error) {
        console.error("Error generating frames:", error);
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  const cleanupFrames = useCallback(async () => {
    for (const uri of frameUris) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
    setFrameUris([]);
  }, [frameUris]);

  return { generateFrames, frameUris, isGenerating, cleanupFrames };
};
