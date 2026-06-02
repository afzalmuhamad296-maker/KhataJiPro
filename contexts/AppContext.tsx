import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG, i18n, URDU_NUMERALS, URDU_MONTHS } from '../constants/config';
import { Customer, Transaction, ItemRate, AppSettings, PaymentMethodConfig, ScanHistoryItem, mockCustomers, mockTransactions, mockItemRates, mockSettings, defaultPaymentMethods } from '../services/mockData';

export type Language = 'en' | 'ur';
export type ThemeColorKey = 'green' | 'gold' | 'blue' | 'black' | 'desert';
export type FontSize = 'small' | 'medium' | 'large';

export interface CustomLanguage {
  id: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  translations: Record<string, string>;
}

interface AppContextType {
  customers: Customer[];
  transactions: Transaction[];
  itemRates: ItemRate[];
  settings: AppSettings;
  language: Language;
  t: typeof i18n.en;
  isRTL: boolean;
  paymentMethods: PaymentMethodConfig[];
  scanHistory: ScanHistoryItem[];

  // New: appearance
  themeColor: ThemeColorKey;
  darkMode: boolean;
  fontSize: FontSize;
  urduNumbers: boolean;
  customLanguages: CustomLanguage[];

  addCustomer: (customer: Omit<Customer, 'id' | 'balance' | 'totalCredit' | 'totalDebit' | 'createdAt'>) => void;
  deleteCustomer: (id: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  deleteTransaction: (id: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  setLanguage: (lang: Language) => void;
  getCustomerById: (id: string) => Customer | undefined;
  getCustomerTransactions: (customerId: string) => Transaction[];
  getTodayStats: () => { todayCredit: number; todayCollection: number; outstanding: number; totalCustomers: number };
  formatCurrency: (amount: number) => string;
  formatNumber: (n: number) => string;
  formatDate: (date: Date | string) => string;
  addScanHistory: (item: Omit<ScanHistoryItem, 'id' | 'scannedAt'>) => void;
  updatePaymentMethod: (id: string, updates: Partial<PaymentMethodConfig>) => void;
  togglePaymentMethod: (id: string) => void;

  setThemeColor: (k: ThemeColorKey) => void;
  setDarkMode: (v: boolean) => void;
  setFontSize: (s: FontSize) => void;
  setUrduNumbers: (v: boolean) => void;
  addCustomLanguage: (lang: CustomLanguage) => void;
  removeCustomLanguage: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [itemRates, setItemRates] = useState<ItemRate[]>(mockItemRates);
  const [settings, setSettings] = useState<AppSettings>(mockSettings);
  const [language, setLanguageState] = useState<Language>('en');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>(defaultPaymentMethods);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);

  const [themeColor, setThemeColorState] = useState<ThemeColorKey>('green');
  const [darkMode, setDarkModeState] = useState<boolean>(false);
  const [fontSize, setFontSizeState] = useState<FontSize>('medium');
  const [urduNumbers, setUrduNumbersState] = useState<boolean>(false);
  const [customLanguages, setCustomLanguages] = useState<CustomLanguage[]>([]);

  const t = i18n[language];
  const isRTL = language === 'ur';

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => { AsyncStorage.setItem(APP_CONFIG.storageKeys.customers, JSON.stringify(customers)); }, [customers]);
  useEffect(() => { AsyncStorage.setItem(APP_CONFIG.storageKeys.transactions, JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { AsyncStorage.setItem(APP_CONFIG.storageKeys.settings, JSON.stringify(settings)); }, [settings]);
  useEffect(() => { AsyncStorage.setItem('kj_paymentMethods', JSON.stringify(paymentMethods)); }, [paymentMethods]);
  useEffect(() => { AsyncStorage.setItem('kj_scanHistory', JSON.stringify(scanHistory)); }, [scanHistory]);
  useEffect(() => { AsyncStorage.setItem(APP_CONFIG.storageKeys.themeColor, themeColor); }, [themeColor]);
  useEffect(() => { AsyncStorage.setItem(APP_CONFIG.storageKeys.darkMode, JSON.stringify(darkMode)); }, [darkMode]);
  useEffect(() => { AsyncStorage.setItem(APP_CONFIG.storageKeys.fontSize, fontSize); }, [fontSize]);
  useEffect(() => { AsyncStorage.setItem(APP_CONFIG.storageKeys.urduNumbers, JSON.stringify(urduNumbers)); }, [urduNumbers]);
  useEffect(() => { AsyncStorage.setItem(APP_CONFIG.storageKeys.customLanguages, JSON.stringify(customLanguages)); }, [customLanguages]);

  const loadData = async () => {
    try {
      const storedCustomers = await AsyncStorage.getItem(APP_CONFIG.storageKeys.customers);
      const storedTransactions = await AsyncStorage.getItem(APP_CONFIG.storageKeys.transactions);
      const storedSettings = await AsyncStorage.getItem(APP_CONFIG.storageKeys.settings);
      const storedLang = await AsyncStorage.getItem(APP_CONFIG.storageKeys.language);
      const storedPaymentMethods = await AsyncStorage.getItem('kj_paymentMethods');
      const storedScanHistory = await AsyncStorage.getItem('kj_scanHistory');
      const storedThemeColor = await AsyncStorage.getItem(APP_CONFIG.storageKeys.themeColor);
      const storedDarkMode = await AsyncStorage.getItem(APP_CONFIG.storageKeys.darkMode);
      const storedFontSize = await AsyncStorage.getItem(APP_CONFIG.storageKeys.fontSize);
      const storedUrduNumbers = await AsyncStorage.getItem(APP_CONFIG.storageKeys.urduNumbers);
      const storedCustomLanguages = await AsyncStorage.getItem(APP_CONFIG.storageKeys.customLanguages);

      if (storedCustomers) setCustomers(JSON.parse(storedCustomers));
      if (storedTransactions) setTransactions(JSON.parse(storedTransactions));
      if (storedSettings) setSettings(JSON.parse(storedSettings));
      if (storedLang === 'en' || storedLang === 'ur') setLanguageState(storedLang);
      if (storedPaymentMethods) setPaymentMethods(JSON.parse(storedPaymentMethods));
      if (storedScanHistory) setScanHistory(JSON.parse(storedScanHistory));
      if (storedThemeColor) setThemeColorState(storedThemeColor as ThemeColorKey);
      if (storedDarkMode) setDarkModeState(JSON.parse(storedDarkMode));
      if (storedFontSize) setFontSizeState(storedFontSize as FontSize);
      if (storedUrduNumbers) setUrduNumbersState(JSON.parse(storedUrduNumbers));
      if (storedCustomLanguages) setCustomLanguages(JSON.parse(storedCustomLanguages));
    } catch (error) {
      console.log('Using mock data');
    }
  };

  const addCustomer = (customer: Omit<Customer, 'id' | 'balance' | 'totalCredit' | 'totalDebit' | 'createdAt'>) => {
    const newCustomer: Customer = {
      ...customer,
      id: Date.now().toString(),
      balance: 0,
      totalCredit: 0,
      totalDebit: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setCustomers(prev => [newCustomer, ...prev]);
  };

  const deleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    setTransactions(prev => prev.filter(t => t.customerId !== id));
  };

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    setTransactions(prev => [newTransaction, ...prev]);

    setCustomers(prev => prev.map(c => {
      if (c.id === transaction.customerId) {
        const balanceChange = transaction.type === 'credit' ? transaction.amount : -transaction.amount;
        const newBalance = c.balance + balanceChange;
        return {
          ...c,
          balance: Math.max(0, newBalance),
          totalCredit: transaction.type === 'credit' ? c.totalCredit + transaction.amount : c.totalCredit,
          totalDebit: transaction.type === 'debit' ? c.totalDebit + transaction.amount : c.totalDebit,
          lastTransaction: new Date().toISOString().split('T')[0],
        };
      }
      return c;
    }));
  };

  const deleteTransaction = (id: string) => {
    const txn = transactions.find(t => t.id === id);
    if (txn) {
      setCustomers(prev => prev.map(c => {
        if (c.id === txn.customerId) {
          const balanceChange = txn.type === 'credit' ? -txn.amount : txn.amount;
          return {
            ...c,
            balance: Math.max(0, c.balance + balanceChange),
            totalCredit: txn.type === 'credit' ? c.totalCredit - txn.amount : c.totalCredit,
            totalDebit: txn.type === 'debit' ? c.totalDebit - txn.amount : c.totalDebit,
          };
        }
        return c;
      }));
    }
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    AsyncStorage.setItem(APP_CONFIG.storageKeys.language, lang);
  };

  const getCustomerById = (id: string) => customers.find(c => c.id === id);

  const getCustomerTransactions = (customerId: string) =>
    transactions.filter(t => t.customerId === customerId).sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

  const getTodayStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayTxns = transactions.filter(t => t.date === today);
    const todayCredit = todayTxns.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
    const todayCollection = todayTxns.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);
    const outstanding = customers.reduce((sum, c) => sum + c.balance, 0);
    return { todayCredit, todayCollection, outstanding, totalCustomers: customers.length };
  };

  const toUrduNumber = (s: string) => s.split('').map(ch => URDU_NUMERALS[ch] || ch).join('');

  const formatNumber = (n: number) => {
    const formatted = n.toLocaleString('en-PK');
    if (urduNumbers && language === 'ur') return toUrduNumber(formatted);
    return formatted;
  };

  const formatCurrency = (amount: number) => {
    const num = formatNumber(amount);
    if (language === 'ur') return `${num} روپے`;
    return `Rs. ${num}`;
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (language === 'ur') {
      const day = String(d.getDate());
      const month = URDU_MONTHS[d.getMonth()];
      const year = String(d.getFullYear());
      const dayDisplay = urduNumbers ? toUrduNumber(day) : day;
      const yearDisplay = urduNumbers ? toUrduNumber(year) : year;
      return `${dayDisplay} ${month} ${yearDisplay}`;
    }
    return d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const addScanHistory = (item: Omit<ScanHistoryItem, 'id' | 'scannedAt'>) => {
    const newItem: ScanHistoryItem = {
      ...item,
      id: Date.now().toString(),
      scannedAt: new Date().toISOString(),
    };
    setScanHistory(prev => [newItem, ...prev].slice(0, 10));
  };

  const updatePaymentMethod = (id: string, updates: Partial<PaymentMethodConfig>) => {
    setPaymentMethods(prev => prev.map(pm => pm.id === id ? { ...pm, ...updates } : pm));
  };

  const togglePaymentMethod = (id: string) => {
    setPaymentMethods(prev => prev.map(pm => pm.id === id ? { ...pm, enabled: !pm.enabled } : pm));
  };

  const setThemeColor = (k: ThemeColorKey) => setThemeColorState(k);
  const setDarkMode = (v: boolean) => setDarkModeState(v);
  const setFontSize = (s: FontSize) => setFontSizeState(s);
  const setUrduNumbers = (v: boolean) => setUrduNumbersState(v);
  const addCustomLanguage = (lang: CustomLanguage) => setCustomLanguages(prev => [...prev, lang]);
  const removeCustomLanguage = (id: string) => setCustomLanguages(prev => prev.filter(l => l.id !== id));

  const value = useMemo(() => ({
    customers, transactions, itemRates, settings, language, t, isRTL,
    paymentMethods, scanHistory,
    themeColor, darkMode, fontSize, urduNumbers, customLanguages,
    addCustomer, deleteCustomer, addTransaction, deleteTransaction,
    updateSettings, setLanguage, getCustomerById, getCustomerTransactions,
    getTodayStats, formatCurrency, formatNumber, formatDate,
    addScanHistory, updatePaymentMethod, togglePaymentMethod,
    setThemeColor, setDarkMode, setFontSize, setUrduNumbers,
    addCustomLanguage, removeCustomLanguage,
  }), [customers, transactions, itemRates, settings, language, paymentMethods, scanHistory, themeColor, darkMode, fontSize, urduNumbers, customLanguages]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
