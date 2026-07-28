import { fontFamily } from "@/constants/DesignSystem";
import { computeCompositeLayout } from "@/utils/compositeImage";
import * as FileSystem from "expo-file-system/legacy";
import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { View } from "react-native";
import Svg, { ClipPath, Defs, Image as SvgImage, Rect, Text as SvgText } from "react-native-svg";

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
  afterness: number;
  caption: string;
  beforeLabel: string;
  afterLabel: string;
}

export const CompositeExporter = forwardRef<CompositeExporterHandle, CompositeExporterProps>(
  ({ beforeUri, afterUri, afterness, caption, beforeLabel, afterLabel }, ref) => {
    const svgRef = useRef<Svg>(null);
    const [dataUris, setDataUris] = useState<{ before: string; after: string; callId: number } | null>(
      null
    );
    const loadedCountRef = useRef(0);
    const readyResolveRef = useRef<(() => void) | null>(null);
    const exportCallIdRef = useRef(0);

    const layout = computeCompositeLayout(afterness);

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
        setDataUris({
          before: `data:image/jpeg;base64,${beforeBase64}`,
          after: `data:image/jpeg;base64,${afterBase64}`,
          callId,
        });
        await ready;

        return new Promise<string>((resolve, reject) => {
          if (!svgRef.current) {
            reject(new Error("CompositeExporter: Svg ref is not attached."));
            return;
          }
          svgRef.current.toDataURL(
            (base64Png) => {
              const fileUri = `${FileSystem.cacheDirectory}composite_${Date.now()}.png`;
              FileSystem.writeAsStringAsync(fileUri, base64Png, {
                encoding: FileSystem.EncodingType.Base64,
              })
                .then(() => resolve(fileUri))
                .catch(reject);
            },
            { width: layout.canvasWidth, height: layout.canvasHeight }
          );
        });
      },
    }));

    return (
      <View
        pointerEvents="none"
        style={{ position: "absolute", left: -9999, top: 0, width: layout.canvasWidth, height: layout.canvasHeight }}
      >
        <Svg ref={svgRef} width={layout.canvasWidth} height={layout.canvasHeight}>
          <Defs>
            <ClipPath id="beforeClip">
              <Rect x={0} y={0} width={layout.beforeClipWidth} height={layout.photoHeight} />
            </ClipPath>
          </Defs>
          {/* Fills the whole canvas — doubles as the caption strip's
              background since the photo images only cover 0..photoHeight. */}
          <Rect x={0} y={0} width={layout.canvasWidth} height={layout.canvasHeight} fill={INK} />
          {dataUris && (
            <>
              <SvgImage
                key={`after-${dataUris.callId}`}
                x={0}
                y={0}
                width={layout.canvasWidth}
                height={layout.photoHeight}
                href={dataUris.after}
                preserveAspectRatio="xMidYMid slice"
                onLoad={handleImageLoad}
              />
              <SvgImage
                key={`before-${dataUris.callId}`}
                x={0}
                y={0}
                width={layout.canvasWidth}
                height={layout.photoHeight}
                href={dataUris.before}
                preserveAspectRatio="xMidYMid slice"
                clipPath="url(#beforeClip)"
                onLoad={handleImageLoad}
              />
              <Rect
                x={layout.dividerX - DIVIDER_WIDTH / 2}
                y={0}
                width={DIVIDER_WIDTH}
                height={layout.photoHeight}
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
                x={layout.canvasWidth - LABEL_MARGIN - LABEL_PILL_WIDTH}
                y={LABEL_MARGIN}
                width={LABEL_PILL_WIDTH}
                height={LABEL_PILL_HEIGHT}
                rx={LABEL_PILL_HEIGHT / 2}
                fill={INK}
                fillOpacity={0.6}
              />
              <SvgText
                x={layout.canvasWidth - LABEL_MARGIN - LABEL_PILL_WIDTH / 2}
                y={LABEL_MARGIN + LABEL_PILL_HEIGHT / 2 + LABEL_FONT_SIZE * 0.35}
                fontSize={LABEL_FONT_SIZE}
                fontFamily={fontFamily.monoSemiBold}
                fill={PAPER}
                textAnchor="middle"
              >
                {afterLabel.toUpperCase()}
              </SvgText>
              <SvgText
                x={layout.canvasWidth / 2}
                y={layout.photoHeight + layout.captionHeight / 2 + CAPTION_FONT_SIZE * 0.35}
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
