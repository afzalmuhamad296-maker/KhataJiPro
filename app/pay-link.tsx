import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Share, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';

interface PayLink {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  link: string;
  status: 'generated' | 'viewed' | 'paid' | 'expired';
  paymentMethod?: string;
  createdAt: string;
  expiresAt: string;
  viewedAt?: string;
  paidAt?: string;
}

const PAYMENT_OPTIONS = [
  { key: 'jazzcash', label: 'JazzCash', icon: 'phone-android', color: '#E2192D', account: '0300-1234567' },
  { key: 'easypaisa', label: 'EasyPaisa', icon: 'account-balance-wallet', color: '#4CAF50', account: '0345-9876543' },
  { key: 'bank', label: 'Bank Transfer', icon: 'account-balance', color: '#1565C0', account: 'HBL 1234-5678-9012' },
  { key: 'cash', label: 'Cash', icon: 'payments', color: '#FF9800', account: 'Visit shop' },
];

export default function PayLinkScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { customers, formatCurrency, settings } = useApp();
  const [links, setLinks] = useState<PayLink[]>([
    { id: '1', customerId: '6', customerName: 'Farhan Malik', amount: 45000, link: 'https://khataji.pay/f7x9k2', status: 'viewed', createdAt: '2026-05-25', expiresAt: '2026-06-01', viewedAt: '2026-05-26' },
    { id: '2', customerId: '3', customerName: 'Chaudhry Rashid', amount: 22000, link: 'https://khataji.pay/m3p8w1', status: 'paid', createdAt: '2026-05-22', expiresAt: '2026-05-29', viewedAt: '2026-05-23', paidAt: '2026-05-24', paymentMethod: 'JazzCash' },
    { id: '3', customerId: '14', customerName: 'Nadeem Butt', amount: 31000, link: 'https://khataji.pay/q5n2v8', status: 'generated', createdAt: '2026-05-28', expiresAt: '2026-06-04' },
    { id: '4', customerId: '18', customerName: 'Rizwan Aslam', amount: 28500, link: 'https://khataji.pay/t1j4x6', status: 'expired', createdAt: '2026-05-15', expiresAt: '2026-05-22' },
  ]);
  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [filter, setFilter] = useState<'all' | 'generated' | 'viewed' | 'paid' | 'expired'>('all');
  const [generatedLink, setGeneratedLink] = useState<PayLink | null>(null);

  const dueCustomers = customers.filter(c => c.balance > 0).sort((a, b) => b.balance - a.balance);
  const filteredLinks = links.filter(l => filter === 'all' || l.status === filter);

  const statsData = {
    total: links.length,
    generated: links.filter(l => l.status === 'generated').length,
    viewed: links.filter(l => l.status === 'viewed').length,
    paid: links.filter(l => l.status === 'paid').length,
    expired: links.filter(l => l.status === 'expired').length,
    totalCollected: links.filter(l => l.status === 'paid').reduce((s, l) => s + l.amount, 0),
  };

  const generateLink = () => {
    if (!selectedCustomer) {
      Alert.alert('Error', 'Please select a customer');
      return;
    }
    const customer = customers.find(c => c.id === selectedCustomer);
    if (!customer) return;

    const linkId = Math.random().toString(36).substring(2, 8);
    const newLink: PayLink = {
      id: Date.now().toString(),
      customerId: customer.id,
      customerName: customer.name,
      amount: customer.balance,
      link: `https://khataji.pay/${linkId}`,
      status: 'generated',
      createdAt: new Date().toISOString().split('T')[0],
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    };
    setLinks(prev => [newLink, ...prev]);
    setGeneratedLink(newLink);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleShareLink = async (link: PayLink) => {
    const customer = customers.find(c => c.id === link.customerId);
    const message = `Assalam o Alaikum ${link.customerName},\n\nYour outstanding balance at ${settings.shopName} is ${formatCurrency(link.amount)}.\n\nPay online: ${link.link}\n\nPayment Options:\n${PAYMENT_OPTIONS.map(p => `${p.label}: ${p.account}`).join('\n')}\n\nLink expires: ${link.expiresAt}\n\nThank you!\n- ${settings.shopName}`;
    try {
      await Share.share({ message });
    } catch {
      // cancelled
    }
  };

  const handleCopyLink = async (link: string) => {
    await Clipboard.setStringAsync(link);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied', 'Payment link copied to clipboard');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'generated': return '#2196F3';
      case 'viewed': return '#FF9800';
      case 'paid': return theme.payment;
      case 'expired': return theme.textMuted;
      default: return theme.textMuted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'generated': return 'link';
      case 'viewed': return 'visibility';
      case 'paid': return 'check-circle';
      case 'expired': return 'timer-off';
      default: return 'help';
    }
  };

  // Generated Link Success View
  if (generatedLink) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => setGeneratedLink(null)} style={styles.backBtn}>
            <MaterialIcons name="close" size={24} color={theme.textDark} />
          </Pressable>
          <Text style={styles.headerTitle}>Link Generated</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
          {/* Success Card */}
          <View style={styles.successCard}>
            <View style={styles.successIconCircle}>
              <MaterialIcons name="check-circle" size={48} color={theme.payment} />
            </View>
            <Text style={styles.successTitle}>Payment Link Ready!</Text>
            <Text style={styles.successSubtitle}>Share this link with {generatedLink.customerName}</Text>
          </View>

          {/* Link Preview Card */}
          <View style={styles.linkPreviewCard}>
            <Text style={styles.previewShopName}>{settings.shopName}</Text>
            <View style={styles.previewDivider} />
            <Text style={styles.previewLabel}>Customer</Text>
            <Text style={styles.previewValue}>{generatedLink.customerName}</Text>
            <Text style={styles.previewLabel}>Amount Due</Text>
            <Text style={[styles.previewAmount, { color: theme.credit }]}>{formatCurrency(generatedLink.amount)}</Text>
            <View style={styles.previewDivider} />
            <Text style={styles.previewLabel}>Payment Options</Text>
            {PAYMENT_OPTIONS.map(opt => (
              <View key={opt.key} style={styles.previewPayOption}>
                <View style={[styles.previewPayIcon, { backgroundColor: opt.color + '15' }]}>
                  <MaterialIcons name={opt.icon as any} size={18} color={opt.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.previewPayName}>{opt.label}</Text>
                  <Text style={styles.previewPayAccount}>{opt.account}</Text>
                </View>
              </View>
            ))}
            <View style={styles.previewDivider} />
            <View style={styles.previewLinkRow}>
              <MaterialIcons name="link" size={16} color={theme.primary} />
              <Text style={styles.previewLinkText}>{generatedLink.link}</Text>
            </View>
            <Text style={styles.previewExpiry}>Expires: {generatedLink.expiresAt}</Text>
          </View>

          {/* Share Actions */}
          <View style={styles.shareActions}>
            <Pressable style={[styles.shareBtn, { backgroundColor: '#25D366' }]} onPress={() => handleShareLink(generatedLink)}>
              <MaterialIcons name="chat" size={20} color="#FFF" />
              <Text style={styles.shareBtnText}>WhatsApp</Text>
            </Pressable>
            <Pressable style={[styles.shareBtn, { backgroundColor: theme.primary }]} onPress={() => handleCopyLink(generatedLink.link)}>
              <MaterialIcons name="content-copy" size={20} color="#FFF" />
              <Text style={styles.shareBtnText}>Copy Link</Text>
            </Pressable>
          </View>
          <Pressable style={[styles.shareBtn, { backgroundColor: '#1565C0', marginTop: 8 }]} onPress={() => handleShareLink(generatedLink)}>
            <MaterialIcons name="share" size={20} color="#FFF" />
            <Text style={styles.shareBtnText}>Share via Other Apps</Text>
          </Pressable>

          <Pressable style={styles.doneBtn} onPress={() => { setGeneratedLink(null); setShowGenerator(false); setSelectedCustomer(null); }}>
            <Text style={styles.doneBtnText}>Done</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Generator View
  if (showGenerator) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => { setShowGenerator(false); setSelectedCustomer(null); setShowCustomerPicker(false); }} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color={theme.textDark} />
          </Pressable>
          <Text style={styles.headerTitle}>Generate Pay Link</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
          {/* Info */}
          <View style={styles.infoCard}>
            <MaterialIcons name="info-outline" size={20} color={theme.primary} />
            <Text style={styles.infoText}>
              Generate a payment link that shows your customer their balance and how to pay. Share via WhatsApp or SMS.
            </Text>
          </View>

          {/* Customer Selection */}
          <Text style={styles.formLabel}>Select Customer</Text>
          <Pressable style={styles.customerPicker} onPress={() => setShowCustomerPicker(!showCustomerPicker)}>
            {selectedCustomer ? (
              <View style={styles.pickerSelected}>
                <View style={styles.pickerAvatar}>
                  <Text style={styles.pickerAvatarText}>
                    {customers.find(c => c.id === selectedCustomer)?.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pickerName}>{customers.find(c => c.id === selectedCustomer)?.name}</Text>
                  <Text style={styles.pickerBalance}>
                    Balance: {formatCurrency(customers.find(c => c.id === selectedCustomer)?.balance || 0)}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.pickerPlaceholder}>Choose a customer with outstanding balance</Text>
            )}
            <MaterialIcons name="arrow-drop-down" size={24} color={theme.textMuted} />
          </Pressable>

          {showCustomerPicker && (
            <View style={styles.customerDropdown}>
              <ScrollView style={{ maxHeight: 250 }} showsVerticalScrollIndicator={false}>
                {dueCustomers.slice(0, 15).map(c => (
                  <Pressable
                    key={c.id}
                    style={[styles.customerOption, selectedCustomer === c.id && styles.customerOptionActive]}
                    onPress={() => { setSelectedCustomer(c.id); setShowCustomerPicker(false); }}
                  >
                    <View>
                      <Text style={styles.customerOptionName}>{c.name}</Text>
                      <Text style={styles.customerOptionPhone}>{c.phone}</Text>
                    </View>
                    <Text style={styles.customerOptionBalance}>{formatCurrency(c.balance)}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Payment Options Preview */}
          <Text style={[styles.formLabel, { marginTop: 24 }]}>Payment Options (included in link)</Text>
          {PAYMENT_OPTIONS.map(opt => (
            <View key={opt.key} style={styles.payOptionRow}>
              <View style={[styles.payOptionIcon, { backgroundColor: opt.color + '15' }]}>
                <MaterialIcons name={opt.icon as any} size={20} color={opt.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.payOptionName}>{opt.label}</Text>
                <Text style={styles.payOptionAccount}>{opt.account}</Text>
              </View>
              <MaterialIcons name="check-circle" size={20} color={theme.payment} />
            </View>
          ))}

          {/* Link Settings */}
          <Text style={[styles.formLabel, { marginTop: 24 }]}>Link Settings</Text>
          <View style={styles.settingRow}>
            <MaterialIcons name="timer" size={20} color={theme.textSecondary} />
            <Text style={styles.settingText}>Expires in 7 days</Text>
          </View>
          <View style={styles.settingRow}>
            <MaterialIcons name="notifications" size={20} color={theme.textSecondary} />
            <Text style={styles.settingText}>Notify when customer views link</Text>
          </View>
          <View style={styles.settingRow}>
            <MaterialIcons name="verified" size={20} color={theme.textSecondary} />
            <Text style={styles.settingText}>Auto-confirm when payment received</Text>
          </View>

          {/* Generate Button */}
          <Pressable style={styles.generateBtn} onPress={generateLink}>
            <MaterialIcons name="link" size={22} color="#FFF" />
            <Text style={styles.generateBtnText}>Generate Payment Link</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Main List View
  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={theme.textDark} />
        </Pressable>
        <Text style={styles.headerTitle}>Digital Pay Links</Text>
        <Pressable style={styles.addBtn} onPress={() => setShowGenerator(true)}>
          <MaterialIcons name="add-link" size={20} color="#FFF" />
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 16 }} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderLeftColor: '#2196F3' }]}>
            <Text style={styles.statNum}>{statsData.total}</Text>
            <Text style={styles.statLabel}>Total Links</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: theme.payment }]}>
            <Text style={[styles.statNum, { color: theme.payment }]}>{statsData.paid}</Text>
            <Text style={styles.statLabel}>Paid</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#FF9800' }]}>
            <Text style={[styles.statNum, { color: '#FF9800' }]}>{statsData.viewed}</Text>
            <Text style={styles.statLabel}>Viewed</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: theme.primary }]}>
            <Text style={[styles.statNum, { color: theme.primary }]}>{formatCurrency(statsData.totalCollected)}</Text>
            <Text style={styles.statLabel}>Collected</Text>
          </View>
        </View>

        {/* Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {(['all', 'generated', 'viewed', 'paid', 'expired'] as const).map(f => (
            <Pressable key={f} style={[styles.filterChip, filter === f && styles.filterChipActive]} onPress={() => setFilter(f)}>
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Links List */}
        <View style={{ padding: 16 }}>
          {filteredLinks.map(link => (
            <View key={link.id} style={styles.linkCard}>
              <View style={styles.linkTop}>
                <View style={styles.linkLeft}>
                  <View style={[styles.statusIcon, { backgroundColor: getStatusColor(link.status) + '20' }]}>
                    <MaterialIcons name={getStatusIcon(link.status) as any} size={18} color={getStatusColor(link.status)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.linkCustomer}>{link.customerName}</Text>
                    <Text style={styles.linkUrl}>{link.link}</Text>
                  </View>
                </View>
                <Text style={[styles.linkAmount, { color: link.status === 'paid' ? theme.payment : theme.credit }]}>
                  {formatCurrency(link.amount)}
                </Text>
              </View>

              {/* Timeline */}
              <View style={styles.timeline}>
                <View style={styles.timelineItem}>
                  <View style={[styles.timelineDot, { backgroundColor: '#2196F3' }]} />
                  <Text style={styles.timelineText}>Created: {link.createdAt}</Text>
                </View>
                {link.viewedAt ? (
                  <View style={styles.timelineItem}>
                    <View style={[styles.timelineDot, { backgroundColor: '#FF9800' }]} />
                    <Text style={styles.timelineText}>Viewed: {link.viewedAt}</Text>
                  </View>
                ) : null}
                {link.paidAt ? (
                  <View style={styles.timelineItem}>
                    <View style={[styles.timelineDot, { backgroundColor: theme.payment }]} />
                    <Text style={styles.timelineText}>Paid: {link.paidAt} via {link.paymentMethod}</Text>
                  </View>
                ) : null}
                {link.status === 'expired' ? (
                  <View style={styles.timelineItem}>
                    <View style={[styles.timelineDot, { backgroundColor: theme.textMuted }]} />
                    <Text style={styles.timelineText}>Expired: {link.expiresAt}</Text>
                  </View>
                ) : null}
              </View>

              {/* Actions */}
              <View style={styles.linkActions}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(link.status) + '15' }]}>
                  <Text style={[styles.statusBadgeText, { color: getStatusColor(link.status) }]}>{link.status}</Text>
                </View>
                {link.status !== 'expired' && link.status !== 'paid' ? (
                  <View style={styles.linkActionBtns}>
                    <Pressable style={styles.linkActionBtn} onPress={() => handleCopyLink(link.link)}>
                      <MaterialIcons name="content-copy" size={16} color={theme.primary} />
                    </Pressable>
                    <Pressable style={[styles.linkActionBtn, { backgroundColor: '#25D366' + '20' }]} onPress={() => handleShareLink(link)}>
                      <MaterialIcons name="chat" size={16} color="#25D366" />
                    </Pressable>
                    <Pressable style={[styles.linkActionBtn, { backgroundColor: '#1565C0' + '20' }]} onPress={() => handleShareLink(link)}>
                      <MaterialIcons name="share" size={16} color="#1565C0" />
                    </Pressable>
                  </View>
                ) : null}
              </View>
            </View>
          ))}

          {filteredLinks.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialIcons name="link-off" size={56} color={theme.border} />
              <Text style={styles.emptyText}>No payment links found</Text>
              <Pressable style={styles.emptyBtn} onPress={() => setShowGenerator(true)}>
                <Text style={styles.emptyBtnText}>Generate First Link</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.borderLight },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' },

  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 8 },
  statCard: { width: '48%', backgroundColor: theme.surface, borderRadius: theme.borderRadius.md, padding: 14, borderLeftWidth: 3, ...theme.cardShadow },
  statNum: { fontSize: 18, fontWeight: '700', color: theme.textDark },
  statLabel: { fontSize: 11, color: theme.textMuted, marginTop: 2 },

  // Filter
  filterScroll: { maxHeight: 44 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  filterChipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  filterText: { fontSize: 13, fontWeight: '600', color: theme.textSecondary },
  filterTextActive: { color: '#FFF' },

  // Link Card
  linkCard: { backgroundColor: theme.surface, borderRadius: theme.borderRadius.md, padding: 16, marginBottom: 12, ...theme.cardShadow },
  linkTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  linkLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  statusIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  linkCustomer: { fontSize: 15, fontWeight: '600', color: theme.textDark },
  linkUrl: { fontSize: 11, color: theme.primary, marginTop: 2 },
  linkAmount: { fontSize: 16, fontWeight: '700' },
  timeline: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.borderLight, paddingLeft: 8 },
  timelineItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  timelineDot: { width: 8, height: 8, borderRadius: 4 },
  timelineText: { fontSize: 12, color: theme.textMuted },
  linkActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.borderLight },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusBadgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  linkActionBtns: { flexDirection: 'row', gap: 8 },
  linkActionBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },

  // Generator
  infoCard: { flexDirection: 'row', gap: 10, backgroundColor: theme.primary + '10', padding: 14, borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: theme.primary + '30' },
  infoText: { flex: 1, fontSize: 13, color: theme.textSecondary, lineHeight: 19 },
  formLabel: { fontSize: 13, fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 16 },
  customerPicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.surface, padding: 14, borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: theme.border },
  pickerSelected: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  pickerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  pickerAvatarText: { fontSize: 13, fontWeight: '700', color: theme.primary },
  pickerName: { fontSize: 15, fontWeight: '600', color: theme.textDark },
  pickerBalance: { fontSize: 12, color: theme.credit, fontWeight: '600', marginTop: 2 },
  pickerPlaceholder: { fontSize: 14, color: theme.textMuted },
  customerDropdown: { backgroundColor: theme.surface, borderRadius: theme.borderRadius.md, marginTop: 6, borderWidth: 1, borderColor: theme.border, overflow: 'hidden' },
  customerOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: theme.borderLight },
  customerOptionActive: { backgroundColor: theme.backgroundSecondary },
  customerOptionName: { fontSize: 14, fontWeight: '600', color: theme.textDark },
  customerOptionPhone: { fontSize: 11, color: theme.textMuted, marginTop: 1 },
  customerOptionBalance: { fontSize: 13, fontWeight: '700', color: theme.credit },
  payOptionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.surface, padding: 12, borderRadius: theme.borderRadius.sm, marginBottom: 6, borderWidth: 1, borderColor: theme.borderLight },
  payOptionIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  payOptionName: { fontSize: 14, fontWeight: '600', color: theme.textDark },
  payOptionAccount: { fontSize: 12, color: theme.textMuted, marginTop: 1 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.borderLight },
  settingText: { fontSize: 14, color: theme.textDark },
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: theme.primary, paddingVertical: 16, borderRadius: theme.borderRadius.md, marginTop: 32 },
  generateBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  // Success View
  successCard: { alignItems: 'center', paddingVertical: 32, backgroundColor: theme.surface, borderRadius: theme.borderRadius.lg, ...theme.cardShadow },
  successIconCircle: { marginBottom: 12 },
  successTitle: { fontSize: 20, fontWeight: '700', color: theme.textDark },
  successSubtitle: { fontSize: 14, color: theme.textMuted, marginTop: 4 },
  linkPreviewCard: { backgroundColor: theme.surface, borderRadius: theme.borderRadius.md, padding: 20, marginTop: 16, borderWidth: 1.5, borderColor: theme.primary + '40', ...theme.cardShadow },
  previewShopName: { fontSize: 16, fontWeight: '700', color: theme.primary, textAlign: 'center' },
  previewDivider: { height: 1, backgroundColor: theme.borderLight, marginVertical: 14 },
  previewLabel: { fontSize: 11, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  previewValue: { fontSize: 15, fontWeight: '600', color: theme.textDark, marginTop: 2, marginBottom: 12 },
  previewAmount: { fontSize: 22, fontWeight: '700', marginTop: 4, marginBottom: 12 },
  previewPayOption: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  previewPayIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  previewPayName: { fontSize: 13, fontWeight: '600', color: theme.textDark },
  previewPayAccount: { fontSize: 11, color: theme.textMuted },
  previewLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.backgroundSecondary, padding: 10, borderRadius: 8 },
  previewLinkText: { fontSize: 13, color: theme.primary, fontWeight: '600' },
  previewExpiry: { fontSize: 11, color: theme.textMuted, marginTop: 8, textAlign: 'center' },
  shareActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  shareBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: theme.borderRadius.md },
  shareBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  doneBtn: { marginTop: 24, paddingVertical: 14, borderRadius: theme.borderRadius.md, borderWidth: 1.5, borderColor: theme.border, alignItems: 'center' },
  doneBtnText: { fontSize: 15, fontWeight: '600', color: theme.textSecondary },

  // Empty
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, color: theme.textMuted, marginTop: 12 },
  emptyBtn: { backgroundColor: theme.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: theme.borderRadius.md, marginTop: 16 },
  emptyBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});
