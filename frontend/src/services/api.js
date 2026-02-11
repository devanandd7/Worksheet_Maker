import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Handle responses
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth APIs
export const authAPI = {
    register: (userData) => api.post('/auth/register', userData),
    login: (credentials) => api.post('/auth/login', credentials),
    getProfile: () => api.get('/auth/profile'),
    updateProfile: (data) => api.put('/auth/profile', data),
    uploadHeader: (formData) => api.post('/auth/upload-header', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    deleteHeader: () => api.delete('/auth/delete-header')
};

// Template APIs
export const templateAPI = {
    uploadSample: (formData) => api.post('/templates/upload-sample', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    analyze: (pdfUrl, extractedText) => api.post('/templates/analyze', { pdfUrl, extractedText }),
    save: (templateData) => api.post('/templates/save', templateData),
    getSuggestions: (subject) => api.get('/templates/suggestions', { params: { subject } }),
    getById: (id) => api.get(`/templates/${id}`),
    getSignedUrl: (id) => api.get(`/templates/${id}/signed-url`)
};

// Worksheet APIs
export const worksheetAPI = {
    generate: (data) => {
        // Check if data is FormData to set correct headers
        const isFormData = data instanceof FormData;
        return api.post('/worksheets/generate', data, {
            headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
            params: { mode: 'sync' }
        });
    },
    uploadImage: (worksheetId, formData) => api.post(`/worksheets/${worksheetId}/upload-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    update: (worksheetId, data) => api.put(`/worksheets/${worksheetId}`, data),
    generatePDF: (worksheetId) => api.post(`/worksheets/${worksheetId}/generate-pdf`),
    getHistory: (page = 1, limit = 10) => api.get('/worksheets/history', { params: { page, limit } }),
    getById: (id) => api.get(`/worksheets/${id}`),
    regenerateSection: (worksheetId, data) => api.post(`/worksheets/${worksheetId}/regenerate-section`, data)
};

// Unified API object for easier imports
const unifiedAPI = {
    // Auth
    register: (userData) => authAPI.register(userData),
    login: (credentials) => authAPI.login(credentials),
    getProfile: () => authAPI.getProfile(),
    updateProfile: (data) => authAPI.updateProfile(data),
    uploadHeader: (formData) => authAPI.uploadHeader(formData),
    deleteHeader: () => authAPI.deleteHeader(),

    // Templates
    uploadSamplePDF: (formData) => templateAPI.uploadSample(formData),
    analyzeTemplate: (data) => templateAPI.analyze(data.pdfUrl, data.extractedText),
    saveTemplate: (templateData) => templateAPI.save(templateData),
    getTemplateSuggestions: (subject) => templateAPI.getSuggestions(subject),
    getTemplateById: (id) => templateAPI.getById(id),
    getTemplateSignedUrl: (id) => templateAPI.getSignedUrl(id),

    // Worksheets
    generateWorksheet: (data) => worksheetAPI.generate(data),
    uploadWorksheetImage: (worksheetId, formData) => worksheetAPI.uploadImage(worksheetId, formData),
    updateWorksheet: (worksheetId, data) => worksheetAPI.update(worksheetId, data),
    generateWorksheetPDF: (worksheetId) => worksheetAPI.generatePDF(worksheetId),
    getWorksheetHistory: (page, limit) => worksheetAPI.getHistory(page, limit),
    getWorksheetById: (id) => worksheetAPI.getById(id),
    regenerateSection: (worksheetId, data) => worksheetAPI.regenerateSection(worksheetId, data)
};

export default unifiedAPI;
