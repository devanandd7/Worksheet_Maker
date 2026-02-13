import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { Analytics } from '@vercel/analytics/react';

// Pages
import Landing from './pages/Landing';
import ProfileSetup from './pages/ProfileSetup';
import { Dashboard, UploadSample, StructurePreview, GenerateWorksheet, WorksheetPreview, Download, History } from './pages/index';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { loading, isClerkSignedIn } = useAuth();

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="spinner"></div>
            </div>
        );
    }

    return isClerkSignedIn ? (
        <>
            <Navbar />
            <main className="main-content">
                {children}
            </main>
            <Footer />
        </>
    ) : <RedirectToSignIn />;
};

function App() {
    return (
        <Router>
            <Analytics />
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />

                {/* Clerk-protected Profile Setup */}
                <Route path="/profile-setup" element={
                    <>
                        <SignedIn>
                            <ProfileSetup />
                        </SignedIn>
                        <SignedOut>
                            <RedirectToSignIn />
                        </SignedOut>
                    </>
                } />

                {/* Protected Routes */}
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
