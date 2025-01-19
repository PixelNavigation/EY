import React from 'react';
import { Link } from 'react-router-dom';
import './PublicNavbar.css';

export const PublicNavbar = () => {
    return (
        <nav className="navbar">

            <Link to="/" className="logo-container">
                <img src="/logo.png" alt="Logo" className="logo" />
            </Link>

            <ul className="nav-links">
                <li><Link to="/about">About</Link></li>
                <li><Link to="/features">Features</Link></li>
                <li><Link to="/pricing">Pricing</Link></li>
            </ul>

            <Link to="/login" className="sign-in-button">
                Sign In
            </Link>
        </nav>
    );
};
