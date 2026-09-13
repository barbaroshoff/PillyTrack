import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import TodayScreen from '../screens/TodayScreen';
import AllCoursesScreen from '../screens/AllCoursesScreen';
import CalendarScreen from '../screens/CalendarScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useTheme } from '../context/ThemeContext';
import { useFontScale } from '../context/FontScaleContext';
import { baseSizes } from '../theme/typography';
import type { RootStackParamList } from './RootNavigator';

export type TabParamList = {
  Today: undefined;
  AllCourses: undefined;
  Calendar: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

const TAB_LABELS: Record<keyof TabParamList, string> = {
  Today: 'Сегодня',
  AllCourses: 'Курсы',
  Calendar: 'Календарь',
  Settings: 'Настройки',
};

const TAB_ICONS: Record<keyof TabParamList, string> = {
  Today: '💊',
  AllCourses: '📋',
  Calendar: '📅',
  Settings: '⚙️',
};

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const { scale } = useFontScale();
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={[s.bar, { backgroundColor: colors.bg, borderTopColor: colors.border }]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const label = TAB_LABELS[route.name as keyof TabParamList];
        const icon = TAB_ICONS[route.name as keyof TabParamList];

        return (
          <TouchableOpacity
            key={route.key}
            style={s.tabItem}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 22 }}>{icon}</Text>
            <Text
              style={{
                color: isFocused ? colors.accent : colors.textMuted,
                fontSize: baseSizes.caption * scale,
                marginTop: 2,
                fontWeight: isFocused ? '600' : '400',
              }}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}

      {/* FAB поверх таб-бара */}
      <TouchableOpacity
        style={[s.fab, { backgroundColor: colors.accent }]}
        onPress={() => rootNav.navigate('ScanCamera')}
        activeOpacity={0.85}
      >
        <Text style={s.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Today" component={TodayScreen} />
      <Tab.Screen name="AllCourses" component={AllCoursesScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
    paddingHorizontal: 8,
    position: 'relative',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  fab: {
    position: 'absolute',
    right: 16,
    top: -20,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  fabIcon: { color: '#fff', fontSize: 28, lineHeight: 32 },
});
