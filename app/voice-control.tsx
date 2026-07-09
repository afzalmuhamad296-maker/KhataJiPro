import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  Animated, Platform, TextInput, Easing, Switch,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import { useAlert } from '@/template';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

type VoiceState = 'idle' | 'listening' | 'processing' | 'executing' | 'error';

interface Command {
  id: string;
  text: string;
  action: string;
  status: 'success' | 'failed';
  time: string;
}

interface Intent {
  type: string;
  route?: string;
  label?: string;
  labelUr?: string;
  customer?: any;
  amount?: number;
  item?: string;
  message: string;
  messageUr: string;
  needsConfirm?: boolean;
  raw: string;
}

const NAV_ROUTES = [
  { keys: ['dashboard', 'home', 'ڈیش بورڈ', 'ہوم'], route: '/(tabs)/', label: 'Dashboard', labelUr: 'ڈیش بورڈ' },
  { keys: ['customers', 'customer list', 'گاہک'], route: '/(tabs)/customers', label: 'Customers', labelUr: 'گاہک' },
  { keys: ['udhaar', 'ادھار', 'ledger', 'transactions'], route: '/(tabs)/udhaar', label: 'Udhaar', labelUr: 'ادھار' },
  { keys: ['reports', 'report', 'رپورٹ'], route: '/(tabs)/reports', label: 'Reports', labelUr: 'رپورٹس' },
  { keys: ['settings', 'setting', 'سیٹنگ'], route: '/(tabs)/settings', label: 'Settings', labelUr: 'سیٹنگز' },
  { keys: ['rate book', 'rates', 'ریٹ بک', 'stock', 'سٹاک'], route: '/stock', label: 'Rate Book', labelUr: 'ریٹ بک' },
  { keys: ['ai assistant', 'chat', 'assistant', 'اسسٹنٹ', 'چیٹ'], route: '/chat-assistant', label: 'AI Assistant', labelUr: 'اے آئی' },
  { keys: ['insights', 'بصیرت', 'analytics'], route: '/insights', label: 'Insights', labelUr: 'بصیرت' },
  { keys: ['qr scanner', 'qr', 'scan'], route: '/qr-scanner', label: 'QR Scanner', labelUr: 'کیو آر' },
  { keys: ['invoice', 'انوائس', 'bill'], route: '/invoice', label: 'Invoice', labelUr: 'انوائس' },
  { keys: ['reminders', 'reminder', 'یاد دہانی'], route: '/reminders', label: 'Reminders', labelUr: 'یاد دہانی' },
  { keys: ['expenses', 'expense', 'اخراجات'], route: '/expense-tracker', label: 'Expenses', labelUr: 'اخراجات' },
  { keys: ['plans', 'pricing', 'پلان', 'pro'], route: '/plans', label: 'Plans', labelUr: 'پلانز' },
  { keys: ['voice entry', 'آواز اندراج'], route: '/voice-entry', label: 'Voice Entry', labelUr: 'آواز اندراج' },
  { keys: ['pay link', 'payment link'], route: '/pay-link', label: 'Payment Link', labelUr: 'پیمنٹ لنک' },
  { keys: ['bulk sms', 'sms', 'ایس ایم ایس'], route: '/bulk-sms', label: 'Bulk SMS', labelUr: 'بلک ایس ایم ایس' },
  { keys: ['add customer', 'new customer', 'نیا گاہک'], route: '/add-customer', label: 'Add Customer', labelUr: 'نیا گاہک' },
  { keys: ['add credit', 'new credit'], route: '/add-credit', label: 'Add Credit', labelUr: 'ادھار شامل' },
  { keys: ['add payment', 'new payment'], route: '/add-payment', label: 'Add Payment', labelUr: 'ادائیگی' },
  { keys: ['suppliers', 'سپلائر'], route: '/suppliers', label: 'Suppliers', labelUr: 'سپلائرز' },
];

