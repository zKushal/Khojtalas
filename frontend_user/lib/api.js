import axios from "axios";

export const TOKEN_STORAGE_KEY = "kt_user_token";
export const USER_STORAGE_KEY = "kt_user_auth";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error?.response?.status === 401) {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      window.localStorage.removeItem(USER_STORAGE_KEY);

      const currentPath = window.location.pathname;
      if (currentPath !== "/login" && currentPath !== "/signup") {
        const next = encodeURIComponent(currentPath || "/");
        window.location.href = `/login?next=${next}`;
      }
    }

    return Promise.reject(error);
  }
);

export function getApiErrorMessage(error, fallback = "Something went wrong.") {
  return error?.response?.data?.message || fallback;
}

export function buildMediaUrl(mediaUrl) {
  if (!mediaUrl) return "";
  if (mediaUrl.startsWith("http://") || mediaUrl.startsWith("https://")) return mediaUrl;
  return `http://localhost:5000${mediaUrl}`;
}

export default api;
