import api from './api';

export const authService = {
  login: async ({ email, password, deviceIdentifier }) => {
    const response = await api.post('/auth/login', {
      email,
      password,
      deviceIdentifier,
    });
    return response.data;
  },

  register: async ({ name, email, phone, password }) => {
    const response = await api.post('/auth/register', {
      name,
      email,
      phone,
      password,
    });
    return response.data;
  },

  checkHealth: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default authService;
