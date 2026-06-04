export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  avatar?: string;
  balance: number;
  totalCredit: number;
  totalDebit: number;
  createdAt: string;
  lastTransaction?: string;
}

export interface Transaction {
  id: string;
  customerId: string;
  customerName: string;
  type: 'credit' | 'debit';
  amount: number;
  note: string;
  items?: TransactionItem[];
  paymentMethod?: string;
  date: string;
  createdAt: string;
}

export interface TransactionItem {
  id: string;
  name: string;
  quantity: number;
  rate: number;
  total: number;
}

export interface ItemRate {
  id: string;
  name: string;
  rate: number;
  unit: string;
  category: string;
  previousRate?: number;
  lastUpdated?: string;
}

export interface AppSettings {
  shopName: string;
  ownerName: string;
  phone: string;
  address?: string;
  language: 'en' | 'ur';
  pin: string;
  darkMode: boolean;
  currency: string;
  smsReminders: boolean;
}

export interface PaymentMethodConfig {
  id: string;
  key: string;
  label: string;
  labelUr: string;
  icon: string;
  color: string;
  bgColor: string;
  enabled: boolean;
  accountId: string;
  accountLabel: string;
}

export interface ScanHistoryItem {
  id: string;
  data: string;
  type: 'customer' | 'item' | 'unknown';
  label: string;
  scannedAt: string;
}

const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split('T')[0];
const threeDaysAgo = new Date(Date.now() - 259200000).toISOString().split('T')[0];
const fourDaysAgo = new Date(Date.now() - 345600000).toISOString().split('T')[0];
const fiveDaysAgo = new Date(Date.now() - 432000000).toISOString().split('T')[0];

