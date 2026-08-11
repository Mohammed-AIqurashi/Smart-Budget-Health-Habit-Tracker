import { useState, useEffect } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import { TrendingDown, PiggyBank, RefreshCw, Sparkles, Flame } from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { formatCurrency, getCategoryColor } from '../utils/format.js';

const Simulator = () => {
  const { user } = useAuth();
  const { t, tCategory } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [cutbacks, setCutbacks] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/analytics/categories');
      const expenseCategories = response.data?.breakdown || response.data?.categories || [
        { name: 'Food & Dining', value: 450 },
        { name: 'Transportation', value: 120 },
        { name: 'Entertainment', value: 200 },
      ];
      setCategories(expenseCategories);
      const initialCutbacks = {};
      expenseCategories.forEach((cat) => {
        initialCutbacks[cat.name] = 0;
      });
      setCutbacks(initialCutbacks);
    } catch {
      const demoCategories = [
        { name: 'Food & Dining', value: 450 },
        { name: 'Transportation', value: 120 },
        { name: 'Entertainment', value: 200 },
      ];
      setCategories(demoCategories);
      const initialCutbacks = {};
      demoCategories.forEach((cat) => { initialCutbacks[cat.name] = 0; });
      setCutbacks(initialCutbacks);
    }
  };

  const handleCutbackChange = (category, value) => {
    setCutbacks((prev) => ({ ...prev, [category]: value }));
  };

  const handleSimulate = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/simulator', { cutbacks });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || t('failedLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    const reset = {};
    categories.forEach((cat) => {
      reset[cat.name] = 0;
    });
    setCutbacks(reset);
    setResult(null);
  };

  const totalCutbackPercentage = Object.values(cutbacks).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('simulatorTitle')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{t('simulatorSubtitle')}</p>
      </div>

      {error && (
        <div className="p-4 bg-danger-50 border border-danger-200 text-danger-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cutback controls */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-danger-500" />
              {t('cutbackSliders')}
            </h2>
            <button onClick={handleReset} className="btn-secondary text-sm py-1.5 px-3">
              <RefreshCw className="w-4 h-4" />
              {t('resetSimulation')}
            </button>
          </div>

          {categories.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>{t('noCategories')}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {categories.map((cat) => (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: getCategoryColor(cat.name) }}
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{tCategory(cat.name)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatCurrency(cat.value || cat.amount || 0, user?.currency)}
                      </span>
                      <span className="text-sm font-semibold text-primary-600 dark:text-primary-400 w-12 text-right">
                        {cutbacks[cat.name] || 0}%
                      </span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={cutbacks[cat.name] || 0}
                    onChange={(e) => handleCutbackChange(cat.name, parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  />
                </div>
              ))}

              <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('reduction')}</span>
                  <span className="text-lg font-bold text-primary-600 dark:text-primary-400">{totalCutbackPercentage}%</span>
                </div>
                <button
                  onClick={handleSimulate}
                  disabled={loading || totalCutbackPercentage === 0}
                  className="w-full btn-primary"
                >
                  <Sparkles className="w-4 h-4" />
                  {loading ? t('runningSimulation') : t('runSimulation')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
            <PiggyBank className="w-5 h-5 text-success-500" />
            {t('projectedSavings')}
          </h2>

          {!result ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              <PiggyBank className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-center">
                {t('simulatorSubtitle')}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Header Cards with High Dark-Mode Contrast */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="p-4 bg-gray-50 dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700">
                  <p className="text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">{t('currentMonthly')}</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatCurrency(result.currentMonthlySpend || 0, result.currency || user?.currency)}
                  </p>
                </div>
                <div className="p-4 bg-success-50/90 dark:bg-emerald-950/60 rounded-xl border border-success-200 dark:border-emerald-800/80">
                  <p className="text-xs font-semibold text-success-800 dark:text-emerald-300 mb-1">{t('optimizedMonthly')}</p>
                  <p className="text-lg font-bold text-success-700 dark:text-emerald-400">
                    {formatCurrency(result.optimizedMonthlySpend || 0, result.currency || user?.currency)}
                  </p>
                </div>
                <div className="p-4 bg-primary-50/90 dark:bg-blue-950/60 rounded-xl border border-primary-200 dark:border-blue-800/80">
                  <p className="text-xs font-semibold text-primary-800 dark:text-blue-300 mb-1">{t('monthlySavings')}</p>
                  <p className="text-lg font-bold text-primary-700 dark:text-blue-400">
                    {formatCurrency(result.totalMonthlySavings || 0, result.currency || user?.currency)}
                  </p>
                </div>
              </div>

              {/* Projection cards - responsive grid */}
              {result.projections && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {result.projections.map((p) => (
                    <div key={p.months} className="p-4 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 rounded-xl text-center shadow-xs">
                      <p className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2">{p.months} {t('months')}</p>
                      <p className="text-lg sm:text-xl font-bold text-success-600 dark:text-emerald-400 mb-1">
                        {formatCurrency(p.totalSavings, result.currency || user?.currency)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        {p.savingsPercentage}% {t('reduction')}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Calorie Reduction Card - responsive grid with LTR minus protection */}
              {result.calorieSavings && !result.calorieSavings.isZero && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                    <Flame className="w-5 h-5 text-warning-500" />
                    {tCategory('Calories')}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="p-4 bg-amber-50/90 dark:bg-amber-950/60 rounded-xl border border-amber-200 dark:border-amber-800/80 text-center">
                      <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">{t('threeMonths')}</p>
                      <p className="text-lg sm:text-xl font-bold text-amber-900 dark:text-amber-300 inline-flex items-center justify-center gap-1 w-full">
                        <span dir="ltr">-{result.calorieSavings.projections?.[0]?.totalCaloriesSaved?.toLocaleString() || 0}</span>
                        <span>{t('kcal')}</span>
                      </p>
                    </div>
                    <div className="p-4 bg-amber-50/90 dark:bg-amber-950/60 rounded-xl border border-amber-200 dark:border-amber-800/80 text-center">
                      <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">{t('sixMonths')}</p>
                      <p className="text-lg sm:text-xl font-bold text-amber-900 dark:text-amber-300 inline-flex items-center justify-center gap-1 w-full">
                        <span dir="ltr">-{result.calorieSavings.projections?.[1]?.totalCaloriesSaved?.toLocaleString() || 0}</span>
                        <span>{t('kcal')}</span>
                      </p>
                    </div>
                    <div className="p-4 bg-amber-50/90 dark:bg-amber-950/60 rounded-xl border border-amber-200 dark:border-amber-800/80 text-center">
                      <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">{t('twelveMonths')}</p>
                      <p className="text-lg sm:text-xl font-bold text-amber-900 dark:text-amber-300 inline-flex items-center justify-center gap-1 w-full">
                        <span dir="ltr">-{result.calorieSavings.projections?.[2]?.totalCaloriesSaved?.toLocaleString() || 0}</span>
                        <span>{t('kcal')}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Custom Category savings breakdown with RTL alignment */}
              {result.categorySavings && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">{t('customCategories')}</h3>
                  <div className="space-y-2">
                    {Object.entries(result.categorySavings)
                      .filter(([, data]) => (data.monthlySavings || 0) > 0)
                      .map(([category, data]) => (
                        <div key={category} className="flex items-center justify-between text-sm p-3 bg-gray-50 dark:bg-slate-800/80 rounded-xl border border-gray-100 dark:border-slate-700/60">
                          <span className="font-medium text-gray-800 dark:text-slate-200 text-right">{tCategory(category)}</span>
                          <span className="font-bold text-success-600 dark:text-emerald-400 text-left dir-ltr">
                            {formatCurrency(data.monthlySavings, result.currency || user?.currency)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Simulator;