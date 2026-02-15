import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const GlobalConfigContext = createContext();

export const GlobalConfigProvider = ({ children }) => {
    const [universities, setUniversities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchGlobalConfig = async () => {
        setLoading(true);
        try {
            console.log('🌍 Fetching Global Configuration...');
            const response = await api.getUniversities();
            if (response.data.success) {
                setUniversities(response.data.universities);
                console.log(`✅ Loaded ${response.data.universities.length} universities globally.`);
            }
        } catch (err) {
            console.error('❌ Failed to fetch global config:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGlobalConfig();
    }, []);

    return (
        <GlobalConfigContext.Provider value={{ universities, loading, error, refetch: fetchGlobalConfig }}>
            {children}
        </GlobalConfigContext.Provider>
    );
};

export const useGlobalConfig = () => useContext(GlobalConfigContext);
