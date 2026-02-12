import React, { useState } from 'react';
import {
    Mail, Heart, Github, Twitter, Linkedin,
    LayoutDashboard, PlusCircle, History,
    Zap, Rocket
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
    // Hover states for animations
    const [hoveredLink, setHoveredLink] = useState(null);
    const [hoveredButton, setHoveredButton] = useState(false);

    const footerStyle = {
        background: 'linear-gradient(135deg, #f0f4ff 0%, #e6f7ff 100%)', // Soft purple to soft blue
        position: 'relative',
        marginTop: 'auto',
        overflow: 'hidden',
        color: '#4a5568',
        fontFamily: "'Inter', sans-serif",
    };

    // Soft glowing effect behind footer
    const glowStyle = {
        position: 'absolute',
        top: '-10%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '60%',
        height: '200px',
        background: 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.15) 0%, rgba(255, 255, 255, 0) 70%)',
        zIndex: 0,
        pointerEvents: 'none',
    };

    const containerStyle = {
        position: 'relative',
        zIndex: 1,
        padding: '80px 20px 40px',
        maxWidth: '1200px',
        margin: '0 auto',
    };

    const glassCardStyle = {
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.8)',
        borderRadius: '24px',
        padding: '40px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.03)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '40px',
    };

    const logoStyle = {
        background: 'linear-gradient(to right, #4f46e5, #00b4d8)', // Indigo to Cyan gradient
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontSize: '1.75rem',
        fontWeight: '800',
        letterSpacing: '-0.5px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '15px',
    };

    const headingStyle = {
        fontSize: '1rem',
        fontWeight: '700',
        color: '#1a202c', // Dark gray
        marginBottom: '20px',
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
    };

    const linkStyle = (name) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '12px',
        color: hoveredLink === name ? '#4f46e5' : '#718096', // Hover color change
        textDecoration: 'none',
        transition: 'all 0.3s ease',
        transform: hoveredLink === name ? 'translateX(5px)' : 'translateX(0)',
        fontSize: '0.95rem',
        fontWeight: '500',
    });

    const buttonStyle = {
        background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '50px', // Complete round
        padding: '12px 28px',
        fontSize: '0.95rem',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        textDecoration: 'none',
        boxShadow: hoveredButton ? '0 10px 25px rgba(79, 70, 229, 0.4)' : '0 4px 12px rgba(79, 70, 229, 0.2)',
        transform: hoveredButton ? 'scale(1.05) translateY(-2px)' : 'scale(1)',
        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Springy feel
    };

    const socialIconStyle = (hoverState) => ({
        color: hoverState ? '#4f46e5' : '#a0aec0',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        transform: hoverState ? 'translateY(-3px)' : 'translateY(0)',
        background: hoverState ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
        padding: '8px',
        borderRadius: '50%',
    });

    return (
        <footer style={footerStyle}>
            {/* Glow Effect */}
            <div style={glowStyle}></div>

            <div style={containerStyle}>
                {/* Main Glass Card */}
                <div style={glassCardStyle}>

                    {/* 1. Brand Section */}
                    <div>
                        <Link to="/" style={{ textDecoration: 'none' }}>
                            <h2 style={logoStyle}>
                                <Rocket size={24} color="#4f46e5" />
                                WorksheetAI
                            </h2>
                        </Link>
                        <p style={{ lineHeight: '1.7', color: '#64748b', fontSize: '1rem', maxWidth: '300px' }}>
                            Empowering educators and students with AI-generated academic worksheets. Create, customize, and learn smarter.
                        </p>

                        {/* Social Icons */}
                        <div style={{ display: 'flex', gap: '15px', marginTop: '25px' }}>
                            {[
                                { icon: Linkedin, link: '#' },
                                { icon: Twitter, link: '#' },
                                { icon: Github, link: '#' }
                            ].map((Item, i) => (
                                <a
                                    key={i}
                                    href={Item.link}
                                    target="_blank"
                                    rel="noreferrer"
                                    onMouseEnter={() => setHoveredLink(`social-${i}`)}
                                    onMouseLeave={() => setHoveredLink(null)}
                                    style={socialIconStyle(hoveredLink === `social-${i}`)}
                                >
                                    <Item.icon size={20} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* 2. Quick Links */}
                    <div>
                        <h4 style={headingStyle}>Quick Actions</h4>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <Link
                                to="/dashboard"
                                style={linkStyle('dashboard')}
                                onMouseEnter={() => setHoveredLink('dashboard')}
                                onMouseLeave={() => setHoveredLink(null)}
                            >
                                <LayoutDashboard size={18} />
                                Dashboard
                            </Link>
                            <Link
                                to="/generate"
                                style={linkStyle('generate')}
                                onMouseEnter={() => setHoveredLink('generate')}
                                onMouseLeave={() => setHoveredLink(null)}
                            >
                                <PlusCircle size={18} />
                                Generate New
                            </Link>
                            <Link
                                to="/history"
                                style={linkStyle('history')}
                                onMouseEnter={() => setHoveredLink('history')}
                                onMouseLeave={() => setHoveredLink(null)}
                            >
                                <History size={18} />
                                My History
                            </Link>
                        </div>
                    </div>

                    {/* 3. Contact Section */}
                    <div>
                        <h4 style={headingStyle}>Get in Touch</h4>
                        <p style={{ marginBottom: '20px', color: '#64748b' }}>
                            Have questions or feature requests? We'd love to hear from you.
                        </p>

                        <a
                            href="https://mail.google.com/mail/?view=cm&fs=1&to=makeworksheetonline@gmail.com&su=Feedback"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={buttonStyle}
                            onMouseEnter={() => setHoveredButton(true)}
                            onMouseLeave={() => setHoveredButton(false)}
                        >
                            <Mail size={18} />
                            <span>Send Feedback</span>
                        </a>

                        <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#718096' }}>
                            <Zap size={16} color="#fbbf24" fill="#fbbf24" />
                            <span>Typically replies within 24h</span>
                        </div>
                    </div>
                </div>

                {/* 4. Bottom Section */}
                <div style={{
                    marginTop: '40px',
                    paddingTop: '20px',
                    borderTop: '1px solid rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '20px',
                    fontSize: '0.9rem',
                    color: '#94a3b8'
                }}>
                    <p>
                        &copy; {new Date().getFullYear()} <span style={{ fontWeight: '600', color: '#4f46e5' }}>WorksheetAI</span>. All rights reserved.
                    </p>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(255,255,255,0.5)',
                        padding: '6px 12px',
                        borderRadius: '20px'
                    }}>
                        <span>Made with</span>
                        <Heart size={14} fill="#ef4444" color="#ef4444" style={{ animation: 'pulse 1.5s infinite' }} />
                        <span>for Education</span>
                    </div>
                </div>
            </div>

            {/* Inline Keyframes for pulse animation */}
            <style>
                {`
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                }
                `}
            </style>
        </footer>
    );
};

export default Footer;
