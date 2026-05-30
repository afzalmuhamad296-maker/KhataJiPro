import { Stack } from 'expo-router';
import { AlertProvider } from '@/template';
import { AppProvider } from '../contexts/AppContext';

export default function RootLayout() {
  return (
    <AlertProvider>
      <AppProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="ledger/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="add-customer" options={{ presentation: 'modal' }} />
          <Stack.Screen name="add-credit" options={{ presentation: 'modal' }} />
          <Stack.Screen name="add-payment" options={{ presentation: 'modal' }} />
          <Stack.Screen name="qr-scanner" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="payment-methods" options={{ presentation: 'card' }} />
          <Stack.Screen name="voice-entry" options={{ presentation: 'card' }} />
          <Stack.Screen name="chat-assistant" options={{ presentation: 'card' }} />
          <Stack.Screen name="reminders" options={{ presentation: 'card' }} />
          <Stack.Screen name="recurring" options={{ presentation: 'card' }} />
          <Stack.Screen name="invoice" options={{ presentation: 'card' }} />
          <Stack.Screen name="expense-tracker" options={{ presentation: 'card' }} />
          <Stack.Screen name="customer-statement" options={{ presentation: 'card' }} />
          <Stack.Screen name="insights" options={{ presentation: 'card' }} />
          <Stack.Screen name="stock" options={{ presentation: 'card' }} />
          <Stack.Screen name="bulk-sms" options={{ presentation: 'card' }} />
          <Stack.Screen name="suppliers" options={{ presentation: 'card' }} />
          <Stack.Screen name="sales-report" options={{ presentation: 'card' }} />
          <Stack.Screen name="more-features" options={{ presentation: 'card' }} />
          <Stack.Screen name="app-lock" options={{ presentation: 'card' }} />
          <Stack.Screen name="pay-link" options={{ presentation: 'card' }} />
          <Stack.Screen name="plans" options={{ presentation: 'card' }} />
        </Stack>
      </AppProvider>
    </AlertProvider>
  );
}
