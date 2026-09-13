# План реализации PillyTrack v2 (на основе финальных макетов)

## Этап 0. Подготовка окружения ✅

```bash
node -v && npm -v
npm install -g eas-cli
npx create-expo-app med-reminder --template blank-typescript
cd med-reminder
git init && git add -A && git commit -m "init: expo blank typescript"
```

## Этап 1. Дизайн-токены и тема (на основе SVG-макетов) ✅

Взять цвета и типографику прямо из сгенерированных SVG — это уже согласованная палитра, кодировать 1-в-1, не придумывать заново.

```bash
mkdir -p src/theme
```

`src/theme/colors.ts`:

```ts
export const colors = {
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
```

`src/theme/typography.ts` — три уровня размера шрифта (см. Этап 7, экран настроек):

```ts
export const fontScales = {
  normal: 1,
  large: 1.15,
  xlarge: 1.3,
};
// базовые размеры уже крупнее обычного mobile-стандарта
export const baseSizes = {
  body: 15,
  title: 20,
  caption: 12,
  button: 15,
};
```

Задача: контекст ThemeProvider/FontScaleProvider (React Context + useState), от него зависят все текстовые компоненты — единая точка масштабирования шрифта на всё приложение.
