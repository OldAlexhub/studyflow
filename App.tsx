import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import mobileAds from 'react-native-google-mobile-ads';
import { RootStackParamList } from './src/types/study';
import HomeScreen from './src/screens/HomeScreen';
import PlanPreviewScreen from './src/screens/PlanPreviewScreen';
import PreStudyScreen from './src/screens/PreStudyScreen';
import SessionScreen from './src/screens/SessionScreen';
import CompleteScreen from './src/screens/CompleteScreen';
import ReportScreen from './src/screens/ReportScreen';
import { colors } from './src/constants/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function StudyStack() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="PlanPreview" component={PlanPreviewScreen} />
      <Stack.Screen name="PreStudy" component={PreStudyScreen} />
      <Stack.Screen name="Session" component={SessionScreen} />
      <Stack.Screen name="Complete" component={CompleteScreen} />
    </Stack.Navigator>
  );
}

function TabIcon({
  name,
  focused,
}: {
  name: 'study' | 'report';
  focused: boolean;
}) {
  const icons = { study: '🎯', report: '📊' };
  return (
    <Text style={[styles.tabIcon, !focused && styles.tabIconInactive]}>
      {icons[name]}
    </Text>
  );
}

export default function App() {
  useEffect(() => {
    mobileAds().initialize();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: styles.tabBar,
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textMuted,
            tabBarLabelStyle: styles.tabLabel,
          }}>
          <Tab.Screen
            name="StudyTab"
            component={StudyStack}
            options={{
              tabBarLabel: 'Study',
              tabBarIcon: ({ focused }) => (
                <TabIcon name="study" focused={focused} />
              ),
            }}
          />
          <Tab.Screen
            name="ReportTab"
            component={ReportScreen}
            options={{
              tabBarLabel: 'Report',
              tabBarIcon: ({ focused }) => (
                <TabIcon name="report" focused={focused} />
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 62,
    paddingBottom: 8,
    paddingTop: 6,
    elevation: 8,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: -2,
  },
  tabIcon: {
    fontSize: 22,
  },
  tabIconInactive: {
    opacity: 0.45,
  },
});
