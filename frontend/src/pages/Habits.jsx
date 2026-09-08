import { useState, useEffect, useCallback } from 'react';
import {
  Flame, Droplets, Footprints, Moon, Plus, Pencil, Trash2, X,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import QuickLogModal from '../components/QuickLogModal.jsx';
import EditHabitModal from '../components/EditHabitModal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import MacroTooltip from '../components/MacroTooltip.jsx';
import { formatDateTime } from '../utils/format.js';
import { useLanguage } from '../context/LanguageContext.jsx';

const Habits = () => {
  const { user, updateUser } = useAuth();
  const { t, tCategory } = useLanguage();
  const [habits, setHabits] = useState([]);
  const [summary, setSummary] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0, water: 0, steps: 0, sleep: 0 });
  const [dailyScore, setDailyScore] = useState(null);
  const [fitnessMode, setFitnessMode] = useState(user?.fitnessMode || 'cutting');
  const [datePreset, setDatePreset] = useState('today'); // 'today' | 'all' | 'custom'

  // Sync mode with user profile
  useEffect(() => {
    if (user?.fitnessMode) {
      setFitnessMode(user.fitnessMode);
    }
  }, [user?.fitnessMode]);

  const handleModeToggle = async (newMode) => {
    setFitnessMode(newMode);
    try {
      await api.put('/users/profile', { fitnessMode: newMode });
      updateUser({ ...user, fitnessMode: newMode });
      fetchHabits();
    } catch {
      // Revert if failed
    }
  };

  // Helper to generate dynamic feedback comment
  const getScoreFeedback = (scoreData) => {
    if (!scoreData) return '';
    const { score, weakestMetric, mode, hasAnyData, calorieStatus } = scoreData;
    
    // If user hasn't logged anything today yet
    if (!hasAnyData) {
      return t('noDataDayFeedback');
    }

    // Tier 1: Outstanding Day (95%+)
    if (score >= 95) return t('perfectDayFeedback');

    // Tier 4: Very Low Score (< 50%) - definitely not a "good day"
    if (score < 50) {
      return t('lowScoreFeedback');
    }

    // Tier 2 & 3: Moderate to Great Scores (50% to 94%)
    // Point out the weakest link specifically
    if (weakestMetric === 'protein') return t('needProteinFeedback');
    if (weakestMetric === 'calories') {
      if (calorieStatus === 'exceeded') {
        return t('exceededCaloriesFeedback');
      }
      return mode === 'bulking' ? t('needCaloriesFeedback') : t('lowScoreFeedback');
    }
    if (weakestMetric === 'water') return t('needWaterFeedback');
    if (weakestMetric === 'sleep') return t('needSleepFeedback');
    if (weakestMetric === 'steps') return t('needStepsFeedback');
    
    if (score >= 75) return t('goodDayFeedback');
    return t('lowScoreFeedback');
  };
  
  // Format local date YYYY-MM-DD
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState({
    metricName: '',
    startDate: getTodayStr(),
    endDate: getTodayStr(),
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [deletingHabit, setDeletingHabit] = useState(null);

  const metricConfig = {
    calories: { icon: Flame, label: tCategory('Calories'), unit: t('kcal'), color: 'text-warning-500', bg: 'bg-warning-50' },
    water: { icon: Droplets, label: tCategory('Water'), unit: t('ml'), color: 'text-blue-500', bg: 'bg-blue-50' },
    steps: { icon: Footprints, label: tCategory('Steps'), unit: t('steps'), color: 'text-success-500', bg: 'bg-success-50' },
    sleep: { icon: Moon, label: tCategory('Sleep'), unit: t('hours'), color: 'text-purple-500', bg: 'bg-purple-50' },
  };

  // Totals computed across ALL records matching the selected date/filter range (not just the current page)
  const dailyTotals = summary;

  const fetchHabits = useCallback(async () => {
    try {
      if (habits.length === 0) setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
      });
      if (filters.metricName) params.append('metricName', filters.metricName);
      if (filters.startDate) {
        // Start of day in ISO or simple date string
        const start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
        params.append('startDate', start.toISOString());
      }
      if (filters.endDate) {
        // End of day in ISO
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        params.append('endDate', end.toISOString());
      }

      const response = await api.get(`/habits?${params.toString()}`);
      const fetchedHabits = response.data.habitLogs || response.data.habits || [];
      setHabits(fetchedHabits);
      
      if (response.data.summary) {
        setSummary(response.data.summary);
      } else {
        // Fallback calculation across fetched items if summary not returned
        const calc = fetchedHabits.reduce(
          (acc, habit) => {
            if (habit.metricName === 'calories') {
              acc.calories += Number(habit.value) || 0;
              acc.protein += Number(habit.protein) || 0;
              acc.carbs += Number(habit.carbs) || 0;
              acc.fat += Number(habit.fat) || 0;
            } else if (habit.metricName === 'water') {
              acc.water += Number(habit.value) || 0;
            } else if (habit.metricName === 'steps') {
              acc.steps += Number(habit.value) || 0;
            } else if (habit.metricName === 'sleep') {
              acc.sleep += Number(habit.value) || 0;
            }
            return acc;
          },
          { calories: 0, protein: 0, carbs: 0, fat: 0, water: 0, steps: 0, sleep: 0 }
        );
        setSummary(calc);
      }

      setDailyScore(response.data.dailyScore || null);

      setPagination(response.data.pagination || {
        page: response.data.currentPage || 1,
        limit: 10,
        total: fetchedHabits.length,
        totalPages: response.data.totalPages || 1,
      });
    } catch (err) {
      setError(err.response?.data?.message || t('failedLoad'));
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters, t]);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const handlePresetChange = (preset) => {
    setDatePreset(preset);
    setPagination((prev) => ({ ...prev, page: 1 }));
    if (preset === 'today') {
      const today = getTodayStr();
      setFilters((prev) => ({ ...prev, startDate: today, endDate: today }));
    } else if (preset === 'all') {
      setFilters((prev) => ({ ...prev, startDate: '', endDate: '' }));
    }
  };

  const handleFilterChange = (key, value) => {
    if (key === 'startDate' || key === 'endDate') {
      setDatePreset('custom');
    }
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/habits/${deletingHabit.id}`);
      setDeletingHabit(null);
      fetchHabits();
    } catch (err) {
      setError(err.response?.data?.message || t('failedLoad'));
    }
  };

  const hasFilters = filters.metricName || filters.startDate || filters.endDate;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('habitsTitle')}</h1>
          <p className="text-gray-600 mt-1">{t('habitsSubtitle')}</p>
        </div>
        <button onClick={() => setShowQuickLog(true)} className="btn-primary shrink-0">
          <Plus className="w-4 h-4" />
          {t('addHabit')}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-danger-50 border border-danger-200 text-danger-700 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Summary Section with Date Scope Selector */}
      <div className="card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">{t('habitsSummary')}</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-medium">
              {datePreset === 'today' ? t('todayFilter') : datePreset === 'all' ? t('allTimeFilter') : t('customRangeFilter')}
            </span>
          </div>

          {/* Preset filter pills & Fitness Mode Toggle */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Fitness Mode (Cutting / Bulking) Toggle */}
            <div className="flex items-center gap-1 p-0.5 bg-gray-100 dark:bg-gray-800 rounded-xl">
              <button
                type="button"
                onClick={() => handleModeToggle('cutting')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  fitnessMode === 'cutting'
                    ? 'bg-white dark:bg-gray-900 text-primary-600 dark:text-primary-400 shadow-xs'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                }`}
              >
                {t('cutting')}
              </button>
              <button
                type="button"
                onClick={() => handleModeToggle('bulking')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  fitnessMode === 'bulking'
                    ? 'bg-white dark:bg-gray-900 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                }`}
              >
                {t('bulking')}
              </button>
            </div>

            <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block" />

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => handlePresetChange('today')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  datePreset === 'today'
                    ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/20'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {t('todayFilter')}
              </button>
              <button
                type="button"
                onClick={() => handlePresetChange('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  datePreset === 'all'
                    ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/20'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {t('allTimeFilter')}
              </button>
              <button
                type="button"
                onClick={() => handlePresetChange('custom')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  datePreset === 'custom'
                    ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/20'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {t('customRangeFilter')}
              </button>
            </div>
          </div>
        </div>

        {/* Daily Health Score Card (shown when a single day is selected and active goals exist) */}
        {filters.startDate && filters.endDate && filters.startDate === filters.endDate && dailyScore && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-primary-500/10 via-emerald-500/5 to-primary-500/5 border border-primary-200 dark:border-primary-800/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Circular Score Badge */}
                <div className="relative w-16 h-16 shrink-0 flex items-center justify-center rounded-2xl bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
                  <div className="text-center">
                    <span className={`text-xl font-black ${
                      dailyScore.score >= 90 ? 'text-emerald-500' : dailyScore.score >= 70 ? 'text-amber-500' : 'text-danger-500'
                    }`}>
                      {dailyScore.score}%
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">{t('dailyScoreTitle')}</h3>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-semibold">
                      {fitnessMode === 'cutting' ? t('cutting') : t('bulking')}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-1">
                    {getScoreFeedback(dailyScore)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Date & Metric Pickers (collapsible or always shown when custom or expanded) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{t('metric')}</label>
            <select
              className="input text-sm"
              value={filters.metricName}
              onChange={(e) => handleFilterChange('metricName', e.target.value)}
            >
              <option value="">{t('allMetrics')}</option>
              <option value="calories">{tCategory('Calories')}</option>
              <option value="water">{tCategory('Water')}</option>
              <option value="steps">{tCategory('Steps')}</option>
              <option value="sleep">{tCategory('Sleep')}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{t('startDate')}</label>
            <input
              type="date"
              className="input text-sm"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{t('endDate')}</label>
            <input
              type="date"
              className="input text-sm"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
        </div>

        {hasFilters && (
          <div className="flex justify-end pt-1">
            <button
              onClick={() => {
                setDatePreset('all');
                setFilters({ metricName: '', startDate: '', endDate: '' });
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="text-xs text-primary-600 dark:text-primary-400 font-medium hover:underline"
            >
              {t('clearFilters')}
            </button>
          </div>
        )}
      </div>

      {/* Summary Cards with Macro Goal Progress Bars */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3.5">
          {/* Total Calories */}
          <div className="card p-4 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-warning-50 dark:bg-warning-950/40 flex items-center justify-center">
                <Flame className="w-3.5 h-3.5 text-warning-500" />
              </div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{tCategory('Calories')}</p>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
              {Math.round(dailyTotals.calories).toLocaleString()} <span className="text-xs font-normal text-gray-500">{t('kcal')}</span>
            </p>
            {user?.calorieGoal ? (
              <div className="mt-2">
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((dailyTotals.calories / user.calorieGoal) * 100))}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">/ {Number(user.calorieGoal).toLocaleString()} {t('kcal')}</p>
              </div>
            ) : null}
          </div>

          {/* Protein */}
          <div className="card p-4 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-500" />
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              </div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t('protein')}</p>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
              {Math.round(dailyTotals.protein)}<span className="text-xs font-normal text-gray-500">g</span>
            </p>
            {user?.proteinGoal ? (
              <div className="mt-2">
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((dailyTotals.protein / user.proteinGoal) * 100))}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">/ {user.proteinGoal}g</p>
              </div>
            ) : null}
          </div>

          {/* Carbs */}
          <div className="card p-4 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-yellow-500" />
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              </div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t('carbs')}</p>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
              {Math.round(dailyTotals.carbs)}<span className="text-xs font-normal text-gray-500">g</span>
            </p>
            {user?.carbsGoal ? (
              <div className="mt-2">
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((dailyTotals.carbs / user.carbsGoal) * 100))}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">/ {user.carbsGoal}g</p>
              </div>
            ) : null}
          </div>

          {/* Fat */}
          <div className="card p-4 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-400 to-red-500" />
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-red-50 dark:bg-red-950/40 flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              </div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t('fat')}</p>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
              {Math.round(dailyTotals.fat)}<span className="text-xs font-normal text-gray-500">g</span>
            </p>
            {user?.fatGoal ? (
              <div className="mt-2">
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-400 to-red-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((dailyTotals.fat / user.fatGoal) * 100))}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">/ {user.fatGoal}g</p>
              </div>
            ) : null}
          </div>

          {/* Total Water */}
          <div className="card p-4 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-blue-500" />
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
                <Droplets className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{tCategory('Water')}</p>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
              {Math.round(dailyTotals.water).toLocaleString()} <span className="text-xs font-normal text-gray-500">{t('ml')}</span>
            </p>
            {user?.waterGoal ? (
              <div className="mt-2">
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((dailyTotals.water / user.waterGoal) * 100))}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">/ {Number(user.waterGoal).toLocaleString()} {t('ml')}</p>
              </div>
            ) : null}
          </div>

          {/* Steps */}
          <div className="card p-4 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-green-500" />
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
                <Footprints className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{tCategory('Steps')}</p>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
              {Math.round(dailyTotals.steps).toLocaleString()}
            </p>
            {user?.stepsGoal ? (
              <div className="mt-2">
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((dailyTotals.steps / user.stepsGoal) * 100))}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">/ {Number(user.stepsGoal).toLocaleString()}</p>
              </div>
            ) : null}
          </div>

          {/* Sleep */}
          <div className="card p-4 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 to-violet-500" />
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center">
                <Moon className="w-3.5 h-3.5 text-purple-500" />
              </div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{tCategory('Sleep')}</p>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
              {Number(dailyTotals.sleep).toFixed(1)} <span className="text-xs font-normal text-gray-500">{t('hours')}</span>
            </p>
            {user?.sleepGoal ? (
              <div className="mt-2">
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-400 to-violet-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((dailyTotals.sleep / user.sleepGoal) * 100))}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">/ {user.sleepGoal} {t('hours')}</p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Data grid */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="table-header">{t('metric')}</th>
                <th className="table-header">{t('value')}</th>
                <th className="table-header">{t('note')}</th>
                <th className="table-header">{t('date')}</th>
                <th className="table-header text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <div className="inline-block w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                  </td>
                </tr>
              ) : habits.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                    <p>{t('noHabitsFound')}</p>
                    {!hasFilters && (
                      <p className="text-sm mt-1">{t('startLoggingHabits')}</p>
                    )}
                  </td>
                </tr>
              ) : (
                habits.map((habit) => {
                  const config = metricConfig[habit.metricName] || { icon: Flame, label: tCategory(habit.metricName), unit: '', color: 'text-gray-500', bg: 'bg-gray-50' };
                  const Icon = config.icon;
                  return (
                    <tr key={habit.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                      <td className="table-cell">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {config.label}
                        </span>
                      </td>
                      <td className="table-cell font-medium">
                        {habit.value.toLocaleString()} {config.unit}
                        {habit.metricName === 'calories' && (
                          <span className="ml-2">
                            <MacroTooltip
                              protein={habit.protein}
                              carbs={habit.carbs}
                              fat={habit.fat}
                              t={t}
                            />
                          </span>
                        )}
                      </td>
                      <td className="table-cell text-gray-500 dark:text-gray-400">{habit.note || '—'}</td>
                      <td className="table-cell text-gray-500 dark:text-gray-400">{formatDateTime(habit.timestamp)}</td>
                      <td className="table-cell text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingHabit(habit)}
                            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingHabit(habit)}
                            className="p-2 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && habits.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-900">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('showing')} {((pagination.page - 1) * pagination.limit) + 1}-
              {Math.min(pagination.page * pagination.limit, pagination.total)} {t('of')} {pagination.total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="btn-secondary text-sm py-1.5 px-3"
              >
                <ChevronLeft className="w-4 h-4" />
                {t('prev')}
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {t('page')} {pagination.page} {t('of')} {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                disabled={pagination.page === pagination.totalPages}
                className="btn-secondary text-sm py-1.5 px-3"
              >
                {t('next')}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {showQuickLog && (
        <QuickLogModal
          onClose={() => setShowQuickLog(false)}
          onSuccess={fetchHabits}
        />
      )}

      {editingHabit && (
        <EditHabitModal
          habit={editingHabit}
          onClose={() => setEditingHabit(null)}
          onSuccess={() => {
            setEditingHabit(null);
            fetchHabits();
          }}
        />
      )}

      {deletingHabit && (
        <ConfirmDialog
          title={t('deleteHabit')}
          message={t('deleteHabitMsg')}
          confirmLabel={t('delete')}
          onConfirm={handleDelete}
          onCancel={() => setDeletingHabit(null)}
        />
      )}
    </div>
  );
};

export default Habits;