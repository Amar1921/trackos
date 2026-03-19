import axios from 'axios';

const TRACKOS_API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const api = axios.create({
    baseURL: TRACKOS_API,
    timeout: 15000,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem('jwt_token');
            // Redirection vers la route React /login (SPA interne)
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

export default api;