import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Animated, Platform, TextInput, Easing } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import { useAlert } from '@/template';
import * as Haptics from 'expo-haptics';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

interface ParsedCommand {
  type: 'credit' | 'debit' | 'query_balance' | 'query_summary' | 'query_rate' | 'add_customer' | 'reminder';
  name?: string;
  amount?: number;
  customer?: any;
  item?: string;
  action: string;
  actionUr: string;
  raw: string;
}

interface VoiceHistoryItem {
  id: string;
  text: string;
  status: 'success' | 'failed';
  time: string;
  result?: string;
}

export default function VoiceEntryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { customers, addTransaction, formatCurrency, getTodayStats, t, language, isRTL, itemRates } = useApp();
  const { showAlert } = useAlert();

  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [parsed, setParsed] = useState<ParsedCommand | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [history, setHistory] = useState<VoiceHistoryItem[]>([]);
  const [showTextMode, setShowTextMode] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [recognitionAvailable, setRecognitionAvailable] = useState(true);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;
  const wave1 = useRef(new Animated.Value(0.4)).current;
  const wave2 = useRef(new Animated.Value(0.6)).current;
  const wave3 = useRef(new Animated.Value(0.8)).current;
  const wave4 = useRef(new Animated.Value(0.5)).current;
  const wave5 = useRef(new Animated.Value(0.7)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  const stateColors = {
    idle: { bg: theme.primary, ring: 'rgba(13,124,74,0.25)', label: theme.primary },
    listening: { bg: '#2563EB', ring: 'rgba(37,99,235,0.3)', label: '#2563EB' },
    processing: { bg: '#F59E0B', ring: 'rgba(245,158,11,0.3)', label: '#D97706' },
    speaking: { bg: theme.payment, ring: 'rgba(22,163,74,0.3)', label: theme.payment },
    error: { bg: theme.credit, ring: 'rgba(220,38,38,0.3)', label: theme.credit },
  };

  // ===== Speech Recognition Permissions =====
  useEffect(() => {
    (async () => {
      try {
        const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (result.granted) {
          setPermissionStatus('granted');
        } else {
          setPermissionStatus('denied');
        }
      } catch (err) {
        // Module not available (e.g., older devices, unsupported web browsers)
        setRecognitionAvailable(false);
        setPermissionStatus('denied');
      }
    })();

    return () => {
      // Stop any ongoing recognition on unmount
      try {
        ExpoSpeechRecognitionModule.stop();
      } catch {}
    };
  }, []);

  // ===== Live Speech Recognition Events =====
  useSpeechRecognitionEvent('start', () => {
    setVoiceState('listening');
    setTranscript('');
    setInterimTranscript('');
  });

  useSpeechRecognitionEvent('end', () => {
    // If recognition ended without final result, return to idle
    setVoiceState((prev) => (prev === 'listening' ? 'idle' : prev));
  });

  useSpeechRecognitionEvent('result', (event: any) => {
    const result = event.results?.[0];
    if (!result) return;

    const text = result.transcript || '';
    const isFinal = event.isFinal === true;

    if (isFinal) {
      setInterimTranscript('');
      setTranscript(text);
      // Stop recognition and process final result
      try {
        ExpoSpeechRecognitionModule.stop();
      } catch {}
      processCommand(text);
    } else {
      // Live interim transcription
      setInterimTranscript(text);
    }
  });

  useSpeechRecognitionEvent('error', (event: any) => {
    setVoiceState('error');
    setInterimTranscript('');
    const code = event.error || 'unknown';
    const msg = code === 'not-allowed'
      ? (language === 'ur' ? 'مائیکروفون کی اجازت درکار ہے' : 'Microphone permission required')
      : code === 'no-speech'
      ? (language === 'ur' ? 'کچھ سنائی نہیں دیا' : 'No speech detected')
      : code === 'network'
      ? (language === 'ur' ? 'انٹرنیٹ کنکشن ضروری' : 'Network connection needed')
      : (language === 'ur' ? 'سپیچ ریکگنیشن ناکام' : 'Speech recognition failed');
    showAlert(t.error, msg);
    setTimeout(() => setVoiceState('idle'), 2000);
  });

  // ===== State-driven animations =====
  useEffect(() => {
    pulseAnim.stopAnimation();
    ringAnim.stopAnimation();
    spinAnim.stopAnimation();

    if (voiceState === 'listening') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.12, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        ])
      ).start();
      Animated.loop(
        Animated.timing(ringAnim, { toValue: 1, duration: 1500, useNativeDriver: true, easing: Easing.out(Easing.ease) })
      ).start();
      animateWaves();
    } else if (voiceState === 'speaking') {
      animateWaves();
    } else if (voiceState === 'processing') {
      Animated.loop(
        Animated.timing(spinAnim, { toValue: 1, duration: 1000, useNativeDriver: true, easing: Easing.linear })
      ).start();
    } else {
      pulseAnim.setValue(1);
      ringAnim.setValue(0);
      spinAnim.setValue(0);
    }
  }, [voiceState]);

  const animateWaves = () => {
    [wave1, wave2, wave3, wave4, wave5].forEach((wave, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(wave, { toValue: 0.3 + Math.random() * 0.7, duration: 300 + i * 50, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(wave, { toValue: 0.4 + Math.random() * 0.6, duration: 300 + i * 50, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        ])
      ).start();
    });
  };

  // Suggested commands (Urdu + English)
  const suggestedCommands = language === 'ur' ? [
    { text: 'اسد کو 500 ادھار دو', icon: 'north-east', color: theme.credit },
    { text: 'راشد سے 1000 واپس لو', icon: 'south-west', color: theme.payment },
    { text: 'آج کا حساب دکھاؤ', icon: 'assessment', color: theme.primary },
    { text: 'چینی کا ریٹ کیا ہے', icon: 'sell', color: '#D97706' },
    { text: 'نیا گاہک بناؤ', icon: 'person-add', color: '#2563EB' },
    { text: 'عمران کو یاد دہانی بھیجیں', icon: 'notifications-active', color: '#7C3AED' },
  ] : [
    { text: 'Asad ko 500 udhaar do', icon: 'north-east', color: theme.credit },
    { text: 'Rashid se 1000 wapas lo', icon: 'south-west', color: theme.payment },
    { text: 'Aaj ka hisaab dikhao', icon: 'assessment', color: theme.primary },
    { text: 'Cheeni ka rate kya hai', icon: 'sell', color: '#D97706' },
    { text: 'Naya customer banao', icon: 'person-add', color: '#2563EB' },
    { text: 'Imran ko reminder bhejen', icon: 'notifications-active', color: '#7C3AED' },
  ];

  // ===== NLP Parser =====
  const parseCommand = useCallback((rawText: string): ParsedCommand | null => {
    const text = rawText.toLowerCase().trim();
    const original = rawText.trim();

    const findCustomer = (name: string) => {
      const n = name.toLowerCase().trim();
      return customers.find(c =>
        c.name.toLowerCase().includes(n) || n.includes(c.name.toLowerCase().split(' ')[0])
      );
    };

    const extractAmount = (s: string): number | null => {
      const urduToEng: Record<string, string> = { '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9' };
      const normalized = s.replace(/[۰-۹]/g, d => urduToEng[d] || d);
      const match = normalized.match(/(\d+)/);
      return match ? parseInt(match[1]) : null;
    };

    // CREDIT patterns
    const creditPatterns = [
      /^(.+?)\s+(?:ko|کو)\s+([\d۰-۹]+).*?(?:udhaar|ادھار|credit)/i,
      /(?:credit|udhaar|ادھار).*?(.+?)\s+(?:to|کو|ko)\s*([\d۰-۹]+)/i,
      /^(.+?)\s+([\d۰-۹]+)\s+(?:udhaar|ادھار|credit)/i,
    ];
    for (const p of creditPatterns) {
      const m = original.match(p);
      if (m) {
        const name = m[1].trim();
        const amount = extractAmount(m[2]);
        if (amount && amount > 0) {
          return {
            type: 'credit',
            name,
            amount,
            customer: findCustomer(name),
            action: `Give Rs. ${amount} credit to ${name}`,
            actionUr: `${name} کو ${amount} روپے ادھار دیں`,
            raw: original,
          };
        }
      }
    }

    // DEBIT patterns
    const debitPatterns = [
      /^(.+?)\s+(?:se|سے)\s+([\d۰-۹]+).*?(?:wapas|واپس|payment|ادائیگی)/i,
      /(?:payment|wapas|واپس).*?(.+?)\s+(?:se|سے)\s*([\d۰-۹]+)/i,
      /^(.+?)\s+([\d۰-۹]+)\s+(?:wapas|واپس|paid)/i,
      /received\s+([\d۰-۹]+)\s+from\s+(.+)/i,
    ];
    for (const p of debitPatterns) {
      const m = original.match(p);
      if (m) {
        let name = m[1].trim();
        let amountStr = m[2];
        if (p.source.includes('received')) {
          name = m[2].trim();
          amountStr = m[1];
        }
        const amount = extractAmount(amountStr);
        if (amount && amount > 0) {
          return {
            type: 'debit',
            name,
            amount,
            customer: findCustomer(name),
            action: `Received Rs. ${amount} from ${name}`,
            actionUr: `${name} سے ${amount} روپے وصول`,
            raw: original,
          };
        }
      }
    }

    // Balance Query
    if (/(?:balance|بقایا|hisaab|حساب).*?(.+)|(.+)\s+(?:ka|کا)\s+(?:balance|بقایا|hisaab|حساب)/i.test(original)) {
      const m = original.match(/(.+?)\s+(?:ka|کا)\s+(?:balance|بقایا|hisaab|حساب)/i);
      const name = m ? m[1].trim() : '';
      return {
        type: 'query_balance',
        name,
        customer: findCustomer(name),
        action: `Check balance of ${name}`,
        actionUr: `${name} کا بقایا چیک کریں`,
        raw: original,
      };
    }

    // Today's Summary
    if (/(?:aaj|آج|today).*?(?:hisaab|حساب|summary|سار)/i.test(text) || /summary|sara hisaab/i.test(text)) {
      return {
        type: 'query_summary',
        action: "Show today's summary",
        actionUr: 'آج کا حساب دکھائیں',
        raw: original,
      };
    }

    // Rate Query
    const rateMatch = original.match(/(.+?)\s+(?:ka|کا)\s+(?:rate|ریٹ|price|قیمت)/i);
    if (rateMatch) {
      const item = rateMatch[1].trim();
      return {
        type: 'query_rate',
        item,
        action: `Check rate of ${item}`,
        actionUr: `${item} کا ریٹ`,
        raw: original,
      };
    }

    // New Customer
    if (/(?:naya|نیا|new)\s+(?:customer|گاہک)/i.test(text)) {
      return {
        type: 'add_customer',
        action: 'Add new customer',
        actionUr: 'نیا گاہک شامل کریں',
        raw: original,
      };
    }

    // Reminder
    const remMatch = original.match(/(.+?)\s+(?:ko|کو)\s+(?:reminder|یاد دہانی)/i);
    if (remMatch) {
      const name = remMatch[1].trim();
      return {
        type: 'reminder',
        name,
        customer: findCustomer(name),
        action: `Send reminder to ${name}`,
        actionUr: `${name} کو یاد دہانی`,
        raw: original,
      };
    }

    return null;
  }, [customers]);

  // ===== Real Speech Recognition Start/Stop =====
  const startRecognition = useCallback(async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }

    if (!recognitionAvailable) {
      setShowTextMode(true);
      showAlert(
        t.error,
        language === 'ur'
          ? 'سپیچ ریکگنیشن دستیاب نہیں۔ ٹیکسٹ موڈ استعمال کریں۔'
          : 'Speech recognition unavailable. Use text mode instead.'
      );
      return;
    }

    if (permissionStatus === 'denied') {
      try {
        const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (!result.granted) {
          showAlert(
            t.error,
            language === 'ur'
              ? 'مائیکروفون کی اجازت درکار ہے۔ سیٹنگز سے دیں۔'
              : 'Microphone permission required. Please enable in settings.'
          );
          return;
        }
        setPermissionStatus('granted');
      } catch {
        setShowTextMode(true);
        return;
      }
    }

    try {
      // Pick locale based on app language
      const lang = language === 'ur' ? 'ur-PK' : 'en-US';
      ExpoSpeechRecognitionModule.start({
        lang,
        interimResults: true,
        maxAlternatives: 1,
        continuous: false,
        requiresOnDeviceRecognition: false,
        addsPunctuation: true,
        contextualStrings: customers.slice(0, 50).map(c => c.name),
      });
    } catch (err: any) {
      setVoiceState('error');
      showAlert(t.error, err?.message || (language === 'ur' ? 'شروع نہیں ہو سکا' : 'Could not start'));
      setTimeout(() => setVoiceState('idle'), 2000);
    }
  }, [language, permissionStatus, recognitionAvailable, customers, t, showAlert]);

  const stopRecognition = useCallback(() => {
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {}
    setVoiceState('idle');
  }, []);

  const handleMicPress = () => {
    if (voiceState === 'idle' || voiceState === 'error') {
      startRecognition();
    } else if (voiceState === 'listening') {
      stopRecognition();
    }
  };

  const processCommand = (command: string) => {
    setTranscript(command);
    setVoiceState('processing');

    setTimeout(() => {
      const result = parseCommand(command);
      if (result) {
        setParsed(result);
        setShowConfirm(true);
        setVoiceState('speaking');
        setTimeout(() => setVoiceState('idle'), 1500);
      } else {
        setVoiceState('error');
        addToHistory(command, 'failed', language === 'ur' ? 'سمجھ نہیں آیا' : 'Not understood');
        setTimeout(() => setVoiceState('idle'), 2000);
      }
    }, 800);
  };

  const handleChipPress = (cmd: string) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {});
    }
    processCommand(cmd);
  };

  const handleTextSubmit = () => {
    if (!textInput.trim()) return;
    processCommand(textInput.trim());
    setTextInput('');
  };

  const addToHistory = (text: string, status: 'success' | 'failed', result?: string) => {
    const item: VoiceHistoryItem = {
      id: Date.now().toString(),
      text,
      status,
      time: new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }),
      result,
    };
    setHistory(prev => [item, ...prev].slice(0, 10));
  };

  const handleConfirm = () => {
    if (!parsed) return;

    let resultText = '';

    if (parsed.type === 'credit' && parsed.customer && parsed.amount) {
      addTransaction({
        customerId: parsed.customer.id,
        customerName: parsed.customer.name,
        type: 'credit',
        amount: parsed.amount,
        note: `Voice: ${parsed.raw}`,
        date: new Date().toISOString().split('T')[0],
      });
      resultText = language === 'ur'
        ? `${formatCurrency(parsed.amount)} ادھار محفوظ ہو گیا`
        : `${formatCurrency(parsed.amount)} credit added`;
      addToHistory(parsed.raw, 'success', resultText);
      showAlert(language === 'ur' ? 'کامیاب' : 'Success', resultText);
    } else if (parsed.type === 'debit' && parsed.customer && parsed.amount) {
      addTransaction({
        customerId: parsed.customer.id,
        customerName: parsed.customer.name,
        type: 'debit',
        amount: parsed.amount,
        note: `Voice: ${parsed.raw}`,
        paymentMethod: 'cash',
        date: new Date().toISOString().split('T')[0],
      });
      resultText = language === 'ur'
        ? `${formatCurrency(parsed.amount)} ادائیگی موصول`
        : `${formatCurrency(parsed.amount)} payment received`;
      addToHistory(parsed.raw, 'success', resultText);
      showAlert(language === 'ur' ? 'کامیاب' : 'Success', resultText);
    } else if (parsed.type === 'query_balance' && parsed.customer) {
      resultText = `${parsed.customer.name}: ${formatCurrency(parsed.customer.balance)}`;
      addToHistory(parsed.raw, 'success', resultText);
      showAlert(language === 'ur' ? 'بقایا' : 'Balance', resultText);
    } else if (parsed.type === 'query_summary') {
      const stats = getTodayStats();
      resultText = language === 'ur'
        ? `ادھار: ${formatCurrency(stats.todayCredit)}\nوصولی: ${formatCurrency(stats.todayCollection)}\nبقایا: ${formatCurrency(stats.outstanding)}`
        : `Credit: ${formatCurrency(stats.todayCredit)}\nCollection: ${formatCurrency(stats.todayCollection)}\nOutstanding: ${formatCurrency(stats.outstanding)}`;
      addToHistory(parsed.raw, 'success', language === 'ur' ? 'حساب دکھایا گیا' : 'Summary shown');
      showAlert(language === 'ur' ? 'آج کا حساب' : "Today's Summary", resultText);
    } else if (parsed.type === 'query_rate' && parsed.item) {
      const rate = itemRates.find(r => r.name.toLowerCase().includes(parsed.item!.toLowerCase()));
      resultText = rate
        ? `${rate.name}: ${formatCurrency(rate.rate)} / ${rate.unit}`
        : language === 'ur' ? 'ریٹ نہیں ملا' : 'Rate not found';
      addToHistory(parsed.raw, rate ? 'success' : 'failed', resultText);
      showAlert(language === 'ur' ? 'ریٹ' : 'Rate', resultText);
    } else if (parsed.type === 'add_customer') {
      addToHistory(parsed.raw, 'success', language === 'ur' ? 'نیا گاہک' : 'Add customer');
      router.push('/add-customer');
    } else if (parsed.type === 'reminder' && parsed.customer) {
      resultText = language === 'ur'
        ? `${parsed.customer.name} کو یاد دہانی بھیج دی گئی`
        : `Reminder sent to ${parsed.customer.name}`;
      addToHistory(parsed.raw, 'success', resultText);
      showAlert(language === 'ur' ? 'بھیج دی' : 'Sent', resultText);
    } else {
      resultText = language === 'ur' ? 'گاہک نہیں ملا' : 'Customer not found';
      addToHistory(parsed.raw, 'failed', resultText);
      showAlert(language === 'ur' ? 'خرابی' : 'Error', resultText);
    }

    setShowConfirm(false);
    setParsed(null);
    setTranscript('');
    setInterimTranscript('');
    setVoiceState('idle');
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setParsed(null);
    setTranscript('');
    setInterimTranscript('');
    setVoiceState('idle');
  };

  const colors = stateColors[voiceState];
  const stateLabel = {
    idle: t.voiceIdle,
    listening: t.voiceListen,
    processing: t.voiceProcess,
    speaking: t.voiceSpeak,
    error: t.voiceError,
  }[voiceState];

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const ringScale = ringAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] });
  const ringOpacity = ringAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  // Display transcript: prefer final, fall back to interim while listening
  const displayTranscript = transcript || interimTranscript;

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <View style={[styles.header, isRTL && styles.rtlRow]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <MaterialIcons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color={theme.textDark} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, isRTL && styles.rtlText]}>{t.voiceEntry}</Text>
          <Text style={[styles.headerSubtitle, isRTL && styles.rtlText]}>
            {language === 'ur' ? `براہ راست ${language === 'ur' ? 'ur-PK' : 'en-US'}` : `Live ${language === 'ur' ? 'ur-PK' : 'en-US'}`}
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.modeBtn, pressed && { opacity: 0.7 }]}
          onPress={() => setShowTextMode(!showTextMode)}
        >
          <MaterialIcons name={showTextMode ? 'mic' : 'keyboard'} size={20} color={theme.primary} />
        </Pressable>
      </View>

      {/* Permission Banner */}
      {permissionStatus === 'denied' && recognitionAvailable ? (
        <View style={styles.permBanner}>
          <MaterialIcons name="mic-off" size={16} color="#B45309" />
          <Text style={[styles.permBannerText, isRTL && styles.rtlText]}>
            {language === 'ur'
              ? 'مائیکروفون کی اجازت ضروری ہے'
              : 'Microphone permission required for voice input'}
          </Text>
          <Pressable
            onPress={async () => {
              const r = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
              setPermissionStatus(r.granted ? 'granted' : 'denied');
            }}
            style={styles.permBannerBtn}
          >
            <Text style={styles.permBannerBtnText}>
              {language === 'ur' ? 'اجازت دیں' : 'Allow'}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {!recognitionAvailable ? (
        <View style={[styles.permBanner, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}>
          <MaterialIcons name="error-outline" size={16} color="#B91C1C" />
          <Text style={[styles.permBannerText, { color: '#991B1B' }, isRTL && styles.rtlText]}>
            {language === 'ur'
              ? 'سپیچ ریکگنیشن اس ڈیوائس پر دستیاب نہیں'
              : 'Speech recognition not available — use text mode'}
          </Text>
        </View>
      ) : null}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Voice Visualizer Area */}
        <View style={styles.visualizerArea}>
          <View style={styles.ringContainer}>
            <Animated.View
              style={[
                styles.outerRing,
                {
                  backgroundColor: colors.ring,
                  transform: [{ scale: ringScale }],
                  opacity: voiceState === 'listening' ? ringOpacity : voiceState === 'idle' ? 0.4 : 0.6,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.middleRing,
                {
                  backgroundColor: colors.ring,
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            />

            <Pressable onPress={handleMicPress} disabled={voiceState === 'processing'}>
              <Animated.View
                style={[
                  styles.micButton,
                  { backgroundColor: colors.bg },
                  voiceState === 'processing' && { transform: [{ rotate: spin }] },
                ]}
              >
                <MaterialIcons
                  name={
                    voiceState === 'idle' ? 'mic' :
                    voiceState === 'listening' ? 'graphic-eq' :
                    voiceState === 'processing' ? 'autorenew' :
                    voiceState === 'speaking' ? 'volume-up' :
                    'error-outline'
                  }
                  size={36}
                  color="#FFF"
                />
              </Animated.View>
            </Pressable>
          </View>

          <Text style={[styles.statusText, { color: colors.label }]}>{stateLabel}</Text>

          {/* Locale badge */}
          <View style={styles.localeBadge}>
            <MaterialIcons name="language" size={12} color={theme.textMuted} />
            <Text style={styles.localeText}>{language === 'ur' ? 'ur-PK' : 'en-US'}</Text>
          </View>

          {/* Waveform */}
          {(voiceState === 'listening' || voiceState === 'speaking') && (
            <View style={styles.waveform}>
              {[wave1, wave2, wave3, wave4, wave5].map((w, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.waveBar,
                    {
                      backgroundColor: colors.bg,
                      transform: [{ scaleY: w }],
                    },
                  ]}
                />
              ))}
            </View>
          )}

          {/* Live transcript display */}
          {displayTranscript ? (
            <View style={[
              styles.transcriptBubble,
              !!interimTranscript && !transcript && styles.transcriptBubbleInterim,
            ]}>
              <MaterialIcons name="format-quote" size={14} color={theme.textMuted} />
              <Text style={[
                styles.transcriptText,
                !!interimTranscript && !transcript && styles.transcriptTextInterim,
                isRTL && styles.rtlText,
              ]}>
                {displayTranscript}
                {!!interimTranscript && !transcript && voiceState === 'listening' ? (
                  <Text style={styles.cursorBlink}>|</Text>
                ) : null}
              </Text>
            </View>
          ) : voiceState === 'listening' ? (
            <View style={styles.transcriptBubble}>
              <MaterialIcons name="mic" size={14} color="#2563EB" />
              <Text style={[styles.transcriptHint, isRTL && styles.rtlText]}>
                {language === 'ur' ? 'بولیں...' : 'Speak now...'}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Text Input Mode */}
        {showTextMode ? (
          <View style={styles.textInputCard}>
            <Text style={[styles.textInputLabel, isRTL && styles.rtlText]}>
              {language === 'ur' ? 'کمانڈ ٹائپ کریں' : 'Type your command'}
            </Text>
            <View style={styles.textInputWrap}>
              <TextInput
                style={[styles.textInput, isRTL && { textAlign: 'right', writingDirection: 'rtl' }]}
                value={textInput}
                onChangeText={setTextInput}
                placeholder={language === 'ur' ? 'مثال: اسد کو 500 ادھار دو' : 'e.g., Asad ko 500 udhaar do'}
                placeholderTextColor={theme.textMuted}
                onSubmitEditing={handleTextSubmit}
                returnKeyType="send"
              />
              <Pressable
                style={({ pressed }) => [styles.sendBtn, pressed && { opacity: 0.8 }]}
                onPress={handleTextSubmit}
              >
                <MaterialIcons name="send" size={18} color="#FFF" />
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* Suggested Commands */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, isRTL && styles.rtlRow]}>
            <MaterialIcons name="auto-awesome" size={18} color={theme.primary} />
            <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>{t.suggestedCommands}</Text>
          </View>
          <View style={styles.chipGrid}>
            {suggestedCommands.map((cmd, i) => (
              <Pressable
                key={i}
                style={({ pressed }) => [
                  styles.chipCard,
                  pressed && { transform: [{ scale: 0.97 }], opacity: 0.85 },
                ]}
                onPress={() => handleChipPress(cmd.text)}
              >
                <View style={[styles.chipIcon, { backgroundColor: cmd.color + '15' }]}>
                  <MaterialIcons name={cmd.icon as any} size={16} color={cmd.color} />
                </View>
                <Text
                  style={[styles.chipText, isRTL && styles.rtlText]}
                  numberOfLines={2}
                >
                  {cmd.text}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Voice History */}
        {history.length > 0 ? (
          <View style={styles.section}>
            <View style={[styles.sectionHeader, isRTL && styles.rtlRow]}>
              <MaterialIcons name="history" size={18} color={theme.textSecondary} />
              <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>{t.voiceHistory}</Text>
            </View>
            <View style={styles.historyList}>
              {history.map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.historyItem}
                  onPress={() => item.status === 'failed' && processCommand(item.text)}
                >
                  <View
                    style={[
                      styles.historyIcon,
                      { backgroundColor: item.status === 'success' ? theme.paymentLight : theme.creditLight },
                    ]}
                  >
                    <MaterialIcons
                      name={item.status === 'success' ? 'check' : 'close'}
                      size={14}
                      color={item.status === 'success' ? theme.payment : theme.credit}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.historyText, isRTL && styles.rtlText]} numberOfLines={1}>{item.text}</Text>
                    {item.result ? (
                      <Text style={[styles.historyResult, isRTL && styles.rtlText]} numberOfLines={1}>{item.result}</Text>
                    ) : null}
                  </View>
                  <Text style={styles.historyTime}>{item.time}</Text>
                  {item.status === 'failed' ? (
                    <MaterialIcons name="refresh" size={16} color={theme.textMuted} />
                  ) : null}
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {/* Tips */}
        <View style={styles.tipsCard}>
          <LinearGradient colors={['#FEF3C7', '#FDE68A']} style={styles.tipsGradient}>
            <MaterialIcons name="lightbulb" size={20} color="#B45309" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.tipsTitle, isRTL && styles.rtlText]}>
                {language === 'ur' ? 'تجاویز' : 'Tips'}
              </Text>
              <Text style={[styles.tipsText, isRTL && styles.rtlText]}>
                {language === 'ur'
                  ? 'گاہک کا نام صاف بولیں پھر رقم۔ لائیو ٹرانسکرپشن چالو ہے۔ اردو، انگریزی اور رومن اردو سب کام کرتے ہیں۔'
                  : 'Speak customer name clearly followed by amount. Live transcription enabled. Works in Urdu, English & Roman Urdu.'}
              </Text>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      {showConfirm && parsed ? (
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmModal}>
            <LinearGradient colors={[theme.primary, '#065F37']} style={styles.confirmHeader}>
              <View style={styles.confirmIconWrap}>
                <MaterialIcons name="record-voice-over" size={32} color="#FFF" />
              </View>
              <Text style={styles.confirmHeaderTitle}>
                {language === 'ur' ? 'کیا یہ ٹھیک ہے؟' : 'Is this correct?'}
              </Text>
            </LinearGradient>

            <View style={styles.confirmBody}>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>{t.action}:</Text>
                <Text style={styles.confirmValue}>{language === 'ur' ? parsed.actionUr : parsed.action}</Text>
              </View>

              {parsed.customer ? (
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>{t.customer}:</Text>
                  <View style={styles.confirmCustomer}>
                    <View style={styles.confirmAvatar}>
                      <Text style={styles.confirmAvatarText}>
                        {parsed.customer.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.confirmCustomerName}>{parsed.customer.name}</Text>
                      <Text style={styles.confirmCustomerBalance}>
                        {language === 'ur' ? 'بقایا:' : 'Balance:'} {formatCurrency(parsed.customer.balance)}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : null}

              {parsed.amount ? (
                <View style={styles.confirmAmountRow}>
                  <Text style={styles.confirmAmountLabel}>{t.amount}</Text>
                  <Text
                    style={[
                      styles.confirmAmountValue,
                      { color: parsed.type === 'credit' ? theme.credit : theme.payment },
                    ]}
                  >
                    {parsed.type === 'credit' ? '+' : '-'}{formatCurrency(parsed.amount)}
                  </Text>
                </View>
              ) : null}

              {!parsed.customer && (parsed.type === 'credit' || parsed.type === 'debit' || parsed.type === 'query_balance' || parsed.type === 'reminder') ? (
                <View style={styles.confirmWarning}>
                  <MaterialIcons name="warning-amber" size={18} color="#D97706" />
                  <Text style={styles.confirmWarningText}>
                    {language === 'ur'
                      ? `گاہک "${parsed.name}" نہیں ملا`
                      : `Customer "${parsed.name}" not found`}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.confirmActions}>
              <Pressable style={styles.confirmCancelBtn} onPress={handleCancel}>
                <MaterialIcons name="close" size={18} color={theme.credit} />
                <Text style={styles.confirmCancelText}>{t.cancel}</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.confirmOkBtn,
                  !parsed.customer && (parsed.type === 'credit' || parsed.type === 'debit' || parsed.type === 'reminder') && styles.confirmOkBtnDisabled,
                ]}
                onPress={handleConfirm}
                disabled={!parsed.customer && (parsed.type === 'credit' || parsed.type === 'debit' || parsed.type === 'reminder')}
              >
                <MaterialIcons name="check" size={18} color="#FFF" />
                <Text style={styles.confirmOkText}>{t.confirm}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  rtlRow: { flexDirection: 'row-reverse' },
  rtlText: { writingDirection: 'rtl', textAlign: 'right' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: theme.textDark },
  headerSubtitle: { fontSize: 11, color: theme.textMuted, marginTop: 2 },
  modeBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: theme.backgroundSecondary,
    alignItems: 'center', justifyContent: 'center',
  },

  // Permission banner
  permBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  permBannerText: { flex: 1, fontSize: 12, color: '#92400E', fontWeight: '600' },
  permBannerBtn: {
    backgroundColor: '#92400E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  permBannerBtnText: { fontSize: 11, fontWeight: '700', color: '#FFF' },

  // Visualizer
  visualizerArea: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
  },
  ringContainer: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  middleRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  micButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 12 },
      android: { elevation: 8 },
      default: {},
    }),
  },
  statusText: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 24,
    letterSpacing: -0.2,
  },
  localeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  localeText: { fontSize: 10, fontWeight: '700', color: theme.textMuted, letterSpacing: 0.5 },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    marginTop: 14,
  },
  waveBar: {
    width: 5,
    height: 30,
    borderRadius: 3,
  },
  transcriptBubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderRadius: 14,
    maxWidth: '90%',
    borderWidth: 1,
    borderColor: theme.borderLight,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 2 },
      default: {},
    }),
  },
  transcriptBubbleInterim: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  transcriptText: {
    flex: 1,
    fontSize: 14,
    color: theme.textDark,
    fontWeight: '500',
    lineHeight: 21,
  },
  transcriptTextInterim: {
    color: '#1E40AF',
    fontStyle: 'italic',
  },
  transcriptHint: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '600',
  },
  cursorBlink: {
    color: '#2563EB',
    fontWeight: '300',
  },

  // Text mode
  textInputCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  textInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
    marginBottom: 8,
  },
  textInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: theme.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: theme.textDark,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sections
  section: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.textDark,
  },

  // Chips
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chipCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.borderLight,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6 },
      android: { elevation: 1 },
      default: {},
    }),
  },
  chipIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: theme.textDark,
  },

  // History
  historyList: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.borderLight,
    overflow: 'hidden',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  historyIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textDark,
  },
  historyResult: {
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 2,
  },
  historyTime: {
    fontSize: 10,
    color: theme.textMuted,
    fontWeight: '500',
  },

  // Tips
  tipsCard: {
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  tipsGradient: {
    flexDirection: 'row',
    padding: 14,
    alignItems: 'flex-start',
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  tipsText: {
    fontSize: 12,
    color: '#78350F',
    marginTop: 4,
    lineHeight: 17,
  },

  // Confirm Modal
  confirmOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confirmModal: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFF',
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.3, shadowRadius: 24 },
      android: { elevation: 16 },
      default: {},
    }),
  },
  confirmHeader: {
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: 'center',
  },
  confirmIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    marginTop: 12,
    letterSpacing: -0.2,
  },
  confirmBody: {
    padding: 20,
  },
  confirmRow: {
    marginBottom: 16,
  },
  confirmLabel: {
    fontSize: 11,
    color: theme.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  confirmValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textDark,
  },
  confirmCustomer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  confirmAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.primary,
  },
  confirmCustomerName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.textDark,
  },
  confirmCustomerBalance: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 2,
  },
  confirmAmountRow: {
    backgroundColor: theme.background,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  confirmAmountLabel: {
    fontSize: 13,
    color: theme.textSecondary,
    fontWeight: '600',
  },
  confirmAmountValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  confirmWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  confirmWarningText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
  },
  confirmActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  confirmCancelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: theme.creditLight,
  },
  confirmCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.credit,
  },
  confirmOkBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: theme.primary,
  },
  confirmOkBtnDisabled: {
    backgroundColor: theme.textMuted,
    opacity: 0.6,
  },
  confirmOkText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
});
