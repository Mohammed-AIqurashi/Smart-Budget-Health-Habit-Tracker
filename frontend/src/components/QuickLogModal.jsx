import { useState } from 'react';
import { X, Receipt, Flame, Save } from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const QuickLogModal = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const [tab, setTab] = useState('expense');
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    type: 'expense',
    note: '',
    metricName: 'calories',
    value: '',
    protein: '',
    carbs: '',
    fat: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const expenseCategories = ['Food & Dining', 'Transportation', 'Housing', 'Entertainment', 'Shopping', 'Health', 'Education', 'Other'];
  const incomeCategories = ['Salary', 'Freelance', 'Gift', 'Other Income'];

  const categories = tab === 'expense' ? expenseCategories : tab === 'income' ? incomeCategories : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (tab === 'expense' || tab === 'income') {
        const payload = {
          amount: parseFloat(formData.amount),
          category: formData.category,
          type: tab,
          note: formData.note || undefined,
          timestamp: formData.date ? new Date(formData.date).toISOString() : undefined,
        };
        await api.post('/transactions', payload);
      } else if (tab === 'habit') {
        const payload = {
          metricName: formData.metricName,
          value: parseFloat(formData.value),
          protein: formData.protein ? parseFloat(formData.protein) : undefined,
          carbs: formData.carbs ? parseFloat(formData.carbs) : undefined,
          fat: formData.fat ? parseFloat(formData.fat) : undefined,
          note: formData.note || undefined,
          timestamp: formData.date ? new Date(formData.date).toISOString() : undefined,
        };
        await api.post('/habits', payload);
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Quick Log</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4">
          <button
            onClick={() => setTab('expense')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'expense'
                ? 'bg-danger-50 text-danger-700 border border-danger-200'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Expense
          </button>
          <button
            onClick={() => setTab('income')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'income'
                ? 'bg-success-50 text-success-700 border border-success-200'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Income
          </button>
          <button
            onClick={() => setTab('habit')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'habit'
                ? 'bg-warning-50 text-warning-700 border border-warning-200'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Flame className="w-4 h-4" />
            Habit
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
          {error && (
            <div className="p-3 bg-danger-50 border border-danger-200 text-danger-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {(tab === 'expense' || tab === 'income') && (
            <>
              <div>
                <label className="label">Amount ({user?.currency})</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  className="input"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Category</label>
                <select
                  required
                  className="input"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {tab === 'habit' && (
            <>
              <div>
                <label className="label">Metric</label>
                <select
                  className="input"
                  value={formData.metricName}
                  onChange={(e) => setFormData({ ...formData, metricName: e.target.value })}
                >
                  <option value="calories">Calories</option>
                  <option value="water">Water (ml)</option>
                  <option value="steps">Steps</option>
                  <option value="sleep">Sleep (hours)</option>
                </select>
              </div>
              <div>
                <label className="label">Value</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  placeholder="e.g., 2000"
                  className="input"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                />
              </div>

              {formData.metricName === 'calories' && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">Optional Macros</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="label">Protein (g)</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="0"
                        className="input"
                        value={formData.protein}
                        onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">Carbs (g)</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="0"
                        className="input"
                        value={formData.carbs}
                        onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">Fat (g)</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="0"
                        className="input"
                        value={formData.fat}
                        onChange={(e) => setFormData({ ...formData, fat: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div>
            <label className="label">Date</label>
            <input
              type="date"
              className="input"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Note</label>
            <textarea
              className="input"
              rows="2"
              placeholder="Add a note..."
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : 'Save Entry'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default QuickLogModal;