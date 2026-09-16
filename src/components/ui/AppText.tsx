import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import type { TextProps } from 'react-native';

const WEIGHT_FONTS: Record<string, string> = {
  '300': 'Nunito_300Light',
  '400': 'Nunito_400Regular',
  normal: 'Nunito_400Regular',
  '500': 'Nunito_600SemiBold',
  '600': 'Nunito_600SemiBold',
  '700': 'Nunito_700Bold',
  bold: 'Nunito_700Bold',
  '800': 'Nunito_800ExtraBold',
  '900': 'Nunito_800ExtraBold',
};

const DEFAULT_FONT = 'Nunito_400Regular';

/**
 * Drop-in replacement for RN's Text: picks the matching Nunito weight file
 * from a style's `fontWeight` since custom fonts can't synthesize bold/light.
 */
export function Text({ style, ...rest }: TextProps) {
  const flat = StyleSheet.flatten(style) as { fontWeight?: string | number } | undefined;
  const weight = flat?.fontWeight != null ? String(flat.fontWeight) : '400';
  const fontFamily = WEIGHT_FONTS[weight] ?? DEFAULT_FONT;
  return <RNText {...rest} style={[{ fontFamily }, style]} />;
}
