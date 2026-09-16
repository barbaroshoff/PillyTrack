export const fontScales = {
  normal: 1,
  large: 1.15,
  xlarge: 1.3,
} as const;

export type FontScaleKey = keyof typeof fontScales;

export const baseSizes = {
  body: 16,
  title: 23,
  caption: 13,
  button: 17,
};