export const mockCustomers: Customer[] = [
  { id: '1', name: 'Ahmed Khan', phone: '03001234567', address: 'Shop 12, Anarkali Bazaar', balance: 15200, totalCredit: 45000, totalDebit: 29800, createdAt: '2024-01-15', lastTransaction: today },
  { id: '2', name: 'Bilal Hussain', phone: '03211234567', address: 'House 45, Model Town', balance: 8500, totalCredit: 32000, totalDebit: 23500, createdAt: '2024-01-20', lastTransaction: today },
  { id: '3', name: 'Chaudhry Rashid', phone: '03331234567', address: 'GT Road, Gujranwala', balance: 22000, totalCredit: 55000, totalDebit: 33000, createdAt: '2024-02-01', lastTransaction: yesterday },
  { id: '4', name: 'Danish Ali', phone: '03451234567', address: 'Sadar Bazaar, Rawalpindi', balance: 3200, totalCredit: 18000, totalDebit: 14800, createdAt: '2024-02-10', lastTransaction: yesterday },
  { id: '5', name: 'Ejaz Muhammad', phone: '03041234567', address: 'Liberty Market, Lahore', balance: 0, totalCredit: 25000, totalDebit: 25000, createdAt: '2024-02-15', lastTransaction: twoDaysAgo },
  { id: '6', name: 'Farhan Malik', phone: '03121234567', address: 'Johar Town, Lahore', balance: 45000, totalCredit: 78000, totalDebit: 33000, createdAt: '2024-01-05', lastTransaction: twoDaysAgo },
  { id: '7', name: 'Ghulam Abbas', phone: '03231234567', address: 'Ichhra Bazaar', balance: 7800, totalCredit: 28000, totalDebit: 20200, createdAt: '2024-03-01', lastTransaction: threeDaysAgo },
  { id: '8', name: 'Hamza Tariq', phone: '03341234567', address: 'Defence, DHA Phase 5', balance: 12500, totalCredit: 40000, totalDebit: 27500, createdAt: '2024-03-10', lastTransaction: threeDaysAgo },
  { id: '9', name: 'Imran Sheikh', phone: '03461234567', address: 'Gulberg III, Lahore', balance: 5600, totalCredit: 22000, totalDebit: 16400, createdAt: '2024-03-15', lastTransaction: fourDaysAgo },
  { id: '10', name: 'Junaid Akhtar', phone: '03051234567', address: 'Faisal Town', balance: 0, totalCredit: 15000, totalDebit: 15000, createdAt: '2024-03-20', lastTransaction: fourDaysAgo },
  { id: '11', name: 'Kashif Nawaz', phone: '03131234567', address: 'Township, Lahore', balance: 18700, totalCredit: 52000, totalDebit: 33300, createdAt: '2024-01-25', lastTransaction: fiveDaysAgo },
  { id: '12', name: 'Liaqat Ali', phone: '03241234567', address: 'Shadman Market', balance: 9300, totalCredit: 30000, totalDebit: 20700, createdAt: '2024-04-01', lastTransaction: fiveDaysAgo },
  { id: '13', name: 'Mushtaq Ahmed', phone: '03351234567', address: 'Baghbanpura', balance: 2100, totalCredit: 12000, totalDebit: 9900, createdAt: '2024-04-05', lastTransaction: fiveDaysAgo },
  { id: '14', name: 'Nadeem Butt', phone: '03471234567', address: 'Garhi Shahu', balance: 31000, totalCredit: 65000, totalDebit: 34000, createdAt: '2024-01-10', lastTransaction: today },
  { id: '15', name: 'Omar Farooq', phone: '03061234567', address: 'Mozang Bazaar', balance: 6400, totalCredit: 24000, totalDebit: 17600, createdAt: '2024-04-10', lastTransaction: yesterday },
  { id: '16', name: 'Pervaiz Iqbal', phone: '03141234567', address: 'Mughalpura', balance: 14200, totalCredit: 38000, totalDebit: 23800, createdAt: '2024-02-20', lastTransaction: threeDaysAgo },
  { id: '17', name: 'Qamar Zaman', phone: '03251234567', address: 'Shah Alam Market', balance: 0, totalCredit: 20000, totalDebit: 20000, createdAt: '2024-04-15', lastTransaction: fourDaysAgo },
  { id: '18', name: 'Rizwan Aslam', phone: '03361234567', address: 'Wahdat Road', balance: 28500, totalCredit: 60000, totalDebit: 31500, createdAt: '2024-01-30', lastTransaction: twoDaysAgo },
  { id: '19', name: 'Sajid Mehmood', phone: '03481234567', address: 'Multan Road', balance: 4700, totalCredit: 16000, totalDebit: 11300, createdAt: '2024-05-01', lastTransaction: today },
  { id: '20', name: 'Tahir Mahmood', phone: '03071234567', address: 'Cantt Area, Lahore', balance: 11800, totalCredit: 35000, totalDebit: 23200, createdAt: '2024-02-05', lastTransaction: yesterday },
  { id: '21', name: 'Usman Ghani', phone: '03151234567', address: 'Allama Iqbal Town', balance: 8900, totalCredit: 27000, totalDebit: 18100, createdAt: '2024-05-05', lastTransaction: threeDaysAgo },
  { id: '22', name: 'Waqas Shah', phone: '03261234567', address: 'Sabzazar, Lahore', balance: 16300, totalCredit: 42000, totalDebit: 25700, createdAt: '2024-03-05', lastTransaction: fourDaysAgo },
  { id: '23', name: 'Yasir Arafat', phone: '03371234567', address: 'Iqbal Town', balance: 21000, totalCredit: 48000, totalDebit: 27000, createdAt: '2024-01-18', lastTransaction: fiveDaysAgo },
  { id: '24', name: 'Zahid Mehmood', phone: '03491234567', address: 'Nishtar Colony', balance: 3800, totalCredit: 14000, totalDebit: 10200, createdAt: '2024-05-10', lastTransaction: today },
  { id: '25', name: 'Abdul Rehman', phone: '03081234567', address: 'Raiwind Road', balance: 7200, totalCredit: 21000, totalDebit: 13800, createdAt: '2024-04-20', lastTransaction: yesterday },
];

