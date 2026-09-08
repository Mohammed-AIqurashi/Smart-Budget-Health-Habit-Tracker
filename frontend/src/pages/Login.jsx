import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet, Mail, Lock, LogIn, Sun, Moon, Globe, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

const Login = () => {
  const { login, loading } = useAuth();
  const { t, lang, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!emailRegex.test(formData.email)) {
      setError(t('invalidEmail'));
      return;
    }

    const result = await login(formData.email, formData.password);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message === 'Invalid email or password' ? t('userNotFound') : (result.message || t('userNotFound')));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50/60 via-white to-indigo-50/60 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4 transition-colors duration-300 relative overflow-hidden">
      {/* Decorative blurred backdrop orbs */}
      <div className="absolute w-96 h-96 bg-primary-400/15 dark:bg-primary-600/10 rounded-full blur-3xl -top-20 -start-20 pointer-events-none" />
      <div className="absolute w-96 h-96 bg-indigo-400/15 dark:bg-indigo-600/10 rounded-full blur-3xl -bottom-20 -end-20 pointer-events-none" />

      {/* Theme & Language toggles — top right */}
      <div className="fixed top-4 end-4 z-50 flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center p-2.5 rounded-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200/80 dark:border-gray-700/80 shadow-md text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          title={theme === 'light' ? t('darkMode') : t('lightMode')}
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-warning-400" />}
        </button>
        <button
          onClick={toggleLanguage}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200/80 dark:border-gray-700/80 shadow-md text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
        >
          <Globe className="w-3.5 h-3.5 text-primary-500" />
          <span>{lang === 'en' ? 'عربي' : 'EN'}</span>
        </button>
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-primary-600 via-primary-500 to-indigo-500 shadow-xl shadow-primary-500/25 mb-4 hover:scale-105 transition-transform duration-200">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Smart Budget</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('trackSubtitle')}</p>
        </div>

        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-100 dark:border-gray-800/90 shadow-xl rounded-3xl p-7 sm:p-8">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">{t('welcomeBack')}</h2>

          {error && (
            <div className="mb-4 p-3 bg-danger-50 dark:bg-danger-900/30 border border-danger-200/60 dark:border-danger-800/50 text-danger-700 dark:text-danger-300 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">{t('email')}</label>
              <div className="relative">
                <Mail className="absolute start-3.5 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="email" required placeholder="you@example.com"
                  className="input ps-10" value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label">{t('password')}</label>
              <div className="relative">
                <Lock className="absolute start-3.5 top-3 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="input ps-10 pe-10"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3.5 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
                  tabIndex="-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary py-3 text-sm font-semibold shadow-md shadow-primary-500/25 hover:shadow-lg mt-2">
              <LogIn className="w-4 h-4" />
              {loading ? t('loggingIn') : t('login')}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800/80 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('noAccount')}{' '}
              <Link to="/register" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
                {t('signUp')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;