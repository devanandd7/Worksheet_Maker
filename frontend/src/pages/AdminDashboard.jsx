import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useGlobalConfig } from '../context/GlobalConfigContext';
import './AdminDashboard.css'; // Import the SaaS CSS
import {
    LayoutDashboard, Users, BookOpen, Cpu, Settings, FileText,
    Search, Bell, Menu, X, ChevronDown, MoreHorizontal, ArrowUpRight,
    LogOut, User, Plus, Trash2, Upload, Image as ImageIcon, X as CloseIcon,
    AlertCircle, CheckCircle, Loader, Zap
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useDropzone } from 'react-dropzone';

const AdminDashboard = () => {
    const { user, getToken, isClerkSignedIn, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const token = await getToken();
            if (!token) return;
            const res = await api.getAdminStats(token);
            if (res.data.success) {
                setStats(res.data.stats);
            }
        } catch (err) {
            console.error(err);
            if (err?.response?.status !== 403) toast.error('Failed to update stats');
        } finally {
            setLoading(false);
        }
    };

    // Initial Auth Check and Data Fetch
    useEffect(() => {
        if (isClerkSignedIn) {
            fetchStats();
        }
    }, [isClerkSignedIn, getToken]);

    // Update stats when switching to relevant tabs
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        if (tab === 'overview' || tab === 'ai') {
            fetchStats();
        }
        setSidebarOpen(false);
    };

    // Mock Data for Charts (visual decoration)
    const barData = [
        { label: 'Mon', value: 30 },
        { label: 'Tue', value: 45 },
        { label: 'Wed', value: 25 },
        { label: 'Thu', value: 60 },
        { label: 'Fri', value: 75 },
        { label: 'Sat', value: 50 },
        { label: 'Sun', value: 40 },
    ];

    if (loading && !stats) return <div className="h-screen flex items-center justify-center"><Loader className="animate-spin text-indigo-600" size={48} /></div>;

    return (
        <div className="saas-dashboard">
            {/* Sidebar */}
            <aside className={`saas-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-logo-area">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                        <FileText size={18} fill="currentColor" />
                    </div>
                    <span className="sidebar-brand">WorksheetAI</span>
                    <button className="md:hidden ml-auto" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
                </div>

                <nav className="sidebar-nav">
                    <NavItem icon={LayoutDashboard} label="Overview" active={activeTab === 'overview'} onClick={() => handleTabChange('overview')} />
                    <NavItem icon={BookOpen} label="Universities" active={activeTab === 'universities'} onClick={() => handleTabChange('universities')} />
                    <NavItem icon={Users} label="Users" active={activeTab === 'users'} onClick={() => handleTabChange('users')} />
                    <NavItem icon={Cpu} label="AI Integrations" active={activeTab === 'ai'} onClick={() => handleTabChange('ai')} />
                    <div className="mt-auto"></div>
                    <NavItem icon={Settings} label="Settings" active={activeTab === 'settings'} onClick={() => handleTabChange('settings')} />
                </nav>

                <div className="sidebar-footer">
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                            {user?.name?.[0] || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'Admin'}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                        <LogOut size={16} className="text-gray-400 hover:text-red-500" onClick={logout} />
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="saas-main">
                <header className="saas-navbar">
                    <div className="flex items-center gap-4">
                        <button className="md:hidden p-2 text-gray-500" onClick={() => setSidebarOpen(true)}>
                            <Menu size={24} />
                        </button>
                        <div className="nav-search hidden md:block">
                            <Search className="search-icon" />
                            <input type="text" placeholder="Search resources..." className="search-input" />
                        </div>
                    </div>
                    <div className="nav-actions">
                        <button className="icon-btn" onClick={fetchStats} title="Refresh Stats"><Zap size={20} className={loading ? "animate-pulse" : ""} /></button>
                        <button className="icon-btn"><Bell size={20} /></button>
                        <div className="w-px h-6 bg-gray-200"></div>
                        <button className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900">
                            <User size={18} />
                            <span className="hidden sm:inline">Profile</span>
                        </button>
                    </div>
                </header>

                <div className="dashboard-content">
                    {activeTab === 'universities' && <UniversityManager getToken={getToken} />}
                    {activeTab === 'users' && <UserManager getToken={getToken} />}
                    {activeTab === 'ai' && <AIIntegrations stats={stats} />}

                    {/* Placeholder Logic */}
                    {activeTab === 'settings' && (
                        <div className="p-8 text-center text-gray-400">
                            <Settings size={48} className="mx-auto mb-3 opacity-20" />
                            <p>Admin settings coming soon.</p>
                        </div>
                    )}

                    {activeTab === 'overview' && (
                        <>
                            <div className="page-header">
                                <h1 className="page-title">Dashboard Overview</h1>
                                <p className="page-subtitle">Real-time system monitoring and user activity.</p>
                            </div>

                            <div className="stats-grid">
                                <StatsCard
                                    icon={Users}
                                    label="Total Users"
                                    value={stats?.totalUsers || "..."}
                                    trend="Actual"
                                />
                                <StatsCard
                                    icon={Zap}
                                    label="AI Usage"
                                    value={stats?.monthlyUsage || 0}
                                    trend="This Month"
                                />
                                <StatsCard
                                    icon={BookOpen}
                                    label="Institutions"
                                    value={stats?.totalUniversities || "..."}
                                    trend="Active"
                                />
                                <StatsCard
                                    icon={FileText}
                                    label="Worksheets"
                                    value={stats?.totalWorksheets || "..."}
                                    trend="Total"
                                />
                            </div>

                            <div className="charts-grid">
                                <div className="chart-card">
                                    <h3 className="chart-title">Weekly Generation</h3>
                                    <div className="css-bar-chart">
                                        {barData.map((d, i) => (
                                            <div key={i} className="bar-col">
                                                <div className="bar-fill" style={{ height: `${d.value}%` }}></div>
                                                <span className="bar-label">{d.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="chart-card">
                                    <h3 className="chart-title">Platform Growth</h3>
                                    <div className="flex-1 flex items-center justify-center p-4">
                                        <svg viewBox="0 0 100 50" className="w-full h-full opacity-75">
                                            <polyline fill="none" stroke="#6366f1" strokeWidth="2" points="0,40 15,35 30,38 45,20 60,25 75,10 90,5 100,2" />
                                            <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                                                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                                            </linearGradient>
                                            <polygon fill="url(#grad)" points="0,40 15,35 30,38 45,20 60,25 75,10 90,5 100,2 100,50 0,50" opacity="0.5" />
                                        </svg>
                                    </div>
                                    <div className="text-center mt-2">
                                        <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
                                        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold opacity-40">System Users</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

// --- Child Components ---

const UserManager = ({ getToken }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            const token = await getToken();
            const res = await api.getAdminUsers(1, 50, token);
            if (res.data.success) setUsers(res.data.users);
        } catch (err) {
            console.error('Fetch users error:', err);
            toast.error(`Failed to load user list: ${err.response?.data?.message || err.message}`);
        }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchUsers(); }, [getToken]);

    if (loading) return <div className="py-20 flex justify-center"><Loader className="animate-spin text-indigo-600" size={32} /></div>;

    return (
        <div className="animate-fade-in-up">
            <div className="page-header mb-8">
                <h1 className="page-title">User Management</h1>
                <p className="page-subtitle">Actual registered users in the database</p>
            </div>
            <div className="table-card overflow-x-auto">
                <table className="saas-table">
                    <thead>
                        <tr><th>User</th><th>Status</th><th>University</th><th>Last Login</th><th>Progress</th></tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u._id}>
                                <td>
                                    <div className="user-cell">
                                        <div className="avatar-circle">{u.name?.[0] || u.email?.[0] || 'U'}</div>
                                        <div>
                                            <div className="font-medium text-gray-900">{u.name || 'Anonymous'}</div>
                                            <div className="text-xs text-gray-500">{u.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td><span className="trend-badge trend-up bg-green-50 text-green-700">Active</span></td>
                                <td className="text-gray-600 truncate max-w-[150px]">{u.university || 'N/A'}</td>
                                <td className="text-gray-500">{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}</td>
                                <td>
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-indigo-500 h-full" style={{ width: `${u.profileCompleted || 0}%` }}></div>
                                        </div>
                                        <span className="text-[10px] text-gray-400">{u.profileCompleted || 0}%</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const AIIntegrations = ({ stats }) => {
    const apiLimit = 1000;
    const usage = stats?.monthlyUsage || 0;
    const percentage = Math.min((usage / apiLimit) * 100, 100);

    return (
        <div className="animate-fade-in-up">
            <div className="page-header mb-8">
                <h1 className="page-title">AI Integration & Quota</h1>
                <p className="page-subtitle">Real-time API monitoring and configuration</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Zap size={24} /></div>
                            <div>
                                <h3 className="font-bold text-gray-900">API Usage</h3>
                                <p className="text-xs text-gray-500">Monthly Quota</p>
                            </div>
                        </div>
                        <span className="text-2xl font-bold text-indigo-600">{usage} <span className="text-sm text-gray-400 font-normal">/ {apiLimit}</span></span>
                    </div>
                    <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden mb-2">
                        <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${percentage}%`, background: 'linear-gradient(90deg, #4f46e5 0%, #a855f7 100%)', boxShadow: '0 0 10px rgba(79, 70, 229, 0.3)' }}></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>0 requests</span>
                        <span>{percentage.toFixed(1)}% consumed</span>
                        <span>{apiLimit} limit</span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600"><Cpu size={24} /></div>
                        <div>
                            <h3 className="font-bold text-gray-800">Gemini 1.5 Flash</h3>
                            <p className="text-xs text-green-600 font-medium flex items-center gap-1"><CheckCircle size={12} /> API Connected</p>
                        </div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded text-[10px] font-mono text-gray-500 mb-4 truncate text-center">
                        API_KEY: AIzaSy...xxxx_xxxx_77t
                    </div>
                    <button className="btn btn-outline text-sm w-full">Config Integration</button>
                </div>
            </div>
            <div className="table-card p-12 text-center text-gray-400">
                <FileText size={48} className="mx-auto mb-3 opacity-20" />
                <p>Detailed AI activity logs will appear here</p>
            </div>
        </div>
    );
};

