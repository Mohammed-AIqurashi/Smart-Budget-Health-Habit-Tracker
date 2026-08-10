import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  CalendarDays,
  Flame,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import api from '../api/client.js';
import StatCard from '../components/StatCard.jsx';
import QuickLogModal from '../components/QuickLogModal.jsx';
import { formatCurrency, formatDateTime, getCategoryColor } from '../utils/format.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

const Dashboard = () => {
  const { theme } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showQuickLog, setShowQuickLog] = useState(false);

  const isDark = theme === 'dark';
  const chartTextColor = isDark ? '#f8fafc' : '#334155';
  const chartGridColor = isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb';

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await api.get('/analytics/dashboard');
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const getBudgetColor = (percentage) => {
    if (percentage < 50) return 'bg-success-500';
    if (percentage < 80) return 'bg-warning-500';
    return 'bg-danger-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-danger-600 font-medium mb-2">{error}</p>
          <button onClick={fetchDashboard} className="btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { summary, categoryBreakdown, dailyTrends, recentTransactions } = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's your financial and health overview.
          </p>
        </div>
        <button onClick={() => setShowQuickLog(true)} className="btn-primary shrink-0">
          <Plus className="w-4 h-4" />
          Quick Log
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Remaining Budget</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(summary.remainingBudget, summary.currency)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-success-100 dark:bg-success-900/50 text-success-600 dark:text-success-400">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${getBudgetColor(summary.budgetPercentage)}`}
              style={{ width: `${Math.min(summary.budgetPercentage, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {summary.budgetPercentage}% of {formatCurrency(summary.monthlyBudget, summary.currency)} used
          </p>
        </div>

        <StatCard
          title="Total Spent This Month"
          value={formatCurrency(summary.totalExpenses, summary.currency)}
          subtitle={`${summary.daysElapsed} days into ${summary.daysInMonth}-day month`}
          icon={TrendingUp}
          iconColor="bg-danger-100 dark:bg-danger-900/50 text-danger-600 dark:text-danger-400"
        />

        <StatCard
          title="Average Daily Spend"
          value={formatCurrency(summary.averageDailySpend, summary.currency)}
          subtitle={`Projected: ${formatCurrency(summary.projectedMonthlySpend, summary.currency)}`}
          icon={CalendarDays}
          iconColor="bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400"
        />

        <StatCard
          title="Average Daily Calories"
          value={summary.averageDailyCalories.toLocaleString()}
          subtitle={`Goal: ${summary.calorieGoal.toLocaleString()} kcal`}
          icon={Flame}
          iconColor="bg-warning-100 dark:bg-warning-900/50 text-warning-600 dark:text-warning-400"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut chart */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Expense Distribution</h2>
          {categoryBreakdown.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-slate-400">
              No expenses logged yet this month
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {categoryBreakdown.map((entry) => (
                      <Cell key={entry.name} fill={getCategoryColor(entry.name)} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(value, summary.currency)}
                    contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', borderRadius: 8, border: `1px solid ${chartGridColor}`, fontSize: 12, color: chartTextColor }}
                  />
                  <Legend
                    wrapperStyle={{ color: chartTextColor, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Dual-axis bar chart */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 pb-4">Daily Expenses vs Calories</h2>
          {dailyTrends.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-slate-400">
              No data available yet
            </div>
          ) : (
            <div className="pt-4">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={dailyTrends} margin={{ top: 10, right: 10, left: 0, bottom: 45 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: chartTextColor }}
                    axisLine={{ stroke: chartGridColor }}
                    tickLine={{ stroke: chartGridColor }}
                    label={{ value: 'Day of Month', position: 'insideBottom', offset: -15, style: { fontSize: 12, fill: chartTextColor } }}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 11, fill: chartTextColor }}
                    axisLine={{ stroke: chartGridColor }}
                    tickLine={{ stroke: chartGridColor }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 11, fill: chartTextColor }}
                    axisLine={{ stroke: chartGridColor }}
                    tickLine={{ stroke: chartGridColor }}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === 'expenses') return [formatCurrency(value, summary.currency), 'Expenses'];
                      return [`${value.toLocaleString()} kcal`, 'Calories'];
                    }}
                    contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', borderRadius: 8, border: `1px solid ${chartGridColor}`, fontSize: 12, color: chartTextColor }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ paddingTop: 20, fontSize: 12, color: chartTextColor }}
                  />
                  <Bar yAxisId="left" dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="calories" name="Calories" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <Link to="/transactions" className="text-sm text-primary-600 font-medium hover:text-primary-700">
            View all →
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No transactions yet. Start logging your expenses!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="table-header">Category</th>
                  <th className="table-header">Note</th>
                  <th className="table-header">Date</th>
                  <th className="table-header text-right">Amount</th>
                  <th className="table-header text-right">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: getCategoryColor(tx.category) }}
                        />
                        {tx.category}
                      </span>
                    </td>
                    <td className="table-cell text-gray-500">{tx.note || '—'}</td>
                    <td className="table-cell text-gray-500">{formatDateTime(tx.timestamp)}</td>
                    <td className="table-cell text-right font-medium">
                      <span className={tx.type === 'income' ? 'text-success-600' : 'text-gray-900'}>
                        {tx.type === 'income' ? '+' : '-'}
                        {formatCurrency(tx.amount, summary.currency)}
                      </span>
                    </td>
                    <td className="table-cell text-right">
                      {tx.type === 'income' ? (
                        <span className="inline-flex items-center gap-1 badge-success">
                          <ArrowUpRight className="w-3 h-3" />
                          Income
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 badge-danger">
                          <ArrowDownRight className="w-3 h-3" />
                          Expense
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showQuickLog && (
        <QuickLogModal
          onClose={() => setShowQuickLog(false)}
          onSuccess={fetchDashboard}
        />
      )}
    </div>
  );
};

export default Dashboard;