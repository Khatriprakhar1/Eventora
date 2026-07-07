import React, { createContext, useState, useEffect, useRef } from 'react';
import api from '../utils/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSuspended, setIsSuspended] = useState(false);
    const [deletedMessage, setDeletedMessage] = useState(null); // shown when account is soft-deleted
    const interceptorRef = useRef(null);

    useEffect(() => {
        // Axios interceptor: catch auth errors from any protected route
        interceptorRef.current = api.interceptors.response.use(
            (response) => response,
            (error) => {
                const status = error.response?.status;
                const message = error.response?.data?.message;

                if (status === 403 && message === 'Account suspended') {
                    setIsSuspended(true);
                }

                // 410 = account soft-deleted — show a proper message instead of silent logout
                if (status === 410) {
                    setUser(null);
                    setIsSuspended(false);
                    setDeletedMessage(message || 'Your account has been deleted by an administrator.');
                    localStorage.removeItem('userInfo');
                    localStorage.removeItem('token');
                }

                // 401 = token invalid / user truly gone from DB
                if (status === 401) {
                    setUser(null);
                    setIsSuspended(false);
                    localStorage.removeItem('userInfo');
                    localStorage.removeItem('token');
                }

                return Promise.reject(error);
            }
        );
        return () => {
            if (interceptorRef.current !== null) {
                api.interceptors.response.eject(interceptorRef.current);
            }
        };
    }, []);


    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            const parsed = JSON.parse(userInfo);
            setUser(parsed);
            // Silently refresh from server to sync avatar + any updated fields
            // If 401 is returned (user deleted), the interceptor above handles logout
            api.get('/profile')
                .then(({ data }) => {
                    const merged = { ...parsed, ...data };
                    setUser(merged);
                    localStorage.setItem('userInfo', JSON.stringify(merged));
                })
                .catch((err) => {
                    // Only ignore non-auth errors (network issues etc.)
                    // 401 is already handled by the interceptor above
                    if (err.response?.status !== 401) {
                        console.warn('Profile refresh failed:', err.message);
                    }
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);


    const login = async (email, password) => {
        try {
            const { data } = await api.post('/auth/login', { email, password });
            setUser(data);
            localStorage.setItem('userInfo', JSON.stringify(data));
            localStorage.setItem('token', data.token);
            return data;
        } catch (error) {
            if (error.response?.data?.needsVerification) throw error.response.data;
            throw error.response?.data?.message || 'Login failed';
        }
    };

    const register = async (name, email, password) => {
        try {
            const { data } = await api.post('/auth/register', { name, email, password });
            return data; // Returns { message, email }
        } catch (error) {
            throw error.response?.data?.message || 'Registration failed';
        }
    };

    const verifyOTP = async (email, otp) => {
        try {
            const { data } = await api.post('/auth/verify-otp', { email, otp });
            setUser(data);
            localStorage.setItem('userInfo', JSON.stringify(data));
            localStorage.setItem('token', data.token);
            return data;
        } catch (error) {
            throw error.response?.data?.message || 'OTP verification failed';
        }
    };

    const logout = () => {
        setUser(null);
        setIsSuspended(false);
        setDeletedMessage(null);
        localStorage.removeItem('userInfo');
        localStorage.removeItem('token');
    };

    const clearDeletedMessage = () => setDeletedMessage(null);

    const updateUser = (updatedData) => {
        const merged = { ...user, ...updatedData };
        setUser(merged);
        localStorage.setItem('userInfo', JSON.stringify(merged));
    };

    return (
        <AuthContext.Provider value={{ user, login, register, verifyOTP, logout, updateUser, loading, isSuspended, deletedMessage, clearDeletedMessage }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
