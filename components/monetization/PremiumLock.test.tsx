import React from "react";
import { create, act } from "react-test-renderer";
import { PremiumLock } from "./PremiumLock";

// Stub the icon set so the real @expo/vector-icons async font loader doesn't
// fire a setState after the test tears down (which surfaces as a non-zero
// exit on isolated runs). A no-op glyph is fine for these behavioral checks.
jest.mock("@expo/vector-icons", () => ({
  Ionicons: (props: any) => null,
}));

jest.mock("@/context/ThemeContext", () => ({
  useTheme: () => ({ effectiveColorScheme: "dark" }),
}));
jest.mock("@/context/LocalizationContext", () => ({
  useLocalization: () => ({ t: (k: string) => (k === "featureGate.pro" ? "Pro" : k) }),
}));

describe("PremiumLock", () => {
  it("renders the title and a PRO chip, and fires onPress", () => {
    const onPress = jest.fn();
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <PremiumLock title="Weekly progress chart" subtitle="Trend over time" onPress={onPress} />
      );
    });
    const json = JSON.stringify(tree!.toJSON());
    expect(json).toContain("Weekly progress chart");
    expect(json).toContain("PRO");

    // find the root pressable and invoke its onPress
    const root = tree!.root.findAll(
      (n) => typeof n.props.onPress === "function"
    )[0];
    act(() => root.props.onPress());
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
