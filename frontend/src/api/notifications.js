import api from "./axios";

export const getNotifications = () => api.get("/notifications/");
export const getUnreadCount = () => api.get("/notifications/unread/");
export const markAllRead = () => api.post("/notifications/read-all/");
export const markRead = (id) => api.post(`/notifications/${id}/read/`);
