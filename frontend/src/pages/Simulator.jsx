import { useState, useEffect } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { TrendingDown, PiggyBank, RefreshCw, Sparkles, Flame } from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency, getCategoryColor } from '../utils/format.js';

const Simulator = () => {
  const { user } = useAuth();
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
      const expenseCategories = response.data.breakdown;
      setCategories(expenseCategories);
      const initialCutbacks = {};
      expenseCategories.forEach((cat) => {
        initialCutbacks[cat.name] = 0;
      });
      setCutbacks(initialCutbacks);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load categories');
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
      setError(err.response?.data?.message || 'Failed to run simulation');
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
        <h1 className="text-2xl font-bold text-gray-900">Smart Budget Simulator</h1>
        <p className="text-gray-600 mt-1">
          Adjust your spending habits and see how much you could save over time.
        </p>
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
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-danger-500" />
              Habit Reduction
            </h2>
            <button onClick={handleReset} className="btn-secondary text-sm py-1.5 px-3">
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
          </div>

          {categories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No expense data available for simulation.</p>
              <p className="text-sm mt-1">Log some expenses first to see projections.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {categories.map((cat) => (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getCategoryColor(cat.name) }}
                      />
                      <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">
                        {formatCurrency(cat.value, user?.currency)}
                      </span>
                      <span className="text-sm font-semibold text-primary-600 w-12 text-right">
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
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  />
                </div>
              ))}

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-700">Total Reduction</span>
                  <span className="text-lg font-bold text-primary-600">{totalCutbackPercentage}%</span>
                </div>
                <button
                  onClick={handleSimulate}
                  disabled={loading || totalCutbackPercentage === 0}
                  className="w-full btn-primary"
                >
                  <Sparkles className="w-4 h-4" />
                  {loading ? 'Simulating...' : 'Run Simulation'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-6">
            <PiggyBank className="w-5 h-5 text-success-500" />
            Projected Savings
          </h2>

          {!result ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <PiggyBank className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-center">
                Adjust the sliders and run the simulation
                <br />
                to see your projected savings.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Current Monthly</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(result.currentMonthlySpend, result.currency)}
                  </p>
                </div>
                <div className="p-4 bg-success-50 rounded-lg">
                  <p className="text-xs text-success-600 mb-1">Optimized Monthly</p>
                  <p className="text-lg font-bold text-success-700">
                    {formatCurrency(result.optimizedMonthlySpend, result.currency)}
                  </p>
                </div>
                <div className="p-4 bg-primary-50 rounded-lg">
                  <p className="text-xs text-primary-600 mb-1">Monthly Savings</p>
                  <p className="text-lg font-bold text-primary-700">
                    {formatCurrency(result.totalMonthlySavings, result.currency)}
                  </p>
                </div>
              </div>

              {/* Projection cards */}
              <div className="grid grid-cols-3 gap-4">
                {result.projections.map((p) => (
                  <div key={p.months} className="p-4 border border-gray-200 rounded-lg text-center">
                    <p className="text-sm font-semibold text-gray-700 mb-2">{p.months} Months</p>
                    <p className="text-xl font-bold text-success-600 mb-1">
                      {formatCurrency(p.totalSavings, result.currency)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {p.savingsPercentage}% savings
                    </p>
                  </div>
                ))}
              </div>

              {/* Calorie Reduction Card — only active when Food & Dining reduction > 0% */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-2">
                  <Flame className="w-5 h-5 text-warning-500" />
                  Projected Calorie Reduction
                </h2>
                <p className="text-sm text-gray-500 mb-3">
                  {result.calorieSavings
                    ? 'Calories saved by reducing Food & Dining spending:'
                    : 'Move the Food & Dining slider to see calorie savings projection'
                  }
                </p>

                {result.calorieSavings && !result.calorieSavings.isZero ? (
                  <div className="grid grid-cols-4 gap-4">
                    {/* Monthly calories saved */}
                    <div className="p-4 bg-warning-50 rounded-lg text-center">
                      <p className="text-xs text-warning-600 mb-1">Monthly Saved</p>
                      <p className="text-xl font-bold text-warning-700 leading-tight">
                        -{result.calorieSavings.monthlyCaloriesSaved.toLocaleString()} kcal/mo
                      </p>
                    </div>
                    {/* 3-month projection */}
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <p className="text-xs text-gray-500 mb-1">3 Months</p>
                      <p className="text-xl font-bold text-gray-700 leading-tight">
                        -{result.calorieSavings.projections[0].totalCaloriesSaved.toLocaleString()} kcal
                      </p>
                    </div>
                    {/* 6-month projection */}
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <p className="text-xs text-gray-500 mb-1">6 Months</p>
                      <p className="text-xl font-bold text-gray-700 leading-tight">
                        -{result.calorieSavings.projections[1].totalCaloriesSaved.toLocaleString()} kcal
                      </p>
                    </div>
                    {/* 12-month cumulative */}
                    <div className="p-4 bg-primary-50 rounded-lg text-center">
                      <p className="text-xs text-primary-600 mb-1">12 Months Total</p>
                      <p className="text-xl font-bold text-primary-700 leading-tight">
                        -{result.calorieSavings.projections[2].totalCaloriesSaved.toLocaleString()} kcal
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-100 rounded-lg text-center opacity-60">
                    <Flame className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      No Food & Dining cutback detected — calorie projection disabled
                    </p>
                  </div>
                )}
              </div>

              {/* Yearly projection chart */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">12-Month Projection</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={result.yearlyProjection}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" label={{ value: 'Month', position: 'insideBottom', offset: -10 }} />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => formatCurrency(value, result.currency)}
                    />
                    <Legend />
                    <Bar dataKey="current" name="Current" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="optimized" name="Optimized" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Category savings breakdown */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Savings by Category</h3>
                <div className="space-y-2">
                  {Object.entries(result.categorySavings)
                    .filter(([, data]) => data.monthlySavings > 0)
                    .map(([category, data]) => (
                      <div key={category} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{category}</span>
                        <span className="font-medium text-success-600">
                          {formatCurrency(data.monthlySavings, result.currency)}/mo
                        </span>
                      </div>
                    ))}
                  {Object.values(result.categorySavings).every((d) => d.monthlySavings === 0) && (
                    <p className="text-sm text-gray-500">No savings from current cutbacks.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Simulator;