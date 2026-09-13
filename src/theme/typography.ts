export const fontScales = {
  normal: 1,
  large: 1.15,
  xlarge: 1.3,
} as const;

export type FontScaleKey = keyof typeof fontScales;

export const baseSizes = {
  body: 15,
  title: 20,
  caption: 12,
  button: 15,
};
