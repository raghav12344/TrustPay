import api from './api';

export const transactionService = {
  createTransaction: async ({ accountId, amount, transactionType, merchant, latitude, longitude }) => {
    const payload = {
      accountId: Number(accountId),
      amount: Number(amount),
      transactionType,
      merchant: merchant ? merchant.trim() : null,
    };

    if (latitude !== undefined && latitude !== null && longitude !== undefined && longitude !== null) {
      payload.latitude = Number(latitude);
      payload.longitude = Number(longitude);
    }

    const response = await api.post('/transactions', payload);
    return response.data;
  },

  getCustomerTransactions: async () => {
    const response = await api.get('/transactions');
    return response.data;
  },
};

export default transactionService;
