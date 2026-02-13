import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api'; // Ensure this service has getWorksheetHistory method or similar
import {
    FileText,
    Calendar,
    Download,
    Eye,
    ArrowLeft,
    Loader
} from 'lucide-react';
import { toast } from 'react-toastify';

import { useAuth } from '../context/AuthContext';

const History = () => {
    const navigate = useNavigate();
    const { getToken } = useAuth();
    const [worksheets, setWorksheets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchHistory = React.useCallback(async () => {
        try {
            // direct axios call if api service wrapper is not ready yet, 
            // but usually api.js has a generic get or specific method.
            // Assuming api.getWorksheetHistory() or api.get('/worksheets/history')
            const token = await getToken();
            const response = await api.getWorksheetHistory(1, 10, token);
            setWorksheets(response.data.worksheets);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch history:', err);
            setError('Failed to load history. Please try again.');
            setLoading(false);
        }
    }, [getToken]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const handleDownload = (e, url, topic) => {
        e.preventDefault();
        e.stopPropagation();
        if (!url) {
            toast.error('PDF not available for this worksheet');
            return;
        }
        window.open(url, '_blank');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader className="spinner text-primary" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="container max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center mb-8">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="mr-4 p-2 rounded-full hover:bg-gray-200 transition"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">My Worksheets</h1>
                        <p className="text-gray-500">History of your generated practicals</p>
                    </div>
                </div>

                {/* Content */}
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-200">
                        {error}
                    </div>
                )}

                {worksheets.length === 0 && !error ? (
                    <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
                        <FileText size={64} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No worksheets yet</h3>
                        <p className="text-gray-500 mb-6">Start by generating your first practical worksheet!</p>
                        <Link to="/generate" className="btn btn-primary">
                            Generate Worksheet
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {worksheets.map((item) => (
                            <div
                                key={item._id}
                                className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => navigate(`/preview/${item._id}`)}
                            >
                                <div className="mb-4 md:mb-0">
                                    <h3 className="text-lg font-bold text-gray-800 mb-1">
                                        {item.topic}
                                    </h3>
                                    <div className="flex items-center text-sm text-gray-500 gap-4">
                                        <span className="flex items-center">
                                            <Calendar size={14} className="mr-1" />
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </span>
                                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium uppercase">
                                            {item.subject}
                                        </span>
                                        {item.status === 'finalized' && (
                                            <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-medium">
                                                Ready
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Link
                                        to={`/preview/${item._id}`}
                                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
                                        title="View Worksheet"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Eye size={20} />
                                    </Link>

                                    {item.pdfUrl ? (
                                        <a
                                            href={item.pdfUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-full transition"
                                            title="Download PDF"
                                            onClick={(e) => handleDownload(e, item.pdfUrl, item.topic)}
                                        >
                                            <Download size={20} />
                                        </a>
                                    ) : (
                                        <button
                                            disabled
                                            className="p-2 text-gray-300 cursor-not-allowed"
                                            title="PDF Gathering..."
                                        >
                                            <Download size={20} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default History;
