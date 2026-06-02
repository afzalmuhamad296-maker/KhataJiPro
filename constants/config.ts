export const APP_CONFIG = {
  name: 'KhataJi Pro',
  version: '3.0.0',
  storageKeys: {
    customers: 'kj_customers',
    transactions: 'kj_transactions',
    itemRates: 'kj_itemRates',
    settings: 'kj_settings',
    pin: 'kj_pin',
    language: 'kj_language',
    customLanguages: 'kj_customLanguages',
    voiceHistory: 'kj_voiceHistory',
    themeColor: 'kj_themeColor',
    darkMode: 'kj_darkMode',
    fontSize: 'kj_fontSize',
    urduNumbers: 'kj_urduNumbers',
  },
  currency: 'PKR',
  currencySymbol: 'Rs.',
  quickAmounts: [100, 200, 500, 1000, 2000, 5000],
  paymentMethods: ['cash', 'easypaisa', 'jazzcash', 'bank', 'other'],
};

// Urdu numerals mapping
export const URDU_NUMERALS: Record<string, string> = {
  '0': '۰', '1': '۱', '2': '۲', '3': '۳', '4': '۴',
  '5': '۵', '6': '۶', '7': '۷', '8': '۸', '9': '۹',
};

export const URDU_MONTHS = [
  'جنوری', 'فروری', 'مارچ', 'اپریل', 'مئی', 'جون',
  'جولائی', 'اگست', 'ستمبر', 'اکتوبر', 'نومبر', 'دسمبر',
];

export const URDU_DAYS = ['اتوار', 'پیر', 'منگل', 'بدھ', 'جمعرات', 'جمعہ', 'ہفتہ'];

