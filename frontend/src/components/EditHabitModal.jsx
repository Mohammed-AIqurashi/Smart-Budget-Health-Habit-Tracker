import { useState } from 'react';
import { X, Save } from 'lucide-react';
import api from '../api/client.js';

const EditHabitModal = ({ habit, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    metricName: habit.metricName,
    value: habit.value,
    note: habit.note || '',
    date: new Date(habit.timestamp).toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        metricName: formData.metricName,
        value: parseFloat(formData.value),
        note: formData.note || undefined,
        timestamp: formData.date ? new Date(formData.date).toISOString() : undefined,
      };

      await api.put(`/habits/${habit.id}`, payload);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update habit log');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Edit Habit Log</h2>
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
            <label className="label">Metric</label>
            <select
              className="input"
              value={formData.metricName}
              onChange={(e) => setFormData({ ...formData, metricName: e.target.value })}
            >
              <option value="calories">Calories</option>
              <option value="water">Water (glasses)</option>
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
              className="input"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            />
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

export default EditHabitModal;