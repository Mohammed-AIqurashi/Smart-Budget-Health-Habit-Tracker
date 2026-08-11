import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')
    ? 'https://smart-budget-backend.onrender.com/api'
    : '/api');

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Demo Store Helpers ───────────────────────────────────────────────────────
const getUsersList = () => {
  const defaultUser = {
    id: 'demo-user', email: 'demo@example.com', password: 'demo1234', name: 'Demo User',
    monthlyBudget: 3000, calorieGoal: 2200, currency: 'SAR',
  };
  const list = JSON.parse(localStorage.getItem('demo_users')) || [defaultUser];
  return list;
};

const saveUsersList = (list) => localStorage.setItem('demo_users', JSON.stringify(list));

const getUser = () =>
  JSON.parse(localStorage.getItem('user')) || getUsersList()[0];

const getUserKey = () => {
  const user = getUser();
  return user?.id || user?.email || 'demo-user';
};

// Strict per-user isolated data helpers
const getTx = () => {
  const key = `demo_tx_${getUserKey()}`;
  return JSON.parse(localStorage.getItem(key)) || [];
};

const getHabits = () => {
  const key = `demo_habits_${getUserKey()}`;
  return JSON.parse(localStorage.getItem(key)) || [];
};

const getCustomCategories = () => {
  const key = `demo_cats_${getUserKey()}`;
  return JSON.parse(localStorage.getItem(key)) || [];
};

const saveTx = (arr) => {
  const key = `demo_tx_${getUserKey()}`;
  localStorage.setItem(key, JSON.stringify(arr));
};

const saveHabits = (arr) => {
  const key = `demo_habits_${getUserKey()}`;
  localStorage.setItem(key, JSON.stringify(arr));
};

const saveCustomCategories = (arr) => {
  const key = `demo_cats_${getUserKey()}`;
  localStorage.setItem(key, JSON.stringify(arr));
};

const idFromUrl = (url) => {
  const parts = url.split('/').filter(Boolean);
  return parts[parts.length - 1];
};

const buildDashboard = () => {
  const user = getUser();
  const txList = getTx();
  const habitList = getHabits();
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const daysElapsed = Math.max(1, today.getDate());
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  const monthTx = txList.filter(t => new Date(t.timestamp) >= monthStart);
  const monthHabits = habitList.filter(h => new Date(h.timestamp) >= monthStart);

  const totalExpenses = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

  const calorieLogs = monthHabits.filter(h => (h.metricName || '').toLowerCase() === 'calories');
  const totalCalories = calorieLogs.reduce((s, h) => s + Number(h.value), 0);
  const uniqueCalorieDays = new Set(calorieLogs.map(h => new Date(h.timestamp).toDateString())).size;
  const avgDailyCalories = uniqueCalorieDays > 0
    ? Math.round(totalCalories / uniqueCalorieDays)
    : 0;

  const catMap = {};
  monthTx.filter(t => t.type === 'expense').forEach(t => {
    catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount);
  });
  const categoryBreakdown = Object.entries(catMap).map(([name, value]) => ({ name, value }));

  const trendsMap = {};
  monthTx.filter(t => t.type === 'expense').forEach(t => {
    const d = new Date(t.timestamp).getDate();
    if (!trendsMap[d]) trendsMap[d] = { day: d, expenses: 0, calories: 0 };
    trendsMap[d].expenses += Number(t.amount);
  });
  monthHabits.filter(h => (h.metricName || '').toLowerCase() === 'calories').forEach(h => {
    const d = new Date(h.timestamp).getDate();
    if (!trendsMap[d]) trendsMap[d] = { day: d, expenses: 0, calories: 0 };
    trendsMap[d].calories += Number(h.value);
  });
  const dailyTrends = Object.values(trendsMap).sort((a, b) => a.day - b.day);

  return {
    summary: {
      remainingBudget: Math.max(0, user.monthlyBudget - totalExpenses),
      totalExpenses,
      budgetPercentage: user.monthlyBudget > 0
        ? Math.min(100, Math.round((totalExpenses / user.monthlyBudget) * 100)) : 0,
      monthlyBudget: user.monthlyBudget,
      currency: user.currency,
      daysElapsed,
      daysInMonth,
      averageDailySpend: Math.round(totalExpenses / daysElapsed),
      projectedMonthlySpend: Math.round((totalExpenses / daysElapsed) * daysInMonth),
      averageDailyCalories: avgDailyCalories,
      calorieGoal: user.calorieGoal,
    },
    categoryBreakdown,
    dailyTrends,
    recentTransactions: txList.slice(0, 5),
  };
};

