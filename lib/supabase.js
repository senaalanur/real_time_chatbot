import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://upzxgchvbeqbpzdtlglu.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Keep false for React Native — URL detection is handled manually
    // in App.js via Linking.getInitialURL() and Linking.addEventListener()
    detectSessionInUrl: false,
    // Required for OTP email confirmation and password recovery flows
    flowType: 'pkce',
  },
});