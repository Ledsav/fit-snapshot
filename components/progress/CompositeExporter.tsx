import { fontFamily } from "@/constants/DesignSystem";
import {
  COMPOSITE_CANVAS_WIDTH,
  COMPOSITE_CAPTION_HEIGHT,
  COMPOSITE_PHOTO_HEIGHT,
  computeCompositeLayout,
} from "@/utils/compositeImage";
import * as FileSystem from "expo-file-system/legacy";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { View } from "react-native";
import Svg, { ClipPath, Defs, Image as SvgImage, Rect, Text as SvgText } from "react-native-svg";

// canvasWidth/canvasHeight/photoHeight/captionHeight never vary with slider
// position (only dividerX/beforeClipWidth do) — used for the idle/static
// render so this component never needs the live slider value as a prop.
const STATIC_CANVAS_HEIGHT = COMPOSITE_PHOTO_HEIGHT + COMPOSITE_CAPTION_HEIGHT;

// Colors are fixed (not theme-derived) so a saved/shared image looks the
// same regardless of the viewer's or exporter's app theme. Mirrors
// constants/Colors.ts's ink/paper/brass values (not exported from there).
const INK = "#14161A";
const PAPER = "#EDEAE2";
const BRASS = "#C9A227";

const DIVIDER_WIDTH = 4;
const LABEL_MARGIN = 40;
const LABEL_PILL_WIDTH = 260;
const LABEL_PILL_HEIGHT = 58;
const LABEL_FONT_SIZE = 30;
const CAPTION_FONT_SIZE = 32;

export interface CompositeExporterHandle {
  export: () => Promise<string>;
}

interface CompositeExporterProps {
  beforeUri: string;
  afterUri: string;
  // A getter rather than a live number: reading it only at export() call
  // time means this component never re-renders while the slider is being
  // dragged (it's off-screen and invisible until Save/Share is tapped, so
  // there's nothing to show reactively anyway).
  getAfterness: () => number;
  caption: string;
  beforeLabel: string;
  afterLabel: string;
}

interface ExportState {
  before: string;
  after: string;
  dividerX: number;
  beforeClipWidth: number;
  callId: number;
}

