import React, { useCallback, useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarList } from 'react-native-calendars';
import type { DateData } from 'react-native-calendars';
import { useIsFocused } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useFontScale } from '../context/FontScaleContext';
import { baseSizes } from '../theme/typography';
import { getIntakesForMonth } from '../db/intakes';
import type { IntakeEvent } from '../db/intakes';

type MarkedDates = Record<string, any>;

// Внутренние константы react-native-calendars
const CAL_HEADER_H = 46;  // строка с названием месяца (без стрелок)
const CAL_NAMES_H  = 30;  // строка Пн Вт Ср…
const ROWS         = 6;   // максимум строк в месяце
const ROW_MARGIN   = 8;   // margin-top + bottom одной строки

const { width: SCREEN_W } = Dimensions.get('window');
const CELL_SIZE = Math.floor(SCREEN_W / 7) - 6;
const MONTH_HEIGHT = CAL_HEADER_H + CAL_NAMES_H + ROWS * (CELL_SIZE + ROW_MARGIN) + 16;

function buildMarkedDates(
  events: IntakeEvent[],
  selectedDate: string,
  colors: any,
): MarkedDates {
  const byDate: Record<string, IntakeEvent[]> = {};
  for (const e of events) {
    const date = e.scheduled_at.slice(0, 10);
    (byDate[date] ??= []).push(e);
  }

  const now = new Date().toISOString().slice(0, 10);
  const marked: MarkedDates = {};

  for (const [date, evs] of Object.entries(byDate)) {
    const allTaken = evs.every((e) => e.status === 'taken');
    const hasMissed = evs.some((e) => e.status === 'missed');
    const isPast = date < now;
    const isSelected = date === selectedDate;

    let bg = 'transparent';
    let borderColor = 'transparent';
    let textColor = colors.textPrimary;

    if (allTaken) {
      bg = colors.success;
      borderColor = colors.success;
      textColor = '#fff';
    } else if (hasMissed && isPast) {
      bg = colors.warningLight;
      borderColor = colors.warning;
      textColor = colors.warning;
    } else {
      bg = 'transparent';
      borderColor = colors.border;
    }

    marked[date] = {
      customStyles: {
        container: {
          backgroundColor: bg,
          borderWidth: isSelected ? 2.5 : 1.5,
          borderColor: isSelected ? colors.accent : borderColor,
          borderRadius: 999,
        },
        text: {
          color: textColor,
          fontWeight: (allTaken || isSelected) ? '700' : '400',
          marginTop: 0,
        },
      },
    };
  }

  // выбранный день без событий
  if (selectedDate && !marked[selectedDate]) {
    marked[selectedDate] = {
      customStyles: {
        container: {
          backgroundColor: colors.accent,
          borderWidth: 2.5,
          borderColor: colors.accent,
          borderRadius: 999,
        },
        text: { color: '#fff', fontWeight: '700', marginTop: 0 },
      },
    };
  }

  return marked;
}

