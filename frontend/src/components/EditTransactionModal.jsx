import { useState } from 'react';
import { X, Save } from 'lucide-react';
import api from '../api/client.js';

const EditTransactionModal = ({ transaction, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    amount: transaction.amount,
    category: transaction.category,
    type: transaction.type,
    note: transaction.note || '',
    date: new Date(transaction.timestamp).toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const expenseCategories = ['Food & Dining', 'Transportation', 'Housing', 'Entertainment', 'Shopping', 'Health', 'Education', 'Other'];
  const incomeCategories = ['Salary', 'Freelance', 'Gift', 'Other Income'];

  const categories = formData.type === 'expense' ? expenseCategories : incomeCategories;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        amount: parseFloat(formData.amount),
        category: formData.category,
        type: formData.type,
        note: formData.note || undefined,
        timestamp: formData.date ? new Date(formData.date).toISOString() : undefined,
      };

      await api.put(`/transactions/${transaction.id}`, payload);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Edit Transaction</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
          {error && (
            <div className="p-3 bg-danger-50 border border-danger-200 text-danger-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="label">Amount</label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              className="input"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Type</label>
            <select
              className="input"
              value={formData.type}
              onChange={(e) => {
                const newType = e.target.value;
                let newCategory = formData.category;
                if (newType === 'expense' && !expenseCategories.includes(newCategory)) {
                  newCategory = '';
                }
                if (newType === 'income' && !incomeCategories.includes(newCategory)) {
                  newCategory = '';
                }
                setFormData({ ...formData, type: newType, category: newCategory });
              }}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
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

          <button type="submit" disabled={loading} className="w-full btn-primary">
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditTransactionModal;