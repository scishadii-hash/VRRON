import { test } from "node:test";
import assert from "node:assert/strict";
import { colors } from "../src/index.ts";

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const channels = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

const textColors = ["textPrimary", "textSecondary", "textMuted", "violetLight", "blueLight"] as const;
const surfaces = ["background", "surface", "surfaceRaised"] as const;

for (const text of textColors) {
  for (const surface of surfaces) {
    test(`${text} on ${surface} meets WCAG AA (4.5:1)`, () => {
      const ratio = contrast(colors[text], colors[surface]);
      assert.ok(ratio >= 4.5, `${text} on ${surface} is ${ratio.toFixed(2)}:1`);
    });
  }
}

test("primary text on violet buttons meets WCAG AA", () => {
  const ratio = contrast(colors.textPrimary, colors.violet);
  assert.ok(ratio >= 4.5, `textPrimary on violet is ${ratio.toFixed(2)}:1`);
});
