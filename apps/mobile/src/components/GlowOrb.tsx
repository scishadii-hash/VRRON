import { View } from "react-native";

type Props = {
  size: number;
  /** RGB triplet such as "124, 58, 237" (see glowRgb in @vrron/design). */
  rgb: string;
  /** Alpha at the centre, where the layers add up. */
  peakAlpha?: number;
  layers?: number;
};

/**
 * Soft glow built from a few stacked translucent circles.
 * No blur library, no images: cheap to draw and safe on low-end phones.
 */
export function GlowOrb({ size, rgb, peakAlpha = 0.5, layers = 7 }: Props) {
  const alpha = peakAlpha / layers;
  return (
    <View
      pointerEvents="none"
      style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}
    >
      {Array.from({ length: layers }, (_, i) => {
        const diameter = size * (1 - (i / (layers - 1)) * 0.85);
        return (
          <View
            key={i}
            style={{
              position: "absolute",
              width: diameter,
              height: diameter,
              borderRadius: diameter / 2,
              backgroundColor: `rgba(${rgb}, ${alpha})`,
            }}
          />
        );
      })}
    </View>
  );
}
