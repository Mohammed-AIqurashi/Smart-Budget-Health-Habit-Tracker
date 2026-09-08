import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, TrendingUp, CalendarDays, Flame, Plus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import api from '../api/client.js';
import StatCard from '../components/StatCard.jsx';
import QuickLogModal from '../components/QuickLogModal.jsx';
import { formatCurrency, formatDateTime, getCategoryColor } from '../utils/format.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

/* ── helpers ─────────────────────────────────────────────── */
const getDateLabel = (lang) => {
  const now = new Date();
  return now.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
};

/* Custom label rendered in the centre of the donut */
const DonutCenterLabel = ({ cx, cy, total, currency, isDark }) => (
  <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
    <tspan x={cx} dy="-0.4em" fontSize={13} fill={isDark ? '#94a3b8' : '#64748b'} fontWeight={500}>
      Total
    </tspan>
    <tspan x={cx} dy="1.5em" fontSize={15} fill={isDark ? '#f1f5f9' : '#1e293b'} fontWeight={700}>
      {formatCurrency(total, currency)}
    </tspan>
  </text>
);

/* ── component ───────────────────────────────────────────── */
const Dashboard = () => {
  const { theme } = useTheme();
  const { t, tCategory, lang } = useLanguage();
  const isArabic = lang === 'ar';
  const [data, setData] = useState(() => {
    try {
      const cached = localStorage.getItem('cached_dashboard');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => !localStorage.getItem('cached_dashboard'));
  const [error, setError] = useState('');
  const [showQuickLog, setShowQuickLog] = useState(false);

  const isDark = theme === 'dark';
  const chartTextColor = isDark ? '#f8fafc' : '#334155';
  const chartGridColor = isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb';

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/analytics/dashboard');
      setData(response.data);
      try {
        localStorage.setItem('cached_dashboard', JSON.stringify(response.data));
      } catch {}
    } catch (err) {
      if (!data) setError(err.response?.data?.message || t('failedLoad'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const getBudgetColor = (p) =>
    p < 50 ? 'from-success-400 to-success-500' :
    p < 80 ? 'from-warning-400 to-warning-500' :
             'from-danger-400 to-danger-500';

  /* ── loading ─── */
  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">{t('loading')}</p>
      </div>
    </div>
  );

  /* ── error ─── */
  if (error) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <p className="text-danger-600 font-medium mb-2">{error}</p>
        <button onClick={fetchDashboard} className="btn-primary">{t('retry')}</button>
      </div>
    </div>
  );

  const { summary, categoryBreakdown, dailyTrends, recentTransactions } = data;

  const translatedBreakdown = categoryBreakdown.map(item => ({
    ...item,
    rawName: item.name,
    name: tCategory(item.name),
  }));

  const totalExpenses = summary.totalExpenses;

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      borderRadius: 10,
      border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
      boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.7)' : '0 4px 16px rgba(0,0,0,0.10)',
      fontSize: 13,
      color: isDark ? '#f1f5f9' : '#1e293b',
      padding: '8px 14px',
    },
    labelStyle: { color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600, marginBottom: 4 },
    itemStyle: { color: isDark ? '#f1f5f9' : '#1e293b', fontWeight: 500 },
  };

  /* ── render ─── */
  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('dashboard')}</h1>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
            {getDateLabel(lang)}
          </p>
        </div>

        <button
          onClick={() => setShowQuickLog(true)}
          className="btn-primary shrink-0 px-5 py-2.5 shadow-md hover:shadow-primary-500/30 hover:scale-105 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          {t('quickLog')}
        </button>
      </div>

      {/* ── Summary Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

        {/* Remaining Budget — custom card */}
        <div className="card hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden relative group flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-success-400 to-emerald-500" />
          <div>
            {/* Header: Title + Icon */}
            <div className="flex items-center justify-between gap-2 mb-3 pt-0.5">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate">
                {t('remainingBudget')}
              </p>
              <div className="p-2 rounded-xl bg-gradient-to-br from-success-400 to-emerald-500 shadow-xs shrink-0 group-hover:scale-105 transition-transform duration-200">
                <Wallet className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Value: Full width row, no collision */}
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-tight tracking-tight mb-1">
              {formatCurrency(summary.remainingBudget, summary.currency)}
            </p>
          </div>

          <div>
            <div className="mt-3 mb-1.5">
              <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ${getBudgetColor(summary.budgetPercentage)}`}
                  style={{ width: `${Math.min(summary.budgetPercentage, 100)}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {summary.budgetPercentage}% {t('of')} {formatCurrency(summary.monthlyBudget, summary.currency)} {t('used')}
            </p>
          </div>
        </div>

        <StatCard
          title={t('totalSpent')}
          value={formatCurrency(summary.totalExpenses, summary.currency)}
          subtitle={`${summary.daysElapsed} ${t('daysInto')} ${summary.daysInMonth} ${t('dayMonth')}`}
          icon={TrendingUp}
          accentColor="from-danger-400 to-rose-500"
        />

        <StatCard
          title={t('avgDailySpend')}
          value={formatCurrency(summary.averageDailySpend, summary.currency)}
          subtitle={`${t('projected')}: ${formatCurrency(summary.projectedMonthlySpend, summary.currency)}`}
          icon={CalendarDays}
          accentColor="from-primary-400 to-violet-500"
        />

        <StatCard
          title={t('avgDailyCalories')}
          value={summary.averageDailyCalories.toLocaleString()}
          subtitle={`${t('goal')}: ${summary.calorieGoal.toLocaleString()} ${t('kcal')}`}
          icon={Flame}
          accentColor="from-warning-400 to-orange-500"
        />
      </div>

      {/* ── Charts ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Donut Chart */}
        <div className="card">
          <h2 className="text-base font-bold text-gray-800 dark:text-slate-100 mb-1">{t('expenseDistribution')}</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">{t('thisMonth') || 'This month'}</p>
          {translatedBreakdown.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-400 dark:text-slate-500 text-sm">
              {t('noExpensesYet')}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={translatedBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={72}
                  outerRadius={105}
                  paddingAngle={3}
                >
                  {translatedBreakdown.map((entry) => (
                    <Cell key={entry.name} fill={getCategoryColor(entry.rawName || entry.name)} />
                  ))}
                </Pie>
                <DonutCenterLabel
                  cx="50%"
                  cy="50%"
                  total={totalExpenses}
                  currency={summary.currency}
                  isDark={isDark}
                />
                <Tooltip
                  formatter={(v) => formatCurrency(v, summary.currency)}
                  {...tooltipStyle}
                />
                <Legend
                  wrapperStyle={{ color: chartTextColor, fontSize: 12 }}
                  formatter={(value) => isArabic ? `\u00A0\u00A0${value}` : value}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar Chart */}
        <div className="card">
          <h2 className="text-base font-bold text-gray-800 dark:text-slate-100 mb-1">{t('dailyExpensesVsCalories')}</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">{t('thisMonth') || 'This month'}</p>
          {dailyTrends.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-400 dark:text-slate-500 text-sm">
              {t('noDataYet')}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyTrends} margin={{ top: 6, right: 10, left: 0, bottom: 40 }}>
                <defs>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f87171" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                  <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: chartTextColor }}
                  axisLine={{ stroke: chartGridColor }}
                  tickLine={false}
                  label={{ value: t('dayOfMonth'), position: 'insideBottom', offset: -15, style: { fontSize: 12, fill: chartTextColor } }}
                />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: chartTextColor }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: chartTextColor }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'expenses') return [formatCurrency(value, summary.currency), t('expenses')];
                    return [`${value.toLocaleString()} ${t('kcal')}`, t('calories')];
                  }}
                  {...tooltipStyle}
                  cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', radius: 4 }}
                />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ paddingTop: 18, fontSize: 12, color: chartTextColor }}
                  formatter={(value) => {
                    const label = value === 'expenses' ? t('expenses') : t('calories');
                    return isArabic ? `\u00A0\u00A0${label}` : label;
                  }}
                />
                <Bar yAxisId="left" dataKey="expenses" name="expenses" fill="url(#expGrad)" radius={[5, 5, 0, 0]} maxBarSize={28} />
                <Bar yAxisId="right" dataKey="calories" name="calories" fill="url(#calGrad)" radius={[5, 5, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Recent Activity ─── */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-gray-800 dark:text-white">{t('recentActivity')}</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t('lastFiveTransactions') || 'Last 5 transactions'}</p>
          </div>
          <Link
            to="/transactions"
            className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1 transition-colors"
          >
            {t('viewAll')}
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="text-center py-10 text-gray-400 dark:text-gray-500">
            <Wallet className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{t('noTransactions')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
              >
                {/* Category dot with color */}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                  style={{ backgroundColor: `${getCategoryColor(tx.category)}22` }}
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getCategoryColor(tx.category) }}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="px-2.5 py-0.5 rounded-lg text-xs font-semibold"
                      style={{
                        backgroundColor: `${getCategoryColor(tx.category)}18`,
                        color: getCategoryColor(tx.category),
                      }}
                    >
                      {tCategory(tx.category)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                    {tx.note || formatDateTime(tx.timestamp)}
                  </p>
                </div>

                {/* Date (hidden on small screens) */}
                <p className="hidden sm:block text-xs text-gray-400 dark:text-gray-500 shrink-0">
                  {formatDateTime(tx.timestamp)}
                </p>

                {/* Amount + badge */}
                <div className="flex flex-col items-end shrink-0">
                  <span className={`text-sm font-bold ${tx.type === 'income' ? 'text-success-600 dark:text-success-400' : 'text-gray-900 dark:text-white'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, summary.currency)}
                  </span>
                  {tx.type === 'income' ? (
                    <span className="inline-flex items-center gap-0.5 badge-success text-[10px] mt-0.5">
                      <ArrowUpRight className="w-2.5 h-2.5" />{t('income')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 badge-danger text-[10px] mt-0.5">
                      <ArrowDownRight className="w-2.5 h-2.5" />{t('expense')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showQuickLog && (
        <QuickLogModal onClose={() => setShowQuickLog(false)} onSuccess={fetchDashboard} />
      )}
    </div>
  );
};

export default Dashboard;