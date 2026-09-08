import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  LineChart,
  Receipt,
  Flame,
  Settings,
  LogOut,
  Wallet,
  Menu,
  X,
  Sun,
  Moon,
  Globe,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { getInitials } from '../utils/format.js';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLanguage, t } = useLanguage();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: t('dashboard'), icon: LayoutDashboard },
    { to: '/simulator', label: t('simulator'), icon: LineChart },
    { to: '/transactions', label: t('transactions'), icon: Receipt },
    { to: '/habits', label: t('habits'), icon: Flame },
    { to: '/settings', label: t('settings'), icon: Settings },
  ];

  const isArabic = lang === 'ar';

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-gradient-to-b dark:from-gray-900 dark:to-gray-950 select-none">
      {/* Logo */}
      <div className="flex items-center gap-3.5 px-6 py-6 border-b border-gray-100 dark:border-gray-800/60">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-600 via-primary-500 to-indigo-500 flex items-center justify-center shadow-md shadow-primary-500/25 shrink-0">
          <Wallet className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-base font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-tight">
            Smart Budget
          </h1>
          <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 truncate">
            {isArabic ? 'تتبع الميزانية والعادات' : 'Health Habit Tracker'}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3.5 py-5 space-y-1.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md shadow-primary-500/25 font-semibold'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-100'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={`p-1 rounded-lg transition-colors ${
                    isActive
                      ? 'text-white'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Theme & Language toggles */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800/60 flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100/90 dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all shadow-xs"
        >
          {theme === 'light' ? <Moon className="w-3.5 h-3.5 text-gray-600" /> : <Sun className="w-3.5 h-3.5 text-warning-400" />}
          <span>{theme === 'light' ? t('darkMode') : t('lightMode')}</span>
        </button>
        <button
          onClick={toggleLanguage}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100/90 dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all shadow-xs"
        >
          <Globe className="w-3.5 h-3.5 text-primary-500" />
          <span>{lang === 'en' ? 'عربي' : 'EN'}</span>
        </button>
      </div>

      {/* User info */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800/60">
        <div className="flex items-center gap-3 mb-3 p-2 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/50">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-600 via-primary-500 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md shadow-primary-500/20">
            {getInitials(user?.email)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">{user?.email}</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
              {t('monthlyBudget')}: {user?.currency} {user?.monthlyBudget}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-danger-600 dark:text-danger-400 bg-danger-50/60 dark:bg-danger-900/30 hover:bg-danger-100 dark:hover:bg-danger-900/50 rounded-xl transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          {t('logout')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/70 dark:bg-gray-950 text-gray-900 dark:text-slate-100 transition-colors duration-300">
      {/* Mobile Top App Bar */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-700 dark:text-gray-200"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center shadow-sm">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-white">Smart Budget</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-warning-400" />}
          </button>
          <button
            onClick={toggleLanguage}
            className="px-2.5 py-1 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-xl"
          >
            {lang === 'en' ? 'عربي' : 'EN'}
          </button>
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 start-0 w-72 border-e border-gray-200/80 dark:border-gray-800 z-30 shadow-sm">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute inset-y-0 start-0 w-72 bg-white dark:bg-gray-900 shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="lg:ps-72 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;