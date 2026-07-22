import React from "react";
import { create, act } from "react-test-renderer";
import { Text } from "react-native";
import { LightingIndicator } from "./LightingIndicator";

jest.mock("@expo/vector-icons", () => ({ Ionicons: (_p: any) => null }));
jest.mock("@/context/ThemeContext", () => ({
  useTheme: () => ({ effectiveColorScheme: "dark" }),
}));
jest.mock("@/context/LocalizationContext", () => ({
  useLocalization: () => ({ t: (k: string) => k }), // echo keys
}));

/** Collect all rendered Text string children into a flat array. */
const texts = (root: any): string[] =>
  root
    .findAllByType(Text)
    .flatMap((n: any) => (Array.isArray(n.props.children) ? n.props.children : [n.props.children]))
    .filter((c: any) => typeof c === "string");

describe("LightingIndicator", () => {
  it("shows the matched label when state is matched", () => {
    let tree: any;
    act(() => { tree = create(<LightingIndicator state="matched" onRecalibrate={() => {}} />); });
    expect(texts(tree.root)).toContain("camera.lightingMatched");
  });

  it("shows the baseline-seeding label and no recalibrate when state is none", () => {
    let tree: any;
    act(() => { tree = create(<LightingIndicator state="none" onRecalibrate={() => {}} />); });
    const labels = texts(tree.root);
    expect(labels).toContain("camera.lightingNone");
    expect(labels).not.toContain("camera.recalibrateLighting");
  });

  it("offers recalibrate when a baseline exists", () => {
    let tree: any;
    act(() => { tree = create(<LightingIndicator state="off" onRecalibrate={() => {}} />); });
    expect(texts(tree.root)).toContain("camera.recalibrateLighting");
  });
});
