import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Animated, Alert, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import * as Haptics from 'expo-haptics';

const COMMANDS = [
  { text: 'Ahmed ko 5000 udhaar do', icon: 'arrow-upward', color: theme.credit },
  { text: 'Bilal se 3000 wapas lo', icon: 'arrow-downward', color: theme.payment },
  { text: 'Aaj ka hisaab dikhao', icon: 'assessment', color: theme.primary },
  { text: 'Naya customer Rashid add karo', icon: 'person-add', color: '#1565C0' },
  { text: 'Ahmed ka balance batao', icon: 'account-balance', color: theme.warningDark },
  { text: 'Sab ka total outstanding kitna hai', icon: 'summarize', color: '#6A1B9A' },
];

export default function VoiceEntryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { customers, addTransaction, formatCurrency, getTodayStats } = useApp();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsedResult, setParsedResult] = useState<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ur'>('en');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(waveAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      waveAnim.setValue(0);
    }
  }, [isListening]);

  const parseCommand = useCallback((text: string) => {
    const lowerText = text.toLowerCase();
    // Parse credit command: "[Name] ko [amount] udhaar do"
    const creditMatch = lowerText.match(/(.+?)\s+ko\s+(\d+)\s+udhaar/);
    if (creditMatch) {
      const name = creditMatch[1].trim();
      const amount = parseInt(creditMatch[2]);
      const customer = customers.find(c => c.name.toLowerCase().includes(name));
      return { type: 'credit', name, amount, customer, action: 'Udhaar dena' };
    }
    // Parse payment: "[Name] se [amount] wapas lo"
    const debitMatch = lowerText.match(/(.+?)\s+se\s+(\d+)\s+wapas/);
    if (debitMatch) {
      const name = debitMatch[1].trim();
      const amount = parseInt(debitMatch[2]);
      const customer = customers.find(c => c.name.toLowerCase().includes(name));
      return { type: 'debit', name, amount, customer, action: 'Payment lena' };
    }
    // Parse balance check
    const balanceMatch = lowerText.match(/(.+?)\s+ka\s+balance/);
    if (balanceMatch) {
      const name = balanceMatch[1].trim();
      const customer = customers.find(c => c.name.toLowerCase().includes(name));
      return { type: 'balance', name, customer, action: 'Balance check' };
    }
    // Parse summary
    if (lowerText.includes('hisaab') || lowerText.includes('summary') || lowerText.includes('total')) {
      return { type: 'summary', action: 'Summary dikhana' };
    }
    return null;
  }, [customers]);

  const handleMicPress = () => {
    if (isListening) {
      setIsListening(false);
      // Simulate processing
      setTimeout(() => {
        if (transcript) {
          const result = parseCommand(transcript);
          if (result) {
            setParsedResult(result);
            setShowConfirmation(true);
          } else {
            Alert.alert('Not Understood', 'Could not understand the command. Please try again.');
          }
        }
      }, 500);
    } else {
      setIsListening(true);
      setTranscript('');
      setParsedResult(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleCommandPress = (command: string) => {
    setTranscript(command);
    const result = parseCommand(command);
    if (result) {
      setParsedResult(result);
      setShowConfirmation(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleConfirm = () => {
    if (!parsedResult) return;

    if (parsedResult.type === 'credit' && parsedResult.customer) {
      addTransaction({
        customerId: parsedResult.customer.id,
        customerName: parsedResult.customer.name,
        type: 'credit',
        amount: parsedResult.amount,
        note: `Voice: ${transcript}`,
        date: new Date().toISOString().split('T')[0],
      });
      Alert.alert('Done', `Rs. ${parsedResult.amount} credit added for ${parsedResult.customer.name}`);
    } else if (parsedResult.type === 'debit' && parsedResult.customer) {
      addTransaction({
        customerId: parsedResult.customer.id,
        customerName: parsedResult.customer.name,
        type: 'debit',
        amount: parsedResult.amount,
        note: `Voice: ${transcript}`,
        paymentMethod: 'cash',
        date: new Date().toISOString().split('T')[0],
      });
      Alert.alert('Done', `Rs. ${parsedResult.amount} payment received from ${parsedResult.customer.name}`);
    } else if (parsedResult.type === 'balance' && parsedResult.customer) {
      Alert.alert('Balance', `${parsedResult.customer.name}: ${formatCurrency(parsedResult.customer.balance)}`);
    } else if (parsedResult.type === 'summary') {
      const stats = getTodayStats();
      Alert.alert('Today Summary', `Credit: ${formatCurrency(stats.todayCredit)}\nCollection: ${formatCurrency(stats.todayCollection)}\nOutstanding: ${formatCurrency(stats.outstanding)}`);
    }
    setShowConfirmation(false);
    setTranscript('');
    setParsedResult(null);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={theme.textDark} />
        </Pressable>
        <Text style={styles.headerTitle}>Voice Entry</Text>
        <Pressable
          style={styles.langBtn}
          onPress={() => setLanguage(language === 'en' ? 'ur' : 'en')}
        >
          <Text style={styles.langBtnText}>{language === 'en' ? 'اردو' : 'EN'}</Text>
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        {/* Status Area */}
        <View style={styles.statusArea}>
          {isListening ? (
            <View style={styles.listeningBox}>
              <View style={styles.waveContainer}>
                {[...Array(5)].map((_, i) => (
                  <Animated.View
                    key={i}
                    style={[styles.wavebar, {
                      transform: [{ scaleY: waveAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.4 + Math.random() * 0.8] }) }],
                      backgroundColor: theme.primary,
                      opacity: 0.6 + i * 0.08,
                    }]}
                  />
                ))}
              </View>
              <Text style={styles.listeningText}>Listening...</Text>
              <Text style={styles.langHint}>{language === 'en' ? 'Speak in English or Urdu' : 'اردو یا انگریزی میں بولیں'}</Text>
            </View>
          ) : transcript ? (
            <View style={styles.transcriptBox}>
              <MaterialIcons name="format-quote" size={20} color={theme.textMuted} />
              <Text style={styles.transcriptText}>{transcript}</Text>
            </View>
          ) : (
            <View style={styles.idleBox}>
              <MaterialIcons name="mic" size={40} color={theme.textMuted} />
              <Text style={styles.idleText}>Tap mic to start speaking</Text>
              <Text style={styles.idleHint}>Or tap a command below</Text>
            </View>
          )}
        </View>

        {/* Mic Button */}
        <View style={styles.micContainer}>
          <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }], opacity: isListening ? 0.3 : 0 }]} />
          <Pressable
            style={[styles.micButton, isListening && styles.micButtonActive]}
            onPress={handleMicPress}
          >
            <MaterialIcons name={isListening ? 'stop' : 'mic'} size={36} color="#FFF" />
          </Pressable>
          <Text style={styles.micLabel}>{isListening ? 'Tap to stop' : 'Tap to speak'}</Text>
        </View>

        {/* Suggested Commands */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suggested Commands</Text>
          {COMMANDS.map((cmd, index) => (
            <Pressable
              key={index}
              style={styles.commandCard}
              onPress={() => handleCommandPress(cmd.text)}
            >
              <View style={[styles.commandIcon, { backgroundColor: cmd.color + '20' }]}>
                <MaterialIcons name={cmd.icon as any} size={20} color={cmd.color} />
              </View>
              <Text style={styles.commandText}>{cmd.text}</Text>
              <MaterialIcons name="play-arrow" size={20} color={theme.textMuted} />
            </Pressable>
          ))}
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <MaterialIcons name="lightbulb" size={20} color={theme.warningDark} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.tipsTitle}>Tips</Text>
            <Text style={styles.tipsText}>Say customer name clearly followed by amount. Works in Urdu and English.</Text>
          </View>
        </View>
      </ScrollView>

      {/* Confirmation Dialog */}
      {showConfirmation && parsedResult && (
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmModal}>
            <View style={styles.confirmHeader}>
              <MaterialIcons name="check-circle" size={40} color={theme.primary} />
              <Text style={styles.confirmTitle}>Confirm Action</Text>
            </View>
            <View style={styles.confirmBody}>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Action:</Text>
                <Text style={styles.confirmValue}>{parsedResult.action}</Text>
              </View>
              {parsedResult.customer && (
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>Customer:</Text>
                  <Text style={styles.confirmValue}>{parsedResult.customer.name}</Text>
                </View>
              )}
              {parsedResult.amount && (
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>Amount:</Text>
                  <Text style={[styles.confirmValue, { color: parsedResult.type === 'credit' ? theme.credit : theme.payment }]}>
                    {formatCurrency(parsedResult.amount)}
                  </Text>
                </View>
              )}
              {!parsedResult.customer && parsedResult.name && (
                <View style={styles.confirmWarning}>
                  <MaterialIcons name="warning" size={16} color={theme.warningDark} />
                  <Text style={styles.confirmWarningText}>Customer "{parsedResult.name}" not found</Text>
                </View>
              )}
            </View>
            <View style={styles.confirmActions}>
              <Pressable style={styles.confirmCancelBtn} onPress={() => { setShowConfirmation(false); setParsedResult(null); }}>
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmOkBtn, !parsedResult.customer && parsedResult.type !== 'summary' && { opacity: 0.5 }]}
                onPress={handleConfirm}
                disabled={!parsedResult.customer && parsedResult.type !== 'summary'}
              >
                <Text style={styles.confirmOkText}>Confirm</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.borderLight },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },
  langBtn: { backgroundColor: theme.primary, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  langBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  statusArea: { marginHorizontal: 16, marginTop: 24, minHeight: 120, justifyContent: 'center', alignItems: 'center' },
  listeningBox: { alignItems: 'center' },
  waveContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 50 },
  wavebar: { width: 4, height: 40, borderRadius: 2 },
  listeningText: { fontSize: 18, fontWeight: '700', color: theme.primary, marginTop: 12 },
  langHint: { fontSize: 13, color: theme.textMuted, marginTop: 4 },
  transcriptBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: theme.surface, padding: 16, borderRadius: theme.borderRadius.md, gap: 8, width: '100%', ...theme.cardShadow },
  transcriptText: { flex: 1, fontSize: 16, color: theme.textDark, lineHeight: 24 },
  idleBox: { alignItems: 'center' },
  idleText: { fontSize: 16, color: theme.textSecondary, marginTop: 12, fontWeight: '500' },
  idleHint: { fontSize: 13, color: theme.textMuted, marginTop: 4 },
  micContainer: { alignItems: 'center', marginTop: 32 },
  pulseRing: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: theme.primary },
  micButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  micButtonActive: { backgroundColor: theme.credit },
  micLabel: { fontSize: 13, color: theme.textMuted, marginTop: 12, fontWeight: '500' },
  section: { marginTop: 32, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  commandCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, padding: 14, borderRadius: theme.borderRadius.md, marginBottom: 8, ...theme.cardShadow },
  commandIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  commandText: { flex: 1, fontSize: 14, color: theme.textDark, fontWeight: '500', marginLeft: 12 },
  tipsCard: { flexDirection: 'row', marginHorizontal: 16, marginTop: 24, backgroundColor: '#FFF8E1', borderRadius: theme.borderRadius.md, padding: 14, borderWidth: 1, borderColor: '#FFE082' },
  tipsTitle: { fontSize: 14, fontWeight: '700', color: theme.warningDark },
  tipsText: { fontSize: 13, color: theme.textSecondary, marginTop: 2, lineHeight: 18 },
  confirmOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  confirmModal: { backgroundColor: theme.surface, borderRadius: theme.borderRadius.xl, width: '100%', maxWidth: 340, overflow: 'hidden' },
  confirmHeader: { alignItems: 'center', paddingTop: 24, paddingBottom: 16 },
  confirmTitle: { fontSize: 18, fontWeight: '700', color: theme.textDark, marginTop: 8 },
  confirmBody: { paddingHorizontal: 24, paddingBottom: 20 },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.borderLight },
  confirmLabel: { fontSize: 14, color: theme.textMuted },
  confirmValue: { fontSize: 14, fontWeight: '700', color: theme.textDark },
  confirmWarning: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF3E0', padding: 10, borderRadius: 8, marginTop: 12 },
  confirmWarningText: { fontSize: 12, color: theme.warningDark, fontWeight: '500' },
  confirmActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: theme.borderLight },
  confirmCancelBtn: { flex: 1, paddingVertical: 16, alignItems: 'center', borderRightWidth: 1, borderRightColor: theme.borderLight },
  confirmCancelText: { fontSize: 15, color: theme.textSecondary, fontWeight: '600' },
  confirmOkBtn: { flex: 1, paddingVertical: 16, alignItems: 'center', backgroundColor: theme.backgroundSecondary },
  confirmOkText: { fontSize: 15, color: theme.primary, fontWeight: '700' },
});
