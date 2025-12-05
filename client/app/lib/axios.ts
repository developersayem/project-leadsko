import axios, { AxiosRequestConfig, AxiosError } from "axios";

// Extend Axios config to mark retries
interface AxiosRequestConfigWithRetry extends AxiosRequestConfig {
  _retry?: boolean;
}

// const localhost = "http://localhost:5001";
// const production = "https://project-file-management-system.onrender.com";
const production = "http://p8ggww4s4wc0w8084kskk0ck.57.128.212.235.sslip.io";


// Create Axios instance
const api = axios.create({
  baseURL: `${production}/api/v1`,
  withCredentials: true, // send cookies automatically
});

// Response interceptor for handling 401 (access token expired)
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfigWithRetry;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Call refresh endpoint; cookies are sent automatically
        await axios.post(
        `${production}/api/v1/api/v1/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError: unknown) {
        if (refreshError instanceof AxiosError) {
          console.error("Refresh token expired or invalid", refreshError);

          // Redirect to login if refresh token failed
          if (refreshError.response?.status === 401) {
            window.location.href = "/login";
          }
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
