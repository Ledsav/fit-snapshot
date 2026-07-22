import React from "react";
import { create, act } from "react-test-renderer";
import { PremiumLock } from "./PremiumLock";

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
