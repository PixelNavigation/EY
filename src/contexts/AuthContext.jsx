import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userProfile, setUserProfile] = useState(null);

    const login = (user) => {
        setIsAuthenticated(true);
        setUserProfile(user);
    };

    const logout = () => {
        setIsAuthenticated(false);
        setUserProfile(null);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout, userProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};