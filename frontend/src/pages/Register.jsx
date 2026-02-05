import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { UserPlus, FileText } from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        university: '',
        course: '',
        semester: '',
        defaultSubject: '',
        uid: '',
        branch: '',
        section: ''
    });
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const result = await register(formData);

        if (result.success) {
            toast.success('Registration successful!');
            navigate('/dashboard');
        } else {
            toast.error(result.message);
        }

        setLoading(false);
    };

    return (
        <div className="auth-page">
            <div className="auth-container container-sm">
                <div className="auth-header">
                    <Link to="/" className="auth-logo">
                        <FileText size={32} />
                        <span>Worksheet AI</span>
                    </Link>
                </div>

                <div className="auth-card card">
                    <h2 className="auth-title">Create Your Account</h2>
                    <p className="auth-subtitle">Join thousands of students saving time with AI</p>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="input-group">
                            <label className="input-label">Full Name *</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Email Address *</label>
                            <input
                                type="email"
                                className="input-field"
                                placeholder="your.email@university.edu"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Password *</label>
                            <input
                                type="password"
                                className="input-field"
                                placeholder="At least 6 characters"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                minLength={6}
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">University/College *</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Chandigarh University"
                                value={formData.university}
                                onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                                required
                            />
                        </div>

                        <div className="flex gap-2">
                            <div className="input-group" style={{ flex: 1 }}>
                                <label className="input-label">Course *</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="MCA / BCA / B.Tech"
                                    value={formData.course}
                                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="input-group" style={{ flex: 1 }}>
                                <label className="input-label">Semester *</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="II / IV / VI"
                                    value={formData.semester}
                                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Default Subject (Optional)</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Machine Learning Lab"
                                value={formData.defaultSubject}
                                onChange={(e) => setFormData({ ...formData, defaultSubject: e.target.value })}
                            />
                        </div>

                        <div className="flex gap-2">
                            <div className="input-group" style={{ flex: 1 }}>
                                <label className="input-label">UID/Roll No (Optional)</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="21MCA001"
                                    value={formData.uid}
                                    onChange={(e) => setFormData({ ...formData, uid: e.target.value })}
                                />
                            </div>

                            <div className="input-group" style={{ flex: 1 }}>
                                <label className="input-label">Branch (Optional)</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="CSE"
                                    value={formData.branch}
                                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Section/Group (Optional)</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="A / B / C"
                                value={formData.section}
                                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                            />
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                            {loading ? (
                                <span>Creating account...</span>
                            ) : (
                                <>
                                    <UserPlus size={20} />
                                    <span>Create Account</span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="auth-footer">
                        Already have an account? <Link to="/login">Sign in</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
