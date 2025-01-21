import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './AuthenticatedNavbar.css';

export const AuthenticatedNavbar = () => {
    const { userProfile, logout } = useAuth();

    return (
        <nav className="Auth-navbar">
            <Link to="/">
                <img src="/logo.png" alt="Logo" className="Auth-logo" />
            </Link>
            <ul>
                <li><Link to="/">Dashboard</Link></li>
                <li><Link to="/learning-path">Learning Path</Link></li>
                <li><Link to="/mock-interview">Mock Interview</Link></li>
                <li><Link to="/portfolio-builder">Portfolio Builder</Link></li>
                <li><Link to="/redeem">Redeem</Link></li>
            </ul>
            <div className="Auth-profile-section">
                <img
                    src={userProfile?.photoURL || "/default-avatar.png"}
                    alt="Profile"
                    className="Auth-profile"
                />
                <button
                    onClick={logout}
                    className="Auth-sign-out-button"
                >
                    Sign Out
                </button>
            </div>
        </nav>
    );
};