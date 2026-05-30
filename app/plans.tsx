import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';

const FREE_FEATURES = [
  { icon: 'people', text: 'Up to 25 Customers', included: true },
  { icon: 'receipt', text: 'Basic Credit/Debit Tracking', included: true },
  { icon: 'calculate', text: 'Simple Reports', included: true },
  { icon: 'qr-code', text: 'QR Code Scanner', included: true },
  { icon: 'notifications', text: '5 Reminders/Month', included: true },
  { icon: 'smart-toy', text: 'AI Features', included: false },
  { icon: 'description', text: 'PDF Export & Invoices', included: false },
  { icon: 'cloud-upload', text: 'Cloud Backup', included: false },
  { icon: 'business', text: 'Multi-Business', included: false },
  { icon: 'group', text: 'Staff Accounts', included: false },
  { icon: 'analytics', text: 'Advanced Analytics', included: false },
  { icon: 'send', text: 'Unlimited SMS/WhatsApp', included: false },
];

const PRO_FEATURES = [
  { icon: 'people', text: 'Unlimited Customers', included: true },
  { icon: 'receipt', text: 'Full Credit/Debit Tracking', included: true },
  { icon: 'analytics', text: 'Advanced Reports & Charts', included: true },
  { icon: 'qr-code', text: 'QR Code Scanner & Generator', included: true },
  { icon: 'notifications', text: 'Unlimited Reminders', included: true },
  { icon: 'smart-toy', text: 'AI Voice, Chat & Insights', included: true },
  { icon: 'description', text: 'PDF Invoices & Statements', included: true },
  { icon: 'cloud-upload', text: 'Auto Cloud Backup', included: true },
  { icon: 'business', text: 'Multi-Business Support', included: true },
  { icon: 'group', text: 'Staff Accounts (up to 5)', included: true },
  { icon: 'send', text: 'Unlimited SMS/WhatsApp', included: true },
  { icon: 'security', text: 'Priority Support', included: true },
];

