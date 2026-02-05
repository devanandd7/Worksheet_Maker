// This file contains placeholder exports for pages
// Each page should be created separately, but for quick setup, basic versions are here

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../pages/Auth.css';

export const ProfileSetup = () => {
    const { user } = useAuth();

    // Profile is set during registration, so redirect to dashboard
    React.useEffect(() => {
        if (user) {
            window.location.href = '/dashboard';
        }
    }, [user]);

    return <div className="loading-overlay"><div className="spinner"></div></div>;
};

export const Dashboard = () => {
    const { user, logout } = useAuth();

    return (
        <div style={{ padding: '2rem' }}>
            <div className="container">
                <div className="flex justify-between items-center mb-4">
                    <h1>Welcome, {user?.name}!</h1>
                    <button onClick={logout} className="btn btn-secondary">Logout</button>
                </div>

                <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <h2 className="mb-2">What would you like to do?</h2>
                    <p className="mb-3" style={{ color: 'var(--text-secondary)' }}>
                        Start by uploading a sample worksheet or generate a new one
                    </p>
                    <div className="flex justify-center gap-2">
                        <Link to="/upload-sample" className="btn btn-primary btn-lg">
                            Upload Sample Worksheet
                        </Link>
                        <Link to="/generate" className="btn btn-outline btn-lg">
                            Generate Worksheet
                        </Link>
                        <Link to="/history" className="btn btn-secondary btn-lg">
                            View History
                        </Link>
                    </div>
                </div>

                <div className="mt-4">
                    <div className="card">
                        <h3 className="mb-2">Your Profile</h3>
                        <p><strong>University:</strong> {user?.university}</p>
                        <p><strong>Course:</strong> {user?.course}, Semester {user?.semester}</p>
                        {user?.defaultSubject && <p><strong>Subject:</strong> {user?.defaultSubject}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const History = () => {
    return (
        <div style={{ padding: '2rem' }}>
            <div className="container">
                <h1 className="mb-3">Worksheet History</h1>
                <div className="card">
                    <p style={{ textAlign: 'center', padding: '3rem' }}>
                        Your generated worksheets will appear here.
                        <br />
                        <Link to="/generate" className="btn btn-primary mt-2">Generate Your First Worksheet</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};
