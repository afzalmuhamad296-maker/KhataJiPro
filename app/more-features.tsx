import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Switch, Alert, Share } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../constants/theme';
import { useApp } from '../contexts/AppContext';

export default function MoreFeaturesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { settings, customers, formatCurrency } = useApp();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Multi-business data
  const [businesses] = useState([
    { id: '1', name: settings.shopName, customers: customers.length, active: true },
    { id: '2', name: 'Malik Cloth House', customers: 15, active: false },
  ]);

  // Backup data
  const [lastBackup] = useState('2026-05-28 10:30 AM');
  const [autoBackup, setAutoBackup] = useState(true);

  const sections = [
    {
      key: 'backup', icon: 'backup', title: 'Cloud Backup', subtitle: `Last: ${lastBackup}`,
      color: '#1565C0',
      content: (
        <View style={styles.sectionContent}>
          <View style={styles.backupInfo}>
            <MaterialIcons name="cloud-done" size={40} color="#1565C0" />
            <Text style={styles.backupText}>Last backup: {lastBackup}</Text>
            <Text style={styles.backupSize}>Size: 2.3 MB</Text>
          </View>
          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Auto Backup (Daily)</Text>
            <Switch value={autoBackup} onValueChange={setAutoBackup} trackColor={{ false: theme.border, true: theme.primaryLight }} thumbColor={autoBackup ? theme.primary : '#f4f3f4'} />
          </View>
          <Pressable style={[styles.actionButton, { backgroundColor: '#1565C0' }]} onPress={() => Alert.alert('Backup', 'Backup completed successfully!')}>
            <MaterialIcons name="backup" size={20} color="#FFF" />
            <Text style={styles.actionButtonText}>Backup Now</Text>
          </Pressable>
          <Pressable style={[styles.actionButton, { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border }]} onPress={() => Alert.alert('Restore', 'Data restored from last backup!')}>
            <MaterialIcons name="restore" size={20} color={theme.primary} />
            <Text style={[styles.actionButtonText, { color: theme.primary }]}>Restore</Text>
          </Pressable>
        </View>
      ),
    },
    {
      key: 'multi', icon: 'business', title: 'Multi-Business', subtitle: `${businesses.length} businesses`,
      color: '#6A1B9A',
      content: (
        <View style={styles.sectionContent}>
          {businesses.map(biz => (
            <View key={biz.id} style={[styles.bizCard, biz.active && styles.bizCardActive]}>
              <View style={styles.bizLeft}>
                <MaterialIcons name="store" size={22} color={biz.active ? theme.primary : theme.textMuted} />
                <View>
                  <Text style={styles.bizName}>{biz.name}</Text>
                  <Text style={styles.bizCustomers}>{biz.customers} customers</Text>
                </View>
              </View>
              {biz.active && <View style={styles.activeBadge}><Text style={styles.activeBadgeText}>Active</Text></View>}
            </View>
          ))}
          <Pressable style={styles.addBizBtn} onPress={() => Alert.alert('Add Business', 'Create new business profile?')}>
            <MaterialIcons name="add" size={20} color={theme.primary} />
            <Text style={styles.addBizText}>Add New Business</Text>
          </Pressable>
        </View>
      ),
    },
    {
      key: 'export', icon: 'file-download', title: 'Import / Export', subtitle: 'CSV, JSON, Excel',
      color: '#00796B',
      content: (
        <View style={styles.sectionContent}>
          <Text style={styles.exportTitle}>Export Data</Text>
          <View style={styles.exportRow}>
            <Pressable style={styles.exportBtn} onPress={() => Alert.alert('Export', 'CSV file exported!')}>
              <MaterialIcons name="table-chart" size={24} color="#00796B" />
              <Text style={styles.exportBtnText}>CSV</Text>
            </Pressable>
            <Pressable style={styles.exportBtn} onPress={() => Alert.alert('Export', 'JSON file exported!')}>
              <MaterialIcons name="code" size={24} color="#1565C0" />
              <Text style={styles.exportBtnText}>JSON</Text>
            </Pressable>
            <Pressable style={styles.exportBtn} onPress={() => Alert.alert('Export', 'Excel file exported!')}>
              <MaterialIcons name="description" size={24} color="#2E7D32" />
              <Text style={styles.exportBtnText}>Excel</Text>
            </Pressable>
          </View>
          <Text style={[styles.exportTitle, { marginTop: 16 }]}>Import Data</Text>
          <Pressable style={[styles.actionButton, { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border }]}>
            <MaterialIcons name="file-upload" size={20} color={theme.primary} />
            <Text style={[styles.actionButtonText, { color: theme.primary }]}>Import from File</Text>
          </Pressable>
        </View>
      ),
    },
    {
      key: 'share', icon: 'share', title: 'Share App', subtitle: 'Invite shopkeepers',
      color: '#E65100',
      content: (
        <View style={styles.sectionContent}>
          <View style={styles.shareCard}>
            <MaterialIcons name="card-giftcard" size={40} color={theme.primary} />
            <Text style={styles.shareTitle}>Share KhataJi Pro</Text>
            <Text style={styles.shareSubtitle}>Help other shopkeepers manage their udhaar</Text>
            <View style={styles.shareActions}>
              <Pressable style={[styles.shareBtn, { backgroundColor: '#25D366' }]} onPress={() => Share.share({ message: 'Try KhataJi Pro - Best udhaar management app for shopkeepers! Download now.' })}>
                <MaterialIcons name="chat" size={18} color="#FFF" />
                <Text style={styles.shareBtnText}>WhatsApp</Text>
              </Pressable>
              <Pressable style={[styles.shareBtn, { backgroundColor: '#1565C0' }]} onPress={() => Share.share({ message: 'Try KhataJi Pro app for your shop!' })}>
                <MaterialIcons name="mail" size={18} color="#FFF" />
                <Text style={styles.shareBtnText}>Email</Text>
              </Pressable>
              <Pressable style={[styles.shareBtn, { backgroundColor: theme.textDark }]} onPress={() => Alert.alert('Copied', 'Link copied to clipboard!')}>
                <MaterialIcons name="content-copy" size={18} color="#FFF" />
                <Text style={styles.shareBtnText}>Copy</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ),
    },
    {
      key: 'feedback', icon: 'rate-review', title: 'Feedback', subtitle: 'Rate & Review',
      color: '#F9A825',
      content: (
        <View style={styles.sectionContent}>
          <Text style={styles.feedbackTitle}>How is your experience?</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(star => (
              <Pressable key={star} onPress={() => Alert.alert('Thank You!', 'Your feedback helps us improve.')}>
                <MaterialIcons name="star" size={40} color={star <= 4 ? '#F9A825' : theme.border} />
              </Pressable>
            ))}
          </View>
          <Pressable style={[styles.actionButton, { backgroundColor: '#F9A825' }]} onPress={() => Alert.alert('Submitted', 'Thank you for your feedback!')}>
            <Text style={[styles.actionButtonText, { color: '#FFF' }]}>Submit Rating</Text>
          </Pressable>
        </View>
      ),
    },
    {
      key: 'announcements', icon: 'campaign', title: 'Announcements', subtitle: 'What is new',
      color: '#AD1457',
      content: (
        <View style={styles.sectionContent}>
          <View style={styles.announcementCard}>
            <View style={styles.announcementBadge}><Text style={styles.announcementBadgeText}>NEW</Text></View>
            <Text style={styles.announcementTitle}>v2.0 - AI Features Added!</Text>
            <Text style={styles.announcementText}>Voice Entry, Chat Assistant, Business Insights, and Smart Reminders are now available.</Text>
            <Text style={styles.announcementDate}>May 29, 2026</Text>
          </View>
          <View style={styles.announcementCard}>
            <Text style={styles.announcementTitle}>v1.5 - QR & Payment Methods</Text>
            <Text style={styles.announcementText}>QR Scanner, QR Generator, and multiple payment methods support added.</Text>
            <Text style={styles.announcementDate}>May 20, 2026</Text>
          </View>
        </View>
      ),
    },
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={theme.textDark} />
        </Pressable>
        <Text style={styles.headerTitle}>More Features</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }} showsVerticalScrollIndicator={false}>
        {sections.map(section => (
          <View key={section.key}>
            <Pressable style={styles.sectionCard} onPress={() => setActiveSection(activeSection === section.key ? null : section.key)}>
              <View style={[styles.sectionIcon, { backgroundColor: section.color + '20' }]}>
                <MaterialIcons name={section.icon as any} size={22} color={section.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionCardTitle}>{section.title}</Text>
                <Text style={styles.sectionCardSubtitle}>{section.subtitle}</Text>
              </View>
              <MaterialIcons name={activeSection === section.key ? 'expand-less' : 'expand-more'} size={24} color={theme.textMuted} />
            </Pressable>
            {activeSection === section.key && section.content}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.borderLight },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },
  sectionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, padding: 14, borderRadius: theme.borderRadius.md, marginBottom: 8, gap: 12, ...theme.cardShadow },
  sectionIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sectionCardTitle: { fontSize: 15, fontWeight: '600', color: theme.textDark },
  sectionCardSubtitle: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
  sectionContent: { backgroundColor: theme.surface, borderRadius: theme.borderRadius.md, padding: 16, marginBottom: 12, marginTop: -4, ...theme.cardShadow },
  backupInfo: { alignItems: 'center', paddingVertical: 16 },
  backupText: { fontSize: 14, color: theme.textSecondary, marginTop: 8 },
  backupSize: { fontSize: 12, color: theme.textMuted, marginTop: 4 },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: theme.borderLight },
  optionLabel: { fontSize: 14, color: theme.textDark },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: theme.borderRadius.md, marginTop: 10 },
  actionButtonText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  bizCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: theme.borderRadius.sm, borderWidth: 1, borderColor: theme.border, marginBottom: 8 },
  bizCardActive: { borderColor: theme.primary, backgroundColor: theme.backgroundSecondary },
  bizLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bizName: { fontSize: 14, fontWeight: '600', color: theme.textDark },
  bizCustomers: { fontSize: 12, color: theme.textMuted },
  activeBadge: { backgroundColor: theme.paymentLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  activeBadgeText: { fontSize: 10, fontWeight: '700', color: theme.payment },
  addBizBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderWidth: 1.5, borderColor: theme.primary, borderRadius: theme.borderRadius.md, borderStyle: 'dashed', marginTop: 8 },
  addBizText: { fontSize: 14, fontWeight: '600', color: theme.primary },
  exportTitle: { fontSize: 14, fontWeight: '700', color: theme.textDark },
  exportRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  exportBtn: { flex: 1, alignItems: 'center', paddingVertical: 16, backgroundColor: theme.background, borderRadius: theme.borderRadius.sm, borderWidth: 1, borderColor: theme.border },
  exportBtnText: { fontSize: 12, fontWeight: '600', color: theme.textSecondary, marginTop: 6 },
  shareCard: { alignItems: 'center', paddingVertical: 16 },
  shareTitle: { fontSize: 18, fontWeight: '700', color: theme.textDark, marginTop: 12 },
  shareSubtitle: { fontSize: 13, color: theme.textMuted, marginTop: 4 },
  shareActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: theme.borderRadius.sm },
  shareBtnText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  feedbackTitle: { fontSize: 16, fontWeight: '700', color: theme.textDark, textAlign: 'center' },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: 16 },
  announcementCard: { backgroundColor: theme.background, borderRadius: theme.borderRadius.sm, padding: 14, marginBottom: 10 },
  announcementBadge: { backgroundColor: theme.credit, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 6 },
  announcementBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  announcementTitle: { fontSize: 15, fontWeight: '700', color: theme.textDark },
  announcementText: { fontSize: 13, color: theme.textSecondary, marginTop: 4, lineHeight: 18 },
  announcementDate: { fontSize: 11, color: theme.textMuted, marginTop: 6 },
});
