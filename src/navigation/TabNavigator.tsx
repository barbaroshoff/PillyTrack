import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
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

const TAB_ICONS: Record<keyof TabParamList, string> = {
  Today: '💊',
  AllCourses: '📋',
  Calendar: '📅',
  Settings: '⚙️',
};

const TAB_KEYS: Record<keyof TabParamList, string> = {
  Today: 'today',
  AllCourses: 'courses',
  Calendar: 'calendar',
  Settings: 'settings',
};

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const { scale } = useFontScale();
  const { t } = useTranslation();
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={{ backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border }}>
      <TouchableOpacity
        style={[s.scanBtn, { backgroundColor: colors.accent }]}
        onPress={() => rootNav.navigate('ScanCamera')}
        activeOpacity={0.85}
      >
        <Text style={[s.scanBtnText, { fontSize: baseSizes.button * scale }]}>
          {t('scan_btn')}
        </Text>
      </TouchableOpacity>

      <View style={[s.bar, { paddingBottom: Platform.OS === 'ios' ? 24 : 8 }]}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const label = t(TAB_KEYS[route.name as keyof TabParamList] as any);
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
      </View>
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
  scanBtn: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  scanBtnText: { color: '#fff', fontWeight: '700' },
  bar: {
    flexDirection: 'row',
    paddingTop: 4,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
});
