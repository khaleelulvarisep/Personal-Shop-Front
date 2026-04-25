

import axios from "axios";

const API = axios.create({
  baseURL: "https://shopper.fitzs.online/api/",
  // baseURL: "http://127.0.0.1:8000/api/",
});

// REQUEST INTERCEPTOR
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// RESPONSE INTERCEPTOR
API.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refresh_token");

      if (!refreshToken) {
        logoutUser();
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(
          "https://shopper.fitzs.online/api/auth/token/refresh/",
          // "http://127.0.0.1:8000/api/auth/token/refresh/",
          { refresh: refreshToken }
        );

        const newAccess = res.data.access;

        localStorage.setItem("access_token", newAccess);

        originalRequest.headers.Authorization = `Bearer ${newAccess}`;

        return API(originalRequest);

      } catch (refreshError) {

        // Refresh token failed → logout
        logoutUser();

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);


// LOGOUT FUNCTION
const logoutUser = () => {

  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");

  window.location.href = "/login";
};

export default API;