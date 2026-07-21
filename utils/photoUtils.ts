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
