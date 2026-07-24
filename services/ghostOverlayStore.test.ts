import { GhostOverlayStore } from "./ghostOverlayStore";

const store: Record<string, string> = {};
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(async (k: string, v: string) => { store[k] = v; }),
  getItem: jest.fn(async (k: string) => (k in store ? store[k] : null)),
}));

describe("GhostOverlayStore", () => {
  beforeEach(() => { for (const k of Object.keys(store)) delete store[k]; });

  it("defaults to false when nothing is stored", async () => {
    expect(await GhostOverlayStore.getEnabled()).toBe(false);
  });

  it("persists and reads back the enabled flag", async () => {
    await GhostOverlayStore.setEnabled(true);
    expect(await GhostOverlayStore.getEnabled()).toBe(true);

    await GhostOverlayStore.setEnabled(false);
    expect(await GhostOverlayStore.getEnabled()).toBe(false);
  });
});
