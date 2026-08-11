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
  const { user } = useAuth();
  const { t, tCategory } = useLanguage();
  const [habits, setHabits] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState({ metricName: '', startDate: '', endDate: '' });
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

  const dailyTotals = habits.reduce(
    (acc, habit) => {
      if (habit.metricName === 'calories') {
        acc.calories += habit.value;
        acc.protein += habit.protein || 0;
        acc.carbs += habit.carbs || 0;
        acc.fat += habit.fat || 0;
      } else if (habit.metricName === 'water') {
        acc.water += habit.value;
      } else if (habit.metricName === 'steps') {
        acc.steps += habit.value;
      } else if (habit.metricName === 'sleep') {
        acc.sleep += habit.value;
      }
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, water: 0, steps: 0, sleep: 0 }
  );

  const fetchHabits = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
      });
      if (filters.metricName) params.append('metricName', filters.metricName);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`/habits?${params.toString()}`);
      setHabits(response.data.habitLogs || response.data.habits || []);
      setPagination(response.data.pagination || {
        page: response.data.currentPage || 1,
        limit: 10,
        total: (response.data.habitLogs || response.data.habits || []).length,
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

  const handleFilterChange = (key, value) => {
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

      {/* Daily Summary Counters with Optional Macro Goal Progress Bars */}
      {!loading && habits.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Total Calories */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-4 h-4 text-warning-500" />
              <p className="text-xs text-gray-500 dark:text-gray-400">{tCategory('Calories')}</p>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {Math.round(dailyTotals.calories).toLocaleString()} {t('kcal')}
              {user?.calorieGoal ? <span className="text-xs text-gray-400 font-normal"> / {Number(user.calorieGoal).toLocaleString()} {t('kcal')}</span> : ''}
            </p>
            {user?.calorieGoal && (
              <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-warning-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, Math.round((dailyTotals.calories / user.calorieGoal) * 100))}%` }}
                />
              </div>
            )}
          </div>

          {/* Protein */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('protein')}</p>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {Math.round(dailyTotals.protein)}g
              {user?.proteinGoal ? <span className="text-xs text-gray-400 font-normal"> / {user.proteinGoal}g</span> : ''}
            </p>
            {user?.proteinGoal && (
              <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, Math.round((dailyTotals.protein / user.proteinGoal) * 100))}%` }}
                />
              </div>
            )}
          </div>

          {/* Carbs */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('carbs')}</p>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {Math.round(dailyTotals.carbs)}g
              {user?.carbsGoal ? <span className="text-xs text-gray-400 font-normal"> / {user.carbsGoal}g</span> : ''}
            </p>
            {user?.carbsGoal && (
              <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-yellow-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, Math.round((dailyTotals.carbs / user.carbsGoal) * 100))}%` }}
                />
              </div>
            )}
          </div>

          {/* Fat */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('fat')}</p>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {Math.round(dailyTotals.fat)}g
              {user?.fatGoal ? <span className="text-xs text-gray-400 font-normal"> / {user.fatGoal}g</span> : ''}
            </p>
            {user?.fatGoal && (
              <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, Math.round((dailyTotals.fat / user.fatGoal) * 100))}%` }}
                />
              </div>
            )}
          </div>

          {/* Total Water */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-1">
              <Droplets className="w-4 h-4 text-blue-500" />
              <p className="text-xs text-gray-500 dark:text-gray-400">{tCategory('Water')}</p>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {Math.round(dailyTotals.water).toLocaleString()} {t('ml')}
              {user?.waterGoal ? <span className="text-xs text-gray-400 font-normal"> / {Number(user.waterGoal).toLocaleString()} {t('ml')}</span> : ''}
            </p>
            {user?.waterGoal && (
              <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, Math.round((dailyTotals.water / user.waterGoal) * 100))}%` }}
                />
              </div>
            )}
          </div>

          {/* Steps */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-1">
              <Footprints className="w-4 h-4 text-success-500" />
              <p className="text-xs text-gray-500 dark:text-gray-400">{tCategory('Steps')}</p>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {Math.round(dailyTotals.steps).toLocaleString()}
              {user?.stepsGoal ? <span className="text-xs text-gray-400 font-normal"> / {Number(user.stepsGoal).toLocaleString()}</span> : ''}
            </p>
            {user?.stepsGoal && (
              <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-success-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, Math.round((dailyTotals.steps / user.stepsGoal) * 100))}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <select
            className="input"
            value={filters.metricName}
            onChange={(e) => handleFilterChange('metricName', e.target.value)}
          >
            <option value="">{t('allMetrics')}</option>
            <option value="calories">{tCategory('Calories')}</option>
            <option value="water">{tCategory('Water')}</option>
            <option value="steps">{tCategory('Steps')}</option>
            <option value="sleep">{tCategory('Sleep')}</option>
          </select>
          <input
            type="date"
            className="input"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
          />
          <input
            type="date"
            className="input"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
          />
        </div>
        {hasFilters && (
          <button
            onClick={() => {
              setFilters({ metricName: '', startDate: '', endDate: '' });
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="mt-4 text-sm text-primary-600 font-medium hover:text-primary-700"
          >
            {t('clearFilters')}
          </button>
        )}
      </div>

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