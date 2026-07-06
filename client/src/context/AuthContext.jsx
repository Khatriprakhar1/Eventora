import React, { createContext, useState, useEffect, useRef } from 'react';
import api from '../utils/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSuspended, setIsSuspended] = useState(false);
    const interceptorRef = useRef(null);

    useEffect(() => {
        // Axios interceptor: catch 403 "Account suspended" from any protected route
        interceptorRef.current = api.interceptors.response.use(
            (response) => response,
            (error) => {
                if (
                    error.response?.status === 403 &&
                    error.response?.data?.message === 'Account suspended'
                ) {
                    setIsSuspended(true);
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
            api.get('/profile')
                .then(({ data }) => {
                    const merged = { ...parsed, ...data };
                    setUser(merged);
                    localStorage.setItem('userInfo', JSON.stringify(merged));
                })
                .catch(() => {}) // ignore if token expired etc.
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
        localStorage.removeItem('userInfo');
        localStorage.removeItem('token');
    };

    const updateUser = (updatedData) => {
        const merged = { ...user, ...updatedData };
        setUser(merged);
        localStorage.setItem('userInfo', JSON.stringify(merged));
    };

    return (
        <AuthContext.Provider value={{ user, login, register, verifyOTP, logout, updateUser, loading, isSuspended }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