export default function CalendarScreen() {
  const { colors } = useTheme();
  const { scale } = useFontScale();
  const { t, i18n } = useTranslation();

  const todayStr = new Date().toISOString().slice(0, 10);
  const [currentMonth, setCurrentMonth] = useState(todayStr.slice(0, 7));
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [events, setEvents] = useState<IntakeEvent[]>([]);
  const isFocused = useIsFocused();

  const load = useCallback(async (month: string) => {
    const data = await getIntakesForMonth(month);
    setEvents(data);
  }, []);

  useEffect(() => {
    if (isFocused) load(currentMonth);
  }, [isFocused, currentMonth, load]);

  const markedDates = useMemo(
    () => buildMarkedDates(events, selectedDate, colors),
    [events, selectedDate, colors],
  );

  const selectedEvents = useMemo(
    () => events.filter((e) => e.scheduled_at.startsWith(selectedDate)),
    [events, selectedDate],
  );

  const onDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const onMonthChange = (month: DateData) => {
    const ym = `${month.year}-${String(month.month).padStart(2, '0')}`;
    setCurrentMonth(ym);
  };

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* Календарь — непрерывный вертикальный скролл, следующий месяц открывается прокруткой вниз */}
      <View style={s.calendarContainer}>
        <CalendarList
          pastScrollRange={12}
          futureScrollRange={12}
          calendarHeight={MONTH_HEIGHT}
          showScrollIndicator={false}
          markingType="custom"
          markedDates={markedDates}
          onDayPress={onDayPress}
          onMonthChange={onMonthChange}
          theme={{
            backgroundColor: colors.bg,
            calendarBackground: colors.bg,
            textSectionTitleColor: colors.textSecondary,
            todayTextColor: colors.accent,
            dayTextColor: colors.textPrimary,
            textDisabledColor: colors.textMuted,
            monthTextColor: colors.textPrimary,
            textMonthFontWeight: '700',
            textMonthFontSize: baseSizes.body * scale,
            textDayFontSize: baseSizes.body * scale,
            textDayHeaderFontSize: baseSizes.caption * scale,
            'stylesheet.calendar.main': {
              week: {
                marginTop: ROW_MARGIN / 2,
                marginBottom: ROW_MARGIN / 2,
                flexDirection: 'row',
                justifyContent: 'space-around',
              },
            },
            'stylesheet.day.basic': {
              base: {
                width: CELL_SIZE,
                height: CELL_SIZE,
                alignItems: 'center',
                justifyContent: 'center',
              },
              text: {
                marginTop: 0,
                fontSize: baseSizes.body * scale,
              },
            },
          } as any}
        />
      </View>

      {/* Легенда */}
      <View style={[s.legend, { borderTopColor: colors.border }]}>
        <LegendItem color={colors.success} label={t('calendar_legend_done')} textColor={colors.success} scale={scale} />
        <LegendItem color={colors.warning} label={t('calendar_legend_missed')} textColor={colors.warning} scale={scale} />
        <LegendItem color={colors.border} label={t('calendar_legend_future')} textColor={colors.textSecondary} scale={scale} />
      </View>

      {/* Приёмы выбранного дня — часть экрана, без модалки и затемнения, обновляется мгновенно по тапу */}
      <View style={[s.dayPanel, { backgroundColor: colors.bg, borderTopColor: colors.border }]}>
        <Text style={[s.dayPanelDate, { color: colors.textPrimary, fontSize: baseSizes.body * scale }]}>
          {new Date(selectedDate + 'T12:00:00').toLocaleDateString(i18n.language, {
            day: 'numeric',
            month: 'long',
          })}
        </Text>

        {selectedEvents.length === 0 ? (
          <Text style={{ color: colors.textMuted, fontSize: baseSizes.body * scale, textAlign: 'center', marginTop: 16 }}>
            {t('calendar_day_empty')}
          </Text>
        ) : (
          <FlatList
            data={selectedEvents}
            keyExtractor={(e) => e.id}
            contentContainerStyle={{ gap: 8, paddingBottom: 12 }}
            renderItem={({ item }) => (
              <SheetEventRow event={item} colors={colors} scale={scale} t={t} />
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function LegendItem({ color, label, textColor, scale }: {
  color: string; label: string; textColor: string; scale: number;
}) {
  return (
    <View style={s.legendItem}>
      <View style={[s.legendDot, { backgroundColor: color }]} />
      <Text style={{ color: textColor, fontSize: baseSizes.caption * scale }}>{label}</Text>
    </View>
  );
}

function SheetEventRow({ event, colors, scale, t }: {
  event: IntakeEvent; colors: any; scale: number; t: any;
}) {
  const statusLabel =
    event.status === 'taken' ? t('status_taken') :
    event.status === 'missed' ? t('status_missed') :
    t('status_pending');

  const statusColor =
    event.status === 'taken' ? colors.success :
    event.status === 'missed' ? colors.danger :
    colors.warning;

  const badgeBg =
    event.status === 'taken' ? colors.successLight :
    event.status === 'missed' ? colors.dangerLight :
    colors.warningLight;

  return (
    <View style={[s.sheetRow, { borderColor: colors.border }]}>
      <View style={[s.sheetIconWrap, { backgroundColor: colors.accentLight }]}>
        <Text style={{ fontSize: 16 }}>💊</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.textPrimary, fontSize: baseSizes.body * scale, fontWeight: '600' }} numberOfLines={1}>
          {event.medication_name ?? '—'}
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: baseSizes.caption * scale }}>
          {event.scheduled_at.slice(11, 16)}
        </Text>
      </View>
      <View style={[s.statusBadge, { backgroundColor: badgeBg }]}>
        <Text style={{ color: statusColor, fontSize: baseSizes.caption * scale, fontWeight: '600' }}>
          {statusLabel}
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  calendarContainer: { flex: 1 },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  dayPanel: {
    height: 240,
    borderTopWidth: 1,
    padding: 20,
    paddingTop: 14,
  },
  dayPanelDate: { fontWeight: '700', marginBottom: 12 },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  sheetIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
});
