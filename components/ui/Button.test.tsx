import React from "react";
import { create, act } from "react-test-renderer";
import { Button } from "./Button";

jest.mock("@/context/ThemeContext", () => ({
  useTheme: () => ({ effectiveColorScheme: "dark" }),
}));

describe("Button", () => {
  it("renders an uppercased mono label for each variant", () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <>
          <Button title="Continue" onPress={() => {}} variant="primary" />
          <Button title="Retake" onPress={() => {}} variant="ghost" />
          <Button title="Delete" onPress={() => {}} variant="danger" />
        </>
      );
    });
    const json = JSON.stringify(tree!.toJSON());
    expect(json).toContain("CONTINUE");
    expect(json).toContain("RETAKE");
    expect(json).toContain("DELETE");
  });

  it("renders a spinner instead of the label when loading", () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <Button title="Save" onPress={() => {}} loading />
      );
    });
    const json = JSON.stringify(tree!.toJSON());
    expect(json).not.toContain("SAVE");
  });
});
