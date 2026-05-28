import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { theme } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCAN_AREA_SIZE = SCREEN_WIDTH * 0.7;

export default function QRScannerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { customers, addScanHistory, scanHistory } = useApp();
  const [permission, requestPermission] = useCameraPermissions();
  const [flashOn, setFlashOn] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleBarCodeScanned = useCallback(({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Try to match customer by phone or name
    const matchedCustomer = customers.find(
      c => c.phone === data || c.name.toLowerCase() === data.toLowerCase() || c.id === data
    );

    if (matchedCustomer) {
      addScanHistory({ data, type: 'customer', label: matchedCustomer.name });
      Alert.alert(
        'Customer Found',
        `Open ledger for ${matchedCustomer.name}?`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setScanned(false) },
          { text: 'Open Ledger', onPress: () => router.replace(`/ledger/${matchedCustomer.id}`) },
        ]
      );
    } else {
      addScanHistory({ data, type: 'unknown', label: data.substring(0, 30) });
      Alert.alert(
        'QR Scanned',
        `Data: ${data}\n\nNo matching customer found.`,
        [
          { text: 'Scan Again', onPress: () => setScanned(false) },
          { text: 'Close', onPress: () => router.back() },
        ]
      );
    }
  }, [scanned, customers, addScanHistory, router]);

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredContent}>
          <MaterialIcons name="qr-code-scanner" size={64} color={theme.textMuted} />
          <Text style={styles.permissionText}>Loading camera...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color={theme.textDark} />
          </Pressable>
          <Text style={styles.headerTitle}>QR Scanner</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centeredContent}>
          <View style={styles.permissionCard}>
            <MaterialIcons name="camera-alt" size={56} color={theme.primary} />
            <Text style={styles.permissionTitle}>Camera Permission Required</Text>
            <Text style={styles.permissionDesc}>
              We need camera access to scan QR codes for quick customer lookup and item entry.
            </Text>
            <Pressable style={styles.permissionBtn} onPress={requestPermission}>
              <MaterialIcons name="check" size={20} color="#FFF" />
              <Text style={styles.permissionBtnText}>Grant Permission</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (showHistory) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => setShowHistory(false)} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color={theme.textDark} />
          </Pressable>
          <Text style={styles.headerTitle}>Scan History</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.historyContent}>
          {scanHistory.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="history" size={56} color={theme.border} />
              <Text style={styles.emptyText}>No scan history yet</Text>
            </View>
          ) : (
            scanHistory.map((item) => (
              <Pressable
                key={item.id}
                style={styles.historyItem}
                onPress={() => {
                  if (item.type === 'customer') {
                    const c = customers.find(cu => cu.name === item.label);
                    if (c) router.push(`/ledger/${c.id}`);
                  }
                }}
              >
                <View style={[styles.historyIcon, {
                  backgroundColor: item.type === 'customer' ? theme.paymentLight : '#FFF3E0',
                }]}>
                  <MaterialIcons
                    name={item.type === 'customer' ? 'person' : 'qr-code'}
                    size={20}
                    color={item.type === 'customer' ? theme.payment : '#FF9800'}
                  />
                </View>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyLabel}>{item.label}</Text>
                  <Text style={styles.historyData} numberOfLines={1}>{item.data}</Text>
                  <Text style={styles.historyTime}>
                    {new Date(item.scannedAt).toLocaleString('en-PK', { dateStyle: 'short', timeStyle: 'short' })}
                  </Text>
                </View>
                <View style={[styles.typeBadge, {
                  backgroundColor: item.type === 'customer' ? theme.paymentLight : '#FFF3E0',
                }]}>
                  <Text style={[styles.typeBadgeText, {
                    color: item.type === 'customer' ? theme.payment : '#FF9800',
                  }]}>
                    {item.type}
                  </Text>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.scannerContainer}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={flashOn}
        barcodeScannerSettings={{ barcodeTypes: ['qr', 'ean13', 'ean8', 'code128'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Top bar */}
        <View style={[styles.scanHeader, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => router.back()} style={styles.scanHeaderBtn}>
            <MaterialIcons name="close" size={24} color="#FFF" />
          </Pressable>
          <Text style={styles.scanHeaderTitle}>Scan QR Code</Text>
          <Pressable onPress={() => setShowHistory(true)} style={styles.scanHeaderBtn}>
            <MaterialIcons name="history" size={24} color="#FFF" />
          </Pressable>
        </View>

        {/* Scan Frame */}
        <View style={styles.scanFrameContainer}>
          <View style={styles.scanFrame}>
            {/* Corners */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <Text style={styles.scanInstructions}>
            Point camera at QR code to scan
          </Text>
        </View>

        {/* Bottom Controls */}
        <View style={[styles.scanControls, { paddingBottom: insets.bottom + 24 }]}>
          <Pressable
            style={[styles.controlBtn, flashOn && styles.controlBtnActive]}
            onPress={() => {
              setFlashOn(!flashOn);
              Haptics.selectionAsync();
            }}
          >
            <MaterialIcons name={flashOn ? 'flash-on' : 'flash-off'} size={24} color="#FFF" />
            <Text style={styles.controlBtnText}>{flashOn ? 'Flash On' : 'Flash Off'}</Text>
          </Pressable>

          {scanned && (
            <Pressable
              style={[styles.controlBtn, styles.rescanBtn]}
              onPress={() => setScanned(false)}
            >
              <MaterialIcons name="refresh" size={24} color="#FFF" />
              <Text style={styles.controlBtnText}>Scan Again</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  centeredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
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
  permissionCard: {
    backgroundColor: theme.surface,
    borderRadius: theme.borderRadius.lg,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    ...theme.cardShadow,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textDark,
    marginTop: 16,
    textAlign: 'center',
  },
  permissionDesc: {
    fontSize: 14,
    color: theme.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  permissionText: {
    fontSize: 16,
    color: theme.textMuted,
    marginTop: 16,
  },
  permissionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    marginTop: 24,
  },
  permissionBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  scanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanHeaderBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  scanFrameContainer: {
    alignItems: 'center',
  },
  scanFrame: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: theme.primary,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  scanInstructions: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 20,
    textAlign: 'center',
    opacity: 0.8,
  },
  scanControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  controlBtn: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  controlBtnActive: {
    backgroundColor: theme.primary,
  },
  rescanBtn: {
    backgroundColor: theme.payment,
  },
  controlBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  // History
  historyContent: {
    flex: 1,
    padding: 16,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    padding: 14,
    borderRadius: theme.borderRadius.md,
    marginBottom: 10,
    ...theme.cardShadow,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyInfo: {
    flex: 1,
    marginLeft: 12,
  },
  historyLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.textDark,
  },
  historyData: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 2,
  },
  historyTime: {
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 2,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.textMuted,
    marginTop: 12,
  },
});
