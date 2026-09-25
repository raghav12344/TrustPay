import api from './api';

export const adminService = {
  getFraudAlerts: async () => {
    const response = await api.get('/transactions/admin/fraud-alerts');
    return response.data;
  },

  getAllTransactions: async (params = {}) => {
    const response = await api.get('/transactions/admin/all', { params });
    return response.data;
  },

  approveTransaction: async (transactionId, reason) => {
    const response = await api.post(`/transactions/admin/transactions/${transactionId}/approve`, {
      reason,
    });
    return response.data;
  },

  rejectTransaction: async (transactionId, reason) => {
    const response = await api.post(`/transactions/admin/transactions/${transactionId}/reject`, {
      reason,
    });
    return response.data;
  },

  getAllAccounts: async () => {
    const response = await api.get('/accounts/admin/all');
    return response.data;
  },

  depositToAccount: async ({ accountId, amount, remarks }) => {
    const response = await api.post('/accounts/admin/deposit', {
      accountId: Number(accountId),
      amount: Number(amount),
      remarks: remarks ? remarks.trim() : null,
    });
    return response.data;
  },
};

export default adminService;