// ─── Request Interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Refresh token logic
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // ── Demo Fallback (no backend reachable) ──────────────────────────────────
    const isNetworkError = !error.response || error.response.status === 404 || error.code === 'ERR_NETWORK';
    if (!isNetworkError || !originalRequest) return Promise.reject(error);

    const url = originalRequest.url || '';
    const method = (originalRequest.method || 'get').toLowerCase();
    const body = (() => { try { return JSON.parse(originalRequest.data || '{}'); } catch { return {}; } })();

    // ── Auth Routes ───────────────────────────────────────────────────────────
    if (url.includes('/auth/register')) {
      const users = getUsersList();
      const email = (body.email || '').trim().toLowerCase();

      const existing = users.find(u => u.email.toLowerCase() === email);
      if (existing) {
        return Promise.reject({
          response: { status: 400, data: { message: 'This email is already registered' } }
        });
      }

      const newUser = {
        id: `user-${Date.now()}`,
        email,
        password: body.password || '',
        name: body.name || email.split('@')[0] || 'User',
        monthlyBudget: Number(body.monthlyBudget) || 3000,
        calorieGoal: Number(body.calorieGoal) || 2200,
        proteinGoal: body.proteinGoal ? Number(body.proteinGoal) : null,
        carbsGoal: body.carbsGoal ? Number(body.carbsGoal) : null,
        fatGoal: body.fatGoal ? Number(body.fatGoal) : null,
        waterGoal: body.waterGoal ? Number(body.waterGoal) : null,
        stepsGoal: body.stepsGoal ? Number(body.stepsGoal) : null,
        currency: body.currency || 'SAR',
      };
      users.push(newUser);
      saveUsersList(users);

      localStorage.setItem('user', JSON.stringify(newUser));
      localStorage.setItem('accessToken', 'demo-token');
      localStorage.setItem('refreshToken', 'demo-refresh');

      return { data: { user: newUser, accessToken: 'demo-token', refreshToken: 'demo-refresh' } };
    }

    if (url.includes('/auth/login')) {
      const users = getUsersList();
      const email = (body.email || '').trim().toLowerCase();
      const password = body.password || '';

      const user = users.find(u => u.email.toLowerCase() === email && u.password === password);
      if (!user) {
        return Promise.reject({
          response: { status: 401, data: { message: 'Invalid email or password' } }
        });
      }

      localStorage.setItem('accessToken', 'demo-token');
      localStorage.setItem('refreshToken', 'demo-refresh');
      localStorage.setItem('user', JSON.stringify(user));
      return { data: { user, accessToken: 'demo-token', refreshToken: 'demo-refresh' } };
    }

    // ── Profile ───────────────────────────────────────────────────────────────
    if (url.includes('/users/profile')) {
      if (method === 'put') {
        const updated = { ...getUser(), ...body };
        localStorage.setItem('user', JSON.stringify(updated));

        const users = getUsersList();
        const idx = users.findIndex(u => u.id === updated.id);
        if (idx !== -1) { users[idx] = updated; saveUsersList(users); }

        return { data: updated };
      }
      return { data: getUser() };
    }

    // ── Custom Categories ──────────────────────────────────────────────────────
    if (url.includes('/users/categories')) {
      const categories = getCustomCategories();

      if (method === 'post') {
        const newCat = { id: `cat-${Date.now()}`, name: body.name, type: body.type || 'expense' };
        categories.push(newCat);
        saveCustomCategories(categories);
        return { data: newCat };
      }

      if (method === 'delete') {
        const id = idFromUrl(url);
        const filtered = categories.filter(c => c.id !== id);
        saveCustomCategories(filtered);
        return { data: { success: true } };
      }

      return { data: categories };
    }

    // ── Analytics ─────────────────────────────────────────────────────────────
    if (url.includes('/analytics/dashboard')) {
      return { data: buildDashboard() };
    }

    if (url.includes('/analytics/categories')) {
      const dashboard = buildDashboard();
      return { data: { breakdown: dashboard.categoryBreakdown } };
    }

    if (url.includes('/analytics/trends')) {
      const dashboard = buildDashboard();
      return { data: { trends: dashboard.dailyTrends } };
    }

    // ── Transactions ──────────────────────────────────────────────────────────
    if (url.includes('/transactions')) {
      const txList = getTx();

      if (method === 'post') {
        const newTx = { id: `tx-${Date.now()}`, ...body, timestamp: body.timestamp || new Date().toISOString() };
        txList.unshift(newTx);
        saveTx(txList);
        return { data: newTx };
      }

      if (method === 'put') {
        const id = idFromUrl(url);
        const idx = txList.findIndex(t => t.id === id);
        if (idx !== -1) { txList[idx] = { ...txList[idx], ...body }; saveTx(txList); return { data: txList[idx] }; }
      }

      if (method === 'delete') {
        const id = idFromUrl(url);
        const filtered = txList.filter(t => t.id !== id);
        saveTx(filtered);
        return { data: { success: true } };
      }

      return { data: { transactions: txList, totalPages: 1, currentPage: 1, pagination: { page: 1, limit: txList.length, total: txList.length, totalPages: 1 } } };
    }

    // ── Habits ────────────────────────────────────────────────────────────────
    if (url.includes('/habits')) {
      const habitList = getHabits();

      if (method === 'post') {
        const newHabit = { id: `h-${Date.now()}`, ...body, timestamp: body.timestamp || new Date().toISOString() };
        habitList.unshift(newHabit);
        saveHabits(habitList);
        return { data: newHabit };
      }

      if (method === 'put') {
        const id = idFromUrl(url);
        const idx = habitList.findIndex(h => h.id === id);
        if (idx !== -1) { habitList[idx] = { ...habitList[idx], ...body }; saveHabits(habitList); return { data: habitList[idx] }; }
      }

      if (method === 'delete') {
        const id = idFromUrl(url);
        const filtered = habitList.filter(h => h.id !== id);
        saveHabits(filtered);
        return { data: { success: true } };
      }

      return { data: { habitLogs: habitList, totalPages: 1, currentPage: 1, pagination: { page: 1, limit: habitList.length, total: habitList.length, totalPages: 1 } } };
    }

    // ── Simulator ─────────────────────────────────────────────────────────────
    if (url.includes('/simulator')) {
      const user = getUser();
      const txList = getTx();
      const cutbacks = body.cutbacks || {};

      const catSpend = {};
      txList.filter(t => t.type === 'expense').forEach(t => {
        catSpend[t.category] = (catSpend[t.category] || 0) + Number(t.amount);
      });

      if (Object.keys(catSpend).length === 0) {
        catSpend['Food & Dining'] = 800;
        catSpend['Transportation'] = 300;
        catSpend['Entertainment'] = 400;
      }

      // الفئات التي تم تحديد نسبة تخفيض عليها فقط
      const activeCutbackCategories = Object.entries(cutbacks)
        .filter(([, pct]) => Number(pct) > 0)
        .map(([catName]) => catName);

      let totalCurrentSpend = 0;
      let totalOptimizedSpend = 0;
      const categorySavingsObj = {};

      Object.entries(catSpend).forEach(([catName, spend]) => {
        const pct = cutbacks[catName] || 0;
        const saved = spend * (pct / 100);
        const opt = spend - saved;

        // إذا حدد فئات معينة فقط، نحسب إجمالي الحالي والمخفض للفئات المحددة فقط
        if (activeCutbackCategories.length === 0 || activeCutbackCategories.includes(catName)) {
          totalCurrentSpend += Number(spend);
          totalOptimizedSpend += opt;
        }

        categorySavingsObj[catName] = {
          current: Number(spend.toFixed(2)),
          optimized: Number(opt.toFixed(2)),
          monthlySavings: Number(saved.toFixed(2))
        };
      });

      const totalSavings = totalCurrentSpend - totalOptimizedSpend;
      const foodMoneySavings = (categorySavingsObj['Food & Dining']?.monthlySavings || categorySavingsObj['Food']?.monthlySavings || 0);
      const monthlyCaloriesSaved = Math.round(foodMoneySavings * 50);
      const savingsPct = totalCurrentSpend > 0 ? Number(((totalSavings / totalCurrentSpend) * 100).toFixed(1)) : 0;

      const simResult = {
        currency: user.currency || 'SAR',
        currentMonthlySpend: Number(totalCurrentSpend.toFixed(2)),
        optimizedMonthlySpend: Number(totalOptimizedSpend.toFixed(2)),
        totalMonthlySavings: Number(totalSavings.toFixed(2)),
        projections: [
          { months: 3, totalSavings: Number((totalSavings * 3).toFixed(2)), savingsPercentage: savingsPct },
          { months: 6, totalSavings: Number((totalSavings * 6).toFixed(2)), savingsPercentage: savingsPct },
          { months: 12, totalSavings: Number((totalSavings * 12).toFixed(2)), savingsPercentage: savingsPct },
        ],
        calorieSavings: monthlyCaloriesSaved > 0 ? {
          isZero: false,
          monthlyCaloriesSaved,
          projections: [
            { months: 3, totalCaloriesSaved: monthlyCaloriesSaved * 3 },
            { months: 6, totalCaloriesSaved: monthlyCaloriesSaved * 6 },
            { months: 12, totalCaloriesSaved: monthlyCaloriesSaved * 12 },
          ]
        } : { isZero: true },
        yearlyProjection: Array.from({ length: 12 }, (_, i) => ({
          month: `M${i + 1}`,
          current: Number(totalCurrentSpend.toFixed(2)),
          optimized: Number(totalOptimizedSpend.toFixed(2)),
        })),
        categorySavings: categorySavingsObj,
      };

      return { data: simResult };
    }

    return Promise.reject(error);
  }
);

export default api;