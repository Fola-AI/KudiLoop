/**
 * Alert Gate - Prevents iOS crashes from early alert dialogs
 * 
 * iOS can crash if Alert.alert() is called before the root view controller
 * is fully ready. This utility queues alerts until the app signals readiness.
 * 
 * Error: "COSMCtrl applyPolicyDelta unexpected absence of policy on appRecord"
 * Error: "Restricted because there's no presenter that can handle this alert item"
 */

import { Alert, Platform, InteractionManager, AlertButton, AlertOptions, AppState } from 'react-native';

let isAppReady = false;
let pendingAlerts: Array<() => void> = [];

// Track app state to avoid showing alerts when app is in background
let isAppActive = AppState.currentState === 'active';

// Listen for app state changes
AppState.addEventListener('change', (nextAppState) => {
  isAppActive = nextAppState === 'active';
  
  // Process pending alerts when app becomes active and ready
  if (isAppActive && isAppReady && pendingAlerts.length > 0) {
    processPendingAlerts();
  }
});

const processPendingAlerts = () => {
  const alertsToProcess = [...pendingAlerts];
  pendingAlerts = [];
  
  alertsToProcess.forEach((showAlert, index) => {
    setTimeout(() => {
      InteractionManager.runAfterInteractions(showAlert);
    }, index * 150); // Stagger alerts by 150ms for safety
  });
};

/**
 * Call this after the app is fully mounted and ready to show alerts.
 * Should be called ~3 seconds after app launch on iOS.
 */
export const setAppReady = () => {
  if (isAppReady) return;
  
  isAppReady = true;
  
  if (__DEV__) {
    console.log(`✅ Alert gate opened - ${pendingAlerts.length} pending alerts`);
  }
  
  // Process pending alerts only if app is active
  if (isAppActive && pendingAlerts.length > 0) {
    processPendingAlerts();
  }
};

/**
 * Check if the app is ready for alerts
 */
export const isAlertReady = () => isAppReady && isAppActive;

/**
 * Safe replacement for Alert.alert that queues alerts on iOS until ready
 */
export const safeAlert = (
  title: string,
  message?: string,
  buttons?: AlertButton[],
  options?: AlertOptions
) => {
  const showAlert = () => {
    // Double-check app is active before showing
    if (AppState.currentState !== 'active') {
      pendingAlerts.push(showAlert);
      return;
    }
    Alert.alert(title, message, buttons, options);
  };

  // On Android, show immediately but still wrap in InteractionManager
  if (Platform.OS !== 'ios') {
    InteractionManager.runAfterInteractions(showAlert);
    return;
  }

  // On iOS, check if ready and active
  if (isAppReady && isAppActive) {
    // Still wrap in InteractionManager for safety
    InteractionManager.runAfterInteractions(showAlert);
  } else {
    // Queue the alert for later
    if (__DEV__) {
      console.log(`⏳ Queuing alert: "${title}"`);
    }
    pendingAlerts.push(showAlert);
  }
};

/**
 * Reset the gate (for testing or hot reload)
 */
export const resetAlertGate = () => {
  isAppReady = false;
  pendingAlerts = [];
};

