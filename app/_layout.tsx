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
        </Stack>
      </AppProvider>
    </AlertProvider>
  );
}
