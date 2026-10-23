import { Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { useFonts } from 'expo-font';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { COLORS } from '../constants';
import { getOfferings, purchasePackage, restorePurchases } from '../lib/purchases';

const FEATURES = [
  'Unlimited daily messages',
  'Voice responses from your companion',
  'Weekly emotional recap',
  'Custom reminder times',
];

export default function PaywallScreen({ navigation }) {
  const [fontsLoaded] = useFonts({ PlayfairDisplay_700Bold, Lato_400Regular, Lato_700Bold });
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState([]);
  const [purchasingId, setPurchasingId] = useState(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => { loadOfferings(); }, []);

  const loadOfferings = async () => {
    setLoading(true);
    const offering = await getOfferings();
    setPackages(offering?.availablePackages ?? []);
    setLoading(false);
  };

  const handlePurchase = async (pkg) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPurchasingId(pkg.identifier);
    const result = await purchasePackage(pkg);
    setPurchasingId(null);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Welcome to Lumaid Pro', 'Your subscription is active. Enjoy unlimited chats and more.');
      navigation.goBack();
    } else if (!result.cancelled) {
      Alert.alert('Purchase failed', result.error || 'Something went wrong. Please try again.');
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    const result = await restorePurchases();
    setRestoring(false);

    if (result.success && result.isPro) {
      Alert.alert('Restored', 'Your Pro subscription has been restored.');
      navigation.goBack();
    } else if (result.success) {
      Alert.alert("No subscription found", "We couldn't find an active Pro subscription for this account.");
    } else {
      Alert.alert('Restore failed', result.error || 'Something went wrong. Please try again.');
    }
  };

  if (!fontsLoaded) return null;

  const monthly = packages.find(p => p.packageType === 'MONTHLY');
  const yearly  = packages.find(p => p.packageType === 'ANNUAL');

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>

        <Text style={styles.eyebrow}>✦ LUMAID PRO</Text>
        <Text style={styles.title}>Unlock the full experience</Text>
        <Text style={styles.subtitle}>Unlimited chats, voice replies, and your weekly emotional recap.</Text>

        <View style={styles.featureList}>
          {FEATURES.map((f) => (
            <View key={f} style={styles.featureRow}>
              <Text style={styles.featureCheck}>✓</Text>
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.accentDark} style={{ marginTop: 32 }} />
        ) : packages.length === 0 ? (
          <Text style={styles.emptyText}>Plans aren't available right now. Please try again later.</Text>
        ) : (
          <View style={styles.plans}>
            {yearly && (
              <TouchableOpacity
                style={[styles.planCard, styles.planCardFeatured]}
                onPress={() => handlePurchase(yearly)}
                disabled={purchasingId !== null}
              >
                <View style={styles.bestValueBadge}>
                  <Text style={styles.bestValueText}>BEST VALUE</Text>
                </View>
                <Text style={styles.planTitle}>Yearly</Text>
                <Text style={styles.planPrice}>
                  {yearly.product.priceString}<Text style={styles.planPeriod}>/year</Text>
                </Text>
                {purchasingId === yearly.identifier
                  ? <ActivityIndicator color={COLORS.text} />
                  : <Text style={styles.planCta}>Start Yearly</Text>}
              </TouchableOpacity>
            )}

            {monthly && (
              <TouchableOpacity
                style={styles.planCard}
                onPress={() => handlePurchase(monthly)}
                disabled={purchasingId !== null}
              >
                <Text style={styles.planTitle}>Monthly</Text>
                <Text style={styles.planPrice}>
                  {monthly.product.priceString}<Text style={styles.planPeriod}>/month</Text>
                </Text>
                {purchasingId === monthly.identifier
                  ? <ActivityIndicator color={COLORS.textSoft} />
                  : <Text style={styles.planCtaSecondary}>Start Monthly</Text>}
              </TouchableOpacity>
            )}
          </View>
        )}

        <TouchableOpacity onPress={handleRestore} disabled={restoring} style={styles.restoreBtn}>
          {restoring
            ? <ActivityIndicator color={COLORS.muted} size="small" />
            : <Text style={styles.restoreText}>Restore Purchases</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 24, paddingTop: 60, paddingBottom: 48 },
  closeBtn: {
    position: 'absolute', top: 8, right: 0, width: 36, height: 36,
    borderRadius: 18, backgroundColor: COLORS.surface,
    alignItems: 'center', justifyContent: 'center', zIndex: 10,
  },
  closeBtnText: { fontFamily: 'Lato_700Bold', fontSize: 16, color: COLORS.textSoft },
  eyebrow: {
    fontFamily: 'Lato_700Bold', fontSize: 12, letterSpacing: 1.5,
    color: COLORS.accentDark, marginBottom: 8,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold', fontSize: 28, color: COLORS.text,
    marginBottom: 10, lineHeight: 34,
  },
  subtitle: {
    fontFamily: 'Lato_400Regular', fontSize: 15, color: COLORS.textSoft,
    marginBottom: 28, lineHeight: 21,
  },
  featureList: { marginBottom: 32 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  featureCheck: { fontFamily: 'Lato_700Bold', fontSize: 15, color: COLORS.accentDark, width: 24 },
  featureText: { fontFamily: 'Lato_400Regular', fontSize: 15, color: COLORS.text, flex: 1 },
  emptyText: {
    fontFamily: 'Lato_400Regular', fontSize: 14, color: COLORS.textSoft,
    textAlign: 'center', marginTop: 32,
  },
  plans: { gap: 14, marginBottom: 20 },
  planCard: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 18,
    padding: 20, backgroundColor: COLORS.bgCard,
  },
  planCardFeatured: {
    borderColor: COLORS.accentDark, borderWidth: 2, backgroundColor: COLORS.accentSoft,
  },
  bestValueBadge: {
    position: 'absolute', top: -10, right: 16, backgroundColor: COLORS.accentDark,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  bestValueText: { fontFamily: 'Lato_700Bold', fontSize: 10, color: COLORS.white, letterSpacing: 0.5 },
  planTitle: { fontFamily: 'Lato_700Bold', fontSize: 16, color: COLORS.text, marginBottom: 6 },
  planPrice: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 26, color: COLORS.text, marginBottom: 14 },
  planPeriod: { fontFamily: 'Lato_400Regular', fontSize: 14, color: COLORS.textSoft },
  planCta: {
    fontFamily: 'Lato_700Bold', fontSize: 15, color: COLORS.text, textAlign: 'center',
    backgroundColor: COLORS.accentDark, paddingVertical: 12, borderRadius: 12, overflow: 'hidden',
  },
  planCtaSecondary: {
    fontFamily: 'Lato_700Bold', fontSize: 15, color: COLORS.textSoft, textAlign: 'center',
    borderWidth: 1, borderColor: COLORS.border, paddingVertical: 12, borderRadius: 12, overflow: 'hidden',
  },
  restoreBtn: { alignItems: 'center', paddingVertical: 12 },
  restoreText: { fontFamily: 'Lato_400Regular', fontSize: 13, color: COLORS.muted, textDecorationLine: 'underline' },
});
