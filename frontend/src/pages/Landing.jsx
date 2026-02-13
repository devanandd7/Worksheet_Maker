import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SignInButton, SignUpButton, SignedIn, SignedOut } from '@clerk/clerk-react';
import { useAuth } from '../context/AuthContext';
import { FileText, Sparkles, Zap, Shield, Clock, Users, Image } from 'lucide-react';
import './Landing.css';

const Landing = () => {
    const { isClerkSignedIn } = useAuth();
    const navigate = useNavigate();

    // Auto-redirect authenticated users to dashboard
    useEffect(() => {
        if (isClerkSignedIn) {
            navigate('/dashboard');
        }
    }, [isClerkSignedIn, navigate]);

    return (
        <div className="landing-page">
            {/* Header */}
            <header className="landing-header">
                <div className="container">
                    <div className="header-content">
                        <div className="logo">
                            <FileText size={32} />
                            <span>Worksheet Maker</span>
                        </div>
                        <nav className="nav-links">
                            <SignedOut>
                                <SignInButton mode="modal">
                                    <button className="btn btn-secondary btn-sm">Login</button>
                                </SignInButton>
                                <SignUpButton mode="modal" afterSignUpUrl="/profile-setup">
                                    <button className="btn btn-primary btn-sm">Get Started</button>
                                </SignUpButton>
                            </SignedOut>
                            <SignedIn>
                                <Link to="/dashboard" className="btn btn-primary btn-sm">Go to Dashboard</Link>
                            </SignedIn>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="container text-center">
                    <div className="fade-in">
                        <h1 className="hero-title">
                            Generate College & University Worksheets
                            <br />
                            <span className="gradient-text">Powered by AI</span>
                        </h1>
                        <p className="hero-description">
                            Create free, university-specific, plagiarism-free worksheets in minutes.
                            <br />
                            Perfect for students who value their time and academic integrity.
                        </p>
                        <div className="hero-cta">
                            <SignedOut>
                                <SignUpButton mode="modal" afterSignUpUrl="/profile-setup">
                                    <button className="btn btn-primary btn-lg">
                                        <Sparkles size={20} />
                                        Start Creating Free
                                    </button>
                                </SignUpButton>
                                <SignInButton mode="modal">
                                    <button className="btn btn-outline btn-lg">Sign In</button>
                                </SignInButton>
                            </SignedOut>
                            <SignedIn>
                                <Link to="/dashboard" className="btn btn-primary btn-lg">
                                    <Sparkles size={20} />
                                    Go to Dashboard
                                </Link>
                            </SignedIn>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="container">
                    <h2 className="section-title text-center mb-4">
                        Why Students Love Worksheet Maker
                    </h2>
                    <div className="features-grid">
                        {/* Highlights - Unique Content Card */}
                        <div className="feature-card card" style={{ borderTop: '4px solid #f59e0b' }}>
                            <div className="feature-icon" style={{ color: '#d97706' }}>
                                <Shield size={32} />
                            </div>
                            <h3>100% Unique Content</h3>
                            <p>Never match your worksheet content with others. AI generates original content every time.</p>
                        </div>

                        <div className="feature-card card">
                            <div className="feature-icon">
                                <Image size={32} />
                            </div>
                            <h3>Add Screenshots</h3>
                            <p>Easily upload outputs, graphs, or circuit diagrams. AI places them perfectly in your worksheet.</p>
                        </div>

                        <div className="feature-card card">
                            <div className="feature-icon">
                                <Zap size={32} />
                            </div>
                            <h3>Lightning Fast</h3>
                            <p>Generate complete worksheets in under 2 minutes. Say goodbye to hours of manual work.</p>
                        </div>

                        <div className="feature-card card">
                            <div className="feature-icon">
                                <Shield size={32} />
                            </div>
                            <h3>100% Original Content</h3>
                            <p>Advanced AI variance engine ensures every worksheet is unique. No plagiarism worries.</p>
                        </div>

                        <div className="feature-card card">
                            <div className="feature-icon">
                                <FileText size={32} />
                            </div>
                            <h3>University Format Match</h3>
                            <p>Upload your sample worksheet once. AI learns and follows your exact format forever.</p>
                        </div>

                        <div className="feature-card card">
                            <div className="feature-icon">
                                <Clock size={32} />
                            </div>
                            <h3>Always Learning</h3>
                            <p>System remembers your preferences and improves with each worksheet you generate.</p>
                        </div>

                        <div className="feature-card card">
                            <div className="feature-icon">
                                <Sparkles size={32} />
                            </div>
                            <h3>Smart Editing</h3>
                            <p>Full control to edit, regenerate sections, and add images before final download.</p>
                        </div>

                        <div className="feature-card card">
                            <div className="feature-icon">
                                <Users size={32} />
                            </div>
                            <h3>Subject Specific</h3>
                            <p>Works for ML, Data Science, Programming, Theory subjects and more.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="how-it-works-section">
                <div className="container">
                    <h2 className="section-title text-center mb-4">
                        Simple 3-Step Process
                    </h2>
                    <div className="steps-container">
                        <div className="step">
                            <div className="step-number">1</div>
                            <h3>Upload Sample Worksheet</h3>
                            <p>Upload ONE sample worksheet PDF from your university. AI analyzes the structure.</p>
                        </div>

                        <div className="step-arrow">→</div>

                        <div className="step">
                            <div className="step-number">2</div>
                            <h3>Enter Topic & Details</h3>
                            <p>Provide your topic, syllabus scope, and difficulty level. AI does the rest.</p>
                        </div>

                        <div className="step-arrow">→</div>

                        <div className="step">
                            <div className="step-number">3</div>
                            <h3>Review & Download</h3>
                            <p>Edit if needed, add screenshots, and download your professional PDF.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="container text-center">
                    <h2 className="cta-title">Ready to Save 10+ Hours This Semester?</h2>
                    <p className="cta-description">
                        Join students who are already using AI to create better worksheets faster.
                    </p>
                    <SignedOut>
                        <SignUpButton mode="modal" afterSignUpUrl="/profile-setup">
                            <button className="btn btn-primary btn-lg">Get Started - It's Free</button>
                        </SignUpButton>
                    </SignedOut>
                    <SignedIn>
                        <Link to="/dashboard" className="btn btn-primary btn-lg">Go to Dashboard</Link>
                    </SignedIn>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="container text-center">
                    <p>&copy; 2026 Worksheet Maker Free. Built with ❤️ for students.</p>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
