import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    FilePlus,
    History as HistoryIcon,
    Upload,
    LogOut,
    Menu,
    X,
    User
} from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const navLinks = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/generate', label: 'Generate', icon: FilePlus },
        { path: '/history', label: 'History', icon: HistoryIcon },
        { path: '/upload-sample', label: 'Upload Sample', icon: Upload },
    ];

    return (
        <nav className="navbar">
            <div className="navbar-container">
                {/* Logo and Brand */}
                <div className="navbar-brand-wrapper">
                    <NavLink to="/dashboard" className="navbar-brand">
                        <div className="brand-icon">WM</div>
                        <span className="brand-text">
                            Worksheet Maker
                        </span>
                    </NavLink>
                </div>

                {/* Desktop Navigation */}
                <div className="nav-links">
                    {navLinks.map((link) => (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        >
                            <link.icon size={18} />
                            {link.label}
                        </NavLink>
                    ))}
                </div>

                {/* User Profile & Logout */}
                <div className="nav-user">
                    <div className="user-badge">
                        <div className="user-avatar">
                            <User size={14} />
                        </div>
                        <span className="user-name">
                            {user?.name || 'User'}
                        </span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="btn-icon"
                        title="Logout"
                    >
                        <LogOut size={20} />
                    </button>
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={toggleMobileMenu}
                    className="mobile-toggle"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
                {navLinks.map((link) => (
                    <NavLink
                        key={link.path}
                        to={link.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                    >
                        <link.icon size={20} />
                        {link.label}
                    </NavLink>
                ))}
                <button
                    onClick={handleLogout}
                    className="mobile-logout"
                >
                    <LogOut size={20} />
                    Logout
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
