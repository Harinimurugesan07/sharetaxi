import axios from "axios";

// Point this at your Flask backend. Override with VITE_API_BASE_URL in .env
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

function getTokens() {
  return {
    access: localStorage.getItem("st_access_token"),
    refresh: localStorage.getItem("st_refresh_token"),
  };
}

export function setTokens({ access_token, refresh_token }) {
  if (access_token) localStorage.setItem("st_access_token", access_token);
  if (refresh_token) localStorage.setItem("st_refresh_token", refresh_token);
}

export function clearTokens() {
  localStorage.removeItem("st_access_token");
  localStorage.removeItem("st_refresh_token");
}

client.interceptors.request.use((config) => {
  const { access } = getTokens();
  if (access) config.headers.Authorization = `Bearer ${access}`;
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

let refreshing = null;

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (status === 401 && !original._retry && getTokens().refresh) {
      original._retry = true;
      try {
        refreshing =
          refreshing ||
          axios.post(
            `${API_BASE_URL}/auth/refresh`,
            {},
            { headers: { Authorization: `Bearer ${getTokens().refresh}` } }
          );
        const res = await refreshing;
        refreshing = null;
        const newAccess = res.data?.data?.access_token;
        if (newAccess) {
          setTokens({ access_token: newAccess });
          original.headers.Authorization = `Bearer ${newAccess}`;
          return client(original);
        }
      } catch (e) {
        refreshing = null;
        clearTokens();
      }
    }
    return Promise.reject(error);
  }
);

// Normalizes Flask's {success, message, data} envelope and turns failures
// into a consistent Error with a human-readable message attached.
export async function request(config) {
  try {
    const res = await client(config);
    const payload = res.data || {};
    const data = payload.data;

    if (data && typeof data === "object" && !Array.isArray(data)) {
      return {
        ...data,
        success: payload.success,
        message: payload.message,
      };
    }

    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Something went wrong. Please try again.";
    const err = new Error(message);
    err.status = error.response?.status;
    err.errors = error.response?.data?.errors;
    throw err;
  }
}

export default client;
