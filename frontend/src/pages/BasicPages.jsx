// This file contains placeholder exports for pages
// Each page should be created separately, but for quick setup, basic versions are here

import React from 'react';
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




