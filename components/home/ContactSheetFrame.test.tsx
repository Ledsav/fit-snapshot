import React from "react";
import { Text } from "react-native";
import { create, act } from "react-test-renderer";
import { ContactSheetFrame } from "./ContactSheetFrame";

jest.mock("@/context/ThemeContext", () => ({
  useTheme: () => ({ effectiveColorScheme: "dark" }),
}));

describe("ContactSheetFrame", () => {
  it("renders the caption and its children", () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <ContactSheetFrame caption="DAY 1 → DAY 47 · FRONT">
          <Text>photo-content</Text>
        </ContactSheetFrame>
      );
    });
    const json = JSON.stringify(tree!.toJSON());
    expect(json).toContain("DAY 1");
    expect(json).toContain("FRONT");
    expect(json).toContain("photo-content");
  });
});
