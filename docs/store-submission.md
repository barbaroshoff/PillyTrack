# Store Submission Guide — PillyTrack

## Pre-submission checklist

- [ ] `eas build:configure` выполнен, `projectId` заполнен в `app.json`
- [ ] `app.json`: `bundleIdentifier` и `package` уникальны и зарегистрированы в сторах
- [ ] `eas.json`: `appleId`, `ascAppId`, `appleTeamId` заполнены
- [ ] `google-play-service-account.json` получен из Google Play Console и добавлен в корень (не коммитить!)
- [ ] Privacy Policy опубликована по доступному URL (GitHub Pages, etc.)
- [ ] Скриншоты готовы (см. ниже)
- [ ] Иконка: 1024×1024 PNG без альфа-канала (App Store)

## EAS Build — команды

```bash
# Установить EAS CLI
npm install -g eas-cli

# Войти в аккаунт Expo
eas login

# Привязать проект (заполнит projectId в app.json)
eas build:configure

# Тест-сборка для устройств (внутренний дистрибутив)
eas build --platform all --profile preview

# Продакшн-сборка
eas build --platform ios --profile production
eas build --platform android --profile production

# Публикация
eas submit --platform ios --latest
eas submit --platform android --latest
```

## App Store Connect — App Privacy

Категория: **Health & Fitness**

В разделе "App Privacy" → "Data Not Collected":
Приложение не собирает и не отправляет никакие данные пользователя.

NSCameraUsageDescription (уже в app.json):
> "PillyTrack использует камеру для сканирования штрихкода упаковки лекарства. Камера нужна только для добавления нового курса — фото и видео не сохраняются."

NSPhotoLibraryUsageDescription (уже в app.json):
> "PillyTrack может добавить фото упаковки лекарства для удобной идентификации. Доступ к фото нужен только для этого."

## Google Play — Data safety

В разделе "Data safety":
- **Данные не собираются** — выбрать "No, I don't collect data from this app"
- Permissions explanation:
  - CAMERA: для сканирования штрихкода на упаковке лекарства
  - READ_MEDIA_IMAGES: опциональное фото упаковки, хранится локально
  - POST_NOTIFICATIONS: напоминания о приёме лекарств в запланированное время
  - SCHEDULE_EXACT_ALARM: точное время уведомлений (Android 12+)

## Скриншоты

Требуемые размеры для App Store:
- iPhone 6.9" (1320×2868 px) — обязательно
- iPhone 6.5" (1242×2688 px) — обязательно
- iPad 13" (2064×2752 px) — если `supportsTablet: true`

Требуемые размеры для Google Play:
- Phone: 1080×1920 px (минимум)
- 7" tablet, 10" tablet — опционально

Экраны для скриншотов (в порядке важности):
1. **Сегодня** — список карточек с кнопками Принял/Пропустил
2. **Сканирование** — видоискатель камеры
3. **Расписание** — пресеты + превью курса
4. **Успех** — "Готово! Будем напоминать вовремя"
5. **Календарь** — месяц с цветовой раскраской
6. **Курсы** — список активных курсов
7. **Настройки** — карточки размера шрифта

## Описание приложения (RU)

**Название:** PillyTrack

**Подзаголовок:** Напоминания о лекарствах

**Описание (краткое, до 170 символов):**
Сканируйте упаковки — PillyTrack сам рассчитает курс и напомнит о каждом приёме вовремя.

**Описание (полное):**
PillyTrack помогает не забывать принимать лекарства по расписанию.

Просто наведите камеру на штрихкод упаковки — приложение рассчитает длительность курса и автоматически запланирует все напоминания.

Возможности:
• Сканирование штрихкода для быстрого добавления
• Автоматический расчёт курса (сколько дней хватит упаковки)
• Напоминания с кнопками "Принял" / "Пропустил" прямо в уведомлении
• Календарь с историей приёмов
• Три размера шрифта — удобно для людей любого возраста
• Русский и английский интерфейс
• Все данные хранятся только на устройстве

⚠️ Приложение не является медицинским и не даёт врачебных рекомендаций.

**Ключевые слова (App Store):**
лекарства, таблетки, напоминание, курс лечения, расписание, здоровье, pills, medication reminder

## Медицинский дисклеймер (для обеих сторов)

"PillyTrack is not a medical app and does not provide medical advice. Always follow your doctor's or pharmacist's instructions."
