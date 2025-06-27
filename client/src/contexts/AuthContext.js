import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests if it exists
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle token expiration
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Initial state
const initialState = {
    token: localStorage.getItem('token'),
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null,
};

// Action types
const AUTH_ACTIONS = {
    USER_LOADED: 'USER_LOADED',
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    REGISTER_SUCCESS: 'REGISTER_SUCCESS',
    AUTH_ERROR: 'AUTH_ERROR',
    LOGOUT: 'LOGOUT',
    CLEAR_ERROR: 'CLEAR_ERROR',
    SET_LOADING: 'SET_LOADING',
};

// Reducer
const authReducer = (state, action) => {
    switch (action.type) {
        case AUTH_ACTIONS.USER_LOADED:
            return {
                ...state,
                isAuthenticated: true,
                user: action.payload,
                loading: false,
                error: null,
            };
        case AUTH_ACTIONS.LOGIN_SUCCESS:
        case AUTH_ACTIONS.REGISTER_SUCCESS:
            localStorage.setItem('token', action.payload.token);
            return {
                ...state,
                token: action.payload.token,
                isAuthenticated: true,
                user: action.payload.user,
                loading: false,
                error: null,
            };
        case AUTH_ACTIONS.AUTH_ERROR:
            localStorage.removeItem('token');
            return {
                ...state,
                token: null,
                isAuthenticated: false,
                user: null,
                loading: false,
                error: action.payload,
            };
        case AUTH_ACTIONS.LOGOUT:
            localStorage.removeItem('token');
            return {
                ...state,
                token: null,
                isAuthenticated: false,
                user: null,
                loading: false,
                error: null,
            };
        case AUTH_ACTIONS.CLEAR_ERROR:
            return {
                ...state,
                error: null,
            };
        case AUTH_ACTIONS.SET_LOADING:
            return {
                ...state,
                loading: action.payload,
            };
        default:
            return state;
    }
};

// Create context
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    // Load user on app start
    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('token');

            if (!token) {
                dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
                return;
            }

            try {
                // Check if token is expired
                const decoded = jwtDecode(token);
                const currentTime = Date.now() / 1000;

                if (decoded.exp < currentTime) {
                    localStorage.removeItem('token');
                    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
                    return;
                }

                const res = await api.get('/auth/me');
                dispatch({
                    type: AUTH_ACTIONS.USER_LOADED,
                    payload: res.data.user,
                });
            } catch (error) {
                localStorage.removeItem('token');
                dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
            }
        };

        loadUser();
    }, []);

    // Register user
    const register = useCallback(async (userData) => {
        try {
            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
            const res = await api.post('/auth/register', userData);
            dispatch({
                type: AUTH_ACTIONS.REGISTER_SUCCESS,
                payload: res.data,
            });
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.message || 'Registration failed';
            dispatch({
                type: AUTH_ACTIONS.AUTH_ERROR,
                payload: message,
            });
            return { success: false, error: message };
        }
    }, []);

    // Login user
    const login = useCallback(async (email, password) => {
        try {
            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
            const res = await api.post('/auth/login', { email, password });
            dispatch({
                type: AUTH_ACTIONS.LOGIN_SUCCESS,
                payload: res.data,
            });
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed';
            dispatch({
                type: AUTH_ACTIONS.AUTH_ERROR,
                payload: message,
            });
            return { success: false, error: message };
        }
    }, []);

    // Logout user
    const logout = useCallback(() => {
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }, []);

    // Update user profile
    const updateProfile = useCallback(async (profileData) => {
        try {
            // Create FormData if there's a file upload
            let data;
            let headers = {};

            if (profileData.photo instanceof File) {
                data = new FormData();
                Object.keys(profileData).forEach(key => {
                    if (key === 'photo') {
                        data.append('photo', profileData.photo);
                    } else {
                        data.append(key, profileData[key]);
                    }
                });
                // Don't set Content-Type for FormData, let browser set it with boundary
            } else {
                data = profileData;
                headers = { 'Content-Type': 'application/json' };
            }

            const res = await api.put('/users/profile', data, { headers });
            dispatch({
                type: AUTH_ACTIONS.USER_LOADED,
                payload: res.data.data,
            });
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.message || 'Profile update failed';
            return { success: false, error: message };
        }
    }, []);

    // Clear error
    const clearError = useCallback(() => {
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
    }, []);

    return (
        <AuthContext.Provider
            value={{
                token: state.token,
                isAuthenticated: state.isAuthenticated,
                user: state.user,
                loading: state.loading,
                error: state.error,
                register,
                login,
                logout,
                updateProfile,
                clearError,
                api,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export { AuthContext }; 