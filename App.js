import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from './lib/supabase';

import AuthScreen from './screens/AuthScreen';
import CharacterBuilderScreen from './screens/CharacterBuilderScreen';
import CharactersScreen from './screens/CharactersScreen';
import ChatScreen from './screens/ChatScreen';
import HomeScreen from './screens/HomeScreen';
import JournalScreen from './screens/JournalScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import WeeklyRecapScreen from './screens/WeeklyRecapScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [session, setSession] = useState(null);
  const [isOnboarded, setIsOnboarded] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  useEffect(() => {
    if (session === null && loading) {
      setLoading(false);
      return;
    }
    if (session) {
      AsyncStorage.getItem('lumaid_user').then(val => {
        setIsOnboarded(!!val);
        setLoading(false);
      });
    }
  }, [session]);

  if (loading) return null;

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
          {!session ? (
            <Stack.Screen name="Auth" component={AuthScreen} />
          ) : !isOnboarded ? (
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          ) : null}
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="Journal" component={JournalScreen} />
          <Stack.Screen name="Characters" component={CharactersScreen} />
          <Stack.Screen name="CharacterBuilder" component={CharacterBuilderScreen} />
          <Stack.Screen name="WeeklyRecap" component={WeeklyRecapScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}