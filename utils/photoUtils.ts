import { PhotoType } from "@/enums/Photos";
import { Photo } from "@/services/photoStorage";

const COMPARISON_TYPE_PRIORITY: PhotoType[] = [
  PhotoType.front,
  PhotoType.back,
  PhotoType.side,
];

export type ComparisonPair = {
  type: PhotoType;
  oldest: Photo;
  newest: Photo;
};

// Picks the oldest/newest photo pair for the highest-priority type that has
// at least 2 photos, so a comparison never mixes photos of different angles.
export const getBestComparisonPair = (photos: Photo[]): ComparisonPair | null => {
  for (const type of COMPARISON_TYPE_PRIORITY) {
    const typedPhotos = photos
      .filter((photo) => photo.type === type)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (typedPhotos.length >= 2) {
      return {
        type,
        oldest: typedPhotos[0],
        newest: typedPhotos[typedPhotos.length - 1],
      };
    }
  }

  return null;
};

// Counts photos taken within the last `days` days (inclusive of today).
export const getPhotosInLastNDays = (photos: Photo[], days: number): number => {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return photos.filter((photo) => new Date(photo.date).getTime() >= cutoff).length;
};
