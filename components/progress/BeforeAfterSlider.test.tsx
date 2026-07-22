import React from "react";
import { create, act } from "react-test-renderer";
import { BeforeAfterSlider } from "./BeforeAfterSlider";

jest.mock("@/context/ThemeContext", () => ({
  useTheme: () => ({ effectiveColorScheme: "dark" }),
}));

describe("BeforeAfterSlider", () => {
  it("renders both labels and both photo sources", () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <BeforeAfterSlider
          beforeUri="file://before.jpg"
          afterUri="file://after.jpg"
          beforeLabel="Before"
          afterLabel="After"
        />
      );
    });
    const json = JSON.stringify(tree!.toJSON());
    expect(json).toContain("BEFORE");
    expect(json).toContain("AFTER");
    expect(json).toContain("file://before.jpg");
    expect(json).toContain("file://after.jpg");
  });

  it("accepts an onValueChange callback and an onLayout without firing spuriously", () => {
    const onValueChange = jest.fn();
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <BeforeAfterSlider
          beforeUri="a"
          afterUri="b"
          beforeLabel="Before"
          afterLabel="After"
          onValueChange={onValueChange}
        />
      );
    });
    // The container measures itself via onLayout; feeding a layout must not
    // by itself invoke onValueChange (that only happens on a real drag).
    const container = tree!.root.findAll((n) => typeof n.props.onLayout === "function")[0];
    expect(container).toBeTruthy();
    act(() => container.props.onLayout({ nativeEvent: { layout: { width: 200 } } }));
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
