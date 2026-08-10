import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  en: {
    dashboard: 'Dashboard',
    simulator: 'Simulator',
    transactions: 'Transactions',
    habits: 'Habits',
    settings: 'Settings',
    login: 'Login',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    monthlyBudget: 'Monthly Budget',
    calorieGoal: 'Daily Calorie Goal',
    currency: 'Currency',
    save: 'Save',
    cancel: 'Cancel',
    addTransaction: 'Add Transaction',
    addHabit: 'Add Habit',
    amount: 'Amount',
    category: 'Category',
    note: 'Note',
    date: 'Date',
    type: 'Type',
    expense: 'Expense',
    income: 'Income',
    search: 'Search',
    filter: 'Filter',
    exportCSV: 'Export CSV',
    delete: 'Delete',
    edit: 'Edit',
    confirm: 'Confirm',
    logout: 'Logout',
    quickLog: 'Quick Log',
    projectedSavings: 'Projected Savings',
    monthlySavings: 'Monthly Savings',
    optimizedMonthly: 'Optimized Monthly',
    currentMonthly: 'Current Monthly',
    projectedCalorieReduction: 'Projected Calorie Reduction',
    monthlySaved: 'Monthly Saved',
    months: 'Months',
    total: 'Total',
    noData: 'No data available',
    remainingBudget: 'Remaining Budget',
    totalSpent: 'Total Spent',
    avgDailySpend: 'Avg Daily Spend',
    avgDailyCalories: 'Avg Daily Calories',
    healthWealthScore: 'Health & Wealth Score',
    protein: 'Protein',
    carbs: 'Carbs',
    fat: 'Fat',
    costPerProtein: 'Cost per Protein',
    kcal: 'kcal',
    grams: 'g',
    meals: 'Meals',
    water: 'Water',
    steps: 'Steps',
    sleep: 'Sleep',
    glasses: 'glasses',
    hours: 'hours',
    language: 'Language',
    theme: 'Theme',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
  },
  ar: {
    dashboard: 'لوحة التحكم',
    simulator: 'المحاكي',
    transactions: 'المعاملات',
    habits: 'العادات',
    settings: 'الإعدادات',
    login: 'تسجيل الدخول',
    register: 'إنشاء حساب',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    monthlyBudget: 'الميزانية الشهرية',
    calorieGoal: 'هدف السعرات اليومي',
    currency: 'العملة',
    save: 'حفظ',
    cancel: 'إلغاء',
    addTransaction: 'إضافة معاملة',
    addHabit: 'إضافة عادة',
    amount: 'المبلغ',
    category: 'الفئة',
    note: 'ملاحظة',
    date: 'التاريخ',
    type: 'النوع',
    expense: 'مصروف',
    income: 'دخل',
    search: 'بحث',
    filter: 'فلتر',
    exportCSV: 'تصدير CSV',
    delete: 'حذف',
    edit: 'تعديل',
    confirm: 'تأكيد',
    logout: 'تسجيل خروج',
    quickLog: 'تسجيل سريع',
    projectedSavings: 'التوفير المتوقع',
    monthlySavings: 'التوفير الشهري',
    optimizedMonthly: 'الشهري المحسن',
    currentMonthly: 'الشهري الحالي',
    projectedCalorieReduction: 'تقليل السعرات المتوقع',
    monthlySaved: 'الشهري الموفر',
    months: 'أشهر',
    total: 'الإجمالي',
    noData: 'لا توجد بيانات',
    remainingBudget: 'الميزانية المتبقية',
    totalSpent: 'إجمالي المصروف',
    avgDailySpend: 'متوسط الإنفاق اليومي',
    avgDailyCalories: 'متوسط السعرات اليومي',
    healthWealthScore: 'مؤشر الصحة والثروة',
    protein: 'بروتين',
    carbs: 'كربوهيدرات',
    fat: 'دهون',
    costPerProtein: 'تكلفة البروتين',
    kcal: 'سعرة',
    grams: 'جم',
    meals: 'وجبات',
    water: 'ماء',
    steps: 'خطوات',
    sleep: 'نوم',
    glasses: 'أكواب',
    hours: 'ساعات',
    language: 'اللغة',
    theme: 'المظهر',
    darkMode: 'الوضع الداكن',
    lightMode: 'الوضع الفاتح',
  },
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('language');
    return saved || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const toggleLanguage = () => {
    setLang(prev => prev === 'en' ? 'ar' : 'en');
  };

  const t = (key) => {
    return translations[lang]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);