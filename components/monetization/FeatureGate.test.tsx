import React from "react";
import { Text } from "react-native";
import { create, act } from "react-test-renderer";

let mockHasAccess = false;
// Stub the icon set — FeatureGate renders the real PremiumLock, which renders
// an Ionicon; the async font loader otherwise fires a setState after teardown
// and surfaces as a non-zero exit on isolated runs.
jest.mock("@expo/vector-icons", () => ({
  Ionicons: (props: any) => null,
}));
jest.mock("@/context/ThemeContext", () => ({
  useTheme: () => ({ effectiveColorScheme: "dark" }),
}));
jest.mock("@/context/LocalizationContext", () => ({
  useLocalization: () => ({ t: (k: string) => k }),
}));
jest.mock("@/context/UserContext", () => ({
  useUser: () => ({ hasFeatureAccess: () => mockHasAccess, restorePurchases: jest.fn() }),
}));
// FeatureGate statically imports PaywallModal, which now pulls in the real
// RevenueCat SDK via purchaseService — stub it so this test doesn't need a
// native module / ESM-dependent transform.
jest.mock("@/services/purchaseService", () => ({
  getDefaultOffering: jest.fn().mockResolvedValue(null),
  purchasePackage: jest.fn(),
}));

import { FeatureGate } from "./FeatureGate";
import { Feature } from "@/constants/Features";

describe("FeatureGate", () => {
  it("renders children when access is granted", () => {
    mockHasAccess = true;
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <FeatureGate feature={Feature.ACHIEVEMENT_BADGES}>
          <Text>unlocked-content</Text>
        </FeatureGate>
      );
    });
    expect(JSON.stringify(tree!.toJSON())).toContain("unlocked-content");
  });

  it("renders a lock row (not the children) when access is denied", () => {
    mockHasAccess = false;
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <FeatureGate feature={Feature.ACHIEVEMENT_BADGES} customMessage="Achievements">
          <Text>unlocked-content</Text>
        </FeatureGate>
      );
    });
    const json = JSON.stringify(tree!.toJSON());
    expect(json).not.toContain("unlocked-content");
    expect(json).toContain("PRO");
  });
});
