import { LightingBaselineStore } from "./lightingBaselineStore";
import { PhotoType } from "@/enums/Photos";

const store: Record<string, string> = {};
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(async (k: string, v: string) => { store[k] = v; }),
  getItem: jest.fn(async (k: string) => (k in store ? store[k] : null)),
}));

describe("LightingBaselineStore", () => {
  beforeEach(() => { for (const k of Object.keys(store)) delete store[k]; });

  it("returns null when no override is stored", async () => {
    expect(await LightingBaselineStore.getOverride(PhotoType.front)).toBeNull();
  });

  it("persists and reads back a per-pose override", async () => {
    await LightingBaselineStore.setOverride(PhotoType.side, 0.37);
    expect(await LightingBaselineStore.getOverride(PhotoType.side)).toBeCloseTo(0.37, 5);
    expect(await LightingBaselineStore.getOverride(PhotoType.front)).toBeNull();
  });
});
