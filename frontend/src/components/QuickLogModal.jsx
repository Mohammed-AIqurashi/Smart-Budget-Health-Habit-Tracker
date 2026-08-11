import { useState, useEffect } from 'react';
import { X, Receipt, Flame, Save, Droplets, Footprints, Moon, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

const QuickLogModal = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const { t, tCategory } = useLanguage();
  const today = new Date().toISOString().split('T')[0];

  const [customCategories, setCustomCategories] = useState([]);

  // Finance section
  const [financeEnabled, setFinanceEnabled] = useState(true);
  const [financeData, setFinanceData] = useState({
    type: 'expense',
    amount: '',
    category: '',
    note: '',
    date: today,
  });

  // Habit section
  const [habitEnabled, setHabitEnabled] = useState(false);
  const [habitData, setHabitData] = useState({
    metricName: 'calories',
    value: '',
    protein: '',
    carbs: '',
    fat: '',
    note: '',
    date: today,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedItems, setSavedItems] = useState([]);

  useEffect(() => {
    const fetchCustomCats = async () => {
      try {
        const res = await api.get('/users/categories');
        setCustomCategories(Array.isArray(res.data) ? res.data : res.data?.categories || []);
      } catch {
        setCustomCategories([]);
      }
    };
    fetchCustomCats();
  }, []);

  const defaultExpenseCategories = ['Food & Dining', 'Transportation', 'Housing', 'Entertainment', 'Shopping', 'Health', 'Education', 'Other'];
  const defaultIncomeCategories = ['Salary', 'Freelance', 'Gift', 'Other Income'];

  const customExpenseNames = customCategories.filter(c => c.type === 'expense').map(c => c.name);
  const customIncomeNames = customCategories.filter(c => c.type === 'income').map(c => c.name);

  const categories = financeData.type === 'expense'
    ? [...defaultExpenseCategories, ...customExpenseNames.filter(n => !defaultExpenseCategories.includes(n))]
    : [...defaultIncomeCategories, ...customIncomeNames.filter(n => !defaultIncomeCategories.includes(n))];

  const metricIcons = {
    calories: Flame,
    water: Droplets,
    steps: Footprints,
    sleep: Moon,
  };
  const MetricIcon = metricIcons[habitData.metricName] || Flame;

  const canSave = (financeEnabled && financeData.amount && financeData.category) ||
    (habitEnabled && habitData.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSave) {
      setError(t('fillAtLeastOneSection'));
      return;
    }
    setError('');
    setLoading(true);
    const saved = [];

    try {
      if (financeEnabled && financeData.amount && financeData.category) {
        await api.post('/transactions', {
          amount: parseFloat(financeData.amount),
          category: financeData.category,
          type: financeData.type,
          note: financeData.note || undefined,
          timestamp: financeData.date ? new Date(financeData.date).toISOString() : undefined,
        });
        saved.push(t('finance'));
      }

      if (habitEnabled && habitData.value) {
        await api.post('/habits', {
          metricName: habitData.metricName,
          value: parseFloat(habitData.value),
          protein: habitData.protein ? parseFloat(habitData.protein) : undefined,
          carbs: habitData.carbs ? parseFloat(habitData.carbs) : undefined,
          fat: habitData.fat ? parseFloat(habitData.fat) : undefined,
          note: habitData.note || undefined,
          timestamp: habitData.date ? new Date(habitData.date).toISOString() : undefined,
        });
        saved.push(t('habit'));
      }

      setSavedItems(saved);
      onSuccess?.();
      setTimeout(() => onClose(), 800);
    } catch (err) {
      setError(err.response?.data?.message || t('failedLoad'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('quickLogTitle')}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('logFinanceAndHabits')}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-danger-50 border border-danger-200 text-danger-700 rounded-xl text-sm">
              {error}
            </div>
          )}
          {savedItems.length > 0 && (
            <div className="p-3 bg-success-50 border border-success-200 text-success-700 rounded-xl text-sm font-medium">
              ✅ {t('saved')}: {savedItems.join(' + ')}
            </div>
          )}

          {/* Finance Section */}
          <div className={`rounded-2xl border-2 transition-all ${financeEnabled ? 'border-primary-400 bg-primary-50/30 dark:bg-primary-950/20' : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40'}`}>
            <button
              type="button"
              onClick={() => setFinanceEnabled(p => !p)}
              className="w-full flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${financeEnabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-700'}`}>
                  <Receipt className="w-4 h-4 text-white" />
                </div>
                <span className={`font-semibold text-sm ${financeEnabled ? 'text-primary-700 dark:text-primary-400' : 'text-gray-500'}`}>
                  {t('financeEntry')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${financeEnabled ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300' : 'bg-gray-200 text-gray-500'}`}>
                  {financeEnabled ? t('on') : t('off')}
                </span>
                {financeEnabled ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>
            </button>

            {financeEnabled && (
              <div className="px-4 pb-4 space-y-3 border-t border-primary-100 dark:border-gray-800">
                <div className="flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setFinanceData(p => ({ ...p, type: 'expense', category: '' }))}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${financeData.type === 'expense' ? 'bg-danger-500 text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}
                  >
                    {t('expense')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFinanceData(p => ({ ...p, type: 'income', category: '' }))}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${financeData.type === 'income' ? 'bg-success-500 text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}
                  >
                    {t('income')}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">{t('amount')} ({user?.currency || 'SAR'})</label>
                    <input
                      type="number" step="0.01" min="0"
                      placeholder="0.00" className="input"
                      value={financeData.amount}
                      onChange={e => setFinanceData(p => ({ ...p, amount: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="label">{t('date')}</label>
                    <input
                      type="date" className="input"
                      value={financeData.date}
                      onChange={e => setFinanceData(p => ({ ...p, date: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">{t('category')}</label>
                  <select
                    className="input"
                    value={financeData.category}
                    onChange={e => setFinanceData(p => ({ ...p, category: e.target.value }))}
                  >
                    <option value="">{t('selectCategory')}</option>
                    {categories.map(cat => <option key={cat} value={cat}>{tCategory(cat)}</option>)}
                  </select>
                </div>

                <div>
                  <label className="label">{t('note')} ({t('optional')})</label>
                  <input
                    type="text" placeholder={t('lunchExample')} className="input"
                    value={financeData.note}
                    onChange={e => setFinanceData(p => ({ ...p, note: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Habit Section */}
          <div className={`rounded-2xl border-2 transition-all ${habitEnabled ? 'border-warning-400 bg-warning-50/30 dark:bg-warning-950/20' : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40'}`}>
            <button
              type="button"
              onClick={() => setHabitEnabled(p => !p)}
              className="w-full flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${habitEnabled ? 'bg-warning-500' : 'bg-gray-300 dark:bg-gray-700'}`}>
                  <MetricIcon className="w-4 h-4 text-white" />
                </div>
                <span className={`font-semibold text-sm ${habitEnabled ? 'text-warning-700 dark:text-warning-400' : 'text-gray-500'}`}>
                  {t('healthHabit')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${habitEnabled ? 'bg-warning-100 text-warning-700 dark:bg-warning-900/50 dark:text-warning-300' : 'bg-gray-200 text-gray-500'}`}>
                  {habitEnabled ? t('on') : t('off')}
                </span>
                {habitEnabled ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>
            </button>

            {habitEnabled && (
              <div className="px-4 pb-4 space-y-3 border-t border-warning-100 dark:border-gray-800">
                <div className="grid grid-cols-4 gap-1 pt-3">
                  {[
                    { key: 'calories', label: tCategory('Calories'), Icon: Flame, color: 'warning' },
                    { key: 'water', label: tCategory('Water'), Icon: Droplets, color: 'blue' },
                    { key: 'steps', label: tCategory('Steps'), Icon: Footprints, color: 'success' },
                    { key: 'sleep', label: tCategory('Sleep'), Icon: Moon, color: 'purple' },
                  ].map(({ key, label, Icon, color }) => (
                    <button
                      key={key} type="button"
                      onClick={() => setHabitData(p => ({ ...p, metricName: key }))}
                      className={`flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-medium transition-all border ${
                        habitData.metricName === key
                          ? `bg-${color}-100 dark:bg-${color}-950 border-${color}-300 text-${color}-700 dark:text-${color}-300`
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">
                      {t('value')} ({habitData.metricName === 'calories' ? t('kcal') : habitData.metricName === 'water' ? t('ml') : habitData.metricName === 'sleep' ? t('hours') : t('steps')})
                    </label>
                    <input
                      type="number" step="any" min="0"
                      placeholder="e.g. 2000" className="input"
                      value={habitData.value}
                      onChange={e => setHabitData(p => ({ ...p, value: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="label">{t('date')}</label>
                    <input
                      type="date" className="input"
                      value={habitData.date}
                      onChange={e => setHabitData(p => ({ ...p, date: e.target.value }))}
                    />
                  </div>
                </div>

                {habitData.metricName === 'calories' && (
                  <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-warning-200 dark:border-gray-700 space-y-2">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">{t('macros')}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {['protein', 'carbs', 'fat'].map(macro => (
                        <div key={macro}>
                          <label className="label capitalize">{t(macro)} (g)</label>
                          <input
                            type="number" step="any" min="0"
                            placeholder="0" className="input"
                            value={habitData[macro]}
                            onChange={e => setHabitData(p => ({ ...p, [macro]: e.target.value }))}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="label">{t('note')} ({t('optional')})</label>
                  <input
                    type="text" placeholder={t('workoutExample')} className="input"
                    value={habitData.note}
                    onChange={e => setHabitData(p => ({ ...p, note: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !canSave}
            className="w-full btn-primary py-3 text-base disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {loading
              ? t('saving')
              : `${t('save')} ${[financeEnabled && financeData.amount && financeData.category ? t('finance') : '', habitEnabled && habitData.value ? t('habit') : ''].filter(Boolean).join(' + ') || ''}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default QuickLogModal;