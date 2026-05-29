import React, { useState, useRef, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../constants/theme';
import { useApp } from '../contexts/AppContext';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
  actions?: { label: string; action: string }[];
}

const QUICK_REPLIES = [
  'Total outstanding?',
  'Today ka summary',
  'Top 5 defaulters',
  'Ahmed ka balance?',
  'Send reminders',
  'Weekly report',
];

export default function ChatAssistantScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { customers, transactions, formatCurrency, getTodayStats } = useApp();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Assalam o Alaikum! Main aapka KhataJi Assistant hoon. Kya madad chahiye?',
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }),
      actions: [
        { label: 'Balance Check', action: 'balance' },
        { label: 'Today Summary', action: 'summary' },
        { label: 'Send Reminder', action: 'reminder' },
      ],
    },
  ]);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const processQuery = useCallback((query: string): string => {
    const lower = query.toLowerCase();
    const stats = getTodayStats();

    if (lower.includes('outstanding') || lower.includes('total') || lower.includes('kitna baqaya')) {
      return `Total outstanding: ${formatCurrency(stats.outstanding)}\n\n${stats.totalCustomers} customers mein se ${customers.filter(c => c.balance > 0).length} ka udhaar baqi hai.`;
    }
    if (lower.includes('summary') || lower.includes('hisaab') || lower.includes('aaj')) {
      return `Today Summary:\n\n📤 Credit Given: ${formatCurrency(stats.todayCredit)}\n📥 Collection: ${formatCurrency(stats.todayCollection)}\n💰 Outstanding: ${formatCurrency(stats.outstanding)}\n👥 Total Customers: ${stats.totalCustomers}`;
    }
    if (lower.includes('defaulter') || lower.includes('top')) {
      const top5 = [...customers].sort((a, b) => b.balance - a.balance).slice(0, 5);
      let response = 'Top 5 Outstanding:\n\n';
      top5.forEach((c, i) => {
        response += `${i + 1}. ${c.name} - ${formatCurrency(c.balance)}\n`;
      });
      return response;
    }
    if (lower.includes('balance') || lower.includes('kitna')) {
      const nameMatch = lower.match(/(.+?)\s+ka\s+balance/);
      if (nameMatch) {
        const name = nameMatch[1].trim();
        const customer = customers.find(c => c.name.toLowerCase().includes(name));
        if (customer) {
          return `${customer.name} ka balance: ${formatCurrency(customer.balance)}\n\nTotal Credit: ${formatCurrency(customer.totalCredit)}\nTotal Paid: ${formatCurrency(customer.totalDebit)}`;
        }
        return `"${name}" naam ka koi customer nahi mila.`;
      }
      return 'Kisi customer ka naam batayen jis ka balance check karna hai.';
    }
    if (lower.includes('reminder') || lower.includes('yaad')) {
      const dueCustomers = customers.filter(c => c.balance > 0).length;
      return `${dueCustomers} customers ka udhaar baqi hai. Reminder bhejne ke liye Reminders screen use karein.\n\nKya main aur kuch madad kar sakta hoon?`;
    }
    if (lower.includes('report') || lower.includes('weekly')) {
      const weekTxns = transactions.filter(t => {
        const txnDate = new Date(t.date);
        const weekAgo = new Date(Date.now() - 7 * 86400000);
        return txnDate >= weekAgo;
      });
      const weekCredit = weekTxns.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
      const weekDebit = weekTxns.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
      return `This Week Report:\n\n📤 Credit: ${formatCurrency(weekCredit)}\n📥 Collection: ${formatCurrency(weekDebit)}\n📊 Transactions: ${weekTxns.length}\n\nNet: ${formatCurrency(weekCredit - weekDebit)} more credit than collection.`;
    }
    return 'Main samajh nahi paya. Please try:\n- "Total outstanding?"\n- "Ahmed ka balance"\n- "Today summary"\n- "Top defaulters"\n- "Weekly report"';
  }, [customers, transactions, formatCurrency, getTodayStats]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    setTimeout(() => {
      const response = processQuery(text);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, botMsg]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }, 800);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={theme.textDark} />
        </Pressable>
        <View style={styles.headerInfo}>
          <View style={styles.headerAvatar}>
            <MaterialIcons name="smart-toy" size={20} color="#FFF" />
          </View>
          <View>
            <Text style={styles.headerTitle}>KhataJi Assistant</Text>
            <Text style={styles.headerStatus}>Online</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          ref={scrollRef}
          style={styles.chatArea}
          contentContainerStyle={{ paddingVertical: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(msg => (
            <View key={msg.id} style={[styles.msgRow, msg.sender === 'user' && styles.msgRowUser]}>
              <View style={[styles.msgBubble, msg.sender === 'user' ? styles.userBubble : styles.botBubble]}>
                <Text style={[styles.msgText, msg.sender === 'user' && styles.userMsgText]}>{msg.text}</Text>
                <Text style={[styles.msgTime, msg.sender === 'user' && styles.userMsgTime]}>{msg.timestamp}</Text>
                {msg.actions && (
                  <View style={styles.actionsRow}>
                    {msg.actions.map(action => (
                      <Pressable key={action.action} style={styles.actionChip} onPress={() => sendMessage(action.label)}>
                        <Text style={styles.actionChipText}>{action.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Quick Replies */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickReplies} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {QUICK_REPLIES.map(reply => (
            <Pressable key={reply} style={styles.quickChip} onPress={() => sendMessage(reply)}>
              <Text style={styles.quickChipText}>{reply}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Input Area */}
        <View style={[styles.inputArea, { paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={theme.textMuted}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => sendMessage(inputText)}
            returnKeyType="send"
          />
          <Pressable style={styles.sendBtn} onPress={() => sendMessage(inputText)}>
            <MaterialIcons name="send" size={22} color="#FFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8F5E9' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 10, backgroundColor: theme.primary },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  headerStatus: { fontSize: 12, color: '#C8E6C9' },
  chatArea: { flex: 1, paddingHorizontal: 12 },
  msgRow: { marginBottom: 12 },
  msgRowUser: { alignItems: 'flex-end' },
  msgBubble: { maxWidth: '80%', padding: 12, borderRadius: 16 },
  botBubble: { backgroundColor: '#FFF', borderTopLeftRadius: 4, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  userBubble: { backgroundColor: theme.primary, borderTopRightRadius: 4 },
  msgText: { fontSize: 14, color: theme.textDark, lineHeight: 20 },
  userMsgText: { color: '#FFF' },
  msgTime: { fontSize: 10, color: theme.textMuted, marginTop: 4, alignSelf: 'flex-end' },
  userMsgTime: { color: 'rgba(255,255,255,0.7)' },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  actionChip: { backgroundColor: theme.backgroundSecondary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: theme.primary },
  actionChipText: { fontSize: 12, color: theme.primary, fontWeight: '600' },
  quickReplies: { maxHeight: 44, borderTopWidth: 1, borderTopColor: theme.borderLight, backgroundColor: '#FFF' },
  quickChip: { backgroundColor: theme.backgroundSecondary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: theme.border },
  quickChipText: { fontSize: 13, color: theme.textSecondary, fontWeight: '500' },
  inputArea: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 8, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: theme.borderLight },
  input: { flex: 1, backgroundColor: theme.background, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: theme.textDark, marginRight: 8 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' },
});
