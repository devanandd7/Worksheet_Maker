import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import { ProfileSetup, Dashboard, UploadSample, StructurePreview, GenerateWorksheet, WorksheetPreview, Download, History } from './pages/index';
import Navbar from './components/Navbar';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="spinner"></div>
            </div>
        );
    }

    //here  we need to set clerk auth
    return isAuthenticated ? (
        <>
            <Navbar />
            <main className="main-content">
                {children}
            </main>
        </>
    ) : <Navigate to="/login" />;
};

function App() {
    return (
        <Router>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected Routes */}
                <Route path="/profile-setup" element={
                    <ProtectedRoute><ProfileSetup /></ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                    <ProtectedRoute><Dashboard /></ProtectedRoute>
                } />
                <Route path="/upload-sample" element={
                    <ProtectedRoute><UploadSample /></ProtectedRoute>
                } />
                <Route path="/structure-preview" element={
                    <ProtectedRoute><StructurePreview /></ProtectedRoute>
                } />
                <Route path="/generate" element={
                    <ProtectedRoute><GenerateWorksheet /></ProtectedRoute>
                } />
                <Route path="/preview/:id" element={
                    <ProtectedRoute><WorksheetPreview /></ProtectedRoute>
                } />
                <Route path="/download/:id" element={
                    <ProtectedRoute><Download /></ProtectedRoute>
                } />
                <Route path="/history" element={
                    <ProtectedRoute><History /></ProtectedRoute>
                } />

                {/* Catch all */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    );
}

export default App;
