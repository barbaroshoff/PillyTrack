import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ScanCameraScreen from '../screens/scan/ScanCameraScreen';
import ScanConfirmScreen from '../screens/scan/ScanConfirmScreen';
import MedicationInfoScreen from '../screens/scan/MedicationInfoScreen';
import ScanScheduleScreen from '../screens/scan/ScanScheduleScreen';
import ScanSuccessScreen from '../screens/scan/ScanSuccessScreen';
import type { MedicationInfo } from '../services/medicationAI';

export type ScanFlowParamList = {
  ScanCamera: undefined;
  ScanConfirm: { barcode?: string } | undefined;
  MedicationInfo: { info: MedicationInfo; photoUri: string };
  ScanSchedule: undefined;
  ScanSuccess: undefined;
};

const Stack = createNativeStackNavigator<ScanFlowParamList>();

// Весь флоу сканирования показывается как ОДНО модальное окно (см. options={{ presentation: 'modal' }}
// на экране 'ScanFlow' в RootNavigator). Внутри — обычный push (card), чтобы шаги флоу не открывались
// каждый как новое модальное окно поверх предыдущего.
export default function ScanFlowNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ScanCamera" component={ScanCameraScreen} />
      <Stack.Screen name="ScanConfirm" component={ScanConfirmScreen} />
      <Stack.Screen name="MedicationInfo" component={MedicationInfoScreen} />
      <Stack.Screen name="ScanSchedule" component={ScanScheduleScreen} />
      <Stack.Screen name="ScanSuccess" component={ScanSuccessScreen} />
    </Stack.Navigator>
  );
}