export const mockTransactions: Transaction[] = [
  { id: 't1', customerId: '1', customerName: 'Ahmed Khan', type: 'credit', amount: 5200, note: 'Atta 2 bags + Cheeni', items: [{ id: 'i1', name: 'Atta (10kg)', quantity: 2, rate: 2100, total: 4200 }, { id: 'i2', name: 'Cheeni (1kg)', quantity: 4, rate: 250, total: 1000 }], date: today, createdAt: today },
  { id: 't2', customerId: '2', customerName: 'Bilal Hussain', type: 'debit', amount: 3000, note: 'Monthly payment', paymentMethod: 'cash', date: today, createdAt: today },
  { id: 't3', customerId: '14', customerName: 'Nadeem Butt', type: 'credit', amount: 8500, note: 'Ghee + Daal', items: [{ id: 'i3', name: 'Dalda Ghee (5kg)', quantity: 1, rate: 5500, total: 5500 }, { id: 'i4', name: 'Daal Chana (kg)', quantity: 10, rate: 300, total: 3000 }], date: today, createdAt: today },
  { id: 't4', customerId: '19', customerName: 'Sajid Mehmood', type: 'credit', amount: 2200, note: 'Chai patti + doodh', date: today, createdAt: today },
  { id: 't5', customerId: '24', customerName: 'Zahid Mehmood', type: 'debit', amount: 1500, note: 'Part payment', paymentMethod: 'easypaisa', date: today, createdAt: today },
  { id: 't6', customerId: '3', customerName: 'Chaudhry Rashid', type: 'credit', amount: 12000, note: 'Wholesale rice order', items: [{ id: 'i5', name: 'Basmati Rice (25kg)', quantity: 4, rate: 3000, total: 12000 }], date: yesterday, createdAt: yesterday },
  { id: 't7', customerId: '4', customerName: 'Danish Ali', type: 'debit', amount: 5000, note: 'Bank transfer received', paymentMethod: 'bank', date: yesterday, createdAt: yesterday },
  { id: 't8', customerId: '15', customerName: 'Omar Farooq', type: 'credit', amount: 3400, note: 'Cooking oil + masala', date: yesterday, createdAt: yesterday },
  { id: 't9', customerId: '20', customerName: 'Tahir Mahmood', type: 'debit', amount: 8000, note: 'Cash payment', paymentMethod: 'cash', date: yesterday, createdAt: yesterday },
  { id: 't10', customerId: '25', customerName: 'Abdul Rehman', type: 'credit', amount: 4500, note: 'Monthly ration', date: yesterday, createdAt: yesterday },
  { id: 't11', customerId: '5', customerName: 'Ejaz Muhammad', type: 'debit', amount: 5000, note: 'Final settlement', paymentMethod: 'jazzcash', date: twoDaysAgo, createdAt: twoDaysAgo },
  { id: 't12', customerId: '6', customerName: 'Farhan Malik', type: 'credit', amount: 15000, note: 'Bulk grocery', date: twoDaysAgo, createdAt: twoDaysAgo },
  { id: 't13', customerId: '18', customerName: 'Rizwan Aslam', type: 'credit', amount: 9500, note: 'Monthly supplies', date: twoDaysAgo, createdAt: twoDaysAgo },
  { id: 't14', customerId: '7', customerName: 'Ghulam Abbas', type: 'credit', amount: 4200, note: 'Daal + chawal', date: threeDaysAgo, createdAt: threeDaysAgo },
  { id: 't15', customerId: '8', customerName: 'Hamza Tariq', type: 'debit', amount: 6000, note: 'Monthly installment', paymentMethod: 'cash', date: threeDaysAgo, createdAt: threeDaysAgo },
  { id: 't16', customerId: '16', customerName: 'Pervaiz Iqbal', type: 'credit', amount: 7800, note: 'Ration items', date: threeDaysAgo, createdAt: threeDaysAgo },
  { id: 't17', customerId: '21', customerName: 'Usman Ghani', type: 'credit', amount: 3200, note: 'Sabzi + phal', date: threeDaysAgo, createdAt: threeDaysAgo },
  { id: 't18', customerId: '9', customerName: 'Imran Sheikh', type: 'credit', amount: 5600, note: 'Tea supplies', date: fourDaysAgo, createdAt: fourDaysAgo },
  { id: 't19', customerId: '10', customerName: 'Junaid Akhtar', type: 'debit', amount: 7500, note: 'Large payment', paymentMethod: 'bank', date: fourDaysAgo, createdAt: fourDaysAgo },
  { id: 't20', customerId: '22', customerName: 'Waqas Shah', type: 'credit', amount: 6300, note: 'Grocery items', date: fourDaysAgo, createdAt: fourDaysAgo },
  { id: 't21', customerId: '11', customerName: 'Kashif Nawaz', type: 'credit', amount: 8700, note: 'Wholesale order', date: fiveDaysAgo, createdAt: fiveDaysAgo },
  { id: 't22', customerId: '12', customerName: 'Liaqat Ali', type: 'debit', amount: 4000, note: 'Partial payment', paymentMethod: 'easypaisa', date: fiveDaysAgo, createdAt: fiveDaysAgo },
  { id: 't23', customerId: '13', customerName: 'Mushtaq Ahmed', type: 'credit', amount: 2100, note: 'Daily items', date: fiveDaysAgo, createdAt: fiveDaysAgo },
  { id: 't24', customerId: '23', customerName: 'Yasir Arafat', type: 'credit', amount: 11000, note: 'Monthly bulk', date: fiveDaysAgo, createdAt: fiveDaysAgo },
  { id: 't25', customerId: '1', customerName: 'Ahmed Khan', type: 'debit', amount: 10000, note: 'Large payment received', paymentMethod: 'cash', date: fiveDaysAgo, createdAt: fiveDaysAgo },
];

