import api from "./axios";

export const getCategories = () => api.get("/ideas/categories/");

export const getIdeas = (params) => api.get("/ideas/", { params });

export const getMyIdeas = () => api.get("/ideas/mine/");

export const getIdea = (id) => api.get(`/ideas/${id}/`);

export const createIdea = (formData) =>
  api.post("/ideas/create/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateIdeaStatus = (id, data) =>
  api.patch(`/ideas/${id}/status/`, data);

export const pinIdea = (id) => api.patch(`/ideas/${id}/pin/`);

export const voteIdea = (id) => api.post(`/ideas/${id}/vote/`);

export const addComment = (ideaId, content) =>
  api.post(`/ideas/${ideaId}/comments/`, { content });

export const reportComment = (commentId) =>
  api.post(`/ideas/comments/${commentId}/report/`);

export const getReportedComments = () =>
  api.get("/ideas/moderation/comments/");

export const moderateComment = (id, action) =>
  api.patch(`/ideas/moderation/comments/${id}/`, { action });

export const getDashboardStats = () => api.get("/ideas/dashboard/");
