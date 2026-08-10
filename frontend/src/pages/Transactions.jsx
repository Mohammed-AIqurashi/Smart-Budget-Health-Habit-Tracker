import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  X,
} from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import QuickLogModal from '../components/QuickLogModal.jsx';
import EditTransactionModal from '../components/EditTransactionModal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { formatCurrency, formatDateTime, getCategoryColor } from '../utils/format.js';

const Transactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    type: '',
    startDate: '',
    endDate: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [deletingTx, setDeletingTx] = useState(null);

  const categories = ['Food & Dining', 'Transportation', 'Housing', 'Entertainment', 'Shopping', 'Health', 'Education', 'Other', 'Salary', 'Freelance', 'Gift', 'Other Income'];

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
      });
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.type) params.append('type', filters.type);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`/transactions?${params.toString()}`);
      setTransactions(response.data.transactions);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({ search: '', category: '', type: '', startDate: '', endDate: '' });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/transactions/${deletingTx.id}`);
      setDeletingTx(null);
      fetchTransactions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete transaction');
    }
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) return;

    const headers = ['Date', 'Category', 'Type', 'Amount', 'Note'];
    const rows = transactions.map((tx) => [
      new Date(tx.timestamp).toISOString().split('T')[0],
      tx.category,
      tx.type,
      tx.amount,
      tx.note || '',
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const hasFilters = filters.search || filters.category || filters.type || filters.startDate || filters.endDate;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600 mt-1">
            View, filter, and manage all your financial transactions.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportCSV} className="btn-secondary" disabled={transactions.length === 0}>
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button onClick={() => setShowQuickLog(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            Add Transaction
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-danger-50 border border-danger-200 text-danger-700 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="input pl-10"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          <select
            className="input"
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            className="input"
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
          >
            <option value="">All Types</option>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <input
            type="date"
            className="input"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
          />
          <input
            type="date"
            className="input"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
          />
        </div>
        {hasFilters && (
          <button onClick={handleClearFilters} className="mt-4 text-sm text-primary-600 font-medium hover:text-primary-700">
            Clear filters
          </button>
        )}
      </div>

      {/* Data grid */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Category</th>
                <th className="table-header">Note</th>
                <th className="table-header">Date</th>
                <th className="table-header">Type</th>
                <th className="table-header text-right">Amount</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="inline-block w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    <p>No transactions found.</p>
                    {!hasFilters && (
                      <p className="text-sm mt-1">Start logging your first transaction!</p>
                    )}
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
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
                    <td className="table-cell">
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
                    <td className={`table-cell text-right font-medium ${tx.type === 'income' ? 'text-success-600' : 'text-gray-900'}`}>
                      {tx.type === 'income' ? '+' : '-'}
                      {formatCurrency(tx.amount, user?.currency)}
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingTx(tx)}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingTx(tx)}
                          className="p-2 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && transactions.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <p className="text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1}-
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="btn-secondary text-sm py-1.5 px-3"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                disabled={pagination.page === pagination.totalPages}
                className="btn-secondary text-sm py-1.5 px-3"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {showQuickLog && (
        <QuickLogModal
          onClose={() => setShowQuickLog(false)}
          onSuccess={fetchTransactions}
        />
      )}

      {editingTx && (
        <EditTransactionModal
          transaction={editingTx}
          onClose={() => setEditingTx(null)}
          onSuccess={() => {
            setEditingTx(null);
            fetchTransactions();
          }}
        />
      )}

      {deletingTx && (
        <ConfirmDialog
          title="Delete Transaction"
          message={`Are you sure you want to delete this ${deletingTx.type} of ${formatCurrency(deletingTx.amount, user?.currency)}?`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeletingTx(null)}
        />
      )}
    </div>
  );
};

export default Transactions;