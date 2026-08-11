import { useState, useEffect } from 'react';
import { User, Wallet, Flame, Save, Trash2, Plus, X } from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const { t, tCategory } = useLanguage();
  const [profile, setProfile] = useState({
    monthlyBudget: user?.monthlyBudget || 2000,
    calorieGoal: user?.calorieGoal || 2000,
    proteinGoal: user?.proteinGoal || '',
    carbsGoal: user?.carbsGoal || '',
    fatGoal: user?.fatGoal || '',
    waterGoal: user?.waterGoal || '',
    stepsGoal: user?.stepsGoal || '',
    currency: user?.currency || 'SAR',
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
      setCategories(Array.isArray(response.data) ? response.data : response.data?.categories || []);
    } catch {
      setCategories([]);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        monthlyBudget: parseFloat(profile.monthlyBudget),
        calorieGoal: parseInt(profile.calorieGoal),
        proteinGoal: profile.proteinGoal ? parseFloat(profile.proteinGoal) : null,
        carbsGoal: profile.carbsGoal ? parseFloat(profile.carbsGoal) : null,
        fatGoal: profile.fatGoal ? parseFloat(profile.fatGoal) : null,
        waterGoal: profile.waterGoal ? parseFloat(profile.waterGoal) : null,
        stepsGoal: profile.stepsGoal ? parseFloat(profile.stepsGoal) : null,
        currency: profile.currency,
      };
      const response = await api.put('/users/profile', payload);
      updateUser(response.data || { ...user, ...payload });
      setSuccess(t('profileUpdated'));
    } catch (err) {
      setError(err.response?.data?.message || t('failedLoad'));
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
      setError(err.response?.data?.message || t('failedLoad'));
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
      setError(err.response?.data?.message || t('failedLoad'));
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('settingsTitle')}</h1>
      </div>

      {error && (
        <div className="p-4 bg-danger-50 border border-danger-200 text-danger-700 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-success-50 border border-success-200 text-success-700 rounded-lg flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
            <User className="w-5 h-5 text-primary-500" />
            {t('profileBudgetGoals')}
          </h2>

          <form onSubmit={handleProfileSave} className="space-y-5">
            <div>
              <label className="label">{t('email')}</label>
              <input type="email" value={user?.email || ''} disabled className="input bg-gray-50 dark:bg-gray-800 cursor-not-allowed" />
            </div>

            <div>
              <label className="label flex items-center gap-2">
                <Wallet className="w-4 h-4 text-gray-400" />
                {t('monthlyBudget')} ({profile.currency})
              </label>
              <input type="number" min="0" step="0.01" required className="input"
                value={profile.monthlyBudget}
                onChange={(e) => setProfile({ ...profile, monthlyBudget: e.target.value })} />
            </div>

            <div>
              <label className="label flex items-center gap-2">
                <Flame className="w-4 h-4 text-gray-400" />
                {t('calorieGoal')}
              </label>
              <input type="number" min="500" max="10000" required className="input"
                value={profile.calorieGoal}
                onChange={(e) => setProfile({ ...profile, calorieGoal: e.target.value })} />
            </div>

            {/* Optional Daily Health & Macro Goals */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl space-y-4">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('macroGoalsTitle')} {t('optional')}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="label text-xs">{t('proteinGoal')}</label>
                  <input type="number" min="0" step="1" placeholder="e.g. 150" className="input text-sm"
                    value={profile.proteinGoal}
                    onChange={(e) => setProfile({ ...profile, proteinGoal: e.target.value })} />
                </div>
                <div>
                  <label className="label text-xs">{t('carbsGoal')}</label>
                  <input type="number" min="0" step="1" placeholder="e.g. 200" className="input text-sm"
                    value={profile.carbsGoal}
                    onChange={(e) => setProfile({ ...profile, carbsGoal: e.target.value })} />
                </div>
                <div>
                  <label className="label text-xs">{t('fatGoal')}</label>
                  <input type="number" min="0" step="1" placeholder="e.g. 60" className="input text-sm"
                    value={profile.fatGoal}
                    onChange={(e) => setProfile({ ...profile, fatGoal: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="label text-xs">{t('waterGoal')}</label>
                  <input type="number" min="0" step="50" placeholder="e.g. 3000" className="input text-sm"
                    value={profile.waterGoal}
                    onChange={(e) => setProfile({ ...profile, waterGoal: e.target.value })} />
                </div>
                <div>
                  <label className="label text-xs">{t('stepsGoal')}</label>
                  <input type="number" min="0" step="100" placeholder="e.g. 10000" className="input text-sm"
                    value={profile.stepsGoal}
                    onChange={(e) => setProfile({ ...profile, stepsGoal: e.target.value })} />
                </div>
              </div>
            </div>

            <div>
              <label className="label">{t('currency')}</label>
              <select className="input" value={profile.currency}
                onChange={(e) => setProfile({ ...profile, currency: e.target.value })}>
                {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <button type="submit" disabled={saving} className="w-full btn-primary">
              <Save className="w-4 h-4" />
              {saving ? t('saving2') : t('saveChanges')}
            </button>
          </form>
        </div>

        {/* Categories */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
            <Wallet className="w-5 h-5 text-primary-500" />
            {t('customCategories')}
          </h2>

          <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-3 mb-6">
            <input type="text" placeholder={t('categoryName')} className="input flex-1"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} />
            <select className="input w-full sm:w-32" value={newCategory.type}
              onChange={(e) => setNewCategory({ ...newCategory, type: e.target.value })}>
              <option value="expense">{t('expenseType')}</option>
              <option value="income">{t('incomeType')}</option>
            </select>
            <button type="submit" disabled={loading || !newCategory.name.trim()} className="btn-primary shrink-0">
              <Plus className="w-4 h-4" />
              {t('addCategory')}
            </button>
          </form>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('expenseType')}</h3>
            {categories.filter((c) => c.type === 'expense').map((cat) => (
              <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg group">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{tCategory(cat.name)}</span>
                <button onClick={() => setDeletingCategory(cat)}
                  className="p-1 text-gray-400 hover:text-danger-600 opacity-100 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {categories.filter((c) => c.type === 'expense').length === 0 && (
              <p className="text-sm text-gray-400 py-2">{t('noCustomCategories')}</p>
            )}

            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 mt-6">{t('incomeType')}</h3>
            {categories.filter((c) => c.type === 'income').map((cat) => (
              <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg group">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{tCategory(cat.name)}</span>
                <button onClick={() => setDeletingCategory(cat)}
                  className="p-1 text-gray-400 hover:text-danger-600 opacity-100 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {categories.filter((c) => c.type === 'income').length === 0 && (
              <p className="text-sm text-gray-400 py-2">{t('noCustomCategories')}</p>
            )}
          </div>
        </div>
      </div>

      {deletingCategory && (
        <ConfirmDialog
          title={t('deleteCategory')}
          message={`${t('deleteCategoryMsg')} "${tCategory(deletingCategory.name)}"?`}
          confirmLabel={t('delete')}
          onConfirm={handleDeleteCategory}
          onCancel={() => setDeletingCategory(null)}
        />
      )}
    </div>
  );
};

export default Settings;