const UniversityManager = ({ getToken }) => {
    const { universities, loading, refetch } = useGlobalConfig();
    const [showForm, setShowForm] = useState(false);

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this university?')) return;
        try {
            const token = await getToken();
            await api.deleteUniversity(id, token);
            toast.success('Deleted successfully');
            refetch();
        } catch (e) { toast.error('Failed to delete'); }
    };

    const handleRetryAnalysis = async (id) => {
        try {
            const token = await getToken();
            await api.retryAnalysis(id, token);
            toast.info('Analysis started in background');
            setTimeout(() => refetch(), 1000);
        } catch (e) { toast.error('Failed to start analysis'); }
    };

    if (showForm) return (
        <div className="animate-fade-in-up">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><ArrowUpRight className="rotate-[-135deg]" size={20} /></button>
                <div><h1 className="page-title mb-0">Add Preset</h1><p className="page-subtitle">Configure institutional template</p></div>
            </div>
            <UniversityForm getToken={getToken} onSuccess={() => { setShowForm(false); refetch(); }} />
        </div>
    );

    return (
        <div className="animate-fade-in-up">
            <div className="flex justify-between items-center mb-8">
                <div><h1 className="page-title">University Presets</h1><p className="page-subtitle">Institutional branding and templates</p></div>
                <button onClick={() => setShowForm(true)} className="btn btn-primary px-6 py-2 w-auto flex items-center gap-2"><Plus size={18} /> Add New</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {loading ? <div className="col-span-full py-12 flex justify-center"><Loader className="animate-spin text-indigo-600" /></div> :
                    universities.length === 0 ? <div className="col-span-full text-center py-20 text-gray-400">No university presets added yet.</div> :
                        universities.map(uni => (
                            <div key={uni._id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all">
                                <div className="flex justify-between mb-4">
                                    <div className="w-12 h-12 rounded border overflow-hidden bg-gray-50"><img src={uni.headerImageUrl} alt="" className="w-full h-full object-cover" /></div>
                                    <div className="flex gap-1">
                                        <button onClick={() => handleRetryAnalysis(uni._id)} className="p-1.5 text-amber-500 hover:bg-amber-50 rounded"><Zap size={14} /></button>
                                        <button onClick={() => handleDelete(uni._id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                                <h3 className="font-bold text-gray-900 truncate mb-1">{uni.name}</h3>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${uni.analysisStatus === 'completed' ? 'bg-green-50 text-green-600 border-green-100' : uni.analysisStatus === 'processing' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                        {uni.analysisStatus || 'Pending'}
                                    </span>
                                </div>
                                <a href={uni.sampleTemplateUrl} target="_blank" rel="noreferrer" className="block text-center py-2 bg-gray-50 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 rounded text-xs font-medium transition-colors">Preview PDF Template</a>
                            </div>
                        ))}
            </div>
        </div>
    );
};

const UniversityForm = ({ getToken, onSuccess }) => {
    const [name, setName] = useState('');
    const [headerImage, setHeaderImage] = useState(null);
    const [samplePdf, setSamplePdf] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !headerImage || !samplePdf) return toast.error('All fields are required');
        setSubmitting(true);
        const formData = new FormData();
        formData.append('name', name);
        formData.append('headerImage', headerImage);
        formData.append('sampleTemplate', samplePdf);
        try {
            const token = await getToken();
            await api.createUniversity(formData, token);
            toast.success('Successfully created preset!');
            onSuccess();
        } catch (error) { toast.error('Failed to create university preset'); }
        finally { setSubmitting(false); }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm max-w-2xl mx-auto">
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">University Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Stanford University" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Branding Image</label>
                    <FileUploadArea accept="image/*" file={headerImage} setFile={setHeaderImage} label="Drop logo/header" icon={ImageIcon} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Template PDF</label>
                    <FileUploadArea accept=".pdf" file={samplePdf} setFile={setSamplePdf} label="Drop sample PDF" icon={FileText} />
                </div>
            </div>
            <button type="submit" disabled={submitting} className="btn btn-primary w-full py-3.5 flex justify-center items-center gap-2">
                {submitting ? <Loader className="animate-spin" size={20} /> : 'Publish Preset'}
            </button>
        </form>
    );
};

const FileUploadArea = ({ label, accept, file, setFile, icon: Icon }) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: { [accept === '.pdf' ? 'application/pdf' : 'image/*']: [] },
        maxFiles: 1,
        onDrop: acceptedFiles => setFile(acceptedFiles[0])
    });
    return (
        <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-400 bg-gray-50/50'}`}>
            <input {...getInputProps()} />
            {file ? <div className="text-xs text-indigo-600 font-bold truncate">{file.name}</div> :
                <div className="flex flex-col items-center gap-1">
                    <Icon size={20} className="text-gray-400" />
                    <span className="text-[10px] text-gray-500 font-medium">{label}</span>
                </div>}
        </div>
    );
};

const NavItem = ({ icon: Icon, label, active, onClick }) => (
    <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}><Icon size={18} /><span>{label}</span></button>
);

const StatsCard = ({ icon: Icon, label, value, trend }) => (
    <div className="stat-card">
        <div className="stat-header">
            <div className="stat-icon"><Icon size={20} /></div>
            <span className={`trend-badge ${trend === 'Actual' || trend === 'This Month' ? 'bg-indigo-50 text-indigo-700' : 'trend-up bg-green-50 text-green-700'}`}>
                {trend === 'Actual' ? <Users size={12} /> : trend === 'This Month' ? <Zap size={12} /> : <ArrowUpRight size={12} />} {trend}
            </span>
        </div>
        <div className="stat-value">{value}</div>
        <div className="stat-label text-xs uppercase tracking-wider font-semibold opacity-60 mt-1">{label}</div>
    </div>
);

export default AdminDashboard;
