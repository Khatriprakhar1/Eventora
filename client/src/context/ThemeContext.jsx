import React, { createContext, useContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [dark, setDark] = useState(() => {
        const saved = localStorage.getItem('eventora-theme');
        if (saved) return saved === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        if (dark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('eventora-theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('eventora-theme', 'light');
        }
    }, [dark]);

    const toggle = () => setDark(prev => !prev);

    return (
        <ThemeContext.Provider value={{ dark, toggle }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
