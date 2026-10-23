import Purchases, { LOG_LEVEL } from 'react-native-purchases';

// TODO: before shipping to real users, swap this for the real "appl_" public
// API key from RevenueCat (this "test_" key only works with RevenueCat's
// Test Store — no real money moves through it).
const REVENUECAT_API_KEY = 'test_bTlsDTgNueNEZYxKkDuhXKwbMUN';
export const PRO_ENTITLEMENT_ID = 'lumaid_pro';

let configured = false;

export function initPurchases() {
  if (configured) return;
  configured = true;
  Purchases.setLogLevel(LOG_LEVEL.WARN);
  Purchases.configure({ apiKey: REVENUECAT_API_KEY });
}

export async function loginPurchases(userId) {
  if (!userId) return;
  try {
    await Purchases.logIn(userId);
  } catch (err) {
    console.warn('[LUMAID] Purchases.logIn failed:', err.message);
  }
}

export async function logoutPurchases() {
  try {
    await Purchases.logOut();
  } catch (err) {
    console.warn('[LUMAID] Purchases.logOut failed:', err.message);
  }
}

export async function getCustomerInfo() {
  try {
    return await Purchases.getCustomerInfo();
  } catch (err) {
    console.warn('[LUMAID] getCustomerInfo failed:', err.message);
    return null;
  }
}

export function isProActive(customerInfo) {
  if (!customerInfo) return false;
  return !!customerInfo.entitlements.active[PRO_ENTITLEMENT_ID];
}

export async function isProUser() {
  const info = await getCustomerInfo();
  return isProActive(info);
}

export async function getOfferings() {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (err) {
    console.warn('[LUMAID] getOfferings failed:', err.message);
    return null;
  }
}

export async function purchasePackage(pkg) {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { success: true, customerInfo, isPro: isProActive(customerInfo) };
  } catch (err) {
    if (err.userCancelled) {
      return { success: false, cancelled: true };
    }
    console.warn('[LUMAID] purchasePackage failed:', err.message);
    return { success: false, error: err.message };
  }
}

export async function showManageSubscriptions() {
  try {
    await Purchases.showManageSubscriptions();
  } catch (err) {
    console.warn('[LUMAID] showManageSubscriptions failed:', err.message);
  }
}

export async function restorePurchases() {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return { success: true, customerInfo, isPro: isProActive(customerInfo) };
  } catch (err) {
    console.warn('[LUMAID] restorePurchases failed:', err.message);
    return { success: false, error: err.message };
  }
}
