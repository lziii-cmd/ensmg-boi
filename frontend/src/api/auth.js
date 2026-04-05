import api from "./axios";

export const login = (email, password) =>
  api.post("/auth/login/", { email, password });

export const logout = (refresh) =>
  api.post("/auth/logout/", { refresh });

export const setPassword = (token, password, password_confirm) =>
  api.post("/auth/set-password/", { token, password, password_confirm });

export const requestPasswordReset = (email) =>
  api.post("/auth/password-reset/", { email });

export const getMe = () => api.get("/auth/me/");

export const updateMe = (data) => api.patch("/auth/me/", data);

export const changePassword = (data) => api.post("/auth/change-password/", data);

export const getUsers = (params) => api.get("/auth/users/", { params });

export const updateUser = (id, data) => api.patch(`/auth/users/${id}/`, data);

export const resendInvitation = (id) =>
  api.post(`/auth/users/${id}/resend-invitation/`);

export const importMembers = (formData) =>
  api.post("/auth/import/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const getImportHistory = () => api.get("/auth/import/history/");

export const createMember = (data) => api.post("/auth/users/create/", data);

export const deleteUser = (id) => api.delete(`/auth/users/${id}/`);

export const getAuditLogs = (params) => api.get("/auth/audit/", { params });
