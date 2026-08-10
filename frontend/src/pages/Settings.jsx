import { useState, useEffect } from 'react';
import {
  User,
  Wallet,
  Flame,
  Save,
  Trash2,
  Plus,
  X,
} from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState({
    monthlyBudget: user?.monthlyBudget || 2000,
    calorieGoal: user?.calorieGoal || 2000,
    currency: user?.currency || 'USD',
  });
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: '', type: 'expense' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deletingCategory, setDeletingCategory] = useState(null);

  const currencies = ['USD', 'EUR', 'GBP', 'SAR', 'AED', 'EGP', 'JOD', 'KWD', 'QAR'];

  const fetchCategories = async () => {
    try {
      const response = await api.get('/users/categories');
      setCategories(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load categories');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await api.put('/users/profile', {
        monthlyBudget: parseFloat(profile.monthlyBudget),
        calorieGoal: parseInt(profile.calorieGoal),
        currency: profile.currency,
      });
      updateUser(response.data);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/users/categories', newCategory);
      setNewCategory({ name: '', type: 'expense' });
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add category');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    try {
      await api.delete(`/users/categories/${deletingCategory.id}`);
      setDeletingCategory(null);
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete category');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your profile, budget goals, and categories.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-danger-50 border border-danger-200 text-danger-700 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-success-50 border border-success-200 text-success-700 rounded-lg flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess('')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile settings */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-6">
            <User className="w-5 h-5 text-primary-500" />
            Profile & Goals
          </h2>

          <form onSubmit={handleProfileSave} className="space-y-5">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="input bg-gray-50 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed.</p>
            </div>

            <div>
              <label className="label flex items-center gap-2">
                <Wallet className="w-4 h-4 text-gray-400" />
                Monthly Budget ({profile.currency})
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                className="input"
                value={profile.monthlyBudget}
                onChange={(e) => setProfile({ ...profile, monthlyBudget: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Your current budget for monthly expenses.
              </p>
            </div>

            <div>
              <label className="label flex items-center gap-2">
                <Flame className="w-4 h-4 text-gray-400" />
                Daily Calorie Goal
              </label>
              <input
                type="number"
                min="500"
                max="10000"
                required
                className="input"
                value={profile.calorieGoal}
                onChange={(e) => setProfile({ ...profile, calorieGoal: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Your daily calorie intake target.
              </p>
            </div>

            <div>
              <label className="label">Currency</label>
              <select
                className="input"
                value={profile.currency}
                onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
              >
                {currencies.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <button type="submit" disabled={saving} className="w-full btn-primary">
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>

        {/* Categories */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-6">
            <Wallet className="w-5 h-5 text-primary-500" />
            Categories
          </h2>

          <form onSubmit={handleAddCategory} className="flex gap-3 mb-6">
            <input
              type="text"
              placeholder="Category name"
              className="input"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
            />
            <select
              className="input w-32"
              value={newCategory.type}
              onChange={(e) => setNewCategory({ ...newCategory, type: e.target.value })}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
              <option value="habit">Habit</option>
            </select>
            <button type="submit" disabled={loading || !newCategory.name.trim()} className="btn-primary shrink-0">
              <Plus className="w-4 h-4" />
              Add
            </button>
          </form>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Expense Categories</h3>
            {categories
              .filter((c) => c.type === 'expense')
              .map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group">
                  <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                  <button
                    onClick={() => setDeletingCategory(cat)}
                    className="p-1 text-gray-400 hover:text-danger-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

            <h3 className="text-sm font-semibold text-gray-700 mb-3 mt-6">Income Categories</h3>
            {categories
              .filter((c) => c.type === 'income')
              .map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group">
                  <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                  <button
                    onClick={() => setDeletingCategory(cat)}
                    className="p-1 text-gray-400 hover:text-danger-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      </div>

      {deletingCategory && (
        <ConfirmDialog
          title="Delete Category"
          message={`Are you sure you want to delete the "${deletingCategory.name}" category?`}
          confirmLabel="Delete"
          onConfirm={handleDeleteCategory}
          onCancel={() => setDeletingCategory(null)}
        />
      )}
    </div>
  );
};

export default Settings;