import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from './lib/supabase';
import { registerForPushNotifications, scheduleDailyReminder } from './lib/notifications';

import AuthScreen from './screens/AuthScreen';
import ChatScreen from './screens/ChatScreen';
import HomeScreen from './screens/HomeScreen';
import JournalScreen from './screens/JournalScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import ProfileScreen from './screens/ProfileScreen';
import SplashScreen from './screens/SplashScreen';
// V2 — uncomment when ready
// import CharacterBuilderScreen from './screens/CharacterBuilderScreen';
// import CharactersScreen from './screens/CharactersScreen';
// import WeeklyRecapScreen from './screens/WeeklyRecapScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [session, setSession] = useState(undefined);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    registerForPushNotifications().then(status => {
      console.log('[Notifications] Permission status:', status);
      if (status === 'granted') {
        scheduleDailyReminder(20, 0);
        console.log('[Notifications] Daily reminder scheduled for 8pm');
      } else {
        console.log('[Notifications] Permission not granted:', status);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === undefined) return;

    if (session === null) {
      setLoading(false);
      return;
    }

    AsyncStorage.getItem('lumaid_user').then(val => {
      setIsOnboarded(!!val);
      setLoading(false);
    });
  }, [session]);

  if (loading || session === undefined) return <SplashScreen />;

  // Determine initial route
  const initialRoute = session === null ? 'Auth' : !isOnboarded ? 'Onboarding' : 'Home';

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{ headerShown: false, animation: 'fade' }}
        >
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="Journal" component={JournalScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          {/* V2 — uncomment when ready */}
          {/* <Stack.Screen name="Characters" component={CharactersScreen} /> */}
          {/* <Stack.Screen name="CharacterBuilder" component={CharacterBuilderScreen} /> */}
          {/* <Stack.Screen name="WeeklyRecap" component={WeeklyRecapScreen} /> */}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}