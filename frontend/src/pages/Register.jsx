import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet, Mail, Lock, UserPlus, DollarSign, Flame, Sun, Moon, Globe, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

const Register = () => {
  const { register, loading } = useAuth();
  const { t, lang, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '',
    monthlyBudget: '2000', calorieGoal: '2000',
    proteinGoal: '', carbsGoal: '', fatGoal: '',
    waterGoal: '', stepsGoal: '', currency: 'SAR',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!emailRegex.test(formData.email)) {
      setError(t('invalidEmail'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t('passwordsNoMatch'));
      return;
    }
    const result = await register({
      email: formData.email,
      password: formData.password,
      monthlyBudget: parseFloat(formData.monthlyBudget),
      calorieGoal: parseInt(formData.calorieGoal),
      proteinGoal: formData.proteinGoal ? parseFloat(formData.proteinGoal) : null,
      carbsGoal: formData.carbsGoal ? parseFloat(formData.carbsGoal) : null,
      fatGoal: formData.fatGoal ? parseFloat(formData.fatGoal) : null,
      waterGoal: formData.waterGoal ? parseFloat(formData.waterGoal) : null,
      stepsGoal: formData.stepsGoal ? parseFloat(formData.stepsGoal) : null,
      currency: formData.currency,
    });
    if (result.success) navigate('/');
    else setError(result.message === 'This email is already registered' ? t('emailTaken') : (result.message || t('failedLoad')));
  };

  const currencies = ['USD', 'EUR', 'GBP', 'SAR', 'AED', 'EGP', 'JOD', 'KWD', 'QAR'];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-success-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4 py-8 transition-colors duration-300">

      {/* Theme & Language toggles — top right */}
      <div className="fixed top-4 end-4 z-50 flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title={theme === 'light' ? t('darkMode') : t('lightMode')}
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
        <button
          onClick={toggleLanguage}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <Globe className="w-4 h-4" />
          {lang === 'en' ? 'عربي' : 'EN'}
        </button>
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 shadow-lg shadow-primary-200 mb-4">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Smart Budget</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t('createSubtitle')}</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">{t('signUp')}</h2>

          {error && (
            <div className="mb-4 p-3 bg-danger-50 border border-danger-200 text-danger-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">{t('email')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                <input type="email" required placeholder="you@example.com"
                  className="input pl-10" value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="label">{t('password')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  placeholder={t('minPassword')}
                  className="input pl-10 pr-10"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
                  tabIndex="-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">{t('confirmPassword')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder={t('reEnterPassword')}
                  className="input pl-10 pr-10"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
                  tabIndex="-1"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">{t('monthlyBudget')}</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                  <input type="number" required min="0" step="0.01" placeholder="2000"
                    className="input pl-10" value={formData.monthlyBudget}
                    onChange={(e) => setFormData({ ...formData, monthlyBudget: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">{t('calorieGoal')}</label>
                <div className="relative">
                  <Flame className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                  <input type="number" required min="500" max="10000" placeholder="2000"
                    className="input pl-10" value={formData.calorieGoal}
                    onChange={(e) => setFormData({ ...formData, calorieGoal: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Optional Daily Health & Macro Goals */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl space-y-3 border border-gray-200 dark:border-gray-700">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('macroGoalsTitle')} {t('optional')}</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="label text-xs">{t('proteinGoal')}</label>
                  <input type="number" min="0" step="1" placeholder="e.g. 150" className="input text-sm"
                    value={formData.proteinGoal}
                    onChange={(e) => setFormData({ ...formData, proteinGoal: e.target.value })} />
                </div>
                <div>
                  <label className="label text-xs">{t('carbsGoal')}</label>
                  <input type="number" min="0" step="1" placeholder="e.g. 200" className="input text-sm"
                    value={formData.carbsGoal}
                    onChange={(e) => setFormData({ ...formData, carbsGoal: e.target.value })} />
                </div>
                <div>
                  <label className="label text-xs">{t('fatGoal')}</label>
                  <input type="number" min="0" step="1" placeholder="e.g. 60" className="input text-sm"
                    value={formData.fatGoal}
                    onChange={(e) => setFormData({ ...formData, fatGoal: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="label text-xs">{t('waterGoal')}</label>
                  <input type="number" min="0" step="50" placeholder="e.g. 3000" className="input text-sm"
                    value={formData.waterGoal}
                    onChange={(e) => setFormData({ ...formData, waterGoal: e.target.value })} />
                </div>
                <div>
                  <label className="label text-xs">{t('stepsGoal')}</label>
                  <input type="number" min="0" step="100" placeholder="e.g. 10000" className="input text-sm"
                    value={formData.stepsGoal}
                    onChange={(e) => setFormData({ ...formData, stepsGoal: e.target.value })} />
                </div>
              </div>
            </div>

            <div>
              <label className="label">{t('currency')}</label>
              <select className="input" value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}>
                {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary">
              <UserPlus className="w-4 h-4" />
              {loading ? t('creatingAccount') : t('createAccount')}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('haveAccount')}{' '}
              <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700">
                {t('login')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;