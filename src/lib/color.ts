/**
 * Compute WCAG relative luminance & select high-contrast ink color (#111116 vs #ffffff)
 * Directly inspired by girlsbands design spec §8 `inkOn(hex)`
 */
export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "").trim();
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean.padEnd(6, "0").slice(0, 6);
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function channelLuminance(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return (
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b)
  );
}

export function inkOn(hex: string): "#111116" | "#ffffff" {
  const lum = relativeLuminance(hex);
  const contrastWhite = (1.0 + 0.05) / (lum + 0.05);
  const contrastDark = (lum + 0.05) / (0.008 + 0.05);
  return contrastDark >= contrastWhite ? "#111116" : "#ffffff";
}

export function hexAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
