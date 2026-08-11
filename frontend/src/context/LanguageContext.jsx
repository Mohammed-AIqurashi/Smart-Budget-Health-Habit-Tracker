import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const categoryTranslations = {
  ar: {
    'Food & Dining': 'الطعام والمطاعم',
    'Food': 'الطعام',
    'Transportation': 'المواصلات',
    'Housing': 'السكن والجوال',
    'Entertainment': 'الترفيه',
    'Shopping': 'التسوق',
    'Health': 'الصحة والرياضة',
    'Education': 'التعليم',
    'Other': 'أخرى',
    'Salary': 'الراتب',
    'Freelance': 'عمل حر',
    'Gift': 'هدية',
    'Other Income': 'دخل آخر',
    'Calories': 'السعرات',
    'Water': 'الماء',
    'Steps': 'الخطوات',
    'Sleep': 'النوم',
    'calories': 'السعرات',
    'water': 'الماء',
    'steps': 'الخطوات',
    'sleep': 'النوم',
    'expense': 'مصروف',
    'income': 'دخل',
    'habit': 'عادة',
  },
};

const translations = {
  en: {
    // Nav
    dashboard: 'Dashboard', simulator: 'Simulator', transactions: 'Transactions',
    habits: 'Habits', settings: 'Settings', logout: 'Logout', quickLog: 'Quick Log',

    // Auth
    login: 'Login', register: 'Register', email: 'Email', password: 'Password',
    confirmPassword: 'Confirm Password', createAccount: 'Create Account', signUp: 'Sign Up',
    welcomeBack: 'Welcome Back', trackSubtitle: 'Track your finances and health habits',
    createSubtitle: 'Create your account', loggingIn: 'Logging in...', creatingAccount: 'Creating account...',
    noAccount: "Don't have an account?", haveAccount: 'Already have an account?',
    passwordsNoMatch: 'Passwords do not match', demoAccount: 'Demo account: demo@example.com / demo1234',
    minPassword: 'Min 8 characters with letters and numbers', reEnterPassword: 'Re-enter your password',
    invalidEmail: 'Please enter a valid email address (e.g. name@domain.com)',
    userNotFound: 'Invalid email or password', emailTaken: 'This email is already registered',

    // Dashboard
    remainingBudget: 'Remaining Budget', totalSpent: 'Total Spent This Month',
    avgDailySpend: 'Average Daily Spend', avgDailyCalories: 'Average Daily Calories',
    projected: 'Projected', daysInto: 'days into', dayMonth: 'day month',
    goal: 'Goal', used: 'used', expenseDistribution: 'Expense Distribution',
    noExpensesYet: 'No expenses logged yet this month', dailyExpensesVsCalories: 'Daily Expenses vs Calories',
    noDataYet: 'No data available yet', recentActivity: 'Recent Activity', viewAll: 'View all →',
    noTransactions: 'No transactions yet. Start logging your expenses!',
    dayOfMonth: 'Day of Month', expenses: 'Expenses', calories: 'Calories',

    // Transactions
    transactionsTitle: 'Transactions', transactionsSubtitle: 'View, filter, and manage all your financial transactions.',
    exportCSV: 'Export CSV', addTransaction: 'Add Transaction', allCategories: 'All Categories',
    allTypes: 'All Types', clearFilters: 'Clear filters', category: 'Category', note: 'Note',
    date: 'Date', type: 'Type', amount: 'Amount', actions: 'Actions', noTransactionsFound: 'No transactions found.',
    startLogging: 'Start logging your first transaction!', showing: 'Showing', of: 'of',
    prev: 'Prev', next: 'Next', page: 'Page', income: 'Income', expense: 'Expense',
    search: 'Search...', deleteTransaction: 'Delete Transaction', deleteTransactionMsg: 'Are you sure you want to delete this',

    // Habits
    habitsTitle: 'Habits', habitsSubtitle: 'Track your daily health metrics.',
    addHabit: 'Add Habit', todaysSummary: "Today's Summary",
    noHabitsFound: 'No habit logs found.', startLoggingHabits: 'Start tracking your first habit!',
    metric: 'Metric', value: 'Value', deleteHabit: 'Delete Habit', deleteHabitMsg: 'Are you sure you want to delete this habit log?',
    allMetrics: 'All Metrics', startDate: 'Start Date', endDate: 'End Date',

    // Quick Log
    quickLogTitle: 'Quick Log', logFinanceAndHabits: 'Log finance & habits at once',
    financeEntry: 'Finance Entry', healthHabit: 'Health & Habit',
    on: 'ON', off: 'OFF', selectCategory: 'Select category', macros: 'Macros (optional)',
    protein: 'Protein (g)', carbs: 'Carbs (g)', fat: 'Fat (g)',
    afterWorkout: 'e.g. After workout', lunchExample: 'e.g. Lunch at restaurant',
    save: 'Save', saving: 'Saving...', optional: '(optional)',
    kcal: 'kcal', ml: 'ml', steps: 'steps', hours: 'hours',
    fillAtLeastOneSection: 'Please fill in at least one section (Finance or Habit).',
    finance: 'Finance', habit: 'Habit', saved: 'Saved', workoutExample: 'e.g. After workout',

    // Settings & Goals
    settingsTitle: 'Settings', profileBudgetGoals: 'Profile & Budget Goals',
    monthlyBudget: 'Monthly Budget', calorieGoal: 'Daily Calorie Goal', currency: 'Currency',
    proteinGoal: 'Target Protein (g)', carbsGoal: 'Target Carbs (g)', fatGoal: 'Target Fat (g)',
    waterGoal: 'Target Water (ml)', stepsGoal: 'Target Steps',
    macroGoalsTitle: 'Optional Daily Health & Macro Goals',
    saveChanges: 'Save Changes', saving2: 'Saving...', profileUpdated: 'Profile updated successfully!',
    customCategories: 'Custom Categories', categoryName: 'Category name', expenseType: 'Expense',
    incomeType: 'Income', addCategory: 'Add Category', noCustomCategories: 'No custom categories yet.',
    deleteCategory: 'Delete Category', deleteCategoryMsg: 'Are you sure you want to delete the category',
    language: 'Language', theme: 'Theme', darkMode: 'Dark Mode', lightMode: 'Light Mode',
    arabic: 'العربية', english: 'English',

    // Simulator
    simulatorTitle: 'Smart Budget Simulator',
    simulatorSubtitle: 'Adjust your spending habits and see how much you could save over time.',
    runSimulation: 'Run Simulation', runningSimulation: 'Running...', resetSimulation: 'Reset',
    cutbackSliders: 'Cutback Sliders', projectedSavings: 'Projected Savings',
    threeMonths: '3 Months', sixMonths: '6 Months', twelveMonths: '12 Months',
    monthlySavings: 'Monthly Savings', currentMonthly: 'Current Monthly', optimizedMonthly: 'Optimized Monthly',
    noCategories: 'No spending categories found. Log some transactions first!',
    reduction: 'reduction', currentSpend: 'Current spend', months: 'Months',

    // Common
    delete: 'Delete', edit: 'Edit', cancel: 'Cancel', confirm: 'Confirm',
    retry: 'Retry', loading: 'Loading...', failedLoad: 'Failed to load',
    noData: 'No data available', search2: 'Search',
  },
  ar: {
    // Nav
    dashboard: 'لوحة التحكم', simulator: 'المحاكي', transactions: 'المعاملات',
    habits: 'العادات', settings: 'الإعدادات', logout: 'تسجيل خروج', quickLog: 'تسجيل سريع',

    // Auth
    login: 'تسجيل الدخول', register: 'إنشاء حساب', email: 'البريد الإلكتروني', password: 'كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور', createAccount: 'إنشاء حساب', signUp: 'إنشاء حساب',
    welcomeBack: 'مرحباً بعودتك', trackSubtitle: 'تتبع ميزانيتك وعاداتك الصحية',
    createSubtitle: 'أنشئ حسابك الجديد', loggingIn: 'جاري تسجيل الدخول...', creatingAccount: 'جاري إنشاء الحساب...',
    noAccount: 'ليس لديك حساب؟', haveAccount: 'لديك حساب بالفعل؟',
    passwordsNoMatch: 'كلمتا المرور غير متطابقتين', demoAccount: 'حساب تجريبي: demo@example.com / demo1234',
    minPassword: '٨ أحرف على الأقل تحتوي على أرقام وحروف', reEnterPassword: 'أعد كتابة كلمة المرور',
    invalidEmail: 'يرجى إدخال بريد إلكتروني صحيح (مثل: name@domain.com)',
    userNotFound: 'البريد الإلكتروني أو كلمة المرور غير صحيحة', emailTaken: 'هذا البريد الإلكتروني مسجل بالفعل',

    // Dashboard
    remainingBudget: 'الميزانية المتبقية', totalSpent: 'إجمالي الإنفاق هذا الشهر',
    avgDailySpend: 'متوسط الإنفاق اليومي', avgDailyCalories: 'متوسط السعرات اليومي',
    projected: 'متوقع', daysInto: 'يوم من', dayMonth: 'يوماً',
    goal: 'الهدف', used: 'مستخدم', expenseDistribution: 'توزيع المصروفات',
    noExpensesYet: 'لا توجد مصروفات مسجلة هذا الشهر', dailyExpensesVsCalories: 'المصروفات اليومية مقابل السعرات',
    noDataYet: 'لا توجد بيانات بعد', recentActivity: 'النشاط الأخير', viewAll: 'عرض الكل ←',
    noTransactions: 'لا توجد معاملات بعد. ابدأ بتسجيل مصروفاتك!',
    dayOfMonth: 'يوم الشهر', expenses: 'المصروفات', calories: 'السعرات',

    // Transactions
    transactionsTitle: 'المعاملات', transactionsSubtitle: 'عرض وتصفية وإدارة جميع معاملاتك المالية.',
    exportCSV: 'تصدير CSV', addTransaction: 'إضافة معاملة', allCategories: 'كل الفئات',
    allTypes: 'كل الأنواع', clearFilters: 'مسح الفلاتر', category: 'الفئة', note: 'ملاحظة',
    date: 'التاريخ', type: 'النوع', amount: 'المبلغ', actions: 'الإجراءات', noTransactionsFound: 'لا توجد معاملات.',
    startLogging: 'ابدأ بتسجيل أول معاملة!', showing: 'عرض', of: 'من',
    prev: 'السابق', next: 'التالي', page: 'صفحة', income: 'دخل', expense: 'مصروف',
    search: 'بحث...', deleteTransaction: 'حذف المعاملة', deleteTransactionMsg: 'هل أنت متأكد من حذف هذا الـ',

    // Habits
    habitsTitle: 'العادات', habitsSubtitle: 'تتبع مؤشراتك الصحية اليومية.',
    addHabit: 'إضافة عادة', todaysSummary: 'ملخص اليوم',
    noHabitsFound: 'لا توجد سجلات عادات.', startLoggingHabits: 'ابدأ بتتبع أول عادة!',
    metric: 'المقياس', value: 'القيمة', deleteHabit: 'حذف العادة', deleteHabitMsg: 'هل أنت متأكد من حذف سجل العادة هذا؟',
    allMetrics: 'كل المقاييس', startDate: 'تاريخ البداية', endDate: 'تاريخ النهاية',

    // Quick Log
    quickLogTitle: 'تسجيل سريع', logFinanceAndHabits: 'سجّل الماليات والعادات معاً',
    financeEntry: 'قيد مالي', healthHabit: 'صحة وعادات',
    on: 'مفعّل', off: 'موقف', selectCategory: 'اختر فئة', macros: 'الماكرو (اختياري)',
    protein: 'بروتين (جم)', carbs: 'كربوهيدرات (جم)', fat: 'دهون (جم)',
    afterWorkout: 'مثال: بعد التمرين', lunchExample: 'مثال: غداء في المطعم',
    save: 'حفظ', saving: 'جاري الحفظ...', optional: '(اختياري)',
    kcal: 'سعرة', ml: 'مل', steps: 'خطوة', hours: 'ساعات',
    fillAtLeastOneSection: 'يرجى تعبئة قسم واحد على الأقل (المالية أو العادات).',
    finance: 'مالية', habit: 'عادة', saved: 'تم الحفظ', workoutExample: 'مثال: بعد التمرين',

    // Settings & Goals
    settingsTitle: 'الإعدادات', profileBudgetGoals: 'الملف الشخصي والأهداف',
    monthlyBudget: 'الميزانية الشهرية', calorieGoal: 'هدف السعرات اليومي', currency: 'العملة',
    proteinGoal: 'البروتين المستهدف (جرام)', carbsGoal: 'الكارب المستهدف (جرام)', fatGoal: 'الدهون المستهدفة (جرام)',
    waterGoal: 'هدف الماء اليومي (مل)', stepsGoal: 'هدف الخطوات اليومي',
    macroGoalsTitle: 'أهداف الصحة والماكروز اليومية الاختيارية',
    saveChanges: 'حفظ التغييرات', saving2: 'جاري الحفظ...', profileUpdated: 'تم تحديث الملف الشخصي بنجاح!',
    customCategories: 'الفئات المخصصة', categoryName: 'اسم الفئة', expenseType: 'مصروف',
    incomeType: 'دخل', addCategory: 'إضافة فئة', noCustomCategories: 'لا توجد فئات مخصصة بعد.',
    deleteCategory: 'حذف الفئة', deleteCategoryMsg: 'هل أنت متأكد من حذف الفئة',
    language: 'اللغة', theme: 'المظهر', darkMode: 'الوضع الداكن', lightMode: 'الوضع الفاتح',
    arabic: 'العربية', english: 'English',

    // Simulator
    simulatorTitle: 'محاكي الميزانية الذكي',
    simulatorSubtitle: 'عدّل عادات إنفاقك وشاهد كم يمكنك توفيره مع الوقت.',
    runSimulation: 'تشغيل المحاكاة', runningSimulation: 'جاري التشغيل...', resetSimulation: 'إعادة تعيين',
    cutbackSliders: 'أشرطة التخفيض', projectedSavings: 'التوفير المتوقع',
    threeMonths: '٣ أشهر', sixMonths: '٦ أشهر', twelveMonths: '١٢ شهراً',
    monthlySavings: 'التوفير الشهري', currentMonthly: 'الإنفاق الحالي', optimizedMonthly: 'الإنفاق المحسّن',
    noCategories: 'لا توجد فئات إنفاق. سجّل بعض المعاملات أولاً!',
    reduction: 'تخفيض', currentSpend: 'الإنفاق الحالي', months: 'أشهر',

    // Common
    delete: 'حذف', edit: 'تعديل', cancel: 'إلغاء', confirm: 'تأكيد',
    retry: 'إعادة المحاولة', loading: 'جاري التحميل...', failedLoad: 'فشل التحميل',
    noData: 'لا توجد بيانات', search2: 'بحث',
  },
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('language') || 'en');

  useEffect(() => {
    localStorage.setItem('language', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const toggleLanguage = () => setLang(prev => prev === 'en' ? 'ar' : 'en');
  const t = (key) => translations[lang]?.[key] || translations['en']?.[key] || key;
  const tCategory = (name) => {
    if (!name) return '';
    if (lang === 'ar' && categoryTranslations.ar[name]) {
      return categoryTranslations.ar[name];
    }
    return name;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t, tCategory }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);