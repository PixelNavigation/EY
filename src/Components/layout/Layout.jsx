import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AuthenticatedNavbar } from './AuthenticatedNavbar';
import { PublicNavbar } from './PublicNavbar';
import { Navigate, Outlet } from 'react-router-dom';

export const Layout = () => {
    const { isAuthenticated } = useAuth();

    return (
        <>
            {isAuthenticated ? <AuthenticatedNavbar /> : <PublicNavbar />}
            <div className="container">
                <Outlet />
            </div>
        </>
    );
};