export default function VoiceControlScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { customers, addTransaction, formatCurrency, getTodayStats, itemRates, language, isRTL, t } = useApp();
  const { showAlert } = useAlert();

  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [alwaysOn, setAlwaysOn] = useState(false);
  const [speakResponses, setSpeakResponses] = useState(true);
  const [history, setHistory] = useState<Command[]>([]);
  const [showTextMode, setShowTextMode] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [recognitionAvailable, setRecognitionAvailable] = useState(true);
  const [pendingIntent, setPendingIntent] = useState<Intent | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const alwaysOnRef = useRef(alwaysOn);
  useEffect(() => { alwaysOnRef.current = alwaysOn; }, [alwaysOn]);

  useEffect(() => {
    (async () => {
      try {
        const r = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        setPermissionStatus(r.granted ? 'granted' : 'denied');
      } catch {
        setRecognitionAvailable(false);
        setPermissionStatus('denied');
      }
    })();
    return () => {
      try { ExpoSpeechRecognitionModule.stop(); Speech.stop(); } catch {}
    };
  }, []);

  useSpeechRecognitionEvent('start', () => {
    setVoiceState('listening');
    setTranscript('');
    setInterimTranscript('');
  });

  useSpeechRecognitionEvent('end', () => {
    setVoiceState((s) => (s === 'listening' ? 'idle' : s));
  });

  useSpeechRecognitionEvent('result', (event: any) => {
    const result = event.results?.[0];
    if (!result) return;
    const text = result.transcript || '';
    if (event.isFinal) {
      setInterimTranscript('');
      setTranscript(text);
      try { ExpoSpeechRecognitionModule.stop(); } catch {}
      if (text.trim()) processCommand(text);
    } else {
      setInterimTranscript(text);
    }
  });

  useSpeechRecognitionEvent('error', (event: any) => {
    setVoiceState('error');
    setInterimTranscript('');
    const code = event.error || 'unknown';
    if (code !== 'no-speech' && code !== 'aborted') {
      showAlert(
        t.error,
        code === 'not-allowed'
          ? (language === 'ur' ? 'مائیک اجازت درکار' : 'Microphone permission required')
          : (language === 'ur' ? 'آواز نہیں سنی' : 'Recognition failed')
      );
    }
    setTimeout(() => setVoiceState('idle'), 1500);
  });

  useEffect(() => {
    pulseAnim.stopAnimation();
    ringAnim.stopAnimation();
    spinAnim.stopAnimation();

    if (voiceState === 'listening') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        ])
      ).start();
      Animated.loop(
        Animated.timing(ringAnim, { toValue: 1, duration: 1600, useNativeDriver: true, easing: Easing.out(Easing.ease) })
      ).start();
    } else if (voiceState === 'processing' || voiceState === 'executing') {
      Animated.loop(
        Animated.timing(spinAnim, { toValue: 1, duration: 1000, useNativeDriver: true, easing: Easing.linear })
      ).start();
    } else {
      pulseAnim.setValue(1);
      ringAnim.setValue(0);
      spinAnim.setValue(0);
    }
  }, [voiceState]);

  const parseIntent = useCallback((raw: string): Intent => {
    const text = raw.toLowerCase().trim();
    const urduToEng: Record<string, string> = { '۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9' };
    const normalize = (s: string) => s.replace(/[۰-۹]/g, d => urduToEng[d] || d);
    const extractAmount = (s: string) => {
      const m = normalize(s).match(/(\d+)/);
      return m ? parseInt(m[1]) : null;
    };
    const findCustomer = (name: string) => {
      const n = name.toLowerCase().trim();
      return customers.find(c => c.name.toLowerCase().includes(n) || n.includes(c.name.toLowerCase().split(' ')[0]));
    };

    // Back / Close
    if (/^(?:back|go back|واپس|پیچھے)$/i.test(text)) {
      return { type: 'back', message: 'Going back', messageUr: 'واپس جا رہا ہوں', raw };
    }

    // NAVIGATION with trigger word
    const navTrigger = /^(?:go to|open|show|dikhao|kholo|chalo|جاؤ|کھولو|دکھاؤ|چلو)\s+(.+)$/i;
    const navMatch = text.match(navTrigger);
    if (navMatch) {
      const target = navMatch[1].trim();
      for (const nav of NAV_ROUTES) {
        if (nav.keys.some(k => target.includes(k.toLowerCase()))) {
          return {
            type: 'navigate', route: nav.route,
            label: nav.label, labelUr: nav.labelUr,
            message: `Opening ${nav.label}`,
            messageUr: `${nav.labelUr} کھول رہا ہوں`, raw,
          };
        }
      }
    }
    // Direct name match
    for (const nav of NAV_ROUTES) {
      if (nav.keys.some(k => text === k.toLowerCase() || text === k.toLowerCase() + '?' )) {
        return {
          type: 'navigate', route: nav.route,
          label: nav.label, labelUr: nav.labelUr,
          message: `Opening ${nav.label}`,
          messageUr: `${nav.labelUr} کھول رہا ہوں`, raw,
        };
      }
    }

    // CREDIT
    const creditPatterns = [
      /^(.+?)\s+(?:ko|کو)\s+([\d۰-۹]+).*?(?:udhaar|ادھار|credit)/i,
      /^(.+?)\s+([\d۰-۹]+)\s+(?:udhaar|ادھار|credit)/i,
    ];
    for (const p of creditPatterns) {
      const m = raw.match(p);
      if (m) {
        const name = m[1].trim();
        const amount = extractAmount(m[2]);
        if (amount && amount > 0) {
          return {
            type: 'credit', customer: findCustomer(name), amount,
            message: `Give Rs. ${amount} credit to ${name}`,
            messageUr: `${name} کو ${amount} روپے ادھار`,
            needsConfirm: true, raw,
          };
        }
      }
    }

    // DEBIT
    const debitPatterns = [
      /^(.+?)\s+(?:se|سے)\s+([\d۰-۹]+).*?(?:wapas|واپس|payment|ادائیگی)/i,
      /^(.+?)\s+([\d۰-۹]+)\s+(?:wapas|واپس|paid)/i,
    ];
    for (const p of debitPatterns) {
      const m = raw.match(p);
      if (m) {
        const name = m[1].trim();
        const amount = extractAmount(m[2]);
        if (amount && amount > 0) {
          return {
            type: 'debit', customer: findCustomer(name), amount,
            message: `Received Rs. ${amount} from ${name}`,
            messageUr: `${name} سے ${amount} روپے وصول`,
            needsConfirm: true, raw,
          };
        }
      }
    }

    // QUERIES
    if (/(?:today|aaj|آج).*(?:summary|hisaab|حساب)/i.test(text) || /^(?:summary|hisaab)$/i.test(text)) {
      const stats = getTodayStats();
      const msg = language === 'ur'
        ? `آج ادھار: ${formatCurrency(stats.todayCredit)}۔ وصولی: ${formatCurrency(stats.todayCollection)}۔ کل بقایا: ${formatCurrency(stats.outstanding)}`
        : `Today credit ${formatCurrency(stats.todayCredit)}, collection ${formatCurrency(stats.todayCollection)}, outstanding ${formatCurrency(stats.outstanding)}`;
      return { type: 'query_summary', message: msg, messageUr: msg, raw };
    }
    if (/top\s*(?:5|five|defaulter)/i.test(text) || /ٹاپ.*بقایا/i.test(text)) {
      const top5 = [...customers].sort((a, b) => b.balance - a.balance).slice(0, 5);
      const list = top5.map((c, i) => `${i + 1}. ${c.name}: ${formatCurrency(c.balance)}`).join('. ');
      return { type: 'query_defaulters', message: `Top 5 outstanding. ${list}`, messageUr: `ٹاپ 5 بقایا۔ ${list}`, raw };
    }
    const balMatch = raw.match(/(.+?)\s+(?:ka|کا)\s+(?:balance|بقایا|hisaab|حساب)/i);
    if (balMatch) {
      const name = balMatch[1].trim();
      const c = findCustomer(name);
      if (c) return {
        type: 'query_balance', customer: c,
        message: `${c.name} balance ${formatCurrency(c.balance)}`,
        messageUr: `${c.name} کا بقایا ${formatCurrency(c.balance)}`, raw,
      };
    }
    const rateMatch = raw.match(/(.+?)\s+(?:ka|کا)\s+(?:rate|ریٹ|price|قیمت)/i);
    if (rateMatch) {
      const item = rateMatch[1].trim();
      const rate = itemRates.find(r => r.name.toLowerCase().includes(item.toLowerCase()));
      if (rate) return {
        type: 'query_rate', item,
        message: `${rate.name} ${formatCurrency(rate.rate)} per ${rate.unit}`,
        messageUr: `${rate.name} ${formatCurrency(rate.rate)} فی ${rate.unit}`, raw,
      };
    }

    return { type: 'unknown', message: 'Command not understood', messageUr: 'کمانڈ سمجھ نہیں آئی', raw };
  }, [customers, itemRates, formatCurrency, getTodayStats, language]);

  const speakText = (en: string, ur: string) => {
    if (!speakResponses) return;
    Speech.stop();
    const text = (language === 'ur' ? ur : en).replace(/[₨•\n\r]/g, ' ').replace(/\s+/g, ' ').trim();
    Speech.speak(text, {
      language: language === 'ur' ? 'ur-PK' : 'en-US',
      rate: 0.9, pitch: 1.0,
    });
  };

  const addToHistory = (text: string, action: string, status: 'success' | 'failed') => {
    setHistory(prev => [{
      id: Date.now().toString(),
      text, action, status,
      time: new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }),
    }, ...prev].slice(0, 15));
  };

  const executeIntent = (intent: Intent) => {
    setVoiceState('executing');
    let success = true;
    let resultMsg = intent.message;
    let resultMsgUr = intent.messageUr;

    try {
      if (intent.type === 'back') {
        router.back();
      } else if (intent.type === 'navigate' && intent.route) {
        setTimeout(() => router.push(intent.route as any), 200);
      } else if (intent.type === 'credit' && intent.customer && intent.amount) {
        addTransaction({
          customerId: intent.customer.id,
          customerName: intent.customer.name,
          type: 'credit', amount: intent.amount,
          note: `Voice Control: ${intent.raw}`,
          date: new Date().toISOString().split('T')[0],
        });
        resultMsg = `Rs. ${intent.amount} credit added to ${intent.customer.name}`;
        resultMsgUr = `${intent.customer.name} کو ${intent.amount} روپے ادھار شامل`;
      } else if (intent.type === 'debit' && intent.customer && intent.amount) {
        addTransaction({
          customerId: intent.customer.id,
          customerName: intent.customer.name,
          type: 'debit', amount: intent.amount,
          note: `Voice Control: ${intent.raw}`, paymentMethod: 'cash',
          date: new Date().toISOString().split('T')[0],
        });
        resultMsg = `Rs. ${intent.amount} received from ${intent.customer.name}`;
        resultMsgUr = `${intent.customer.name} سے ${intent.amount} روپے وصول`;
      }
    } catch {
      success = false;
    }

    addToHistory(intent.raw, resultMsg, success ? 'success' : 'failed');
    speakText(resultMsg, resultMsgUr);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(success ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
    setPendingIntent(null);

    setTimeout(() => {
      setVoiceState('idle');
      setTranscript('');
      setInterimTranscript('');
      if (alwaysOnRef.current && (intent.type !== 'navigate' && intent.type !== 'back')) {
        setTimeout(() => startListening(), 800);
      }
    }, 1200);
  };

  const processCommand = (text: string) => {
    setTranscript(text);
    setVoiceState('processing');
    setTimeout(() => {
      const intent = parseIntent(text);
      if (intent.type === 'unknown') {
        setVoiceState('error');
        addToHistory(text, intent.message, 'failed');
        speakText(intent.message, intent.messageUr);
        setTimeout(() => {
          setVoiceState('idle');
          if (alwaysOnRef.current) startListening();
        }, 1800);
        return;
      }
      if (intent.needsConfirm && (!intent.customer)) {
        addToHistory(text, language === 'ur' ? 'گاہک نہیں ملا' : 'Customer not found', 'failed');
        speakText('Customer not found', 'گاہک نہیں ملا');
        setVoiceState('error');
        setTimeout(() => setVoiceState('idle'), 1500);
        return;
      }
      if (intent.needsConfirm) {
        setPendingIntent(intent);
        setVoiceState('idle');
        return;
      }
      executeIntent(intent);
    }, 400);
  };

  const startListening = useCallback(async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    if (!recognitionAvailable) {
      setShowTextMode(true);
      return;
    }
    if (permissionStatus !== 'granted') {
      try {
        const r = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (!r.granted) {
          showAlert(t.error, language === 'ur' ? 'مائیک کی اجازت درکار' : 'Microphone permission required');
          return;
        }
        setPermissionStatus('granted');
      } catch {
        setShowTextMode(true);
        return;
      }
    }
    try {
      Speech.stop();
      ExpoSpeechRecognitionModule.start({
        lang: language === 'ur' ? 'ur-PK' : 'en-US',
        interimResults: true,
        maxAlternatives: 1,
        continuous: false,
        addsPunctuation: true,
        contextualStrings: [
          ...customers.slice(0, 30).map(c => c.name),
          'dashboard', 'customers', 'reports', 'settings', 'rate book', 'invoice',
        ],
      });
    } catch (err: any) {
      setVoiceState('error');
      showAlert(t.error, err?.message || 'Could not start');
      setTimeout(() => setVoiceState('idle'), 1500);
    }
  }, [language, permissionStatus, recognitionAvailable, customers, t, showAlert]);

  const handleMicPress = () => {
    if (voiceState === 'idle' || voiceState === 'error') startListening();
    else if (voiceState === 'listening') {
      try { ExpoSpeechRecognitionModule.stop(); } catch {}
    }
  };

  const handleTextSubmit = () => {
    if (!textInput.trim()) return;
    processCommand(textInput.trim());
    setTextInput('');
  };

  const stateColors = {
    idle: { bg: '#6366F1', ring: 'rgba(99,102,241,0.25)', label: '#4338CA' },
    listening: { bg: '#2563EB', ring: 'rgba(37,99,235,0.3)', label: '#1E40AF' },
    processing: { bg: '#F59E0B', ring: 'rgba(245,158,11,0.3)', label: '#D97706' },
    executing: { bg: '#10B981', ring: 'rgba(16,185,129,0.3)', label: '#047857' },
    error: { bg: '#DC2626', ring: 'rgba(220,38,38,0.3)', label: '#B91C1C' },
  };
  const colors = stateColors[voiceState];
  const stateLabels = {
    idle: language === 'ur' ? 'کمانڈ کے لیے دبائیں' : 'Tap to speak command',
    listening: language === 'ur' ? 'سن رہا ہوں...' : 'Listening...',
    processing: language === 'ur' ? 'سمجھ رہا ہوں...' : 'Processing...',
    executing: language === 'ur' ? 'عمل ہو رہا ہے...' : 'Executing...',
    error: language === 'ur' ? 'سمجھ نہیں آیا' : 'Not understood',
  };

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const ringScale = ringAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] });
  const ringOpacity = ringAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });
  const displayTranscript = transcript || interimTranscript;

  const navSuggestions = language === 'ur'
    ? ['گاہک دکھاؤ', 'ریٹ بک کھولو', 'رپورٹس', 'سیٹنگز', 'AI اسسٹنٹ', 'انوائس']
    : ['Show customers', 'Open rate book', 'Reports', 'Settings', 'AI Assistant', 'Invoice'];

  const actionSuggestions = language === 'ur'
    ? ['آج کا حساب', 'ٹاپ 5 بقایا', 'اسد کو 500 ادھار', 'راشد سے 1000 وصول']
    : ['Today summary', 'Top 5 defaulters', 'Asad ko 500 udhaar', 'Rashid se 1000 wapas'];

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <LinearGradient colors={['#4338CA', '#6366F1', '#8B5CF6']} style={styles.header}>
        <View style={[styles.headerRow, isRTL && styles.rtlRow]}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={8}>
            <MaterialIcons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={22} color="#FFF" />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              {language === 'ur' ? 'وائس کنٹرول' : 'Voice Control'}
            </Text>
            <Text style={styles.headerSub}>
              {language === 'ur' ? 'پوری ایپ آواز سے' : 'Full app voice control'}
            </Text>
          </View>
          <Pressable style={styles.iconBtn} onPress={() => setShowTextMode(!showTextMode)} hitSlop={8}>
            <MaterialIcons name={showTextMode ? 'mic' : 'keyboard'} size={20} color="#FFF" />
          </Pressable>
        </View>

        <View style={styles.togglesRow}>
          <View style={styles.toggleItem}>
            <View style={styles.toggleLabelRow}>
              <MaterialIcons name="autorenew" size={14} color="#FFF" />
              <Text style={styles.toggleText}>{language === 'ur' ? 'مسلسل' : 'Always On'}</Text>
            </View>
            <Switch
              value={alwaysOn}
              onValueChange={setAlwaysOn}
              trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#4ADE80' }}
              thumbColor="#FFF"
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
          </View>
          <View style={styles.toggleItem}>
            <View style={styles.toggleLabelRow}>
              <MaterialIcons name="volume-up" size={14} color="#FFF" />
              <Text style={styles.toggleText}>{language === 'ur' ? 'جواب' : 'Speak'}</Text>
            </View>
            <Switch
              value={speakResponses}
              onValueChange={setSpeakResponses}
              trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#4ADE80' }}
              thumbColor="#FFF"
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
          </View>
        </View>
      </LinearGradient>

      {permissionStatus === 'denied' && recognitionAvailable ? (
        <View style={styles.permBanner}>
          <MaterialIcons name="mic-off" size={16} color="#B45309" />
          <Text style={styles.permText}>
            {language === 'ur' ? 'مائیک اجازت درکار' : 'Microphone permission needed'}
          </Text>
          <Pressable
            onPress={async () => {
              const r = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
              setPermissionStatus(r.granted ? 'granted' : 'denied');
            }}
            style={styles.permBtn}
          >
            <Text style={styles.permBtnText}>{language === 'ur' ? 'اجازت دیں' : 'Allow'}</Text>
          </Pressable>
        </View>
      ) : null}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Mic Area */}
        <View style={styles.micArea}>
          <View style={styles.ringWrap}>
            <Animated.View
              style={[styles.outerRing, {
                backgroundColor: colors.ring,
                transform: [{ scale: ringScale }],
                opacity: voiceState === 'listening' ? ringOpacity : (voiceState === 'idle' ? 0.4 : 0.6),
              }]}
            />
            <Animated.View
              style={[styles.middleRing, {
                backgroundColor: colors.ring,
                transform: [{ scale: pulseAnim }],
              }]}
            />
            <Pressable onPress={handleMicPress} disabled={voiceState === 'processing' || voiceState === 'executing'}>
              <Animated.View style={[
                styles.micBtn, { backgroundColor: colors.bg },
                (voiceState === 'processing' || voiceState === 'executing') && { transform: [{ rotate: spin }] },
              ]}>
                <MaterialIcons
                  name={
                    voiceState === 'idle' ? 'mic' :
                    voiceState === 'listening' ? 'graphic-eq' :
                    voiceState === 'processing' ? 'autorenew' :
                    voiceState === 'executing' ? 'check' : 'error-outline'
                  }
                  size={40}
                  color="#FFF"
                />
              </Animated.View>
            </Pressable>
          </View>
          <Text style={[styles.stateLabel, { color: colors.label }]}>{stateLabels[voiceState]}</Text>

          {displayTranscript ? (
            <View style={[styles.transcriptBox, interimTranscript && !transcript && styles.transcriptInterim]}>
              <MaterialIcons name="format-quote" size={14} color={theme.textMuted} />
              <Text style={[styles.transcriptText, interimTranscript && !transcript && styles.transcriptItalic, isRTL && styles.rtlText]}>
                {displayTranscript}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Confirmation card */}
        {pendingIntent ? (
          <View style={styles.confirmCard}>
            <LinearGradient colors={['#FEF3C7', '#FDE68A']} style={styles.confirmGrad}>
              <MaterialIcons name="help-outline" size={20} color="#B45309" />
              <Text style={styles.confirmTitle}>
                {language === 'ur' ? 'تصدیق کریں' : 'Confirm Action'}
              </Text>
            </LinearGradient>
            <View style={styles.confirmBody}>
              <Text style={[styles.confirmMsg, isRTL && styles.rtlText]}>
                {language === 'ur' ? pendingIntent.messageUr : pendingIntent.message}
              </Text>
              {pendingIntent.customer ? (
                <View style={styles.confirmCust}>
                  <View style={styles.confirmAvatar}>
                    <Text style={styles.confirmAvText}>
                      {pendingIntent.customer.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.confirmCustName}>{pendingIntent.customer.name}</Text>
                    <Text style={styles.confirmCustBal}>
                      {language === 'ur' ? 'بقایا:' : 'Balance:'} {formatCurrency(pendingIntent.customer.balance)}
                    </Text>
                  </View>
                </View>
              ) : null}
              <View style={styles.confirmBtns}>
                <Pressable style={styles.confirmCancel} onPress={() => { setPendingIntent(null); setTranscript(''); }}>
                  <MaterialIcons name="close" size={16} color={theme.credit} />
                  <Text style={styles.confirmCancelText}>{t.cancel}</Text>
                </Pressable>
                <Pressable style={styles.confirmOk} onPress={() => executeIntent(pendingIntent)}>
                  <MaterialIcons name="check" size={16} color="#FFF" />
                  <Text style={styles.confirmOkText}>{t.confirm}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}

        {/* Text mode */}
        {showTextMode ? (
          <View style={styles.textCard}>
            <TextInput
              style={[styles.textInput, isRTL && styles.rtlText]}
              value={textInput}
              onChangeText={setTextInput}
              placeholder={language === 'ur' ? 'کمانڈ لکھیں' : 'Type command'}
              placeholderTextColor={theme.textMuted}
              onSubmitEditing={handleTextSubmit}
              returnKeyType="send"
            />
            <Pressable style={styles.sendBtn} onPress={handleTextSubmit}>
              <MaterialIcons name="send" size={18} color="#FFF" />
            </Pressable>
          </View>
        ) : null}

        {/* Navigation suggestions */}
        <View style={styles.section}>
          <View style={[styles.sectionHead, isRTL && styles.rtlRow]}>
            <MaterialIcons name="explore" size={18} color="#6366F1" />
            <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>
              {language === 'ur' ? 'نیویگیشن' : 'Navigation'}
            </Text>
          </View>
          <View style={styles.chipsWrap}>
            {navSuggestions.map((s, i) => (
              <Pressable key={i} style={styles.suggestChip} onPress={() => processCommand(s)}>
                <MaterialIcons name="mic-none" size={12} color="#6366F1" />
                <Text style={styles.suggestText}>{s}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Actions suggestions */}
        <View style={styles.section}>
          <View style={[styles.sectionHead, isRTL && styles.rtlRow]}>
            <MaterialIcons name="bolt" size={18} color={theme.warning} />
            <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>
              {language === 'ur' ? 'اعمال اور سوالات' : 'Actions & Queries'}
            </Text>
          </View>
          <View style={styles.chipsWrap}>
            {actionSuggestions.map((s, i) => (
              <Pressable key={i} style={[styles.suggestChip, { borderColor: theme.warning + '40' }]} onPress={() => processCommand(s)}>
                <MaterialIcons name="mic-none" size={12} color={theme.warning} />
                <Text style={styles.suggestText}>{s}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* History */}
        {history.length > 0 ? (
          <View style={styles.section}>
            <View style={[styles.sectionHead, isRTL && styles.rtlRow]}>
              <MaterialIcons name="history" size={18} color={theme.textSecondary} />
              <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>
                {language === 'ur' ? 'تاریخ' : 'Command History'}
              </Text>
            </View>
            <View style={styles.historyList}>
              {history.map((h) => (
                <Pressable key={h.id} style={styles.historyItem} onPress={() => h.status === 'failed' && processCommand(h.text)}>
                  <View style={[styles.historyIcon, { backgroundColor: h.status === 'success' ? theme.paymentLight : theme.creditLight }]}>
                    <MaterialIcons name={h.status === 'success' ? 'check' : 'close'} size={14} color={h.status === 'success' ? theme.payment : theme.credit} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.historyText, isRTL && styles.rtlText]} numberOfLines={1}>{h.text}</Text>
                    <Text style={[styles.historyResult, isRTL && styles.rtlText]} numberOfLines={1}>{h.action}</Text>
                  </View>
                  <Text style={styles.historyTime}>{h.time}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.tips}>
          <LinearGradient colors={['#EEF2FF', '#E0E7FF']} style={styles.tipsGrad}>
            <MaterialIcons name="tips-and-updates" size={20} color="#4338CA" />
            <Text style={[styles.tipsText, isRTL && styles.rtlText]}>
              {language === 'ur'
                ? 'مثالیں: "گاہک دکھاؤ"، "احمد کا بقایا"، "آج کا حساب"، "اسد کو 500 ادھار"، "واپس"'
                : 'Try: "Show customers", "Ahmed ka balance", "Today summary", "Asad ko 500 udhaar", "Back"'}
            </Text>
          </LinearGradient>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  rtlRow: { flexDirection: 'row-reverse' },
  rtlText: { writingDirection: 'rtl', textAlign: 'right' },
  header: {
    paddingTop: 6, paddingBottom: 14, paddingHorizontal: 12,
    borderBottomLeftRadius: 26, borderBottomRightRadius: 26,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#FFF' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  togglesRow: {
    flexDirection: 'row', gap: 8, marginTop: 12,
    backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 12, padding: 4,
  },
  toggleItem: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 10, paddingVertical: 4,
  },
  toggleLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  toggleText: { fontSize: 12, color: '#FFF', fontWeight: '600' },
  permBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF3C7', padding: 10,
    borderBottomWidth: 1, borderBottomColor: '#FDE68A',
  },
  permText: { flex: 1, fontSize: 12, color: '#92400E', fontWeight: '600' },
  permBtn: { backgroundColor: '#92400E', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  permBtnText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  micArea: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20 },
  ringWrap: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center' },
  outerRing: { position: 'absolute', width: 220, height: 220, borderRadius: 110 },
  middleRing: { position: 'absolute', width: 160, height: 160, borderRadius: 80 },
  micBtn: {
    width: 110, height: 110, borderRadius: 55,
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#4338CA', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16 },
      android: { elevation: 10 }, default: {},
    }),
  },
  stateLabel: { fontSize: 17, fontWeight: '700', marginTop: 22 },
  transcriptBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    marginTop: 18, paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#FFF', borderRadius: 14, maxWidth: '92%',
    borderWidth: 1, borderColor: theme.borderLight,
  },
  transcriptInterim: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  transcriptText: { flex: 1, fontSize: 14, color: theme.textDark, fontWeight: '500', lineHeight: 20 },
  transcriptItalic: { color: '#1E40AF', fontStyle: 'italic' },
  textCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 20, marginBottom: 12,
    backgroundColor: '#FFF', borderRadius: 14, padding: 8,
    borderWidth: 1, borderColor: theme.borderLight,
  },
  textInput: {
    flex: 1, backgroundColor: theme.background,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: theme.textDark,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#6366F1', alignItems: 'center', justifyContent: 'center',
  },
  section: { paddingHorizontal: 20, marginTop: 8, marginBottom: 4 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: theme.textDark },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggestChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: '#6366F1' + '40',
  },
  suggestText: { fontSize: 12, color: theme.textDark, fontWeight: '600' },
  historyList: {
    backgroundColor: '#FFF', borderRadius: 14,
    borderWidth: 1, borderColor: theme.borderLight, overflow: 'hidden',
  },
  historyItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: theme.borderLight,
  },
  historyIcon: {
    width: 26, height: 26, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  historyText: { fontSize: 13, fontWeight: '600', color: theme.textDark },
  historyResult: { fontSize: 11, color: theme.textMuted, marginTop: 2 },
  historyTime: { fontSize: 10, color: theme.textMuted, fontWeight: '500' },
  confirmCard: {
    marginHorizontal: 20, marginBottom: 16,
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: '#FCD34D',
  },
  confirmGrad: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  confirmTitle: { fontSize: 14, fontWeight: '800', color: '#78350F' },
  confirmBody: { backgroundColor: '#FFF', padding: 16 },
  confirmMsg: { fontSize: 15, fontWeight: '600', color: theme.textDark, lineHeight: 22 },
  confirmCust: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginTop: 12, padding: 10, backgroundColor: theme.background, borderRadius: 12,
  },
  confirmAvatar: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#6366F1' + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  confirmAvText: { fontSize: 14, fontWeight: '700', color: '#4338CA' },
  confirmCustName: { fontSize: 14, fontWeight: '700', color: theme.textDark },
  confirmCustBal: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
  confirmBtns: { flexDirection: 'row', gap: 10, marginTop: 14 },
  confirmCancel: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 12, backgroundColor: theme.creditLight,
  },
  confirmCancelText: { fontSize: 13, fontWeight: '700', color: theme.credit },
  confirmOk: {
    flex: 1.4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 12, backgroundColor: '#6366F1',
  },
  confirmOkText: { fontSize: 13, fontWeight: '800', color: '#FFF' },
  tips: { marginHorizontal: 20, marginTop: 16, borderRadius: 14, overflow: 'hidden' },
  tipsGrad: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14 },
  tipsText: { flex: 1, fontSize: 12, color: '#3730A3', lineHeight: 18, fontWeight: '500' },
});
