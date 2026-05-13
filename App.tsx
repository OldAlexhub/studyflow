import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootStackParamList } from './src/types/study';
import HomeScreen from './src/screens/HomeScreen';
import PlanPreviewScreen from './src/screens/PlanPreviewScreen';
import PreStudyScreen from './src/screens/PreStudyScreen';
import SessionScreen from './src/screens/SessionScreen';
import CompleteScreen from './src/screens/CompleteScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="PlanPreview" component={PlanPreviewScreen} />
          <Stack.Screen name="PreStudy" component={PreStudyScreen} />
          <Stack.Screen name="Session" component={SessionScreen} />
          <Stack.Screen name="Complete" component={CompleteScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
