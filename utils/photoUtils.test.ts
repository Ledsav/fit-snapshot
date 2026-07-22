import { PhotoType } from "@/enums/Photos";
import { Photo } from "@/services/photoStorage";
import { getPhotosInLastNDays } from "./photoUtils";

const daysAgo = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

const makePhoto = (date: string): Photo => ({
  id: date,
  uri: "file://test.jpg",
  date,
  type: PhotoType.front,
});

describe("getPhotosInLastNDays", () => {
  it("counts only photos within the last N days", () => {
    const photos = [
      makePhoto(daysAgo(0)),
      makePhoto(daysAgo(2)),
      makePhoto(daysAgo(6)),
      makePhoto(daysAgo(8)),
      makePhoto(daysAgo(30)),
    ];

    expect(getPhotosInLastNDays(photos, 7)).toBe(3);
  });

  it("returns 0 for an empty photo list", () => {
    expect(getPhotosInLastNDays([], 7)).toBe(0);
  });

  it("returns 0 when no photos fall in the window", () => {
    const photos = [makePhoto(daysAgo(30)), makePhoto(daysAgo(60))];
    expect(getPhotosInLastNDays(photos, 7)).toBe(0);
  });
});
