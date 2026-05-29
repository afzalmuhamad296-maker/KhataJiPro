import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, Alert, Share } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import * as Haptics from 'expo-haptics';

interface InvoiceItem {
  id: string;
  name: string;
  qty: number;
  rate: number;
  total: number;
}

export default function InvoiceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { customers, itemRates, formatCurrency, settings } = useApp();
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [taxRate, setTaxRate] = useState('0');
  const [note, setNote] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showItemPicker, setShowItemPicker] = useState(false);

  const customer = customers.find(c => c.id === selectedCustomer);
  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const tax = subtotal * (parseFloat(taxRate) || 0) / 100;
  const grandTotal = subtotal + tax;
  const invoiceNo = `INV-${Date.now().toString().slice(-6)}`;

  const addItem = (rate: typeof itemRates[0]) => {
    const existing = items.find(i => i.name === rate.name);
    if (existing) {
      setItems(prev => prev.map(i => i.name === rate.name ? { ...i, qty: i.qty + 1, total: (i.qty + 1) * i.rate } : i));
    } else {
      setItems(prev => [...prev, { id: Date.now().toString(), name: rate.name, qty: 1, rate: rate.rate, total: rate.rate }]);
    }
    setShowItemPicker(false);
    Haptics.selectionAsync();
  };

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) {
      setItems(prev => prev.filter(i => i.id !== id));
    } else {
      setItems(prev => prev.map(i => i.id === id ? { ...i, qty, total: qty * i.rate } : i));
    }
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleShare = async () => {
    if (!customer) {
      Alert.alert('Error', 'Please select a customer');
      return;
    }
    let invoiceText = `═══ INVOICE ═══\n${settings.shopName}\n${settings.phone}\n\nInvoice #: ${invoiceNo}\nDate: ${new Date().toLocaleDateString('en-PK')}\n\nBill To: ${customer.name}\nPhone: ${customer.phone}\n\n─────────────────\n`;
    items.forEach(item => {
      invoiceText += `${item.name}\n  ${item.qty} x Rs.${item.rate} = Rs.${item.total}\n`;
    });
    invoiceText += `─────────────────\nSubtotal: ${formatCurrency(subtotal)}\n`;
    if (parseFloat(taxRate) > 0) {
      invoiceText += `Tax (${taxRate}%): ${formatCurrency(tax)}\n`;
    }
    invoiceText += `TOTAL: ${formatCurrency(grandTotal)}\n═══════════════\nThank you for your business!`;

    try {
      await Share.share({ message: invoiceText });
    } catch {
      // cancelled
    }
  };

  if (showPreview && customer) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => setShowPreview(false)} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color={theme.textDark} />
          </Pressable>
          <Text style={styles.headerTitle}>Invoice Preview</Text>
          <Pressable style={styles.shareBtn} onPress={handleShare}>
            <MaterialIcons name="share" size={20} color="#FFF" />
          </Pressable>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
          <View style={styles.invoiceCard}>
            {/* Invoice Header */}
            <View style={styles.invoiceHeader}>
              <View>
                <Text style={styles.invoiceShopName}>{settings.shopName}</Text>
                <Text style={styles.invoiceShopPhone}>{settings.phone}</Text>
              </View>
              <View style={styles.invoiceBadge}>
                <Text style={styles.invoiceBadgeText}>INVOICE</Text>
              </View>
            </View>

            <View style={styles.invoiceMeta}>
              <View style={styles.invoiceMetaRow}>
                <Text style={styles.invoiceMetaLabel}>Invoice #</Text>
                <Text style={styles.invoiceMetaValue}>{invoiceNo}</Text>
              </View>
              <View style={styles.invoiceMetaRow}>
                <Text style={styles.invoiceMetaLabel}>Date</Text>
                <Text style={styles.invoiceMetaValue}>{new Date().toLocaleDateString('en-PK')}</Text>
              </View>
            </View>

            {/* Bill To */}
            <View style={styles.billTo}>
              <Text style={styles.billToLabel}>BILL TO</Text>
              <Text style={styles.billToName}>{customer.name}</Text>
              <Text style={styles.billToPhone}>{customer.phone}</Text>
              <Text style={styles.billToAddr}>{customer.address}</Text>
            </View>

            {/* Items Table */}
            <View style={styles.invoiceTable}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 2 }]}>Item</Text>
                <Text style={[styles.tableHeaderText, { width: 40, textAlign: 'center' }]}>Qty</Text>
                <Text style={[styles.tableHeaderText, { width: 70, textAlign: 'right' }]}>Rate</Text>
                <Text style={[styles.tableHeaderText, { width: 80, textAlign: 'right' }]}>Total</Text>
              </View>
              {items.map(item => (
                <View key={item.id} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{item.name}</Text>
                  <Text style={[styles.tableCell, { width: 40, textAlign: 'center' }]}>{item.qty}</Text>
                  <Text style={[styles.tableCell, { width: 70, textAlign: 'right' }]}>Rs.{item.rate}</Text>
                  <Text style={[styles.tableCellBold, { width: 80, textAlign: 'right' }]}>Rs.{item.total}</Text>
                </View>
              ))}
            </View>

            {/* Totals */}
            <View style={styles.invoiceTotals}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
              </View>
              {parseFloat(taxRate) > 0 && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Tax ({taxRate}%)</Text>
                  <Text style={styles.totalValue}>{formatCurrency(tax)}</Text>
                </View>
              )}
              <View style={[styles.totalRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>TOTAL</Text>
                <Text style={styles.grandTotalValue}>{formatCurrency(grandTotal)}</Text>
              </View>
            </View>

            {note ? <Text style={styles.invoiceNote}>Note: {note}</Text> : null}
            <Text style={styles.invoiceFooter}>Thank you for your business!</Text>
          </View>

          {/* Actions */}
          <View style={styles.previewActions}>
            <Pressable style={[styles.previewBtn, { backgroundColor: '#25D366' }]} onPress={handleShare}>
              <MaterialIcons name="chat" size={20} color="#FFF" />
              <Text style={styles.previewBtnText}>WhatsApp</Text>
            </Pressable>
            <Pressable style={[styles.previewBtn, { backgroundColor: theme.primary }]} onPress={handleShare}>
              <MaterialIcons name="download" size={20} color="#FFF" />
              <Text style={styles.previewBtnText}>Download</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={theme.textDark} />
        </Pressable>
        <Text style={styles.headerTitle}>Invoice Generator</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false}>
        {/* Customer Selection */}
        <Text style={styles.formLabel}>Customer</Text>
        <Pressable style={styles.pickerBtn} onPress={() => setShowCustomerPicker(!showCustomerPicker)}>
          <Text style={customer ? styles.pickerValue : styles.pickerPlaceholder}>
            {customer ? customer.name : 'Select Customer'}
          </Text>
          <MaterialIcons name="arrow-drop-down" size={24} color={theme.textMuted} />
        </Pressable>
        {showCustomerPicker && (
          <View style={styles.pickerDropdown}>
            {customers.slice(0, 10).map(c => (
              <Pressable key={c.id} style={styles.pickerOption} onPress={() => { setSelectedCustomer(c.id); setShowCustomerPicker(false); }}>
                <Text style={styles.pickerOptionText}>{c.name}</Text>
                <Text style={styles.pickerOptionSub}>{c.phone}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Items */}
        <View style={styles.itemsHeader}>
          <Text style={styles.formLabel}>Items</Text>
          <Pressable style={styles.addItemBtn} onPress={() => setShowItemPicker(!showItemPicker)}>
            <MaterialIcons name="add" size={18} color={theme.primary} />
            <Text style={styles.addItemText}>Add Item</Text>
          </Pressable>
        </View>

        {showItemPicker && (
          <View style={styles.itemPickerContainer}>
            {itemRates.slice(0, 10).map(rate => (
              <Pressable key={rate.id} style={styles.itemPickerRow} onPress={() => addItem(rate)}>
                <Text style={styles.itemPickerName}>{rate.name}</Text>
                <Text style={styles.itemPickerRate}>Rs. {rate.rate}/{rate.unit}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {items.length > 0 ? (
          <View style={styles.itemsList}>
            {items.map(item => (
              <View key={item.id} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemRate}>Rs. {item.rate} x {item.qty}</Text>
                </View>
                <View style={styles.qtyControls}>
                  <Pressable style={styles.qtyBtn} onPress={() => updateQty(item.id, item.qty - 1)}>
                    <MaterialIcons name="remove" size={16} color={theme.credit} />
                  </Pressable>
                  <Text style={styles.qtyText}>{item.qty}</Text>
                  <Pressable style={styles.qtyBtn} onPress={() => updateQty(item.id, item.qty + 1)}>
                    <MaterialIcons name="add" size={16} color={theme.payment} />
                  </Pressable>
                </View>
                <Text style={styles.itemTotal}>{formatCurrency(item.total)}</Text>
                <Pressable onPress={() => removeItem(item.id)} style={{ padding: 4 }}>
                  <MaterialIcons name="close" size={18} color={theme.credit} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.noItems}>
            <MaterialIcons name="receipt" size={40} color={theme.border} />
            <Text style={styles.noItemsText}>No items added</Text>
          </View>
        )}

        {/* Tax */}
        <Text style={styles.formLabel}>Tax Rate (%)</Text>
        <TextInput style={styles.input} value={taxRate} onChangeText={setTaxRate} keyboardType="numeric" placeholder="0" placeholderTextColor={theme.textMuted} />

        {/* Note */}
        <Text style={styles.formLabel}>Note (optional)</Text>
        <TextInput style={[styles.input, { height: 60, textAlignVertical: 'top' }]} value={note} onChangeText={setNote} multiline placeholder="Additional notes..." placeholderTextColor={theme.textMuted} />

        {/* Summary */}
        {items.length > 0 && (
          <View style={styles.summaryBox}>
            <View style={styles.summaryRowItem}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
            </View>
            {parseFloat(taxRate) > 0 && (
              <View style={styles.summaryRowItem}>
                <Text style={styles.summaryLabel}>Tax ({taxRate}%)</Text>
                <Text style={styles.summaryValue}>{formatCurrency(tax)}</Text>
              </View>
            )}
            <View style={[styles.summaryRowItem, styles.grandTotal]}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(grandTotal)}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action */}
      <View style={[styles.bottomAction, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={[styles.previewBtnFull, items.length === 0 && { opacity: 0.5 }]}
          onPress={() => {
            if (items.length === 0) { Alert.alert('Error', 'Add at least one item'); return; }
            if (!customer) { Alert.alert('Error', 'Select a customer'); return; }
            setShowPreview(true);
          }}
          disabled={items.length === 0}
        >
          <MaterialIcons name="visibility" size={20} color="#FFF" />
          <Text style={styles.previewBtnFullText}>Preview Invoice</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.borderLight },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },
  shareBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' },
  formLabel: { fontSize: 13, fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 16, marginBottom: 8 },
  pickerBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.surface, padding: 14, borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: theme.border },
  pickerValue: { fontSize: 15, fontWeight: '600', color: theme.textDark },
  pickerPlaceholder: { fontSize: 15, color: theme.textMuted },
  pickerDropdown: { backgroundColor: theme.surface, borderRadius: theme.borderRadius.md, marginTop: 4, borderWidth: 1, borderColor: theme.border, maxHeight: 200 },
  pickerOption: { padding: 12, borderBottomWidth: 1, borderBottomColor: theme.borderLight },
  pickerOptionText: { fontSize: 14, fontWeight: '600', color: theme.textDark },
  pickerOptionSub: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
  itemsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  addItemBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.backgroundSecondary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  addItemText: { fontSize: 13, color: theme.primary, fontWeight: '600' },
  itemPickerContainer: { backgroundColor: theme.surface, borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: theme.border, marginTop: 8, maxHeight: 200 },
  itemPickerRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: theme.borderLight },
  itemPickerName: { fontSize: 14, color: theme.textDark },
  itemPickerRate: { fontSize: 13, color: theme.primary, fontWeight: '600' },
  itemsList: { marginTop: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, padding: 12, borderRadius: theme.borderRadius.sm, marginBottom: 6, gap: 8 },
  itemName: { fontSize: 14, fontWeight: '600', color: theme.textDark },
  itemRate: { fontSize: 12, color: theme.textMuted },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: theme.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontSize: 14, fontWeight: '700', color: theme.textDark },
  itemTotal: { fontSize: 14, fontWeight: '700', color: theme.textDark, width: 70, textAlign: 'right' },
  noItems: { alignItems: 'center', paddingVertical: 32, backgroundColor: theme.surface, borderRadius: theme.borderRadius.md, marginTop: 12 },
  noItemsText: { fontSize: 14, color: theme.textMuted, marginTop: 8 },
  input: { backgroundColor: theme.surface, borderRadius: theme.borderRadius.sm, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: theme.textDark, borderWidth: 1, borderColor: theme.border },
  summaryBox: { backgroundColor: theme.surface, borderRadius: theme.borderRadius.md, padding: 16, marginTop: 16, ...theme.cardShadow },
  summaryRowItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  summaryLabel: { fontSize: 14, color: theme.textSecondary },
  summaryValue: { fontSize: 14, fontWeight: '600', color: theme.textDark },
  grandTotal: { borderTopWidth: 1, borderTopColor: theme.borderLight, paddingTop: 10, marginTop: 6 },
  grandTotalLabel: { fontSize: 16, fontWeight: '700', color: theme.textDark },
  grandTotalValue: { fontSize: 18, fontWeight: '700', color: theme.primary },
  bottomAction: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingTop: 12, backgroundColor: theme.background, borderTopWidth: 1, borderTopColor: theme.borderLight },
  previewBtnFull: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.primary, paddingVertical: 16, borderRadius: theme.borderRadius.md },
  previewBtnFullText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  // Invoice Preview styles
  invoiceCard: { backgroundColor: '#FFF', borderRadius: theme.borderRadius.lg, padding: 24, ...theme.cardShadow },
  invoiceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  invoiceShopName: { fontSize: 20, fontWeight: '700', color: theme.primary },
  invoiceShopPhone: { fontSize: 13, color: theme.textMuted, marginTop: 4 },
  invoiceBadge: { backgroundColor: theme.primary, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 4 },
  invoiceBadgeText: { color: '#FFF', fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  invoiceMeta: { borderBottomWidth: 1, borderBottomColor: theme.borderLight, paddingBottom: 12, marginBottom: 16 },
  invoiceMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  invoiceMetaLabel: { fontSize: 12, color: theme.textMuted },
  invoiceMetaValue: { fontSize: 12, fontWeight: '600', color: theme.textDark },
  billTo: { backgroundColor: theme.backgroundSecondary, borderRadius: 8, padding: 12, marginBottom: 16 },
  billToLabel: { fontSize: 10, fontWeight: '700', color: theme.textMuted, letterSpacing: 1, marginBottom: 4 },
  billToName: { fontSize: 16, fontWeight: '700', color: theme.textDark },
  billToPhone: { fontSize: 13, color: theme.textSecondary, marginTop: 2 },
  billToAddr: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
  invoiceTable: { marginBottom: 16 },
  tableHeader: { flexDirection: 'row', backgroundColor: theme.primary, padding: 10, borderRadius: 4 },
  tableHeaderText: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  tableRow: { flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderBottomColor: theme.borderLight },
  tableCell: { fontSize: 13, color: theme.textDark },
  tableCellBold: { fontSize: 13, fontWeight: '700', color: theme.textDark },
  invoiceTotals: { borderTopWidth: 2, borderTopColor: theme.primary, paddingTop: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalLabel: { fontSize: 14, color: theme.textSecondary },
  totalValue: { fontSize: 14, fontWeight: '600', color: theme.textDark },
  grandTotalRow: { borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 8, marginTop: 4 },
  invoiceNote: { fontSize: 12, color: theme.textMuted, marginTop: 16, fontStyle: 'italic' },
  invoiceFooter: { fontSize: 13, color: theme.primary, fontWeight: '600', textAlign: 'center', marginTop: 20 },
  previewActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  previewBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: theme.borderRadius.md },
  previewBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});
