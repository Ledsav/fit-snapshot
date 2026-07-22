import { StreakService } from "./streakService";

const store: Record<string, string> = {};
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(async (k: string, v: string) => { store[k] = v; }),
  getItem: jest.fn(async (k: string) => (k in store ? store[k] : null)),
}));

const photo = (date: string) => ({ id: date, uri: "x", date, type: "front" as any });

describe("StreakService bestStreak", () => {
  beforeEach(() => { for (const k of Object.keys(store)) delete store[k]; });

  it("defaults bestStreak to 0 when nothing is stored", async () => {
    const d = await StreakService.getStreakData();
    expect(d.bestStreak).toBe(0);
  });

  it("raises bestStreak to the highest currentStreak seen and never lowers it", async () => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const iso = (offset: number) => {
      const dt = new Date(today); dt.setDate(dt.getDate() - offset); return dt.toISOString();
    };
    // first photo → current 1, best 1
    let d = await StreakService.updateStreak(photo(iso(0)));
    expect(d.currentStreak).toBe(1);
    expect(d.bestStreak).toBe(1);
    // simulate a stored higher best surviving a reset
    await StreakService.saveStreakData({ currentStreak: 5, lastPhotoDate: iso(0), bestStreak: 5 });
    const after = await StreakService.getStreakData();
    expect(after.bestStreak).toBe(5);
  });
});
