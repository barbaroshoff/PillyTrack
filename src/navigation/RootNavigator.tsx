import React from 'react';
import { NavigationContainer, type NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import PaywallScreen from '../screens/PaywallScreen';
import ScanFlowNavigator, { type ScanFlowParamList } from './ScanFlowNavigator';
import RenewCourseScreen from '../screens/RenewCourseScreen';
import MedicationDetailsScreen from '../screens/MedicationDetailsScreen';
import ShareScreen from '../screens/ShareScreen';
import ViewSharedScreen from '../screens/ViewSharedScreen';

export type RootStackParamList = {
  Tabs: undefined;
  Paywall: undefined;
  ScanFlow: NavigatorScreenParams<ScanFlowParamList> | undefined;
  RenewCourse: { medicationId: string; courseId?: string };
  MedicationDetails: { medicationId: string };
  Share: undefined;
  ViewShared: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen name="Paywall" component={PaywallScreen} />
        <Stack.Screen name="ScanFlow" component={ScanFlowNavigator} />
        <Stack.Screen name="RenewCourse" component={RenewCourseScreen} />
        <Stack.Screen name="MedicationDetails" component={MedicationDetailsScreen} />
        <Stack.Screen name="Share" component={ShareScreen} />
        <Stack.Screen name="ViewShared" component={ViewSharedScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