export const mockItemRates: ItemRate[] = [
  { id: 'r1', name: 'Atta (10kg)', rate: 2100, unit: 'bag', category: 'Flour', previousRate: 2050, lastUpdated: today },
  { id: 'r2', name: 'Atta (20kg)', rate: 4000, unit: 'bag', category: 'Flour', previousRate: 4100, lastUpdated: yesterday },
  { id: 'r3', name: 'Cheeni (1kg)', rate: 250, unit: 'kg', category: 'Sugar', previousRate: 240, lastUpdated: today },
  { id: 'r4', name: 'Cheeni (5kg)', rate: 1200, unit: 'bag', category: 'Sugar', previousRate: 1250, lastUpdated: twoDaysAgo },
  { id: 'r5', name: 'Basmati Rice (25kg)', rate: 3000, unit: 'bag', category: 'Rice', previousRate: 2900, lastUpdated: yesterday },
  { id: 'r6', name: 'Sella Rice (25kg)', rate: 2500, unit: 'bag', category: 'Rice', previousRate: 2500, lastUpdated: threeDaysAgo },
  { id: 'r7', name: 'Dalda Ghee (1kg)', rate: 1200, unit: 'pack', category: 'Oil & Ghee', previousRate: 1180, lastUpdated: today },
  { id: 'r8', name: 'Dalda Ghee (5kg)', rate: 5500, unit: 'tin', category: 'Oil & Ghee', previousRate: 5600, lastUpdated: fourDaysAgo },
  { id: 'r9', name: 'Cooking Oil (5L)', rate: 3200, unit: 'bottle', category: 'Oil & Ghee', previousRate: 3150, lastUpdated: yesterday },
  { id: 'r10', name: 'Daal Chana (kg)', rate: 300, unit: 'kg', category: 'Pulses', previousRate: 290, lastUpdated: twoDaysAgo },
  { id: 'r11', name: 'Daal Masoor (kg)', rate: 350, unit: 'kg', category: 'Pulses' },
  { id: 'r12', name: 'Daal Moong (kg)', rate: 400, unit: 'kg', category: 'Pulses' },
  { id: 'r13', name: 'Chai Patti (250g)', rate: 350, unit: 'pack', category: 'Beverages' },
  { id: 'r14', name: 'Chai Patti (1kg)', rate: 1200, unit: 'pack', category: 'Beverages' },
  { id: 'r15', name: 'Doodh (1L)', rate: 220, unit: 'pack', category: 'Dairy' },
  { id: 'r16', name: 'Namak (kg)', rate: 80, unit: 'kg', category: 'Spices' },
  { id: 'r17', name: 'Mirch Powder (250g)', rate: 200, unit: 'pack', category: 'Spices' },
  { id: 'r18', name: 'Haldi (250g)', rate: 180, unit: 'pack', category: 'Spices' },
  { id: 'r19', name: 'Sabun (Surf)', rate: 150, unit: 'pack', category: 'Household' },
  { id: 'r20', name: 'Vim Bar', rate: 80, unit: 'piece', category: 'Household' },
];

export const mockSettings: AppSettings = {
  shopName: 'Malik General Store',
  ownerName: 'Muhammad Malik',
  phone: '03001112233',
  address: 'Anarkali Bazaar, Lahore',
  language: 'en',
  pin: '',
  darkMode: false,
  currency: 'PKR',
  smsReminders: true,
};

export const defaultPaymentMethods: PaymentMethodConfig[] = [
  { id: 'pm1', key: 'cash', label: 'Cash', labelUr: 'نقد', icon: 'payments', color: '#43A047', bgColor: '#E8F5E9', enabled: true, accountId: '', accountLabel: '' },
  { id: 'pm2', key: 'jazzcash', label: 'JazzCash', labelUr: 'جاز کیش', icon: 'phone-iphone', color: '#E53935', bgColor: '#FFEBEE', enabled: true, accountId: '', accountLabel: 'JazzCash Number' },
  { id: 'pm3', key: 'easypaisa', label: 'EasyPaisa', labelUr: 'ایزی پیسہ', icon: 'phone-android', color: '#388E3C', bgColor: '#E8F5E9', enabled: true, accountId: '', accountLabel: 'EasyPaisa Number' },
  { id: 'pm4', key: 'bank', label: 'Bank Transfer', labelUr: 'بینک ٹرانسفر', icon: 'account-balance', color: '#1565C0', bgColor: '#E3F2FD', enabled: true, accountId: '', accountLabel: 'Account Number' },
  { id: 'pm5', key: 'card', label: 'Card', labelUr: 'کارڈ', icon: 'credit-card', color: '#6A1B9A', bgColor: '#F3E5F5', enabled: false, accountId: '', accountLabel: 'Last 4 Digits' },
];
