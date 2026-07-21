import React from "react";
import { create, act } from "react-test-renderer";
import { InstrumentStrip } from "./InstrumentStrip";

jest.mock("@/context/ThemeContext", () => ({
  useTheme: () => ({ effectiveColorScheme: "dark" }),
}));

jest.mock("@/context/LocalizationContext", () => ({
  useLocalization: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        "progressSummary.days": "days",
        "progressSummary.consistency": "consistency",
        "progressSummary.thisWeek": "this week",
      };
      return map[key] ?? key;
    },
  }),
}));

describe("InstrumentStrip", () => {
  it("renders all three stat columns", () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <InstrumentStrip totalDays={47} consistency={82} weeklyPhotoCount={3} />
      );
    });
    const json = JSON.stringify(tree!.toJSON());
    expect(json).toContain("47");
    expect(json).toContain("82%");
    expect(json).toContain("3");
    expect(json).toContain("THIS WEEK");
  });
});