export const i18n = {
  en: {
    // App
    appName: 'KhataJi Pro',
    tagline: 'Smart Udhaar Management',
    
    // Tabs
    home: 'Home',
    dashboard: 'Dashboard',
    customers: 'Customers',
    udhaar: 'Udhaar',
    reports: 'Reports',
    settings: 'Settings',
    
    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',
    ok: 'OK',
    next: 'Next',
    back: 'Back',
    done: 'Done',
    apply: 'Apply',
    reset: 'Reset',
    close: 'Close',
    search: 'Search...',
    loading: 'Loading...',
    
    // Greetings & Status
    welcome: 'Welcome back!',
    welcomeHello: 'Hello',
    morning: 'Good Morning',
    afternoon: 'Good Afternoon',
    evening: 'Good Evening',
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    
    // Dashboard
    todayCredit: 'Today Credit',
    todayCollection: 'Collection',
    outstanding: 'Outstanding',
    totalCustomers: 'Customers',
    totalOutstanding: 'Total Outstanding',
    weekCredit: 'Week Credit',
    weekCollection: 'Week Collection',
    pending: 'Pending',
    settled: 'Settled',
    clear: 'Clear',
    quickActions: 'Quick Actions',
    recentActivity: 'Recent Activity',
    businessOverview: 'Business Overview',
    topOutstanding: 'Top Outstanding',
    seeAll: 'See All',
    viewAll: 'View All',
    
    // Customers
    addCustomer: 'Add Customer',
    newCustomer: 'New Customer',
    noCustomers: 'No customers yet',
    customerName: 'Customer Name',
    
    // Transactions
    addCredit: 'Add Credit',
    addPayment: 'Add Payment',
    credit: 'Credit',
    debit: 'Payment',
    creditGiven: 'Credit Given',
    paymentReceived: 'Payment Received',
    noTransactions: 'No transactions yet',
    amount: 'Amount',
    note: 'Note (optional)',
    date: 'Date',
    selectCustomer: 'Select Customer',
    addItems: 'Add Items',
    quantity: 'Qty',
    rate: 'Rate',
    total: 'Total',
    
    // Customer details
    name: 'Name',
    phone: 'Phone',
    address: 'Address',
    balance: 'Balance',
    totalCredit: 'Total Credit',
    totalDebit: 'Total Paid',
    ledger: 'Ledger',
    due: 'Due',
    
    // Filters
    all: 'All',
    credits: 'Credits',
    payments: 'Payments',
    today: 'Today',
    yesterday: 'Yesterday',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    
    // Settings sections
    profile: 'Profile',
    appearance: 'Appearance',
    language: 'Language & Region',
    security: 'Security',
    notifications: 'Notifications',
    dataBackup: 'Data & Backup',
    business: 'Business Settings',
    printReceipt: 'Print & Receipt',
    about: 'About',
    quickAccess: 'Quick Access',
    
    // Profile
    shopName: 'Shop Name',
    ownerName: 'Owner Name',
    saveProfile: 'Save Profile',
    tapPhotoChange: 'Tap photo to change',
    
    // Appearance
    themeColor: 'Theme Color',
    darkMode: 'Dark Mode',
    autoDarkMode: 'Auto Dark Mode',
    fontSize: 'Font Size',
    small: 'Small',
    medium: 'Medium',
    large: 'Large',
    
    // Language
    appLanguage: 'App Language',
    dateFormat: 'Date Format',
    currency: 'Currency',
    symbolPosition: 'Symbol Position',
    addCustom: 'Add Custom',
    customLanguage: 'Custom Language',
    languageName: 'Language Name',
    nativeName: 'Native Name',
    direction: 'Direction',
    rtl: 'Right to Left',
    ltr: 'Left to Right',
    importJson: 'Import JSON',
    exportJson: 'Export JSON',
    urduNumerals: 'Urdu Numerals',
    
    // Security
    changePin: 'Change PIN',
    twoFA: 'Two-Factor Authentication',
    biometric: 'Biometric Login',
    autoLock: 'Auto-Lock After',
    sessionTimeout: 'Session Timeout',
    instant: 'Instant',
    never: 'Never',
    
    // Notifications
    smsReminders: 'SMS Reminders',
    smsTemplate: 'SMS Template',
    dailyReminder: 'Daily Reminder',
    paymentNotif: 'Payment Received',
    festivalNotif: 'Festival Greetings',
    birthdayNotif: 'Birthday Wishes',
    sound: 'Sound',
    vibration: 'Vibration',
    
    // Data
    storage: 'Storage',
    lastBackup: 'Last Backup',
    backupNow: 'Backup Now',
    autoBackup: 'Auto Backup',
    wifiOnly: 'WiFi Only',
    restore: 'Restore from Backup',
    exportData: 'Export Data',
    importData: 'Import Data',
    clearCache: 'Clear Cache',
    clearAll: 'Clear All Data',
    permanent: 'Permanent',
    
    // Business
    dailyGoal: 'Daily Goal',
    creditLimit: 'Credit Limit',
    shopOpens: 'Shop Opens',
    shopCloses: 'Shop Closes',
    taxRate: 'Tax Rate',
    discount: 'Discount',
    
    // Print
    receiptTemplate: 'Receipt Template',
    invoiceFooter: 'Invoice Footer',
    
    // About
    version: 'Version',
    madeIn: 'Made with ❤️ in Pakistan',
    rateApp: 'Rate App',
    support: 'Support',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    checkUpdate: 'Check for Updates',
    
    // Voice Entry
    voiceEntry: 'Voice Entry',
    voiceListen: 'Listening...',
    voiceProcess: 'Processing...',
    voiceSpeak: 'Speaking...',
    voiceIdle: 'Tap to speak',
    voiceError: 'Could not understand',
    voiceRetry: 'Tap to retry',
    suggestedCommands: 'Suggested Commands',
    voiceHistory: 'Voice History',
    typeInstead: 'Type instead',
    voicePending: 'Pending',
    voiceDone: 'Done',
    voiceFailed: 'Failed',
    
    // AI / Assistant
    chatAssistant: 'AI Assistant',
    insights: 'Business Insights',
    
    // Actions
    call: 'Call',
    sms: 'SMS',
    pay: 'Pay',
    share: 'Share',
    
    // Confirmations
    confirmDelete: 'Are you sure?',
    confirmAction: 'Confirm Action',
    customer: 'Customer',
    action: 'Action',
    
    // Plans
    free: 'Free',
    pro: 'Pro',
    upgrade: 'Upgrade',
    upgradeProDesc: 'Unlock AI features, unlimited customers & more',
    
    // Payment Methods
    paymentMethod: 'Payment Method',
    cash: 'Cash',
    easypaisa: 'Easypaisa',
    jazzcash: 'JazzCash',
    bank: 'Bank Transfer',
    other: 'Other',
    
    // PIN
    pin: 'PIN Lock',
    enterPin: 'Enter PIN',
    wrongPin: 'Wrong PIN',
    pinChanged: 'PIN Changed',
    
    // Common others
    sendSMS: 'Send SMS reminder',
    typeDelete: 'Type DELETE to confirm',
    deleteWarning: 'This action cannot be undone',
  },

  ur: {
    // App
    appName: 'کھاتا جی پرو',
    tagline: 'سمارٹ ادھار مینجمنٹ',
    
    // Tabs
    home: 'ہوم',
    dashboard: 'ڈیش بورڈ',
    customers: 'گاہک',
    udhaar: 'ادھار',
    reports: 'رپورٹس',
    settings: 'سیٹنگز',
    
    // Common
    save: 'محفوظ کریں',
    cancel: 'منسوخ',
    delete: 'حذف کریں',
    edit: 'ترمیم',
    add: 'شامل کریں',
    confirm: 'تصدیق کریں',
    yes: 'ہاں',
    no: 'نہیں',
    ok: 'ٹھیک ہے',
    next: 'اگلا',
    back: 'واپس',
    done: 'مکمل',
    apply: 'لاگو کریں',
    reset: 'ری سیٹ',
    close: 'بند کریں',
    search: 'تلاش کریں...',
    loading: 'لوڈ ہو رہا ہے...',
    
    // Greetings
    welcome: 'واپسی پر خوش آمدید',
    welcomeHello: 'السلام علیکم',
    morning: 'صبح بخیر',
    afternoon: 'دوپہر بخیر',
    evening: 'شام بخیر',
    success: 'کامیاب',
    error: 'خرابی',
    warning: 'انتباہ',
    
    // Dashboard
    todayCredit: 'آج کا ادھار',
    todayCollection: 'وصولی',
    outstanding: 'بقایا',
    totalCustomers: 'کل گاہک',
    totalOutstanding: 'کل بقایا',
    weekCredit: 'ہفتہ ادھار',
    weekCollection: 'ہفتہ وصولی',
    pending: 'باقی',
    settled: 'سیٹلڈ',
    clear: 'صاف',
    quickActions: 'فوری اعمال',
    recentActivity: 'حالیہ سرگرمی',
    businessOverview: 'کاروبار کا جائزہ',
    topOutstanding: 'سب سے زیادہ بقایا',
    seeAll: 'سب دیکھیں',
    viewAll: 'تمام دیکھیں',
    
    // Customers
    addCustomer: 'نیا گاہک',
    newCustomer: 'نیا گاہک',
    noCustomers: 'کوئی گاہک نہیں',
    customerName: 'گاہک کا نام',
    
    // Transactions
    addCredit: 'ادھار شامل کریں',
    addPayment: 'ادائیگی شامل کریں',
    credit: 'ادھار',
    debit: 'ادائیگی',
    creditGiven: 'ادھار دیا',
    paymentReceived: 'وصول کیا',
    noTransactions: 'کوئی لین دین نہیں',
    amount: 'رقم',
    note: 'نوٹ (اختیاری)',
    date: 'تاریخ',
    selectCustomer: 'گاہک منتخب کریں',
    addItems: 'اشیاء شامل کریں',
    quantity: 'مقدار',
    rate: 'ریٹ',
    total: 'کل',
    
    // Customer details
    name: 'نام',
    phone: 'فون',
    address: 'پتہ',
    balance: 'بقایا',
    totalCredit: 'کل ادھار',
    totalDebit: 'کل ادائیگی',
    ledger: 'کھاتہ',
    due: 'باقی',
    
    // Filters
    all: 'تمام',
    credits: 'ادھار',
    payments: 'ادائیگیاں',
    today: 'آج',
    yesterday: 'کل',
    thisWeek: 'اس ہفتے',
    thisMonth: 'اس ماہ',
    daily: 'روزانہ',
    weekly: 'ہفتہ وار',
    monthly: 'ماہانہ',
    
    // Settings sections
    profile: 'پروفائل',
    appearance: 'تھیم',
    language: 'زبان اور علاقہ',
    security: 'سیکیورٹی',
    notifications: 'اطلاعات',
    dataBackup: 'ڈیٹا اور بیک اپ',
    business: 'کاروبار کی ترتیبات',
    printReceipt: 'پرنٹ اور رسید',
    about: 'ایپ کے بارے میں',
    quickAccess: 'فوری رسائی',
    
    // Profile
    shopName: 'دکان کا نام',
    ownerName: 'مالک کا نام',
    saveProfile: 'پروفائل محفوظ کریں',
    tapPhotoChange: 'تصویر تبدیل کرنے کے لئے دبائیں',
    
    // Appearance
    themeColor: 'رنگ',
    darkMode: 'ڈارک موڈ',
    autoDarkMode: 'خودکار ڈارک موڈ',
    fontSize: 'فونٹ سائز',
    small: 'چھوٹا',
    medium: 'درمیانہ',
    large: 'بڑا',
    
    // Language
    appLanguage: 'ایپ کی زبان',
    dateFormat: 'تاریخ کا انداز',
    currency: 'کرنسی',
    symbolPosition: 'علامت کی پوزیشن',
    addCustom: 'نئی زبان شامل کریں',
    customLanguage: 'حسبِ ضرورت زبان',
    languageName: 'زبان کا نام',
    nativeName: 'مقامی نام',
    direction: 'سمت',
    rtl: 'دائیں سے بائیں',
    ltr: 'بائیں سے دائیں',
    importJson: 'JSON درآمد',
    exportJson: 'JSON برآمد',
    urduNumerals: 'اردو ہندسے',
    
    // Security
    changePin: 'پن تبدیل کریں',
    twoFA: 'دو مرحلہ توثیق',
    biometric: 'فنگر پرنٹ / فیس آئی ڈی',
    autoLock: 'خودکار لاک',
    sessionTimeout: 'سیشن ٹائم آؤٹ',
    instant: 'فوری',
    never: 'کبھی نہیں',
    
    // Notifications
    smsReminders: 'ایس ایم ایس یاد دہانی',
    smsTemplate: 'ایس ایم ایس ٹیمپلیٹ',
    dailyReminder: 'روزانہ یاد دہانی',
    paymentNotif: 'ادائیگی کی اطلاع',
    festivalNotif: 'تہوار کی مبارک باد',
    birthdayNotif: 'سالگرہ کی مبارکباد',
    sound: 'آواز',
    vibration: 'وائبریشن',
    
    // Data
    storage: 'سٹوریج',
    lastBackup: 'آخری بیک اپ',
    backupNow: 'ابھی بیک اپ کریں',
    autoBackup: 'خودکار بیک اپ',
    wifiOnly: 'صرف وائی فائی',
    restore: 'بیک اپ سے بحال',
    exportData: 'ڈیٹا برآمد',
    importData: 'ڈیٹا درآمد',
    clearCache: 'کیشے صاف کریں',
    clearAll: 'تمام ڈیٹا حذف',
    permanent: 'مستقل',
    
    // Business
    dailyGoal: 'روزانہ کا ہدف',
    creditLimit: 'ادھار کی حد',
    shopOpens: 'دکان کھلنے کا وقت',
    shopCloses: 'دکان بند ہونے کا وقت',
    taxRate: 'ٹیکس کی شرح',
    discount: 'رعایت',
    
    // Print
    receiptTemplate: 'رسید کا ٹیمپلیٹ',
    invoiceFooter: 'انوائس فوٹر',
    
    // About
    version: 'ورژن',
    madeIn: 'پاکستان میں ❤️ کے ساتھ بنایا گیا',
    rateApp: 'ایپ کو ریٹ کریں',
    support: 'مدد',
    privacy: 'پرائیویسی پالیسی',
    terms: 'شرائط و ضوابط',
    checkUpdate: 'اپ ڈیٹ چیک کریں',
    
    // Voice Entry
    voiceEntry: 'آواز سے اندراج',
    voiceListen: 'سن رہا ہوں...',
    voiceProcess: 'سمجھ رہا ہوں...',
    voiceSpeak: 'بول رہا ہوں...',
    voiceIdle: 'بولنے کے لئے دبائیں',
    voiceError: 'سمجھ نہیں آیا',
    voiceRetry: 'دوبارہ کوشش کریں',
    suggestedCommands: 'تجاویز شدہ کمانڈز',
    voiceHistory: 'تاریخ',
    typeInstead: 'لکھ کر کوشش کریں',
    voicePending: 'باقی',
    voiceDone: 'مکمل',
    voiceFailed: 'ناکام',
    
    // AI
    chatAssistant: 'اے آئی اسسٹنٹ',
    insights: 'بصیرت',
    
    // Actions
    call: 'کال کریں',
    sms: 'پیغام',
    pay: 'ادا',
    share: 'شیئر',
    
    // Confirmations
    confirmDelete: 'کیا آپ واقعی حذف کرنا چاہتے ہیں؟',
    confirmAction: 'تصدیق کریں',
    customer: 'گاہک',
    action: 'عمل',
    
    // Plans
    free: 'مفت',
    pro: 'پرو',
    upgrade: 'اپ گریڈ',
    upgradeProDesc: 'اے آئی فیچرز، لامحدود گاہک اور بہت کچھ',
    
    // Payment Methods
    paymentMethod: 'ادائیگی کا طریقہ',
    cash: 'نقد',
    easypaisa: 'ایزی پیسہ',
    jazzcash: 'جاز کیش',
    bank: 'بینک ٹرانسفر',
    other: 'دیگر',
    
    // PIN
    pin: 'پن کوڈ',
    enterPin: 'پن درج کریں',
    wrongPin: 'غلط پن',
    pinChanged: 'پن تبدیل ہو گیا',
    
    sendSMS: 'ایس ایم ایس بھیجیں',
    typeDelete: 'تصدیق کے لیے DELETE لکھیں',
    deleteWarning: 'یہ عمل واپس نہیں ہو سکتا',
  },
};

export type Language = 'en' | 'ur';
export type LangKeys = keyof typeof i18n.en;
