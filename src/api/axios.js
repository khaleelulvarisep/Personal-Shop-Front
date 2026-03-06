
// import axios from "axios";

// const API = axios.create({
//   baseURL: "http://127.0.0.1:8000/api/",
// });

// // Add interceptor
// API.interceptors.request.use(
//   (config) => {

//     const token = localStorage.getItem("access_token");

//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }

//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// export default API;





import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
});

// request interceptor
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// response interceptor
API.interceptors.response.use(
  (response) => response,
  async (error) => {

    const originalRequest = error.config;

    if (error.response.status === 401 && !originalRequest._retry) {

      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refresh_token");

      const res = await axios.post(
        "http://127.0.0.1:8000/api/auth/token/refresh/",
        { refresh: refreshToken }
      );

      const newAccess = res.data.access;

      localStorage.setItem("access_token", newAccess);

      originalRequest.headers.Authorization = `Bearer ${newAccess}`;

      return API(originalRequest);
    }

    return Promise.reject(error);
  }
);

export default API;