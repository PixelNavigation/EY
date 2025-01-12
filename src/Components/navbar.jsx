import React from 'react';
import { Link } from 'react-router-dom';
import './navbar.css';

const Navbar = () => {
    return (
        <div>
            <nav className="navbar">
                <img src="https://assets.ccbp.in/frontend/react-js/learn-react-js-logo.png" alt="LOGO" className="logo" />
                <ul>
                    <li><Link to="/">Dashboard</Link></li>
                    <li><Link to="/learning-path">Learning Path</Link></li>
                    <li><Link to="/mock-interview">Mock Interview</Link></li>
                    <li><Link to="/portfolio-builder">Portfolio Builder</Link></li>
                    <li><Link to="/redeem">Redeem</Link></li>
                </ul>
                <button className="sign-in-button">Sign In</button>
            </nav>
        </div>
    );
};

export default Navbar;