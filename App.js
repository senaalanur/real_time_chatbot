import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';

import ChatScreen from './screens/ChatScreen';
import HomeScreen from './screens/HomeScreen';
import JournalScreen from './screens/JournalScreen';
import OnboardingScreen from './screens/OnboardingScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isOnboarded, setIsOnboarded] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('echo_user').then(val => {
      setIsOnboarded(!!val);
    });
  }, []);

  if (isOnboarded === null) return null;

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {!isOnboarded ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : null}
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="Journal" component={JournalScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}