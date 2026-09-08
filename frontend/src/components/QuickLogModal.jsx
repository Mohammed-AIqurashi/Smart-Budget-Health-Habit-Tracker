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
    time: '', // empty means auto/current time
  });

  // Habit section - multi-habit support
  const [habitEnabled, setHabitEnabled] = useState(false);
  const [habitDate, setHabitDate] = useState(today);
  const [habitTime, setHabitTime] = useState(''); // empty means auto/current time
  const [habitMetrics, setHabitMetrics] = useState({
    calories: { enabled: false, value: '', protein: '', carbs: '', fat: '', note: '' },
    water:    { enabled: false, value: '', note: '' },
    steps:    { enabled: false, value: '', note: '' },
    sleep:    { enabled: false, value: '', note: '' },
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

  const anyHabitFilled = Object.values(habitMetrics).some(m => m.enabled && m.value);
  const canSave = (financeEnabled && financeData.amount && financeData.category) ||
    (habitEnabled && anyHabitFilled);

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
      // Create timestamp combining the selected date with the specified time or current time
      const buildTimestamp = (dateStr, customTimeStr) => {
        if (!dateStr) return new Date().toISOString();
        const now = new Date();
        const [year, month, day] = dateStr.split('-').map(Number);
        let hours = now.getHours();
        let minutes = now.getMinutes();
        let seconds = now.getSeconds();

        if (customTimeStr && customTimeStr.includes(':')) {
          const [h, m] = customTimeStr.split(':').map(Number);
          hours = isNaN(h) ? hours : h;
          minutes = isNaN(m) ? minutes : m;
          seconds = 0;
        }

        const combined = new Date(year, month - 1, day, hours, minutes, seconds, now.getMilliseconds());
        return combined.toISOString();
      };

      if (financeEnabled && financeData.amount && financeData.category) {
        await api.post('/transactions', {
          amount: parseFloat(financeData.amount),
          category: financeData.category,
          type: financeData.type,
          note: financeData.note || undefined,
          timestamp: buildTimestamp(financeData.date, financeData.time),
        });
        saved.push(t('finance'));
      }

      if (habitEnabled && anyHabitFilled) {
        const toSave = Object.entries(habitMetrics).filter(([, m]) => m.enabled && m.value);
        for (const [metricName, m] of toSave) {
          const payload = {
            metricName,
            value: parseFloat(m.value),
            note: m.note || undefined,
            timestamp: buildTimestamp(habitDate, habitTime),
          };
          if (metricName === 'calories') {
            if (m.protein) payload.protein = parseFloat(m.protein);
            if (m.carbs)   payload.carbs   = parseFloat(m.carbs);
            if (m.fat)     payload.fat     = parseFloat(m.fat);
          }
          await api.post('/habits', payload);
        }
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

  const setMetric = (metric, field, value) =>
    setHabitMetrics(prev => ({
      ...prev,
      [metric]: { ...prev[metric], [field]: value }
    }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      <div className="relative bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-sm">
              <Save className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white leading-tight">{t('quickLogTitle')}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('logFinanceAndHabits')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {error && (
            <div className="p-3 bg-danger-50 border border-danger-200 text-danger-700 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          {savedItems.length > 0 && (
            <div className="p-3 bg-success-50 border border-success-200 text-success-700 rounded-xl text-sm font-medium">
              ✅ {t('saved')}: {savedItems.join(' + ')}
            </div>
          )}

          {/* Finance Section */}
          <div className={`rounded-2xl border-2 transition-all ${financeEnabled ? 'border-primary-400 dark:border-primary-500/60 bg-primary-50/40 dark:bg-gray-800/80' : 'border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-850/40'}`}>
            <button
              type="button"
              onClick={() => setFinanceEnabled(p => !p)}
              className="w-full flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${financeEnabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-700'}`}>
                  <Receipt className="w-4 h-4 text-white" />
                </div>
                <span className={`font-semibold text-sm ${financeEnabled ? 'text-primary-700 dark:text-primary-300' : 'text-gray-500 dark:text-gray-400'}`}>
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
                  <button type="button"
                    onClick={() => setFinanceData(p => ({ ...p, type: 'expense', category: '' }))}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${financeData.type === 'expense' ? 'bg-danger-500 text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}
                  >{t('expense')}</button>
                  <button type="button"
                    onClick={() => setFinanceData(p => ({ ...p, type: 'income', category: '' }))}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${financeData.type === 'income' ? 'bg-success-500 text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}
                  >{t('income')}</button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="label">{t('amount')} ({user?.currency || 'SAR'})</label>
                    <input type="number" step="0.01" min="0" placeholder="0.00" className="input"
                      value={financeData.amount}
                      onChange={e => setFinanceData(p => ({ ...p, amount: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">{t('date')}</label>
                    <input type="date" className="input"
                      value={financeData.date}
                      onChange={e => setFinanceData(p => ({ ...p, date: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label flex items-center justify-between">
                      <span>{t('time')}</span>
                      <span className="text-[10px] text-gray-400 font-normal">{t('optional')}</span>
                    </label>
                    <input type="time" className="input"
                      value={financeData.time}
                      placeholder="--:--"
                      onChange={e => setFinanceData(p => ({ ...p, time: e.target.value }))} />
                  </div>
                </div>

                <div>
                  <label className="label">{t('category')}</label>
                  <select className="input" value={financeData.category}
                    onChange={e => setFinanceData(p => ({ ...p, category: e.target.value }))}>
                    <option value="">{t('selectCategory')}</option>
                    {categories.map(cat => <option key={cat} value={cat}>{tCategory(cat)}</option>)}
                  </select>
                </div>

                <div>
                  <label className="label">{t('note')} {t('optional')}</label>
                  <input type="text" placeholder={t('lunchExample')} className="input"
                    value={financeData.note}
                    onChange={e => setFinanceData(p => ({ ...p, note: e.target.value }))} />
                </div>
              </div>
            )}
          </div>

          {/* Habit Section */}
          <div className={`rounded-2xl border-2 transition-all ${habitEnabled ? 'border-warning-400 dark:border-warning-500/60 bg-warning-50/40 dark:bg-gray-800/80' : 'border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-850/40'}`}>
            <button
              type="button"
              onClick={() => setHabitEnabled(p => !p)}
              className="w-full flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${habitEnabled ? 'bg-warning-500' : 'bg-gray-300 dark:bg-gray-700'}`}>
                  <Flame className="w-4 h-4 text-white" />
                </div>
                <span className={`font-semibold text-sm ${habitEnabled ? 'text-warning-700 dark:text-warning-400' : 'text-gray-500 dark:text-gray-400'}`}>
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
                {/* التاريخ والوقت */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                  <div>
                    <label className="label">{t('date')}</label>
                    <input type="date" className="input" value={habitDate}
                      onChange={e => setHabitDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="label flex items-center justify-between">
                      <span>{t('time')}</span>
                      <span className="text-[10px] text-gray-400 font-normal">{t('optional')}</span>
                    </label>
                    <input type="time" className="input" value={habitTime}
                      placeholder="--:--"
                      onChange={e => setHabitTime(e.target.value)} />
                  </div>
                </div>

                {/* السعرات */}
                <div className={`rounded-xl border p-3.5 transition-all ${habitMetrics.calories.enabled ? 'border-amber-400 dark:border-amber-500/50 bg-amber-50/40 dark:bg-gray-850' : 'border-gray-200 dark:border-gray-700/60 bg-gray-50/30 dark:bg-gray-850/40'}`}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-amber-500"
                      checked={habitMetrics.calories.enabled}
                      onChange={e => setMetric('calories', 'enabled', e.target.checked)} />
                    <Flame className="w-4 h-4 text-warning-500" />
                    <span className="text-sm font-semibold text-gray-800 dark:text-white">{tCategory('Calories')}</span>
                  </label>
                  {habitMetrics.calories.enabled && (
                    <div className="mt-2.5 space-y-2.5">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="label">{t('kcal')}</label>
                          <input type="number" step="any" min="0" placeholder="e.g. 2000" className="input"
                            value={habitMetrics.calories.value}
                            onChange={e => setMetric('calories', 'value', e.target.value)} />
                        </div>
                        <div>
                          <label className="label">{t('note')} {t('optional')}</label>
                          <input type="text" className="input" value={habitMetrics.calories.note}
                            onChange={e => setMetric('calories', 'note', e.target.value)} />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {['protein', 'carbs', 'fat'].map(macro => (
                          <div key={macro} className="flex flex-col justify-between">
                            <label className="label text-xs mb-1 min-h-[2.25rem] flex items-center">{t(macro)}</label>
                            <input type="number" step="any" min="0" placeholder="0" className="input mt-auto"
                              value={habitMetrics.calories[macro]}
                              onChange={e => setMetric('calories', macro, e.target.value)} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* الماء */}
                <div className={`rounded-xl border p-3.5 transition-all ${habitMetrics.water.enabled ? 'border-blue-400 dark:border-blue-500/50 bg-blue-50/40 dark:bg-gray-850' : 'border-gray-200 dark:border-gray-700/60 bg-gray-50/30 dark:bg-gray-850/40'}`}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-blue-500"
                      checked={habitMetrics.water.enabled}
                      onChange={e => setMetric('water', 'enabled', e.target.checked)} />
                    <Droplets className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-semibold text-gray-800 dark:text-white">{tCategory('Water')}</span>
                  </label>
                  {habitMetrics.water.enabled && (
                    <div className="mt-2.5 grid grid-cols-2 gap-2">
                      <div>
                        <label className="label">{t('ml')}</label>
                        <input type="number" step="any" min="0" placeholder="e.g. 2000" className="input"
                          value={habitMetrics.water.value}
                          onChange={e => setMetric('water', 'value', e.target.value)} />
                      </div>
                      <div>
                        <label className="label">{t('note')} {t('optional')}</label>
                        <input type="text" className="input" value={habitMetrics.water.note}
                          onChange={e => setMetric('water', 'note', e.target.value)} />
                      </div>
                    </div>
                  )}
                </div>

                {/* الخطوات */}
                <div className={`rounded-xl border p-3.5 transition-all ${habitMetrics.steps.enabled ? 'border-emerald-400 dark:border-emerald-500/50 bg-emerald-50/40 dark:bg-gray-850' : 'border-gray-200 dark:border-gray-700/60 bg-gray-50/30 dark:bg-gray-850/40'}`}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-emerald-500"
                      checked={habitMetrics.steps.enabled}
                      onChange={e => setMetric('steps', 'enabled', e.target.checked)} />
                    <Footprints className="w-4 h-4 text-success-500" />
                    <span className="text-sm font-semibold text-gray-800 dark:text-white">{tCategory('Steps')}</span>
                  </label>
                  {habitMetrics.steps.enabled && (
                    <div className="mt-2.5 grid grid-cols-2 gap-2">
                      <div>
                        <label className="label">{t('steps')}</label>
                        <input type="number" step="1" min="0" placeholder="e.g. 8000" className="input"
                          value={habitMetrics.steps.value}
                          onChange={e => setMetric('steps', 'value', e.target.value)} />
                      </div>
                      <div>
                        <label className="label">{t('note')} {t('optional')}</label>
                        <input type="text" className="input" value={habitMetrics.steps.note}
                          onChange={e => setMetric('steps', 'note', e.target.value)} />
                      </div>
                    </div>
                  )}
                </div>

                {/* النوم */}
                <div className={`rounded-xl border p-3.5 transition-all ${habitMetrics.sleep.enabled ? 'border-purple-400 dark:border-purple-500/50 bg-purple-50/40 dark:bg-gray-850' : 'border-gray-200 dark:border-gray-700/60 bg-gray-50/30 dark:bg-gray-850/40'}`}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-purple-500"
                      checked={habitMetrics.sleep.enabled}
                      onChange={e => setMetric('sleep', 'enabled', e.target.checked)} />
                    <Moon className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-semibold text-gray-800 dark:text-white">{tCategory('Sleep')}</span>
                  </label>
                  {habitMetrics.sleep.enabled && (
                    <div className="mt-2.5 grid grid-cols-2 gap-2">
                      <div>
                        <label className="label">{t('hours')}</label>
                        <input type="number" step="0.5" min="0" max="24" placeholder="e.g. 8" className="input"
                          value={habitMetrics.sleep.value}
                          onChange={e => setMetric('sleep', 'value', e.target.value)} />
                      </div>
                      <div>
                        <label className="label">{t('note')} {t('optional')}</label>
                        <input type="text" className="input" value={habitMetrics.sleep.note}
                          onChange={e => setMetric('sleep', 'note', e.target.value)} />
                      </div>
                    </div>
                  )}
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
            {loading ? t('saving') : t('save')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default QuickLogModal;