export const CompositeExporter = forwardRef<CompositeExporterHandle, CompositeExporterProps>(
  ({ beforeUri, afterUri, getAfterness, caption, beforeLabel, afterLabel }, ref) => {
    const svgRef = useRef<Svg>(null);
    const [exportState, setExportState] = useState<ExportState | null>(null);
    const loadedCountRef = useRef(0);
    const readyResolveRef = useRef<(() => void) | null>(null);
    const exportCallIdRef = useRef(0);

    const handleImageLoad = () => {
      loadedCountRef.current += 1;
      if (loadedCountRef.current >= 2 && readyResolveRef.current) {
        readyResolveRef.current();
        readyResolveRef.current = null;
      }
    };

    useImperativeHandle(ref, () => ({
      export: async () => {
        loadedCountRef.current = 0;
        exportCallIdRef.current += 1;
        const callId = exportCallIdRef.current;
        const { dividerX, beforeClipWidth } = computeCompositeLayout(getAfterness());

        // Embed both photos as data URIs before mounting the SVG <Image>
        // elements — the pixel data is inline in the tree at render time
        // instead of being fetched after mount, which avoids racing
        // toDataURL against an async image load.
        const [beforeBase64, afterBase64] = await Promise.all([
          FileSystem.readAsStringAsync(beforeUri, { encoding: FileSystem.EncodingType.Base64 }),
          FileSystem.readAsStringAsync(afterUri, { encoding: FileSystem.EncodingType.Base64 }),
        ]);

        const ready = new Promise<void>((resolve) => {
          readyResolveRef.current = resolve;
        });
        setExportState({
          before: `data:image/jpeg;base64,${beforeBase64}`,
          after: `data:image/jpeg;base64,${afterBase64}`,
          dividerX,
          beforeClipWidth,
          callId,
        });
        await ready;

        return new Promise<string>((resolve, reject) => {
          if (!svgRef.current) {
            reject(new Error("CompositeExporter: Svg ref is not attached."));
            return;
          }
          // No {width, height} options here: on Android, Svg.toDataURL(w, h)
          // creates the output Bitmap at exactly those raw pixel dimensions,
          // but draws the SVG's content using the native view's actual
          // (density-scaled) pixel size — with no options, that already
          // matches, so the drawing isn't scaled and doesn't get cropped.
          // Passing dp-sized options instead produced an undersized canvas
          // that only fit the content's top-left corner.
          svgRef.current.toDataURL((base64Png) => {
            const rawUri = `${FileSystem.cacheDirectory}composite_raw_${Date.now()}.png`;
            FileSystem.writeAsStringAsync(rawUri, base64Png, {
              encoding: FileSystem.EncodingType.Base64,
            })
              .then(() =>
                // Normalizes the device-pixel-density-dependent raw bitmap
                // down to the fixed export width the design calls for.
                manipulateAsync(rawUri, [{ resize: { width: COMPOSITE_CANVAS_WIDTH } }], {
                  format: SaveFormat.PNG,
                })
              )
              .then((resized) => resolve(resized.uri))
              .catch(reject);
          });
        });
      },
    }));

    return (
      <View
        pointerEvents="none"
        style={{ position: "absolute", left: -9999, top: 0, width: COMPOSITE_CANVAS_WIDTH, height: STATIC_CANVAS_HEIGHT }}
      >
        <Svg ref={svgRef} width={COMPOSITE_CANVAS_WIDTH} height={STATIC_CANVAS_HEIGHT}>
          <Defs>
            <ClipPath id="beforeClip">
              <Rect x={0} y={0} width={exportState?.beforeClipWidth ?? 0} height={COMPOSITE_PHOTO_HEIGHT} />
            </ClipPath>
          </Defs>
          {/* Fills the whole canvas — doubles as the caption strip's
              background since the photo images only cover 0..photoHeight. */}
          <Rect x={0} y={0} width={COMPOSITE_CANVAS_WIDTH} height={STATIC_CANVAS_HEIGHT} fill={INK} />
          {exportState && (
            <>
              <SvgImage
                key={`after-${exportState.callId}`}
                x={0}
                y={0}
                width={COMPOSITE_CANVAS_WIDTH}
                height={COMPOSITE_PHOTO_HEIGHT}
                href={exportState.after}
                preserveAspectRatio="xMidYMid slice"
                onLoad={handleImageLoad}
              />
              <SvgImage
                key={`before-${exportState.callId}`}
                x={0}
                y={0}
                width={COMPOSITE_CANVAS_WIDTH}
                height={COMPOSITE_PHOTO_HEIGHT}
                href={exportState.before}
                preserveAspectRatio="xMidYMid slice"
                clipPath="url(#beforeClip)"
                onLoad={handleImageLoad}
              />
              <Rect
                x={exportState.dividerX - DIVIDER_WIDTH / 2}
                y={0}
                width={DIVIDER_WIDTH}
                height={COMPOSITE_PHOTO_HEIGHT}
                fill={BRASS}
              />
              <Rect
                x={LABEL_MARGIN}
                y={LABEL_MARGIN}
                width={LABEL_PILL_WIDTH}
                height={LABEL_PILL_HEIGHT}
                rx={LABEL_PILL_HEIGHT / 2}
                fill={INK}
                fillOpacity={0.6}
              />
              <SvgText
                x={LABEL_MARGIN + LABEL_PILL_WIDTH / 2}
                y={LABEL_MARGIN + LABEL_PILL_HEIGHT / 2 + LABEL_FONT_SIZE * 0.35}
                fontSize={LABEL_FONT_SIZE}
                fontFamily={fontFamily.monoSemiBold}
                fill={PAPER}
                textAnchor="middle"
              >
                {beforeLabel.toUpperCase()}
              </SvgText>
              <Rect
                x={COMPOSITE_CANVAS_WIDTH - LABEL_MARGIN - LABEL_PILL_WIDTH}
                y={LABEL_MARGIN}
                width={LABEL_PILL_WIDTH}
                height={LABEL_PILL_HEIGHT}
                rx={LABEL_PILL_HEIGHT / 2}
                fill={INK}
                fillOpacity={0.6}
              />
              <SvgText
                x={COMPOSITE_CANVAS_WIDTH - LABEL_MARGIN - LABEL_PILL_WIDTH / 2}
                y={LABEL_MARGIN + LABEL_PILL_HEIGHT / 2 + LABEL_FONT_SIZE * 0.35}
                fontSize={LABEL_FONT_SIZE}
                fontFamily={fontFamily.monoSemiBold}
                fill={PAPER}
                textAnchor="middle"
              >
                {afterLabel.toUpperCase()}
              </SvgText>
              <SvgText
                x={COMPOSITE_CANVAS_WIDTH / 2}
                y={COMPOSITE_PHOTO_HEIGHT + COMPOSITE_CAPTION_HEIGHT / 2 + CAPTION_FONT_SIZE * 0.35}
                fontSize={CAPTION_FONT_SIZE}
                fontFamily={fontFamily.mono}
                fill={PAPER}
                textAnchor="middle"
                letterSpacing={1}
              >
                {caption}
              </SvgText>
            </>
          )}
        </Svg>
      </View>
    );
  }
);

export default CompositeExporter;
