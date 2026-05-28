import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG, i18n } from '../constants/config';
import { Customer, Transaction, ItemRate, AppSettings, PaymentMethodConfig, ScanHistoryItem, mockCustomers, mockTransactions, mockItemRates, mockSettings, defaultPaymentMethods } from '../services/mockData';

interface AppContextType {
  customers: Customer[];
  transactions: Transaction[];
  itemRates: ItemRate[];
  settings: AppSettings;
  language: 'en' | 'ur';
  t: typeof i18n.en;
  paymentMethods: PaymentMethodConfig[];
  scanHistory: ScanHistoryItem[];
  addCustomer: (customer: Omit<Customer, 'id' | 'balance' | 'totalCredit' | 'totalDebit' | 'createdAt'>) => void;
  deleteCustomer: (id: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  deleteTransaction: (id: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  setLanguage: (lang: 'en' | 'ur') => void;
  getCustomerById: (id: string) => Customer | undefined;
  getCustomerTransactions: (customerId: string) => Transaction[];
  getTodayStats: () => { todayCredit: number; todayCollection: number; outstanding: number; totalCustomers: number };
  formatCurrency: (amount: number) => string;
  addScanHistory: (item: Omit<ScanHistoryItem, 'id' | 'scannedAt'>) => void;
  updatePaymentMethod: (id: string, updates: Partial<PaymentMethodConfig>) => void;
  togglePaymentMethod: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [itemRates, setItemRates] = useState<ItemRate[]>(mockItemRates);
  const [settings, setSettings] = useState<AppSettings>(mockSettings);
  const [language, setLanguageState] = useState<'en' | 'ur'>('en');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>(defaultPaymentMethods);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);

  const t = i18n[language];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(APP_CONFIG.storageKeys.customers, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    AsyncStorage.setItem(APP_CONFIG.storageKeys.transactions, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    AsyncStorage.setItem(APP_CONFIG.storageKeys.settings, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    AsyncStorage.setItem('kj_paymentMethods', JSON.stringify(paymentMethods));
  }, [paymentMethods]);

  useEffect(() => {
    AsyncStorage.setItem('kj_scanHistory', JSON.stringify(scanHistory));
  }, [scanHistory]);

  const loadData = async () => {
    try {
      const storedCustomers = await AsyncStorage.getItem(APP_CONFIG.storageKeys.customers);
      const storedTransactions = await AsyncStorage.getItem(APP_CONFIG.storageKeys.transactions);
      const storedSettings = await AsyncStorage.getItem(APP_CONFIG.storageKeys.settings);
      const storedLang = await AsyncStorage.getItem(APP_CONFIG.storageKeys.language);

      const storedPaymentMethods = await AsyncStorage.getItem('kj_paymentMethods');
      const storedScanHistory = await AsyncStorage.getItem('kj_scanHistory');

      if (storedCustomers) setCustomers(JSON.parse(storedCustomers));
      if (storedTransactions) setTransactions(JSON.parse(storedTransactions));
      if (storedSettings) setSettings(JSON.parse(storedSettings));
      if (storedLang) setLanguageState(storedLang as 'en' | 'ur');
      if (storedPaymentMethods) setPaymentMethods(JSON.parse(storedPaymentMethods));
      if (storedScanHistory) setScanHistory(JSON.parse(storedScanHistory));
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

  const setLanguage = (lang: 'en' | 'ur') => {
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

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toLocaleString('en-PK')}`;
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

  return (
    <AppContext.Provider value={{
      customers, transactions, itemRates, settings, language, t,
      paymentMethods, scanHistory,
      addCustomer, deleteCustomer, addTransaction, deleteTransaction,
      updateSettings, setLanguage, getCustomerById, getCustomerTransactions,
      getTodayStats, formatCurrency, addScanHistory, updatePaymentMethod, togglePaymentMethod,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
