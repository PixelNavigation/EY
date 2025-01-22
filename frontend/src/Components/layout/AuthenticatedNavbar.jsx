import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './AuthenticatedNavbar.css';

const AuthenticatedNavbar = () => {
    const { userProfile, logout } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    return (
        <nav className="Auth-navbar">
            <Link to="/" className="Auth-logo">
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
                    onClick={toggleDropdown}
                />
                {isDropdownOpen && (
                    <div className="Auth-dropdown-menu">
                        <Link to="/profile" onClick={toggleDropdown}>
                            <button>
                                Profile
                            </button>
                        </Link>
                        <button onClick={logout}>
                            Sign Out
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
};

export { AuthenticatedNavbar };