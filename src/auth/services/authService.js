import API from "../../api/axios";

export const registerUser = (data) => {
  return API.post("auth/register/", data);
};

export const verifyOTP = (data) => {
  return API.post("auth/verify-otp/", data);
};

export const loginUser = (data) => {
  return API.post("auth/login/", data);
};
