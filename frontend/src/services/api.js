import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// No global token interceptor - tokens passed per request

// Auth APIs
export const authAPI = {
    syncProfile: (data, token) => api.post('/auth/sync-profile', data, {
        headers: { Authorization: `Bearer ${token}` }
    }),
    getProfile: (token) => api.get('/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
    }),
    updateProfile: (data, token) => api.put('/auth/profile', data, {
        headers: { Authorization: `Bearer ${token}` }
    }),
    uploadHeader: (formData, token) => api.post('/auth/upload-header', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
        }
    }),
    deleteHeader: (token) => api.delete('/auth/delete-header', {
        headers: { Authorization: `Bearer ${token}` }
    })
};

// Template APIs
export const templateAPI = {
    uploadSample: (formData, token) => api.post('/templates/upload-sample', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
        }
    }),
    analyzeTemplate: (data, token) => api.post('/templates/analyze', data, {
        headers: { Authorization: `Bearer ${token}` }
    }),
    saveTemplate: (data, token) => api.post('/templates/save', data, {
        headers: { Authorization: `Bearer ${token}` }
    }),
    getSuggestions: (subject, token, university) => {
        let url = `/templates/suggestions?`;
        if (subject) url += `subject=${subject}&`;
        if (university) url += `university=${university}`;
        return api.get(url, {
            headers: { Authorization: `Bearer ${token}` }
        });
    },
    getById: (id, token) => api.get(`/templates/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    }),
    getSignedUrl: (id, token) => api.get(`/templates/${id}/signed-url`, {
        headers: { Authorization: `Bearer ${token}` }
    })
};

// Worksheet APIs
export const worksheetAPI = {
    generate: (formData, token) => api.post('/worksheets/generate', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
        },
        params: { mode: 'sync' }
    }),
    uploadImage: (id, formData, token) => api.post(`/worksheets/${id}/upload-image`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
        }
    }),
    update: (id, data, token) => api.put(`/worksheets/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    }),
    getHistory: (page = 1, limit = 10, token) => api.get(`/worksheets/history?page=${page}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` }
    }),
    getById: (id, token) => api.get(`/worksheets/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    }),
    regenerateSection: (id, data, token) => api.post(`/worksheets/${id}/regenerate-section`, data, {
        headers: { Authorization: `Bearer ${token}` }
    })
};

// Unified API object for easier imports
const unifiedAPI = {
    // Auth
    syncProfile: authAPI.syncProfile,
    getProfile: authAPI.getProfile,
    updateProfile: authAPI.updateProfile,
    uploadHeader: authAPI.uploadHeader,
    deleteHeader: authAPI.deleteHeader,

    // Templates
    uploadSample: templateAPI.uploadSample,
    analyzeTemplate: templateAPI.analyzeTemplate,
    saveTemplate: templateAPI.saveTemplate,
    getTemplateSuggestions: templateAPI.getSuggestions,
    getTemplateById: templateAPI.getById,
    getTemplateSignedUrl: templateAPI.getSignedUrl,

    // Worksheets
    generateWorksheet: worksheetAPI.generate,
    uploadWorksheetImage: worksheetAPI.uploadImage,
    updateWorksheet: worksheetAPI.update,
    regenerateWorksheetSection: worksheetAPI.regenerateSection,

    // Admin
    getAdminStats: (token) => api.get('/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
    }),
    getAdminUsers: (page = 1, limit = 10, token) => api.get(`/admin/users?page=${page}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` }
    }),

    // Universities
    getUniversities: () => api.get('/universities'), // Public
    getAllUniversities: (token) => api.get('/universities/all', { // Admin
        headers: { Authorization: `Bearer ${token}` }
    }),
    createUniversity: (formData, token) => api.post('/universities', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
        }
    }),
    deleteUniversity: (id, token) => api.delete(`/universities/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    }),
    retryAnalysis: (id, token) => api.post(`/universities/${id}/analyze`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    })
};

export default unifiedAPI;
