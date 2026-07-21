import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const api = axios.create({ baseURL: API_URL, timeout: 15000 });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(err);
      }
      try {
        const { data } = await axios.post(`${API_URL}/api/auth/refresh-token`, { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// portalApi ahora usa el mismo token unificado
export const portalApi = {
  get:    (url, cfg = {}) => api.get(url, cfg),
  post:   (url, data, cfg = {}) => api.post(url, data, cfg),
  put:    (url, data, cfg = {}) => api.put(url, data, cfg),
  patch:  (url, data, cfg = {}) => api.patch(url, data, cfg),
  delete: (url, cfg = {}) => api.delete(url, cfg),
};

export default api;
