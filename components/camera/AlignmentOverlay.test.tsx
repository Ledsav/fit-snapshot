import React from "react";
import { create, act } from "react-test-renderer";
import AlignmentOverlay from "./AlignmentOverlay";
import { PhotoType } from "@/enums/Photos";
import { Photo } from "@/services/photoStorage";

describe("AlignmentOverlay", () => {
  it("falls back to the generic silhouette when no ghost photo is given", () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(<AlignmentOverlay type={PhotoType.front} />);
    });
    const json = JSON.stringify(tree!.toJSON());
    expect(json).toContain("0.3");
    expect(json).not.toContain("ghost-photo-uri");
  });

  it("renders the ghost photo at low opacity instead of the silhouette when provided", () => {
    const ghostPhoto: Photo = {
      id: "1",
      uri: "file://ghost-photo-uri.jpg",
      date: "2026-01-01T00:00:00.000Z",
      type: PhotoType.front,
    };
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(<AlignmentOverlay type={PhotoType.front} ghostPhoto={ghostPhoto} />);
    });
    const json = JSON.stringify(tree!.toJSON());
    expect(json).toContain("file://ghost-photo-uri.jpg");
    expect(json).toContain("0.15");
  });
});
