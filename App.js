import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from './lib/supabase';
import { registerForPushNotifications, scheduleDailyReminder } from './lib/notifications';

import AuthScreen from './screens/AuthScreen';
// import CharactersScreen from './screens/CharactersScreen';
import ChatScreen from './screens/ChatScreen';
import HomeScreen from './screens/HomeScreen';
import JournalScreen from './screens/JournalScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import ProfileScreen from './screens/ProfileScreen';
import SplashScreen from './screens/SplashScreen';
// V2 — hidden until ready


const Stack = createNativeStackNavigator();

export default function App() {
  const [session, setSession] = useState(null);
  const [isOnboarded, setIsOnboarded] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    registerForPushNotifications().then(status => {
      if (status === 'granted') scheduleDailyReminder(20, 0);
    });

    AsyncStorage.getItem('lumaid_guest').then(val => {
      if (val === 'true') setIsGuest(true);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setIsGuest(false);
        AsyncStorage.removeItem('lumaid_guest');
      }
    });
  }, []);

  useEffect(() => {
    if (session === null && !isGuest && loading) {
      setLoading(false);
      return;
    }
    if (session || isGuest) {
      AsyncStorage.getItem('lumaid_user').then(val => {
        setIsOnboarded(!!val);
        setLoading(false);
      });
    }
  }, [session, isGuest]);

  if (loading) return <SplashScreen />;

  const showAuth = !session && !isGuest;
  const showOnboarding = (session || isGuest) && !isOnboarded;

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
          {showAuth ? (
            <Stack.Screen name="Auth" component={AuthScreen} />
          ) : showOnboarding ? (
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          ) : null}
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="Journal" component={JournalScreen} />
          {/* V2 — uncomment when ready to launch these features */}
          {/* <Stack.Screen name="Characters" component={CharactersScreen} /> */}
          {/* <Stack.Screen name="CharacterBuilder" component={CharacterBuilderScreen} /> */}

          <Stack.Screen name="Profile" component={ProfileScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}