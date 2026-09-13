import React, { useCallback, useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  ScrollView,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import type { DateData } from 'react-native-calendars';
import { useIsFocused } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useFontScale } from '../context/FontScaleContext';
import { baseSizes } from '../theme/typography';
import { getIntakesForMonth } from '../db/intakes';
import type { IntakeEvent } from '../db/intakes';

type MarkedDates = Record<string, any>;

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

    let bg = 'transparent';
    let border = false;
    let borderColor = colors.border;
    let textColor = colors.textPrimary;

    if (allTaken) {
      bg = colors.successLight;
      textColor = colors.success;
    } else if (hasMissed && isPast) {
      bg = colors.warningLight;
      border = true;
      borderColor = colors.warning;
      textColor = colors.warning;
    } else {
      border = true;
      borderColor = colors.border;
    }

    if (date === selectedDate) {
      bg = colors.accentLight;
      border = true;
      borderColor = colors.accent;
      textColor = colors.accentDark;
    }

    marked[date] = {
      customStyles: {
        container: {
          backgroundColor: bg,
          borderWidth: border ? 1.5 : 0,
          borderColor,
          borderRadius: 16,
        },
        text: { color: textColor, fontWeight: date === selectedDate ? '700' : '400' },
      },
    };
  }

  // выбранный день без событий
  if (selectedDate && !marked[selectedDate]) {
    marked[selectedDate] = {
      customStyles: {
        container: {
          backgroundColor: colors.accentLight,
          borderWidth: 1.5,
          borderColor: colors.accent,
          borderRadius: 16,
        },
        text: { color: colors.accentDark, fontWeight: '700' },
      },
    };
  }

  return marked;
}

export default function CalendarScreen() {
  const { colors } = useTheme();
  const { scale } = useFontScale();
  const { t } = useTranslation();

  const todayStr = new Date().toISOString().slice(0, 10);
  const [currentMonth, setCurrentMonth] = useState(todayStr.slice(0, 7));
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [events, setEvents] = useState<IntakeEvent[]>([]);
  const [sheetVisible, setSheetVisible] = useState(false);
  const slideY = useRef(new Animated.Value(400)).current;
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

  const openSheet = () => {
    setSheetVisible(true);
    Animated.spring(slideY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }).start();
  };

  const closeSheet = () => {
    Animated.timing(slideY, { toValue: 400, duration: 220, useNativeDriver: true }).start(() =>
      setSheetVisible(false),
    );
  };

  const onDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
    openSheet();
  };

  const onMonthChange = (month: DateData) => {
    const ym = `${month.year}-${String(month.month).padStart(2, '0')}`;
    setCurrentMonth(ym);
  };

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.bg }]} edges={['top']}>
      <Text style={[s.heading, { color: colors.textPrimary, fontSize: baseSizes.title * scale }]}>
        {t('calendar')}
      </Text>

      <Calendar
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
          arrowColor: colors.accent,
          textMonthFontWeight: '700',
          textMonthFontSize: baseSizes.body * scale,
          textDayFontSize: baseSizes.body * scale,
          textDayHeaderFontSize: baseSizes.caption * scale,
        }}
      />

      {/* Легенда */}
      <View style={[s.legend, { borderTopColor: colors.border }]}>
        <LegendItem color={colors.successLight} border={colors.successLight} label={t('calendar_legend_done')} textColor={colors.success} scale={scale} />
        <LegendItem color={colors.warningLight} border={colors.warning} label={t('calendar_legend_missed')} textColor={colors.warning} scale={scale} />
        <LegendItem color="transparent" border={colors.border} label={t('calendar_legend_future')} textColor={colors.textSecondary} scale={scale} />
      </View>

      {/* Bottom sheet */}
      <Modal transparent visible={sheetVisible} onRequestClose={closeSheet} animationType="none">
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={closeSheet} />
        <Animated.View
          style={[
            s.sheet,
            { backgroundColor: colors.bg, transform: [{ translateY: slideY }] },
          ]}
        >
          <View style={[s.sheetHandle, { backgroundColor: colors.border }]} />
          <Text style={[s.sheetDate, { color: colors.textPrimary, fontSize: baseSizes.title * scale }]}>
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('ru-RU', {
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
              contentContainerStyle={{ gap: 8, paddingBottom: 24 }}
              renderItem={({ item }) => (
                <SheetEventRow event={item} colors={colors} scale={scale} t={t} />
              )}
            />
          )}
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}

function LegendItem({ color, border, label, textColor, scale }: any) {
  return (
    <View style={s.legendItem}>
      <View style={[s.legendDot, { backgroundColor: color, borderColor: border, borderWidth: 1.5 }]} />
      <Text style={{ color: textColor, fontSize: baseSizes.caption * scale }}>{label}</Text>
    </View>
  );
}

function SheetEventRow({ event, colors, scale, t }: { event: IntakeEvent; colors: any; scale: number; t: any }) {
  const statusLabel = event.status === 'taken'
    ? t('status_taken')
    : event.status === 'missed'
    ? t('status_missed')
    : t('status_pending');

  const statusColor = event.status === 'taken'
    ? colors.success
    : event.status === 'missed'
    ? colors.danger
    : colors.warning;

  const badgeBg = event.status === 'taken'
    ? colors.successLight
    : event.status === 'missed'
    ? colors.dangerLight
    : colors.warningLight;

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
  heading: { fontWeight: '700', margin: 20, marginBottom: 8 },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    marginTop: 8,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 14, height: 14, borderRadius: 7 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingTop: 12,
    maxHeight: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 12,
  },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetDate: { fontWeight: '700', marginBottom: 16 },
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