export default function PlansScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');

  const monthlyPrice = 'Rs. 299';
  const yearlyPrice = 'Rs. 2,499';
  const yearlyMonthly = 'Rs. 208/mo';

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={theme.textDark} />
        </Pressable>
        <Text style={styles.headerTitle}>Plans & Pricing</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <LinearGradient
          colors={['#0D7C4A', '#065F37', '#043D25']}
          style={styles.heroSection}
        >
          <View style={styles.heroIconWrap}>
            <MaterialIcons name="workspace-premium" size={40} color="#FFD700" />
          </View>
          <Text style={styles.heroTitle}>Choose Your Plan</Text>
          <Text style={styles.heroSubtitle}>
            Start free, upgrade when you need more power for your business
          </Text>
        </LinearGradient>

        {/* Period Toggle */}
        <View style={styles.toggleContainer}>
          <View style={styles.toggleWrap}>
            <Pressable
              style={[styles.toggleBtn, selectedPlan === 'monthly' && styles.toggleBtnActive]}
              onPress={() => setSelectedPlan('monthly')}
            >
              <Text style={[styles.toggleText, selectedPlan === 'monthly' && styles.toggleTextActive]}>Monthly</Text>
            </Pressable>
            <Pressable
              style={[styles.toggleBtn, selectedPlan === 'yearly' && styles.toggleBtnActive]}
              onPress={() => setSelectedPlan('yearly')}
            >
              <Text style={[styles.toggleText, selectedPlan === 'yearly' && styles.toggleTextActive]}>Yearly</Text>
              <View style={styles.saveBadge}>
                <Text style={styles.saveBadgeText}>-30%</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* FREE Plan Card */}
        <View style={styles.planCard}>
          <View style={styles.planHeader}>
            <View style={styles.planIconWrap}>
              <MaterialIcons name="star-outline" size={24} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.planName}>Free Plan</Text>
              <Text style={styles.planDesc}>Perfect for getting started</Text>
            </View>
            <View style={styles.currentBadge}>
              <Text style={styles.currentBadgeText}>CURRENT</Text>
            </View>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceValue}>Rs. 0</Text>
            <Text style={styles.pricePeriod}>/forever</Text>
          </View>
          <View style={styles.featuresList}>
            {FREE_FEATURES.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <MaterialIcons
                  name={f.included ? 'check-circle' : 'cancel'}
                  size={18}
                  color={f.included ? theme.payment : theme.textMuted}
                />
                <Text style={[styles.featureText, !f.included && styles.featureTextDisabled]}>{f.text}</Text>
              </View>
            ))}
          </View>
          <View style={styles.planBtnDisabled}>
            <Text style={styles.planBtnDisabledText}>Current Plan</Text>
          </View>
        </View>

        {/* PRO Plan Card */}
        <View style={[styles.planCard, styles.proPlanCard]}>
          {/* Popular Badge */}
          <View style={styles.popularBadge}>
            <MaterialIcons name="local-fire-department" size={14} color="#FFF" />
            <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
          </View>

          <View style={styles.planHeader}>
            <LinearGradient colors={['#FEF3C7', '#FDE68A']} style={styles.planIconWrapPro}>
              <MaterialIcons name="workspace-premium" size={24} color="#B45309" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.planNamePro}>Pro Plan</Text>
              <Text style={styles.planDesc}>Everything you need to grow</Text>
            </View>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceValuePro}>
              {selectedPlan === 'monthly' ? monthlyPrice : yearlyPrice}
            </Text>
            <Text style={styles.pricePeriodPro}>
              /{selectedPlan === 'monthly' ? 'month' : 'year'}
            </Text>
          </View>
          {selectedPlan === 'yearly' ? (
            <View style={styles.savingsRow}>
              <MaterialIcons name="savings" size={16} color={theme.payment} />
              <Text style={styles.savingsText}>Save Rs. 1,089/year ({yearlyMonthly})</Text>
            </View>
          ) : null}
          <View style={styles.featuresList}>
            {PRO_FEATURES.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <MaterialIcons name="check-circle" size={18} color="#FFB300" />
                <Text style={styles.featureTextPro}>{f.text}</Text>
              </View>
            ))}
          </View>
          <Pressable style={({ pressed }) => [styles.upgradeBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}>
            <LinearGradient
              colors={['#0D7C4A', '#065F37']}
              style={styles.upgradeBtnGradient}
            >
              <MaterialIcons name="rocket-launch" size={20} color="#FFF" />
              <Text style={styles.upgradeBtnText}>Upgrade to Pro</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Comparison Section */}
        <View style={styles.comparisonSection}>
          <Text style={styles.comparisonTitle}>Plan Comparison</Text>
          <View style={styles.comparisonTable}>
            <View style={styles.comparisonHeader}>
              <Text style={styles.comparisonHeaderText}>Feature</Text>
              <Text style={styles.comparisonHeaderText}>Free</Text>
              <Text style={[styles.comparisonHeaderText, { color: '#B45309' }]}>Pro</Text>
            </View>
            {[
              { feature: 'Customers', free: '25', pro: 'Unlimited' },
              { feature: 'Transactions', free: '100/mo', pro: 'Unlimited' },
              { feature: 'Reminders', free: '5/mo', pro: 'Unlimited' },
              { feature: 'AI Features', free: '—', pro: '✓' },
              { feature: 'PDF Export', free: '—', pro: '✓' },
              { feature: 'Cloud Backup', free: '—', pro: 'Daily' },
              { feature: 'Multi-Business', free: '—', pro: 'Up to 5' },
              { feature: 'Staff', free: '—', pro: 'Up to 5' },
              { feature: 'Support', free: 'Email', pro: 'Priority' },
            ].map((row, i) => (
              <View key={i} style={[styles.comparisonRow, i % 2 === 0 && styles.comparisonRowAlt]}>
                <Text style={styles.comparisonFeature}>{row.feature}</Text>
                <Text style={styles.comparisonValue}>{row.free}</Text>
                <Text style={[styles.comparisonValue, styles.comparisonValuePro]}>{row.pro}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* FAQ */}
        <View style={styles.faqSection}>
          <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
          {[
            { q: 'Can I cancel anytime?', a: 'Yes! You can cancel your Pro subscription at any time. You will continue to have access until the end of your billing period.' },
            { q: 'Is my data safe?', a: 'Absolutely. All data is encrypted and stored securely. Pro users get automatic cloud backups.' },
            { q: 'Can I switch plans?', a: 'You can upgrade or downgrade at any time. When downgrading, you keep Pro features until the end of your billing period.' },
          ].map((faq, i) => (
            <View key={i} style={styles.faqCard}>
              <Text style={styles.faqQuestion}>{faq.q}</Text>
              <Text style={styles.faqAnswer}>{faq.a}</Text>
            </View>
          ))}
        </View>

        {/* Guarantee */}
        <View style={styles.guaranteeCard}>
          <MaterialIcons name="verified-user" size={28} color={theme.primary} />
          <Text style={styles.guaranteeTitle}>7-Day Money Back Guarantee</Text>
          <Text style={styles.guaranteeText}>
            Not satisfied? Get a full refund within 7 days, no questions asked.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
  },

  // Hero
  heroSection: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  heroIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,215,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,215,0,0.25)',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 16,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },

  // Toggle
  toggleContainer: {
    alignItems: 'center',
    marginTop: -20,
    marginBottom: 8,
  },
  toggleWrap: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 4 },
      default: {},
    }),
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  toggleBtnActive: {
    backgroundColor: theme.primary,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  toggleTextActive: {
    color: '#FFF',
  },
  saveBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  saveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFF',
  },

  // Plan Cards
  planCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    borderWidth: 1.5,
    borderColor: theme.borderLight,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16 },
      android: { elevation: 3 },
      default: {},
    }),
  },
  proPlanCard: {
    borderColor: '#D97706',
    borderWidth: 2,
    ...Platform.select({
      ios: { shadowColor: '#D97706', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 20 },
      android: { elevation: 6 },
      default: {},
    }),
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D97706',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
    left: '30%',
  },
  popularBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFF',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  planIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: theme.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planIconWrapPro: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textDark,
  },
  planNamePro: {
    fontSize: 18,
    fontWeight: '700',
    color: '#B45309',
  },
  planDesc: {
    fontSize: 13,
    color: theme.textMuted,
    marginTop: 2,
  },
  currentBadge: {
    backgroundColor: theme.backgroundSecondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.primary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 18,
  },
  priceValue: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.textDark,
  },
  priceValuePro: {
    fontSize: 32,
    fontWeight: '800',
    color: '#B45309',
  },
  pricePeriod: {
    fontSize: 14,
    color: theme.textMuted,
    marginLeft: 4,
  },
  pricePeriodPro: {
    fontSize: 14,
    color: '#92400E',
    marginLeft: 4,
  },
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: theme.paymentLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.payment,
  },
  featuresList: {
    marginTop: 20,
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    color: theme.textDark,
    fontWeight: '500',
  },
  featureTextDisabled: {
    color: theme.textMuted,
    textDecorationLine: 'line-through',
  },
  featureTextPro: {
    fontSize: 14,
    color: theme.textDark,
    fontWeight: '500',
  },
  planBtnDisabled: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: theme.borderLight,
    alignItems: 'center',
  },
  planBtnDisabledText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.textMuted,
  },
  upgradeBtn: {
    marginTop: 20,
    borderRadius: 14,
    overflow: 'hidden',
  },
  upgradeBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  upgradeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },

  // Comparison
  comparisonSection: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  comparisonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textDark,
    marginBottom: 16,
  },
  comparisonTable: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
      android: { elevation: 2 },
      default: {},
    }),
  },
  comparisonHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  comparisonHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  comparisonRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  comparisonRowAlt: {
    backgroundColor: '#FAFCFB',
  },
  comparisonFeature: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: theme.textDark,
  },
  comparisonValue: {
    flex: 1,
    fontSize: 13,
    color: theme.textMuted,
    textAlign: 'center',
  },
  comparisonValuePro: {
    color: '#B45309',
    fontWeight: '600',
  },

  // FAQ
  faqSection: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  faqTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textDark,
    marginBottom: 16,
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.textDark,
  },
  faqAnswer: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 8,
    lineHeight: 19,
  },

  // Guarantee
  guaranteeCard: {
    marginHorizontal: 20,
    marginTop: 24,
    alignItems: 'center',
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.primary + '30',
  },
  guaranteeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.primary,
    marginTop: 10,
  },
  guaranteeText: {
    fontSize: 13,
    color: theme.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 19,
  },
});
