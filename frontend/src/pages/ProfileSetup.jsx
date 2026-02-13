import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { User, BookOpen, GraduationCap, Save, ArrowRight } from 'lucide-react';
import CircularProgress from '../components/CircularProgress';
import './Auth.css';

const ProfileSetup = () => {
    const navigate = useNavigate();
    const { syncProfile, user, clerkUser, refreshProfile } = useAuth();

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        university: '',
        course: '',
        semester: '',
        section: '',
        branch: '',
        uid: '',
        defaultSubject: ''
    });

    // Initialize form with existing data
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || clerkUser?.fullName || '',
                university: user.university !== 'Not Set' ? user.university : '',
                course: user.course !== 'Not Set' ? user.course : '',
                semester: user.semester !== 'Not Set' ? user.semester : '',
                section: user.section || '',
                branch: user.branch || '',
                uid: user.uid || '',
                defaultSubject: user.defaultSubject || ''
            });
        } else if (clerkUser) {
            setFormData(prev => ({
                ...prev,
                name: clerkUser.fullName || clerkUser.firstName + ' ' + clerkUser.lastName || ''
            }));
        }
    }, [user, clerkUser]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await syncProfile(formData);
            if (result.success) {
                toast.success('Profile updated successfully!');
                // calculate completion locally to update UI immediately if needed, 
                // but syncProfile should return updated user with completion
                if (result.user?.profileCompleted) {
                    // Optional: navigate somewhere or stay
                }
            } else {
                toast.error(result.message || 'Failed to save profile');
            }
        } catch (error) {
            console.error(error);
            toast.error('An error occurred while saving your profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container" style={{ maxWidth: '1000px' }}>
            <div className="auth-box" style={{ maxWidth: '100%' }}>

                <div className="profile-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 2fr', gap: '2rem' }}>

                    {/* Left Column: Stats & Info */}
                    <div className="profile-sidebar" style={{ textAlign: 'center', borderRight: '1px solid #e5e7eb', paddingRight: '2rem' }}>
                        <div className="profile-completion-wrapper" style={{ marginBottom: '2rem' }}>
                            <CircularProgress
                                percentage={user?.profileCompletion?.percentage || 0}
                                size={140}
                            />
                            <p style={{ marginTop: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                                Profile Completion
                            </p>
                        </div>

                        <div className="user-static-info" style={{ textAlign: 'left' }}>
                            <div className="info-group" style={{ marginBottom: '1rem' }}>
                                <label style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</label>
                                <p style={{ fontWeight: 600, color: '#1f2937' }}>{clerkUser?.fullName || formData.name}</p>
                            </div>
                            <div className="info-group">
                                <label style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
                                <p style={{ fontWeight: 600, color: '#1f2937', wordBreak: 'break-all' }}>
                                    {clerkUser?.primaryEmailAddress?.emailAddress}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Form */}
                    <div className="profile-form-wrapper">
                        <div className="auth-header" style={{ textAlign: 'left', marginBottom: '2rem' }}>
                            <h1 className="auth-title" style={{ fontSize: '1.5rem' }}>Academic Profile</h1>
                            <p className="auth-subtitle">Update your details to get personalized worksheets</p>
                        </div>

                        <form className="auth-form" onSubmit={handleSubmit}>
                            {/* Academic Details */}
                            <div className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#4b5563', fontWeight: 600 }}>
                                <GraduationCap size={18} /> Required Details
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">University/College</label>
                                    <input
                                        type="text"
                                        name="university"
                                        className="form-input"
                                        value={formData.university}
                                        onChange={handleChange}
                                        placeholder="e.g., MIT"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Course</label>
                                    <input
                                        type="text"
                                        name="course"
                                        className="form-input"
                                        value={formData.course}
                                        onChange={handleChange}
                                        placeholder="e.g., B.Tech"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Semester</label>
                                <input
                                    type="text"
                                    name="semester"
                                    className="form-input"
                                    value={formData.semester}
                                    onChange={handleChange}
                                    placeholder="e.g., 5th"
                                    required
                                />
                            </div>

                            {/* Additional Details */}
                            <div className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', marginTop: '2rem', color: '#4b5563', fontWeight: 600 }}>
                                <BookOpen size={18} /> Optional Details <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#9ca3af' }}>(Boosts completion score)</span>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Section</label>
                                    <input
                                        type="text"
                                        name="section"
                                        className="form-input"
                                        value={formData.section}
                                        onChange={handleChange}
                                        placeholder="A"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Branch</label>
                                    <input
                                        type="text"
                                        name="branch"
                                        className="form-input"
                                        value={formData.branch}
                                        onChange={handleChange}
                                        placeholder="CS"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Roll Number (UID)</label>
                                    <input
                                        type="text"
                                        name="uid"
                                        className="form-input"
                                        value={formData.uid}
                                        onChange={handleChange}
                                        placeholder="CS2023001"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Default Subject</label>
                                    <input
                                        type="text"
                                        name="defaultSubject"
                                        className="form-input"
                                        value={formData.defaultSubject}
                                        onChange={handleChange}
                                        placeholder="Data Structures"
                                    />
                                </div>
                            </div>

                            <div className="form-actions" style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => navigate('/dashboard')}
                                    disabled={loading}
                                >
                                    Back to Dashboard
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={loading}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    {loading ? 'Saving...' : <>Save Changes <Save size={18} /></>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileSetup;
