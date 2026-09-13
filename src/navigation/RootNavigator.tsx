import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import ScanCameraScreen from '../screens/scan/ScanCameraScreen';
import ScanConfirmScreen from '../screens/scan/ScanConfirmScreen';
import ScanScheduleScreen from '../screens/scan/ScanScheduleScreen';
import ScanSuccessScreen from '../screens/scan/ScanSuccessScreen';
import MedicationInfoScreen from '../screens/scan/MedicationInfoScreen';
import RenewCourseScreen from '../screens/RenewCourseScreen';
import MedicationDetailsScreen from '../screens/MedicationDetailsScreen';
import type { MedicationInfo } from '../services/medicationAI';

export type RootStackParamList = {
  Tabs: undefined;
  ScanCamera: undefined;
  ScanConfirm: { barcode?: string };
  MedicationInfo: { info: MedicationInfo; photoUri: string };
  ScanSchedule: undefined;
  ScanSuccess: undefined;
  RenewCourse: { medicationId: string; courseId?: string };
  MedicationDetails: { medicationId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Group screenOptions={{ presentation: 'modal' }}>
          <Stack.Screen name="ScanCamera" component={ScanCameraScreen} />
          <Stack.Screen name="ScanConfirm" component={ScanConfirmScreen} />
          <Stack.Screen name="MedicationInfo" component={MedicationInfoScreen} />
          <Stack.Screen name="ScanSchedule" component={ScanScheduleScreen} />
          <Stack.Screen name="ScanSuccess" component={ScanSuccessScreen} />
        </Stack.Group>
        <Stack.Screen name="RenewCourse" component={RenewCourseScreen} />
        <Stack.Screen name="MedicationDetails" component={MedicationDetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
