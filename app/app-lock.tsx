import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Vibration, Platform, AppState, Switch, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../constants/theme';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

type LockMode = 'locked' | 'settings' | 'change-pin' | 'set-pin';

const PIN_LENGTH = 4;
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30000; // 30 seconds

const AUTO_LOCK_OPTIONS = [
  { label: 'Immediately', value: 0 },
  { label: 'After 1 minute', value: 60000 },
  { label: 'After 5 minutes', value: 300000 },
  { label: 'After 15 minutes', value: 900000 },
  { label: 'After 30 minutes', value: 1800000 },
];

export default function AppLockScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [mode, setMode] = useState<LockMode>('settings');
  const [pin, setPin] = useState('');
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [confirmPin, setConfirmPin] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [lockCountdown, setLockCountdown] = useState(0);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('Biometric');
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [autoLockTimer, setAutoLockTimer] = useState(0);
  const [lockEnabled, setLockEnabled] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const dotScaleAnims = useRef(Array.from({ length: PIN_LENGTH }, () => new Animated.Value(0))).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadLockSettings();
    checkBiometrics();
  }, []);

  useEffect(() => {
    if (lockedUntil) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, lockedUntil - Date.now());
        setLockCountdown(Math.ceil(remaining / 1000));
        if (remaining <= 0) {
          setLockedUntil(null);
          setAttempts(0);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockedUntil]);

  useEffect(() => {
    const currentLength = pin.length;
    if (currentLength > 0) {
      Animated.spring(dotScaleAnims[currentLength - 1], {
        toValue: 1,
        friction: 3,
        tension: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [pin]);

  const loadLockSettings = async () => {
    try {
      const savedPin = await AsyncStorage.getItem('kj_app_pin');
      const savedBiometric = await AsyncStorage.getItem('kj_biometric_enabled');
      const savedAutoLock = await AsyncStorage.getItem('kj_auto_lock_timer');
      const savedLockEnabled = await AsyncStorage.getItem('kj_lock_enabled');

      if (savedPin) setStoredPin(savedPin);
      if (savedBiometric) setBiometricEnabled(JSON.parse(savedBiometric));
      if (savedAutoLock) setAutoLockTimer(JSON.parse(savedAutoLock));
      if (savedLockEnabled) setLockEnabled(JSON.parse(savedLockEnabled));
    } catch (e) {
      // ignore
    }
  };

  const checkBiometrics = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(compatible && enrolled);

      if (compatible) {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('Face ID');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType('Fingerprint');
        }
      }
    } catch (e) {
      setBiometricAvailable(false);
    }
  };

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const resetDots = () => {
    dotScaleAnims.forEach(anim => anim.setValue(0));
  };

  const handlePinInput = useCallback((digit: string) => {
    if (lockedUntil) return;
    setError('');

    const newPin = pin + digit;
    setPin(newPin);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (newPin.length === PIN_LENGTH) {
      setTimeout(() => processPin(newPin), 200);
    }
  }, [pin, mode, isConfirming, storedPin, lockedUntil, confirmPin]);

  const processPin = (enteredPin: string) => {
    if (mode === 'locked') {
      if (enteredPin === storedPin) {
        // Unlock success
        setShowSuccess(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Animated.timing(successAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        setTimeout(() => {
          router.back();
        }, 500);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        if (newAttempts >= MAX_ATTEMPTS) {
          setLockedUntil(Date.now() + LOCKOUT_DURATION);
          setError(`Too many attempts. Locked for 30 seconds.`);
        } else {
          setError(`Wrong PIN. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`);
        }
        triggerShake();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Vibration.vibrate(200);
        setPin('');
        resetDots();
      }
    } else if (mode === 'set-pin' || mode === 'change-pin') {
      if (!isConfirming) {
        setConfirmPin(enteredPin);
        setIsConfirming(true);
        setPin('');
        resetDots();
      } else {
        if (enteredPin === confirmPin) {
          // Save PIN
          savePin(enteredPin);
        } else {
          setError('PINs do not match. Try again.');
          triggerShake();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setIsConfirming(false);
          setConfirmPin('');
          setPin('');
          resetDots();
        }
      }
    }
  };

  const savePin = async (newPin: string) => {
    try {
      await AsyncStorage.setItem('kj_app_pin', newPin);
      await AsyncStorage.setItem('kj_lock_enabled', 'true');
      setStoredPin(newPin);
      setLockEnabled(true);
      setShowSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.timing(successAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      setTimeout(() => {
        setShowSuccess(false);
        successAnim.setValue(0);
        setMode('settings');
        setPin('');
        setConfirmPin('');
        setIsConfirming(false);
        resetDots();
      }, 1200);
    } catch (e) {
      setError('Failed to save PIN');
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      const newPin = pin.slice(0, -1);
      dotScaleAnims[pin.length - 1].setValue(0);
      setPin(newPin);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleBiometric = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock KhataJi Pro',
        cancelLabel: 'Use PIN',
        disableDeviceFallback: true,
      });
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      }
    } catch (e) {
      // cancelled
    }
  };

  const toggleBiometric = async (value: boolean) => {
    if (value) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable biometric unlock',
        cancelLabel: 'Cancel',
      });
      if (result.success) {
        setBiometricEnabled(true);
        await AsyncStorage.setItem('kj_biometric_enabled', 'true');
      }
    } else {
      setBiometricEnabled(false);
      await AsyncStorage.setItem('kj_biometric_enabled', 'false');
    }
  };

  const toggleLock = async (value: boolean) => {
    if (value && !storedPin) {
      setMode('set-pin');
    } else {
      setLockEnabled(value);
      await AsyncStorage.setItem('kj_lock_enabled', JSON.stringify(value));
    }
  };

  const handleAutoLockChange = async (value: number) => {
    setAutoLockTimer(value);
    await AsyncStorage.setItem('kj_auto_lock_timer', JSON.stringify(value));
  };

  const handleRemovePin = async () => {
    await AsyncStorage.removeItem('kj_app_pin');
    await AsyncStorage.setItem('kj_lock_enabled', 'false');
    await AsyncStorage.setItem('kj_biometric_enabled', 'false');
    setStoredPin(null);
    setLockEnabled(false);
    setBiometricEnabled(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // PIN Entry UI
  const renderPinEntry = () => {
    let title = 'Enter PIN';
    let subtitle = 'Enter your 4-digit PIN to unlock';

    if (mode === 'set-pin') {
      title = isConfirming ? 'Confirm PIN' : 'Set New PIN';
      subtitle = isConfirming ? 'Re-enter your PIN to confirm' : 'Choose a 4-digit PIN';
    } else if (mode === 'change-pin') {
      title = isConfirming ? 'Confirm New PIN' : 'Enter New PIN';
      subtitle = isConfirming ? 'Re-enter to confirm' : 'Choose a new 4-digit PIN';
    }

    return (
      <SafeAreaView style={styles.lockContainer}>
        {/* Header with back button for set/change modes */}
        {mode !== 'locked' && (
          <Pressable style={styles.lockBackBtn} onPress={() => { setMode('settings'); setPin(''); setConfirmPin(''); setIsConfirming(false); resetDots(); }}>
            <MaterialIcons name="arrow-back" size={24} color="#FFF" />
          </Pressable>
        )}

        <View style={styles.lockContent}>
          {/* Lock Icon */}
          <View style={styles.lockIconContainer}>
            <MaterialIcons name="lock" size={32} color="#FFF" />
          </View>

          <Text style={styles.lockTitle}>{title}</Text>
          <Text style={styles.lockSubtitle}>{subtitle}</Text>

          {/* PIN Dots */}
          <Animated.View style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  pin.length > i ? styles.dotFilled : null,
                  { transform: [{ scale: pin.length > i ? dotScaleAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) : 1 }] },
                ]}
              />
            ))}
          </Animated.View>

          {/* Error message */}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Lockout timer */}
          {lockedUntil ? (
            <View style={styles.lockoutBadge}>
              <MaterialIcons name="timer" size={16} color="#FFF" />
              <Text style={styles.lockoutText}>Try again in {lockCountdown}s</Text>
            </View>
          ) : null}

          {/* Keypad */}
          <View style={styles.keypad}>
            {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['biometric', '0', 'delete']].map((row, ri) => (
              <View key={ri} style={styles.keypadRow}>
                {row.map((key) => {
                  if (key === 'biometric') {
                    if (mode === 'locked' && biometricEnabled && biometricAvailable) {
                      return (
                        <Pressable key={key} style={styles.keyBtn} onPress={handleBiometric}>
                          <MaterialIcons name={biometricType === 'Face ID' ? 'face' : 'fingerprint'} size={28} color="#FFF" />
                        </Pressable>
                      );
                    }
                    return <View key={key} style={styles.keyBtn} />;
                  }
                  if (key === 'delete') {
                    return (
                      <Pressable key={key} style={styles.keyBtn} onPress={handleDelete}>
                        <MaterialIcons name="backspace" size={24} color="#FFF" />
                      </Pressable>
                    );
                  }
                  return (
                    <Pressable
                      key={key}
                      style={({ pressed }) => [styles.keyBtn, styles.keyBtnNum, pressed && styles.keyBtnPressed]}
                      onPress={() => handlePinInput(key)}
                      disabled={!!lockedUntil}
                    >
                      <Text style={styles.keyBtnText}>{key}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        {/* Success Overlay */}
        {showSuccess && (
          <Animated.View style={[styles.successOverlay, { opacity: successAnim }]}>
            <View style={styles.successCircle}>
              <MaterialIcons name="check" size={48} color="#FFF" />
            </View>
            <Text style={styles.successText}>{mode === 'locked' ? 'Unlocked!' : 'PIN Saved!'}</Text>
          </Animated.View>
        )}
      </SafeAreaView>
    );
  };

  // Settings UI
  const renderSettings = () => (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={theme.textDark} />
        </Pressable>
        <Text style={styles.headerTitle}>App Lock</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        {/* Lock Toggle */}
        <View style={styles.settingCard}>
          <View style={styles.settingIconRow}>
            <View style={[styles.settingIcon, { backgroundColor: theme.primary + '20' }]}>
              <MaterialIcons name="lock" size={22} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>App Lock</Text>
              <Text style={styles.settingDesc}>Require PIN to open app</Text>
            </View>
            <Switch
              value={lockEnabled}
              onValueChange={toggleLock}
              trackColor={{ false: theme.border, true: theme.primaryLight }}
              thumbColor={lockEnabled ? theme.primary : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Biometric Toggle */}
        {biometricAvailable && (
          <View style={styles.settingCard}>
            <View style={styles.settingIconRow}>
              <View style={[styles.settingIcon, { backgroundColor: '#1565C0' + '20' }]}>
                <MaterialIcons name={biometricType === 'Face ID' ? 'face' : 'fingerprint'} size={22} color="#1565C0" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>{biometricType}</Text>
                <Text style={styles.settingDesc}>Use {biometricType.toLowerCase()} to unlock</Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={toggleBiometric}
                trackColor={{ false: theme.border, true: '#90CAF9' }}
                thumbColor={biometricEnabled ? '#1565C0' : '#f4f3f4'}
                disabled={!lockEnabled}
              />
            </View>
          </View>
        )}

        {/* Auto Lock Timer */}
        <View style={styles.settingCard}>
          <View style={styles.settingIconRow}>
            <View style={[styles.settingIcon, { backgroundColor: '#6A1B9A' + '20' }]}>
              <MaterialIcons name="timer" size={22} color="#6A1B9A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Auto-Lock Timer</Text>
              <Text style={styles.settingDesc}>Lock app after inactivity</Text>
            </View>
          </View>
          <View style={styles.timerOptions}>
            {AUTO_LOCK_OPTIONS.map(option => (
              <Pressable
                key={option.value}
                style={[styles.timerOption, autoLockTimer === option.value && styles.timerOptionActive]}
                onPress={() => handleAutoLockChange(option.value)}
              >
                <View style={[styles.radioOuter, autoLockTimer === option.value && styles.radioOuterActive]}>
                  {autoLockTimer === option.value && <View style={styles.radioInner} />}
                </View>
                <Text style={[styles.timerOptionText, autoLockTimer === option.value && styles.timerOptionTextActive]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Change PIN */}
        {storedPin && (
          <View style={styles.settingCard}>
            <Pressable style={styles.settingIconRow} onPress={() => { setMode('change-pin'); setPin(''); setConfirmPin(''); setIsConfirming(false); resetDots(); }}>
              <View style={[styles.settingIcon, { backgroundColor: '#E65100' + '20' }]}>
                <MaterialIcons name="vpn-key" size={22} color="#E65100" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>Change PIN</Text>
                <Text style={styles.settingDesc}>Set a new 4-digit PIN</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={theme.textMuted} />
            </Pressable>
          </View>
        )}

        {/* Remove PIN */}
        {storedPin && (
          <View style={[styles.settingCard, { borderColor: theme.credit + '40' }]}>
            <Pressable style={styles.settingIconRow} onPress={handleRemovePin}>
              <View style={[styles.settingIcon, { backgroundColor: theme.credit + '20' }]}>
                <MaterialIcons name="delete-outline" size={22} color={theme.credit} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingLabel, { color: theme.credit }]}>Remove PIN</Text>
                <Text style={styles.settingDesc}>Disable app lock completely</Text>
              </View>
            </Pressable>
          </View>
        )}

        {/* Security Info */}
        <View style={styles.infoCard}>
          <MaterialIcons name="info-outline" size={20} color={theme.primary} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.infoTitle}>Security Info</Text>
            <Text style={styles.infoText}>
              {"\u2022"} PIN is stored securely on device{"\n"}
              {"\u2022"} 5 wrong attempts locks for 30 seconds{"\n"}
              {"\u2022"} Biometric adds extra convenience{"\n"}
              {"\u2022"} Auto-lock activates after set time
            </Text>
          </View>
        </View>

        {/* Test Lock Button */}
        {storedPin && (
          <Pressable style={styles.testBtn} onPress={() => { setMode('locked'); setPin(''); resetDots(); setAttempts(0); setLockedUntil(null); setError(''); }}>
            <MaterialIcons name="screen-lock-portrait" size={20} color="#FFF" />
            <Text style={styles.testBtnText}>Test Lock Screen</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );

  // Decide which UI to show
  if (mode === 'locked' || mode === 'set-pin' || mode === 'change-pin') {
    return renderPinEntry();
  }
  return renderSettings();
}

const styles = StyleSheet.create({
  // Settings Styles
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.borderLight },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },
  settingCard: { backgroundColor: theme.surface, borderRadius: theme.borderRadius.md, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.borderLight, ...theme.cardShadow },
  settingIconRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { fontSize: 15, fontWeight: '600', color: theme.textDark },
  settingDesc: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
  timerOptions: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.borderLight },
  timerOption: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  timerOptionActive: {},
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' },
  radioOuterActive: { borderColor: theme.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.primary },
  timerOptionText: { fontSize: 14, color: theme.textSecondary },
  timerOptionTextActive: { color: theme.primary, fontWeight: '600' },
  infoCard: { flexDirection: 'row', backgroundColor: theme.backgroundSecondary, borderRadius: theme.borderRadius.md, padding: 16, marginTop: 8, borderWidth: 1, borderColor: theme.primary + '30' },
  infoTitle: { fontSize: 14, fontWeight: '700', color: theme.primary },
  infoText: { fontSize: 12, color: theme.textSecondary, marginTop: 4, lineHeight: 20 },
  testBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.primary, paddingVertical: 16, borderRadius: theme.borderRadius.md, marginTop: 20 },
  testBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  // Lock Screen Styles
  lockContainer: { flex: 1, backgroundColor: '#1B4332', justifyContent: 'center' },
  lockBackBtn: { position: 'absolute', top: 60, left: 16, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  lockContent: { alignItems: 'center', paddingHorizontal: 24 },
  lockIconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  lockTitle: { fontSize: 22, fontWeight: '700', color: '#FFF' },
  lockSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 6 },
  dotsRow: { flexDirection: 'row', gap: 20, marginTop: 32, marginBottom: 16 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  dotFilled: { backgroundColor: '#FFF', borderColor: '#FFF' },
  errorText: { fontSize: 13, color: '#EF5350', marginTop: 8, fontWeight: '500' },
  lockoutBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(229,57,53,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 12 },
  lockoutText: { color: '#EF5350', fontSize: 13, fontWeight: '600' },
  keypad: { marginTop: 32, width: '100%', maxWidth: 300 },
  keypadRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  keyBtn: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  keyBtnNum: { backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  keyBtnPressed: { backgroundColor: 'rgba(255,255,255,0.25)', transform: [{ scale: 0.95 }] },
  keyBtnText: { fontSize: 28, fontWeight: '600', color: '#FFF' },
  successOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,104,55,0.95)', justifyContent: 'center', alignItems: 'center' },
  successCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.payment, alignItems: 'center', justifyContent: 'center' },
  successText: { fontSize: 20, fontWeight: '700', color: '#FFF', marginTop: 16 },
});
