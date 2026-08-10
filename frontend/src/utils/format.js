export const formatCurrency = (amount, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  } catch {
    return `$${(amount || 0).toFixed(2)}`;
  }
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const formatNumber = (num) => {
  return new Intl.NumberFormat('en-US').format(num || 0);
};

export const formatPercentage = (num) => {
  return `${Math.round(num || 0)}%`;
};

export const getInitials = (email) => {
  if (!email) return 'U';
  const parts = email.split('@')[0].split(/[._-]/);
  return parts
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
};

export const CATEGORY_COLORS = {
  'Food & Dining': '#3b82f6',
  Transportation: '#10b981',
  Housing: '#8b5cf6',
  Entertainment: '#f59e0b',
  Shopping: '#ec4899',
  Health: '#ef4444',
  Education: '#06b6d4',
  Other: '#6b7280',
  Salary: '#22c55e',
  Freelance: '#14b8a6',
  Gift: '#a855f7',
  'Other Income': '#84cc16',
};

export const getCategoryColor = (category) => {
  return CATEGORY_COLORS[category] || '#6366f1';
};