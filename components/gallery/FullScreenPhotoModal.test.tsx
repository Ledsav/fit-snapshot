import React from "react";
import { create, act } from "react-test-renderer";
import { ActivityIndicator } from "react-native";
import { FullScreenPhotoModal } from "./FullScreenPhotoModal";
import { PhotoType } from "@/enums/Photos";
import { Photo } from "@/services/photoStorage";

jest.mock("@expo/vector-icons", () => ({ Ionicons: (_p: any) => null }));

const photo: Photo = {
  id: "1",
  uri: "file://photo.jpg",
  date: "2026-01-01T00:00:00.000Z",
  type: PhotoType.front,
};

describe("FullScreenPhotoModal", () => {
  it("hides the edit and reference-luminance buttons when no photo is given (GIF case)", () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <FullScreenPhotoModal isVisible photoUri="file://gif.gif" onClose={() => {}} />
      );
    });
    expect(tree!.root.findAllByProps({ testID: "fullscreen-photo-edit-button" })).toHaveLength(0);
    expect(
      tree!.root.findAllByProps({ testID: "fullscreen-photo-reference-luminance-button" })
    ).toHaveLength(0);
  });

  it("calls onEdit with the photo when the edit button is pressed", () => {
    const onEdit = jest.fn();
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <FullScreenPhotoModal
          isVisible
          photoUri={photo.uri}
          onClose={() => {}}
          photo={photo}
          onEdit={onEdit}
        />
      );
    });
    act(() => {
      tree!.root.findByProps({ testID: "fullscreen-photo-edit-button" }).props.onPress();
    });
    expect(onEdit).toHaveBeenCalledWith(photo);
  });

  it("calls onSetReferenceLuminance with the photo when the reference button is pressed", () => {
    const onSetReferenceLuminance = jest.fn();
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <FullScreenPhotoModal
          isVisible
          photoUri={photo.uri}
          onClose={() => {}}
          photo={photo}
          onSetReferenceLuminance={onSetReferenceLuminance}
        />
      );
    });
    act(() => {
      tree!.root
        .findByProps({ testID: "fullscreen-photo-reference-luminance-button" })
        .props.onPress();
    });
    expect(onSetReferenceLuminance).toHaveBeenCalledWith(photo);
  });

  it("shows a spinner and disables both buttons while computing luminance", () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <FullScreenPhotoModal
          isVisible
          photoUri={photo.uri}
          onClose={() => {}}
          photo={photo}
          onEdit={() => {}}
          onSetReferenceLuminance={() => {}}
          isComputingLuminance
        />
      );
    });
    expect(tree!.root.findAllByType(ActivityIndicator)).toHaveLength(1);
    expect(
      tree!.root.findByProps({ testID: "fullscreen-photo-edit-button" }).props.disabled
    ).toBe(true);
    expect(
      tree!.root.findByProps({ testID: "fullscreen-photo-reference-luminance-button" }).props
        .disabled
    ).toBe(true);
  });
});
