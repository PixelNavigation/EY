import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AuthenticatedNavbar } from './AuthenticatedNavbar';
import { PublicNavbar } from './PublicNavbar';

export const Layout = ({ children }) => {
    const { isAuthenticated } = useAuth();

    return (
        <>
            {isAuthenticated ? <AuthenticatedNavbar /> : <PublicNavbar />}
            <div className="container">
                {children}
            </div>
        </>
    );
};