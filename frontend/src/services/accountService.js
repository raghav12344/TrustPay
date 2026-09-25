import api from './api';

export const accountService = {
  getMyAccount: async () => {
    const response = await api.get('/accounts/me');
    return response.data;
  },
};

export default accountService;
