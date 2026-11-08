/**
 * Root App component — sets up navigation with bottom tabs.
 *
 * Tabs:
 *  1. Translate — main translation screen
 *  2. History   — past translations
 *  3. Settings  — API config and credentials
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, Platform } from 'react-native';

import TranslateScreen from './src/screens/TranslateScreen';
import HistoryScreen   from './src/screens/HistoryScreen';
import SettingsScreen  from './src/screens/SettingsScreen';
import { colors } from './src/theme';

const Tab = createBottomTabNavigator();

const tabIcon = (name: string) => ({ color }: { color: string }) => (
  <Text style={{ fontSize: 20, color }}>{name}</Text>
);

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" backgroundColor={colors.primary} />
        <Tab.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: '700', fontSize: 17 },
            tabBarActiveTintColor:   colors.primary,
            tabBarInactiveTintColor: colors.muted,
            tabBarStyle: {
              borderTopColor: '#e2e6ea',
              ...(Platform.OS === 'android' && { elevation: 8 }),
            },
          }}
        >
          <Tab.Screen
            name="Translate"
            component={TranslateScreen}
            options={{
              title: 'Darija Translator',
              tabBarLabel: 'Translate',
              tabBarIcon: tabIcon('🌍'),
            }}
          />
          <Tab.Screen
            name="History"
            component={HistoryScreen}
            options={{
              title: 'Translation History',
              tabBarLabel: 'History',
              tabBarIcon: tabIcon('📋'),
            }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              title: 'API Settings',
              tabBarLabel: 'Settings',
              tabBarIcon: tabIcon('⚙️'),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
