import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { theme } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import { useAlert } from '@/template';

type AIProvider = 'local' | 'pro' | 'cloud';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
  provider?: AIProvider;
  isVoice?: boolean;
  actions?: { label: string; action: string }[];
}

export default function ChatAssistantScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { customers, transactions, itemRates, formatCurrency, getTodayStats, language, isRTL } = useApp();
  const { showAlert } = useAlert();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [aiProvider, setAiProvider] = useState<AIProvider>('local');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showCloudUpgrade, setShowCloudUpgrade] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');

  const scrollRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Initial greeting
  useEffect(() => {
    const initial: Message = {
      id: '1',
      text: language === 'ur'
        ? 'السلام علیکم! میں آپ کا KhataJi اسسٹنٹ ہوں۔ آواز یا ٹیکسٹ سے بات کریں۔'
        : 'Assalam o Alaikum! I am your KhataJi AI Assistant. Talk with voice or type below.',
      sender: 'bot',
      timestamp: now(),
      provider: aiProvider,
      actions: [
        { label: language === 'ur' ? 'کل حساب' : 'Total Balance', action: 'outstanding' },
        { label: language === 'ur' ? 'آج کا خلاصہ' : 'Today Summary', action: 'summary' },
        { label: language === 'ur' ? 'ٹاپ ڈیفالٹرز' : 'Top Defaulters', action: 'defaulters' },
      ],
    };
    setMessages([initial]);
  }, [language]);

  // Request mic permissions
  useEffect(() => {
    (async () => {
      try {
        const res = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        setPermissionStatus(res.granted ? 'granted' : 'denied');
      } catch {
        setPermissionStatus('denied');
      }
    })();
    return () => {
      try {
        ExpoSpeechRecognitionModule.stop();
        Speech.stop();
      } catch {}
    };
  }, []);

  // Listening pulse animation
  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.25, duration: 600, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isListening]);

  // Speech recognition events
  useSpeechRecognitionEvent('start', () => {
    setIsListening(true);
    setInterimText('');
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
  });

  useSpeechRecognitionEvent('result', (event: any) => {
    const result = event.results?.[0];
    if (!result) return;
    const text = result.transcript || '';
    if (event.isFinal) {
      setInterimText('');
      try {
        ExpoSpeechRecognitionModule.stop();
      } catch {}
      setIsListening(false);
      if (text.trim()) sendMessage(text, true);
    } else {
      setInterimText(text);
    }
  });

  useSpeechRecognitionEvent('error', (event: any) => {
    setIsListening(false);
    setInterimText('');
    const code = event.error || 'unknown';
    if (code !== 'no-speech' && code !== 'aborted') {
      showAlert(
        language === 'ur' ? 'خرابی' : 'Error',
        code === 'not-allowed'
          ? language === 'ur' ? 'مائیکروفون کی اجازت درکار ہے' : 'Microphone permission required'
          : language === 'ur' ? 'آواز نہیں سنی گئی' : 'Voice recognition failed'
      );
    }
  });

  function now() {
    return new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
  }

  // Local rule-based processor
  const processLocal = useCallback((query: string): string => {
    const lower = query.toLowerCase();
    const stats = getTodayStats();

    if (lower.includes('outstanding') || lower.includes('total') || lower.includes('kul') || lower.includes('کل') || lower.includes('بقایا')) {
      return language === 'ur'
        ? `کل بقایا: ${formatCurrency(stats.outstanding)}\n\n${stats.totalCustomers} گاہکوں میں سے ${customers.filter(c => c.balance > 0).length} کا ادھار باقی ہے۔`
        : `Total outstanding: ${formatCurrency(stats.outstanding)}\n\n${customers.filter(c => c.balance > 0).length} of ${stats.totalCustomers} customers have pending balance.`;
    }
    if (lower.includes('summary') || lower.includes('hisaab') || lower.includes('aaj') || lower.includes('آج') || lower.includes('حساب')) {
      return language === 'ur'
        ? `آج کا خلاصہ:\n\nادھار دیا: ${formatCurrency(stats.todayCredit)}\nوصول کیا: ${formatCurrency(stats.todayCollection)}\nکل بقایا: ${formatCurrency(stats.outstanding)}\nگاہک: ${stats.totalCustomers}`
        : `Today Summary:\n\nCredit Given: ${formatCurrency(stats.todayCredit)}\nCollection: ${formatCurrency(stats.todayCollection)}\nOutstanding: ${formatCurrency(stats.outstanding)}\nCustomers: ${stats.totalCustomers}`;
    }
    if (lower.includes('defaulter') || lower.includes('top') || lower.includes('ٹاپ') || lower.includes('زیادہ')) {
      const top5 = [...customers].sort((a, b) => b.balance - a.balance).slice(0, 5);
      let response = language === 'ur' ? 'ٹاپ 5 بقایا:\n\n' : 'Top 5 Outstanding:\n\n';
      top5.forEach((c, i) => {
        response += `${i + 1}. ${c.name} - ${formatCurrency(c.balance)}\n`;
      });
      return response;
    }
    if (lower.includes('balance') || lower.includes('kitna') || lower.includes('بقایا')) {
      const nameMatch = lower.match(/(.+?)\s+(?:ka|کا)\s+(?:balance|بقایا)/);
      if (nameMatch) {
        const name = nameMatch[1].trim();
        const customer = customers.find(c => c.name.toLowerCase().includes(name));
        if (customer) {
          return language === 'ur'
            ? `${customer.name} کا بقایا: ${formatCurrency(customer.balance)}\n\nکل ادھار: ${formatCurrency(customer.totalCredit)}\nکل ادائیگی: ${formatCurrency(customer.totalDebit)}`
            : `${customer.name}'s balance: ${formatCurrency(customer.balance)}\n\nTotal Credit: ${formatCurrency(customer.totalCredit)}\nTotal Paid: ${formatCurrency(customer.totalDebit)}`;
        }
        return language === 'ur' ? `"${name}" نام کا گاہک نہیں ملا۔` : `Customer "${name}" not found.`;
      }
      return language === 'ur' ? 'گاہک کا نام بتائیں' : 'Please tell me the customer name';
    }
    if (lower.includes('rate') || lower.includes('ریٹ') || lower.includes('price')) {
      const match = lower.match(/(.+?)\s+(?:ka|کا)\s+(?:rate|ریٹ|price)/);
      if (match) {
        const item = match[1].trim();
        const found = itemRates.find(r => r.name.toLowerCase().includes(item));
        if (found) {
          return language === 'ur'
            ? `${found.name}: ${formatCurrency(found.rate)} / ${found.unit}`
            : `${found.name}: ${formatCurrency(found.rate)} per ${found.unit}`;
        }
      }
    }
    if (lower.includes('report') || lower.includes('weekly') || lower.includes('ہفتہ')) {
      const weekTxns = transactions.filter(t => new Date(t.date) >= new Date(Date.now() - 7 * 86400000));
      const weekCredit = weekTxns.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
      const weekDebit = weekTxns.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
      return language === 'ur'
        ? `اس ہفتے کی رپورٹ:\n\nادھار: ${formatCurrency(weekCredit)}\nوصولی: ${formatCurrency(weekDebit)}\nلین دین: ${weekTxns.length}`
        : `This Week Report:\n\nCredit: ${formatCurrency(weekCredit)}\nCollection: ${formatCurrency(weekDebit)}\nTransactions: ${weekTxns.length}`;
    }
    return language === 'ur'
      ? 'میں سمجھ نہیں سکا۔ کوشش کریں:\n- "کل بقایا کتنا ہے؟"\n- "احمد کا بقایا"\n- "آج کا حساب"\n- "ٹاپ ڈیفالٹرز"'
      : "I did not understand. Try:\n- 'Total outstanding?'\n- 'Ahmed ka balance'\n- 'Today summary'\n- 'Top defaulters'";
  }, [customers, transactions, itemRates, formatCurrency, getTodayStats, language]);

  // AI Pro processor - enhanced with insights
  const processAIPro = useCallback((query: string): string => {
    const localResp = processLocal(query);
    const lower = query.toLowerCase();
    const stats = getTodayStats();

    // Insights
    if (lower.includes('trend') || lower.includes('growth') || lower.includes('رجحان') || lower.includes('advice') || lower.includes('suggest') || lower.includes('مشورہ')) {
      const totalBalance = customers.reduce((s, c) => s + c.balance, 0);
      const avgBalance = customers.length > 0 ? totalBalance / customers.length : 0;
      const highRisk = customers.filter(c => c.balance > avgBalance * 2).length;
      const weekTxns = transactions.filter(t => new Date(t.date) >= new Date(Date.now() - 7 * 86400000));
      const weekCredit = weekTxns.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
      const weekDebit = weekTxns.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
      const collectionRate = weekCredit > 0 ? ((weekDebit / weekCredit) * 100).toFixed(0) : '0';

      return language === 'ur'
        ? `📊 AI بصیرت:\n\n• اوسط بقایا: ${formatCurrency(Math.round(avgBalance))}\n• زیادہ خطرہ: ${highRisk} گاہک\n• ہفتہ وار وصولی کی شرح: ${collectionRate}%\n\n💡 مشورہ: ${highRisk} گاہکوں کو یاد دہانی بھیجیں۔ وصولی کی شرح بہتر بنانے کے لیے کیش ڈسکاؤنٹ آفر کریں۔`
        : `📊 AI Insights:\n\n• Average balance: ${formatCurrency(Math.round(avgBalance))}\n• High risk: ${highRisk} customers\n• Weekly collection rate: ${collectionRate}%\n\n💡 Suggestion: Send reminders to ${highRisk} high-risk customers. Consider cash discounts to improve collection rate.`;
    }

    // Enhanced default
    if (localResp.startsWith('I did not') || localResp.startsWith('میں سمجھ')) {
      return language === 'ur'
        ? `🤖 AI پرو موڈ:\n\nمیں سیکھ رہا ہوں۔ آپ پوچھ سکتے ہیں:\n\n• "کل کا حساب" - آج کا خلاصہ\n• "احمد کا بقایا" - گاہک کی معلومات\n• "رجحان دکھاؤ" - کاروباری بصیرت\n• "چینی کا ریٹ" - قیمت چیک کریں\n• "ٹاپ ڈیفالٹرز" - زیادہ ادھار والے\n\n☁️ کلاؤڈ GPT فیچرز کے لیے AI کلاؤڈ فعال کریں۔`
        : `🤖 AI Pro Mode:\n\nStill learning. You can ask:\n\n• "Today summary" - Daily overview\n• "Ahmed ka balance" - Customer info\n• "Show trends" - Business insights\n• "Cheeni ka rate" - Check price\n• "Top defaulters" - Highest debts\n\n☁️ Enable AI Cloud for GPT-powered features.`;
    }

    return `${localResp}\n\n💡 ${language === 'ur' ? 'AI ٹپ: مزید تفصیلی مشورے کے لیے "رجحان دکھاؤ" پوچھیں۔' : 'AI Tip: Ask "show trends" for detailed business insights.'}`;
  }, [processLocal, customers, transactions, getTodayStats, formatCurrency, language]);

  const sendMessage = (text: string, isVoice: boolean = false) => {
    if (!text.trim()) return;

    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {});
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user',
      timestamp: now(),
      isVoice,
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      let response: string;
      if (aiProvider === 'cloud') {
        // Cloud mode - would use OnSpace AI when backend enabled
        response = language === 'ur'
          ? `☁️ AI کلاؤڈ موڈ:\n\nحقیقی ChatGPT انضمام کے لیے OnSpace بیک اینڈ فعال کریں۔ فی الحال AI پرو موڈ استعمال کر رہا ہوں:\n\n${processAIPro(text)}`
          : `☁️ AI Cloud Mode:\n\nEnable OnSpace backend for real ChatGPT integration. Using AI Pro mode for now:\n\n${processAIPro(text)}`;
      } else if (aiProvider === 'pro') {
        response = processAIPro(text);
      } else {
        response = processLocal(text);
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'bot',
        timestamp: now(),
        provider: aiProvider,
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);

      // Auto-speak bot response if voice was used or voice output enabled
      if (voiceEnabled && (isVoice || aiProvider !== 'local')) {
        speakMessage(botMsg.id, response);
      }

      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }, aiProvider === 'cloud' ? 1200 : aiProvider === 'pro' ? 900 : 600);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const speakMessage = (msgId: string, text: string) => {
    Speech.stop();
    if (speakingId === msgId) {
      setSpeakingId(null);
      return;
    }
    setSpeakingId(msgId);
    // Strip emoji and markdown-ish characters
    const clean = text.replace(/[📊💡🤖☁️📈📉•\n\r]/g, ' ').replace(/\s+/g, ' ').trim();
    Speech.speak(clean, {
      language: language === 'ur' ? 'ur-PK' : 'en-US',
      pitch: 1.0,
      rate: 0.92,
      onDone: () => setSpeakingId(null),
      onStopped: () => setSpeakingId(null),
      onError: () => setSpeakingId(null),
    });
  };

  const toggleVoiceInput = async () => {
    if (isListening) {
      try {
        ExpoSpeechRecognitionModule.stop();
      } catch {}
      setIsListening(false);
      return;
    }

    if (permissionStatus !== 'granted') {
      const res = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!res.granted) {
        showAlert(
          language === 'ur' ? 'خرابی' : 'Permission Required',
          language === 'ur' ? 'مائیکروفون کی اجازت درکار ہے' : 'Microphone permission required'
        );
        return;
      }
      setPermissionStatus('granted');
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }

    try {
      Speech.stop();
      setSpeakingId(null);
      ExpoSpeechRecognitionModule.start({
        lang: language === 'ur' ? 'ur-PK' : 'en-US',
        interimResults: true,
        maxAlternatives: 1,
        continuous: false,
        addsPunctuation: true,
        contextualStrings: customers.slice(0, 30).map(c => c.name),
      });
    } catch (err: any) {
      showAlert(language === 'ur' ? 'خرابی' : 'Error', err?.message || 'Could not start');
    }
  };

  const handleActionChip = (action: string) => {
    const map: Record<string, string> = {
      balance: language === 'ur' ? 'کل بقایا کتنا ہے' : 'What is total outstanding',
      summary: language === 'ur' ? 'آج کا حساب' : 'Today summary',
      outstanding: language === 'ur' ? 'کل بقایا' : 'Total outstanding',
      defaulters: language === 'ur' ? 'ٹاپ ڈیفالٹرز' : 'Top defaulters',
      reminder: language === 'ur' ? 'یاد دہانی بھیجیں' : 'Send reminders',
    };
    sendMessage(map[action] || action);
  };

  const quickReplies = language === 'ur'
    ? ['کل بقایا؟', 'آج کا حساب', 'ٹاپ 5', 'احمد کا بقایا', 'رجحان دکھاؤ', 'چینی کا ریٹ']
    : ['Total outstanding?', 'Today summary', 'Top 5', 'Ahmed ka balance', 'Show trends', 'Cheeni rate'];

  const providerInfo = {
    local: {
      label: language === 'ur' ? 'لوکل' : 'Local',
      icon: 'smart-toy' as const,
      color: theme.textSecondary,
      desc: language === 'ur' ? 'قوانین پر مبنی' : 'Rule-based',
    },
    pro: {
      label: language === 'ur' ? 'AI پرو' : 'AI Pro',
      icon: 'auto-awesome' as const,
      color: '#7C3AED',
      desc: language === 'ur' ? 'ذہین بصیرت' : 'Smart Insights',
    },
    cloud: {
      label: language === 'ur' ? 'ChatGPT' : 'ChatGPT',
      icon: 'cloud' as const,
      color: '#0EA5E9',
      desc: language === 'ur' ? 'کلاؤڈ پاور' : 'Cloud Powered',
    },
  };

  const handleProviderChange = (p: AIProvider) => {
    if (p === 'cloud') {
      setShowCloudUpgrade(true);
      return;
    }
    setAiProvider(p);
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {});
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient
        colors={aiProvider === 'pro' ? ['#5B21B6', '#7C3AED', '#9333EA'] : aiProvider === 'cloud' ? ['#0284C7', '#0EA5E9', '#38BDF8'] : ['#0A6B3F', '#0D7C4A', '#065F37']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={[styles.headerTop, isRTL && styles.rtlRow]}>
          <Pressable onPress={() => router.back()} style={styles.headerBtn} hitSlop={8}>
            <MaterialIcons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={22} color="#FFF" />
          </Pressable>
          <View style={[styles.headerInfo, isRTL && styles.rtlRow]}>
            <View style={styles.avatarWrap}>
              <MaterialIcons name={providerInfo[aiProvider].icon} size={20} color="#FFF" />
              <View style={[styles.onlineDot, isListening && { backgroundColor: '#F59E0B' }]} />
            </View>
            <View style={isRTL && { alignItems: 'flex-end' }}>
              <Text style={styles.headerTitle}>
                {language === 'ur' ? 'AI اسسٹنٹ' : 'KhataJi AI'}
              </Text>
              <Text style={styles.headerStatus}>
                {isListening
                  ? language === 'ur' ? 'سن رہا ہوں...' : 'Listening...'
                  : `${providerInfo[aiProvider].desc} • ${language === 'ur' ? 'آن لائن' : 'Online'}`}
              </Text>
            </View>
          </View>
          <Pressable
            style={styles.voiceToggle}
            onPress={() => setVoiceEnabled(!voiceEnabled)}
            hitSlop={8}
          >
            <MaterialIcons name={voiceEnabled ? 'volume-up' : 'volume-off'} size={20} color="#FFF" />
          </Pressable>
        </View>

        {/* AI Provider Selector */}
        <View style={styles.providerBar}>
          {(['local', 'pro', 'cloud'] as AIProvider[]).map(p => {
            const info = providerInfo[p];
            const active = aiProvider === p;
            return (
              <Pressable
                key={p}
                onPress={() => handleProviderChange(p)}
                style={({ pressed }) => [
                  styles.providerChip,
                  active && styles.providerChipActive,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <MaterialIcons
                  name={info.icon}
                  size={14}
                  color={active ? '#FFF' : 'rgba(255,255,255,0.7)'}
                />
                <Text style={[styles.providerChipText, active && styles.providerChipTextActive]}>
                  {info.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Chat Area */}
        <ScrollView
          ref={scrollRef}
          style={styles.chatArea}
          contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 12 }}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(msg => {
            const isBot = msg.sender === 'bot';
            const isSpeaking = speakingId === msg.id;
            return (
              <View key={msg.id} style={[styles.msgRow, !isBot && styles.msgRowUser]}>
                {isBot ? (
                  <View style={styles.botAvatar}>
                    <MaterialIcons
                      name={providerInfo[msg.provider || 'local'].icon}
                      size={14}
                      color={providerInfo[msg.provider || 'local'].color}
                    />
                  </View>
                ) : null}
                <View
                  style={[
                    styles.msgBubble,
                    isBot ? styles.botBubble : styles.userBubble,
                    !isBot && msg.isVoice ? styles.userBubbleVoice : null,
                  ]}
                >
                  {msg.isVoice && !isBot ? (
                    <View style={styles.voiceBadge}>
                      <MaterialIcons name="mic" size={10} color="rgba(255,255,255,0.9)" />
                      <Text style={styles.voiceBadgeText}>
                        {language === 'ur' ? 'آواز' : 'Voice'}
                      </Text>
                    </View>
                  ) : null}
                  <Text
                    style={[
                      styles.msgText,
                      !isBot && styles.userMsgText,
                      isRTL && styles.rtlText,
                    ]}
                  >
                    {msg.text}
                  </Text>
                  <View style={[styles.msgFooter, isRTL && styles.rtlRow]}>
                    <Text style={[styles.msgTime, !isBot && styles.userMsgTime]}>{msg.timestamp}</Text>
                    {isBot ? (
                      <Pressable
                        style={styles.speakBtn}
                        onPress={() => speakMessage(msg.id, msg.text)}
                        hitSlop={8}
                      >
                        <MaterialIcons
                          name={isSpeaking ? 'stop-circle' : 'volume-up'}
                          size={14}
                          color={isSpeaking ? theme.primary : theme.textMuted}
                        />
                      </Pressable>
                    ) : null}
                  </View>
                  {msg.actions ? (
                    <View style={styles.actionsRow}>
                      {msg.actions.map(action => (
                        <Pressable
                          key={action.action}
                          style={({ pressed }) => [styles.actionChip, pressed && { opacity: 0.7 }]}
                          onPress={() => handleActionChip(action.action)}
                        >
                          <Text style={styles.actionChipText}>{action.label}</Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })}

          {isTyping ? (
            <View style={styles.msgRow}>
              <View style={styles.botAvatar}>
                <MaterialIcons name={providerInfo[aiProvider].icon} size={14} color={providerInfo[aiProvider].color} />
              </View>
              <View style={[styles.msgBubble, styles.botBubble, styles.typingBubble]}>
                <View style={styles.typingDots}>
                  <View style={[styles.dot, styles.dot1]} />
                  <View style={[styles.dot, styles.dot2]} />
                  <View style={[styles.dot, styles.dot3]} />
                </View>
              </View>
            </View>
          ) : null}
        </ScrollView>

        {/* Interim transcript preview */}
        {isListening && interimText ? (
          <View style={styles.interimBar}>
            <MaterialIcons name="graphic-eq" size={14} color="#F59E0B" />
            <Text style={styles.interimText} numberOfLines={1}>{interimText}</Text>
          </View>
        ) : null}

        {/* Quick Replies */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.quickReplies}
          contentContainerStyle={{ paddingHorizontal: 12, gap: 8, alignItems: 'center' }}
        >
          {quickReplies.map(reply => (
            <Pressable
              key={reply}
              style={({ pressed }) => [styles.quickChip, pressed && { opacity: 0.7 }]}
              onPress={() => sendMessage(reply)}
            >
              <Text style={styles.quickChipText}>{reply}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Input Area */}
        <View style={[styles.inputArea, { paddingBottom: insets.bottom + 8 }]}>
          <Pressable
            style={({ pressed }) => [
              styles.micBtn,
              isListening && styles.micBtnActive,
              pressed && { opacity: 0.8 },
            ]}
            onPress={toggleVoiceInput}
          >
            <Animated.View style={{ transform: [{ scale: isListening ? pulseAnim : 1 }] }}>
              <MaterialIcons
                name={isListening ? 'stop' : 'mic'}
                size={22}
                color="#FFF"
              />
            </Animated.View>
          </Pressable>
          <TextInput
            style={[styles.input, isRTL && styles.rtlText]}
            placeholder={
              isListening
                ? language === 'ur' ? 'بولیں...' : 'Speak now...'
                : language === 'ur' ? 'پیغام لکھیں یا مائیک دبائیں' : 'Type or tap mic to speak'
            }
            placeholderTextColor={theme.textMuted}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => sendMessage(inputText)}
            returnKeyType="send"
            editable={!isListening}
          />
          <Pressable
            style={({ pressed }) => [
              styles.sendBtn,
              !inputText.trim() && styles.sendBtnDisabled,
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim()}
          >
            <MaterialIcons name="send" size={20} color="#FFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Cloud Upgrade Modal */}
      <Modal
        visible={showCloudUpgrade}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCloudUpgrade(false)}
      >
        <View style={styles.upgradeOverlay}>
          <View style={styles.upgradeCard}>
            <LinearGradient colors={['#0284C7', '#0EA5E9']} style={styles.upgradeHeader}>
              <MaterialIcons name="cloud" size={40} color="#FFF" />
              <Text style={styles.upgradeTitle}>
                {language === 'ur' ? 'ChatGPT کلاؤڈ فعال کریں' : 'Enable ChatGPT Cloud'}
              </Text>
              <Text style={styles.upgradeSubtitle}>
                {language === 'ur' ? 'حقیقی GPT پاور آپ کی جیب میں' : 'Real GPT power in your pocket'}
              </Text>
            </LinearGradient>
            <View style={styles.upgradeBody}>
              {[
                { icon: 'chat', text: language === 'ur' ? 'قدرتی زبان میں گفتگو' : 'Natural language conversations' },
                { icon: 'psychology', text: language === 'ur' ? 'جدید ترین GPT-4 ماڈل' : 'Latest GPT-4 model' },
                { icon: 'analytics', text: language === 'ur' ? 'گہری کاروباری تجزیہ' : 'Deep business analysis' },
                { icon: 'translate', text: language === 'ur' ? 'اردو، انگریزی مکمل سپورٹ' : 'Full Urdu & English support' },
              ].map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <View style={styles.featureIcon}>
                    <MaterialIcons name={f.icon as any} size={16} color="#0EA5E9" />
                  </View>
                  <Text style={styles.featureText}>{f.text}</Text>
                </View>
              ))}
            </View>
            <View style={styles.upgradeActions}>
              <Pressable
                style={styles.upgradeCancel}
                onPress={() => setShowCloudUpgrade(false)}
              >
                <Text style={styles.upgradeCancelText}>
                  {language === 'ur' ? 'بعد میں' : 'Maybe Later'}
                </Text>
              </Pressable>
              <Pressable
                style={styles.upgradeGo}
                onPress={() => {
                  setShowCloudUpgrade(false);
                  setAiProvider('cloud');
                  showAlert(
                    language === 'ur' ? 'اطلاع' : 'Coming Soon',
                    language === 'ur'
                      ? 'ChatGPT کلاؤڈ جلد دستیاب ہوگا۔ فی الحال AI پرو موڈ استعمال کر رہا ہوں۔'
                      : 'ChatGPT Cloud will be available soon. Using AI Pro mode for now.'
                  );
                }}
              >
                <LinearGradient colors={['#0284C7', '#0EA5E9']} style={styles.upgradeGoGrad}>
                  <MaterialIcons name="rocket-launch" size={16} color="#FFF" />
                  <Text style={styles.upgradeGoText}>
                    {language === 'ur' ? 'کلاؤڈ آزمائیں' : 'Try Cloud'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0FDF4' },
  rtlRow: { flexDirection: 'row-reverse' },
  rtlText: { writingDirection: 'rtl', textAlign: 'right' },

  // Header
  header: {
    paddingTop: 6,
    paddingBottom: 14,
    paddingHorizontal: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 12 },
  avatarWrap: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0, right: 0,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#4ADE80',
    borderWidth: 2, borderColor: '#0D7C4A',
  },
  headerTitle: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  headerStatus: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  voiceToggle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Provider selector
  providerBar: {
    flexDirection: 'row',
    marginTop: 12,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 12,
    padding: 3,
  },
  providerChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 9,
  },
  providerChipActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  providerChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
  },
  providerChipTextActive: { color: '#FFF' },

  // Chat
  chatArea: { flex: 1 },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
    gap: 6,
  },
  msgRowUser: { justifyContent: 'flex-end' },
  botAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#FFF',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  msgBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  botBubble: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: theme.borderLight,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3 },
      android: { elevation: 1 },
      default: {},
    }),
  },
  userBubble: {
    backgroundColor: theme.primary,
    borderTopRightRadius: 4,
  },
  userBubbleVoice: {
    backgroundColor: '#7C3AED',
  },
  voiceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  voiceBadgeText: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  msgText: {
    fontSize: 14,
    color: theme.textDark,
    lineHeight: 20,
  },
  userMsgText: { color: '#FFF' },
  msgFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 6,
  },
  msgTime: { fontSize: 10, color: theme.textMuted },
  userMsgTime: { color: 'rgba(255,255,255,0.7)' },
  speakBtn: {
    padding: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  actionChip: {
    backgroundColor: theme.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.primary + '40',
  },
  actionChipText: { fontSize: 11, color: theme.primary, fontWeight: '700' },

  // Typing
  typingBubble: { paddingVertical: 14, paddingHorizontal: 16 },
  typingDots: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  dot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: theme.textMuted,
  },
  dot1: { opacity: 0.4 },
  dot2: { opacity: 0.7 },
  dot3: { opacity: 1 },

  // Interim
  interimBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
  },
  interimText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    fontStyle: 'italic',
    fontWeight: '600',
  },

  // Quick replies
  quickReplies: {
    maxHeight: 48,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: theme.borderLight,
  },
  quickChip: {
    backgroundColor: theme.backgroundSecondary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  quickChipText: { fontSize: 12, color: theme.textSecondary, fontWeight: '600' },

  // Input
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 8,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: theme.borderLight,
    gap: 6,
  },
  micBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: theme.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  micBtnActive: {
    backgroundColor: '#DC2626',
  },
  input: {
    flex: 1,
    backgroundColor: theme.background,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: theme.textDark,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: theme.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: theme.textMuted,
    opacity: 0.5,
  },

  // Upgrade modal
  upgradeOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  upgradeCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFF',
    borderRadius: 24,
    overflow: 'hidden',
  },
  upgradeHeader: {
    padding: 24,
    alignItems: 'center',
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    marginTop: 10,
    textAlign: 'center',
  },
  upgradeSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  upgradeBody: {
    padding: 20,
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureIcon: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#E0F2FE',
    alignItems: 'center', justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: 13,
    color: theme.textDark,
    fontWeight: '600',
  },
  upgradeActions: {
    flexDirection: 'row',
    gap: 10,
    padding: 20,
    paddingTop: 4,
  },
  upgradeCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: theme.background,
    alignItems: 'center',
  },
  upgradeCancelText: { fontSize: 13, fontWeight: '700', color: theme.textSecondary },
  upgradeGo: {
    flex: 1.3,
    borderRadius: 12,
    overflow: 'hidden',
  },
  upgradeGoGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  upgradeGoText: { fontSize: 13, fontWeight: '800', color: '#FFF' },
});
