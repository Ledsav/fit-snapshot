import { fontFamily } from "@/constants/DesignSystem";
import {
  COMPOSITE_CANVAS_WIDTH,
  COMPOSITE_CAPTION_HEIGHT,
  COMPOSITE_PHOTO_HEIGHT,
  computeCompositeLayout,
} from "@/utils/compositeImage";
import * as FileSystem from "expo-file-system/legacy";
import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { PixelRatio, View } from "react-native";
import Svg, { ClipPath, Defs, Image as SvgImage, Rect, Text as SvgText } from "react-native-svg";

// canvasWidth/canvasHeight/photoHeight/captionHeight never vary with slider
// position (only dividerX/beforeClipWidth do) — used for the idle/static
// render so this component never needs the live slider value as a prop.
const STATIC_CANVAS_HEIGHT = COMPOSITE_PHOTO_HEIGHT + COMPOSITE_CAPTION_HEIGHT;

// The <Svg> below is sized in dp, but Android's toDataURL() rasterizes at
// the view's actual (density-scaled) pixel size, not its dp size — so a
// naive width={1080} renders at ~1080*density device pixels (e.g. ~3240px
// on a 3x-density phone), producing a bitmap many times larger than
// intended and slow enough to encode/bridge that it reads as a hang.
// Shrinking the component's own dp size by the device's density, while
// keeping a viewBox in the original 1080x1536 coordinate space for all
// children, makes the actual rendered pixel size come out to exactly
// COMPOSITE_CANVAS_WIDTH x STATIC_CANVAS_HEIGHT on any device.
const DENSITY = PixelRatio.get();
const SVG_WIDTH_DP = COMPOSITE_CANVAS_WIDTH / DENSITY;
const SVG_HEIGHT_DP = STATIC_CANVAS_HEIGHT / DENSITY;

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

// After setting the new export state, wait for a real commit+paint (two
// animation frames) plus this safety margin for the native <Image>'s data
// URI decode to finish, before rasterizing. Not used: waiting on the
// SvgImage onLoad event — on Android, re-decoding byte-identical data URI
// content (the same source photos) into a freshly mounted view does not
// reliably re-fire onLoad (looks like an image-loader cache hit that
// bypasses the event), which hung every export() call after the first.
const IMAGE_DECODE_SAFETY_MARGIN_MS = 300;

function waitTwoFrames(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const CompositeExporter = forwardRef<CompositeExporterHandle, CompositeExporterProps>(
  ({ beforeUri, afterUri, getAfterness, caption, beforeLabel, afterLabel }, ref) => {
    const svgRef = useRef<Svg>(null);
    const [exportState, setExportState] = useState<ExportState | null>(null);
    const exportCallIdRef = useRef(0);
    // The file from the previous export() call, cleaned up lazily at the
    // start of the next call rather than right after use: PhotoMorph's
    // isSaving/isSharingComposite guard blocks starting a new export until
    // the prior save/share has fully resolved, so by the time we get here
    // the previous file is guaranteed to no longer be needed.
    const previousFileUriRef = useRef<string | null>(null);

    useImperativeHandle(ref, () => ({
      export: async () => {
        exportCallIdRef.current += 1;
        const callId = exportCallIdRef.current;
        const { dividerX, beforeClipWidth } = computeCompositeLayout(getAfterness());

        if (previousFileUriRef.current) {
          FileSystem.deleteAsync(previousFileUriRef.current, { idempotent: true }).catch(() => {});
        }

        // Embed both photos as data URIs before mounting the SVG <Image>
        // elements — the pixel data is inline in the tree at render time
        // instead of being fetched after mount, which avoids racing
        // toDataURL against an async image load.
        const [beforeBase64, afterBase64] = await Promise.all([
          FileSystem.readAsStringAsync(beforeUri, { encoding: FileSystem.EncodingType.Base64 }),
          FileSystem.readAsStringAsync(afterUri, { encoding: FileSystem.EncodingType.Base64 }),
        ]);

        setExportState({
          before: `data:image/jpeg;base64,${beforeBase64}`,
          after: `data:image/jpeg;base64,${afterBase64}`,
          dividerX,
          beforeClipWidth,
          callId,
        });
        await waitTwoFrames();
        await delay(IMAGE_DECODE_SAFETY_MARGIN_MS);

        return new Promise<string>((resolve, reject) => {
          if (!svgRef.current) {
            reject(new Error("CompositeExporter: Svg ref is not attached."));
            return;
          }
          // No {width, height} options: passing them makes Android size the
          // output Bitmap at exactly those raw pixels while still drawing
          // content scaled to the view's actual (larger) pixel size, which
          // crops to the top-left corner. With no options, toDataURL uses
          // the view's real pixel size directly — already exactly
          // COMPOSITE_CANVAS_WIDTH x STATIC_CANVAS_HEIGHT thanks to the
          // dp/density adjustment above, so this is correctly-sized and
          // fast with no extra resize step needed.
          svgRef.current.toDataURL((base64Png) => {
            const fileUri = `${FileSystem.cacheDirectory}composite_${Date.now()}.png`;
            FileSystem.writeAsStringAsync(fileUri, base64Png, {
              encoding: FileSystem.EncodingType.Base64,
            })
              .then(() => {
                previousFileUriRef.current = fileUri;
                resolve(fileUri);
              })
              .catch(reject);
          });
        });
      },
    }));

    return (
      <View
        pointerEvents="none"
        style={{ position: "absolute", left: -9999, top: 0, width: SVG_WIDTH_DP, height: SVG_HEIGHT_DP }}
      >
        {/*
          Keyed on the export call id so the ENTIRE native Svg view — not
          just its children — is torn down and recreated fresh on every
          export() call. react-native-svg's Android SvgView caches
          internal readiness state (mRendered/mBitmap) on the view
          instance itself; reusing the same instance across repeated
          toDataURL() calls left that state inconsistent and could hang
          the second call indefinitely (waiting on a native onDraw pass
          that was never guaranteed to fire again for an off-screen,
          already-drawn-once view). A brand-new instance behaves exactly
          like the reliable first call, every time.
        */}
        <Svg
          key={exportState?.callId ?? 0}
          ref={svgRef}
          width={SVG_WIDTH_DP}
          height={SVG_HEIGHT_DP}
          viewBox={`0 0 ${COMPOSITE_CANVAS_WIDTH} ${STATIC_CANVAS_HEIGHT}`}
        >
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
                x={0}
                y={0}
                width={COMPOSITE_CANVAS_WIDTH}
                height={COMPOSITE_PHOTO_HEIGHT}
                href={exportState.after}
                preserveAspectRatio="xMidYMid slice"
              />
              <SvgImage
                x={0}
                y={0}
                width={COMPOSITE_CANVAS_WIDTH}
                height={COMPOSITE_PHOTO_HEIGHT}
                href={exportState.before}
                preserveAspectRatio="xMidYMid slice"
                clipPath="url(#beforeClip)"
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
