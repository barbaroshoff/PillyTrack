export const lightColors = {
  bg: '#FFFFFF',
  cardBg: '#FFFFFF',
  cardAlt: '#F6FAFD',
  accent: '#4FA8E8',
  accentLight: '#E8F4FC',
  accentDark: '#1E6FA8',
  textPrimary: '#1C1F26',
  textSecondary: '#6B7684',
  textMuted: '#9AA3AF',
  border: '#E4E9F0',
  success: '#2FA36B',
  successLight: '#E5F6ED',
  warning: '#DB8F2A',
  warningLight: '#FDF1E1',
  danger: '#DD5652',
  dangerLight: '#FCEAEA',
};

export const darkColors: typeof lightColors = {
  bg: '#12151B',
  cardBg: '#1B1F27',
  cardAlt: '#1E232C',
  accent: '#4FA8E8',
  accentLight: '#1D3A4F',
  accentDark: '#7FC4F2',
  textPrimary: '#F2F5F9',
  textSecondary: '#A3ACB9',
  textMuted: '#6E7885',
  border: '#2C323C',
  success: '#3FBE85',
  successLight: '#173626',
  warning: '#E3A24A',
  warningLight: '#3A2C13',
  danger: '#E8756F',
  dangerLight: '#3A1D1B',
};

/** @deprecated use useTheme().colors instead — kept only as the light default */
export const colors = lightColors;
