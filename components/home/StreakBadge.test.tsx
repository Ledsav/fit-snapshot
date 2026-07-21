import React from "react";
import { create, act } from "react-test-renderer";
import { StreakBadge } from "./StreakBadge";

jest.mock("@/context/ThemeContext", () => ({
  useTheme: () => ({ effectiveColorScheme: "dark" }),
}));

jest.mock("@/context/LocalizationContext", () => ({
  useLocalization: () => ({
    t: (key: string) => (key === "home.streak" ? "Streak" : key),
  }),
}));

describe("StreakBadge", () => {
  it("renders the streak count and label", () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(<StreakBadge streak={7} />);
    });
    const json = JSON.stringify(tree!.toJSON());
    expect(json).toContain("7");
    expect(json).toContain("STREAK");
  });
});
