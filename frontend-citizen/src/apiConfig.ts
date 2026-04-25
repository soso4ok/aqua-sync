const isProd = import.meta.env.VITE_APP_ENV === 'prod';
const remoteUrl = import.meta.env.VITE_API_URL_REMOTE || 'https://fastapi-app-154466642830.europe-central2.run.app';
const localUrl = import.meta.env.VITE_API_URL_LOCAL || 'http://localhost:8000';

export const API_BASE_URL = isProd ? remoteUrl : localUrl;

export const getApiUrl = (path: string) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    if (cleanPath.startsWith('/api')) {
        return `${API_BASE_URL}${cleanPath}`;
    }
    return cleanPath;
};
