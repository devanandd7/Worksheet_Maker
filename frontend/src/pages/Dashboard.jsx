import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    FilePlus,
    Upload,
    History,
    ArrowRight,
    GraduationCap,
    BookOpen,
    FileText,
    AlertCircle
} from 'lucide-react';
import './Dashboard.css';
import '../components/Navbar.css'; // Re-use general styles if needed

const Dashboard = () => {
    const { user, clerkUser } = useAuth();
    const [greeting, setGreeting] = useState('');

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good Morning');
        else if (hour < 18) setGreeting('Good Afternoon');
        else setGreeting('Good Evening');
    }, []);

    return (
        <div className="dashboard-container px-4">
            {/* Header Section */}
            <div className="dashboard-header animate-slide-up">
                <div className="dashboard-welcome">
                    <h1>{greeting}, {(user?.name || clerkUser?.firstName || 'Student').split(' ')[0]}! 👋</h1>
                    <p className="dashboard-subtitle">
                        Ready to create some amazing worksheets today?
                    </p>
                </div>
                <div className="dashboard-actions">
                    <Link to="/generate" className="btn btn-primary">
                        <FilePlus size={20} />
                        New Worksheet
                    </Link>
                </div>
            </div>

            {/* Profile Warning Banner */}
            {user && user.profileCompletion && user.profileCompletion.percentage < 80 && (
                <div className="profile-warning-banner animate-slide-up delay-100" style={{
                    background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
                    borderLeft: '4px solid #f59e0b',
                    padding: '1rem 1.5rem',
                    marginBottom: '2rem',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    color: '#92400e'
                }}>
                    <AlertCircle size={24} color="#d97706" />
                    <div style={{ flex: 1 }}>
                        <strong>Complete your profile!</strong> You are missing some details.
                        Complete your profile to get personalized worksheets.
                    </div>
                    <Link to="/profile-setup" className="btn btn-sm btn-secondary" style={{ whiteSpace: 'nowrap' }}>
                        Complete Now
                    </Link>
                </div>
            )}

            {/* Main Action Cards */}
            <div className="overview-grid">


                {/* Create New */}
                <div className="overview-card animate-slide-up delay-100">
                    <div className="card-content">
                        <div className="card-icon-wrapper icon-blue">
                            <FilePlus />
                        </div>
                        <h3>Smart Generator</h3>
                        <p>Generate a complete practical worksheet from just a topic name using AI.</p>
                    </div>
                    <div className="card-action">
                        <Link to="/generate" className="btn btn-outline w-full justify-center">
                            Start Generating <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>

                {/* Upload Sample */}
                {/* <div className="overview-card animate-slide-up delay-200">
                    <div className="card-content">
                        <div className="card-icon-wrapper icon-purple">
                            <Upload />
                        </div>
                        <h3>Upload Template</h3>
                        <p>Upload a sample PDF from your university to teach AI your specific format.</p>
                    </div>
                    <div className="card-action">
                        <Link to="/upload-sample" className="btn btn-outline w-full justify-center">
                            Upload PDF <ArrowRight size={16} />
                        </Link>
                    </div>
                </div> */}

                {/* History */}
                <div className="overview-card animate-slide-up delay-300">
                    <div className="card-content">
                        <div className="card-icon-wrapper icon-green">
                            <History />
                        </div>
                        <h3>Your Library</h3>
                        <p>Access, edit, and download your previously generated worksheets.</p>
                    </div>
                    <div className="card-action">
                        <Link to="/history" className="btn btn-outline w-full justify-center">
                            View History <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Profile Summary & Stats */}
            <div className="animate-slide-up delay-300">
                <div className="recent-section">
                    <div className="section-header">
                        <h2>Academic Profile</h2>
                        <Link to="/profile-setup" className="btn btn-sm btn-secondary">
                            Edit Profile
                        </Link>
                    </div>

                    <div className="profile-details grid md:grid-cols-3 gap-6">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                                <GraduationCap size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800">University</h4>
                                <p className="text-gray-600">{user?.university || 'Not Set'}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                                <BookOpen size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800">Course</h4>
                                <p className="text-gray-600">
                                    {user?.course || 'General'}
                                    {user?.semester ? ` • Sem ${user.semester}` : ''}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                                <FileText size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800">Default Subject</h4>
                                <p className="text-gray-600">{user?.defaultSubject || 'Not Set'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats (Could be dynamic later) */}
                    <div className="stats-grid border-t border-gray-100 pt-6 mt-6">
                        <div className="stat-item">
                            <span className="stat-value">Always</span>
                            <span className="stat-label">Available</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">Fast</span>
                            <span className="stat-label">Generation</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">High</span>
                            <span className="stat-label">Quality PDF</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
