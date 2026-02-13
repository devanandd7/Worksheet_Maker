import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn } = useUser();
    const { getToken, signOut } = useClerkAuth();

    const [user, setUser] = useState(null); // MongoDB user data
    const [loading, setLoading] = useState(true);
    const [clerkToken, setClerkToken] = useState(null);

    // Sync Clerk session token and fetch MongoDB user data
    useEffect(() => {
        const syncUser = async () => {
            if (!clerkLoaded) {
                return; // Wait for Clerk to load
            }

            if (!isSignedIn || !clerkUser) {
                // User not signed in via Clerk
                setUser(null);
                setClerkToken(null);
                setLoading(false);
                return;
            }

            try {
                // Get Clerk session token
                const token = await getToken();
                setClerkToken(token);

                // Fetch user profile from backend (this will auto-create if doesn't exist)
                const response = await authAPI.getProfile(token);
                setUser(response.data.user);

                console.log('✅ User synced:', response.data.user);
            } catch (error) {
                console.error('Failed to sync user:', error);
                // Don't sign out on profile fetch error - user might be new
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        syncUser();
    }, [clerkUser, clerkLoaded, isSignedIn, getToken]);

    // Sync/update profile with backend
    const syncProfile = useCallback(async (profileData) => {
        try {
            const token = await getToken();
            const response = await authAPI.syncProfile(profileData, token);
            const updatedUser = response.data.user;

            setUser(updatedUser);
            return { success: true, user: updatedUser };
        } catch (error) {
            console.error('Failed to sync profile:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to sync profile'
            };
        }
    }, [getToken]);

    // Refresh profile from backend
    const refreshProfile = useCallback(async () => {
        try {
            const token = await getToken();
            const response = await authAPI.getProfile(token);
            const updatedUser = response.data.user;

            setUser(updatedUser);
            return { success: true, user: updatedUser };
        } catch (error) {
            console.error('Failed to refresh profile:', error);
            return { success: false };
        }
    }, [getToken]);

    // Update user state locally
    const updateUser = (updatedUser) => {
        setUser(updatedUser);
    };

    // Logout using Clerk
    const logout = async () => {
        try {
            await signOut();
            setUser(null);
            setClerkToken(null);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // Get current Clerk session token
    const getCurrentToken = useCallback(async () => {
        try {
            return await getToken();
        } catch (error) {
            console.error('Failed to get token:', error);
            return null;
        }
    }, [getToken]);

    return (
        <AuthContext.Provider value={{
            user,                           // MongoDB user data
            clerkUser,                      // Clerk user data
            clerkToken,                     // Clerk session token
            loading,
            logout,
            updateUser,
            refreshProfile,
            syncProfile,
            getToken: getCurrentToken,
            getCurrentToken,
            isAuthenticated: isSignedIn && !!user,
            isClerkSignedIn: isSignedIn
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
