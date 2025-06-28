import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import UserDetail from './UserDetail';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock axios
jest.mock('axios');

// Mock useParams
const mockUseParams = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useParams: () => mockUseParams(),
}));

// Mock localStorage
const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
});

const mockUseAuth = jest.fn();
jest.mock('../../contexts/AuthContext', () => ({
    ...jest.requireActual('../../contexts/AuthContext'),
    useAuth: () => mockUseAuth(),
}));

const testTheme = createTheme();

const mockUser = {
    _id: 'user789',
    firstName: 'Emily',
    lastName: 'Clark',
    name: 'Emily Clark',
    username: 'emilyclark',
    email: 'emily@example.com',
    role: 'user',
    isActive: true,
    avatar: '',
    bio: 'Bio here',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('UserDetail Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseParams.mockReturnValue({ id: 'user789' });
        mockUseAuth.mockReturnValue({
            user: mockUser,
            isAuthenticated: true,
        });
        mockLocalStorage.getItem.mockReturnValue('fake-token');

        // Mock axios.get
        const axios = require('axios');
        axios.get.mockResolvedValue({
            data: {
                success: true,
                data: mockUser
            }
        });
    });

    it('should render the username as a clickable link to the user profile', async () => {
        render(
            <ThemeProvider theme={testTheme}>
                <BrowserRouter>
                    <AuthProvider>
                        <UserDetail />
                    </AuthProvider>
                </BrowserRouter>
            </ThemeProvider>
        );

        await waitFor(() => {
            const links = screen.getAllByRole('link');
            const usernameLink = links.find(link => link.textContent.replace(/\s+/g, '').includes('@emilyclark'));
            expect(usernameLink).toBeDefined();
            expect(usernameLink).toHaveAttribute('href', '/users/user789');
        });
    });

    test('username links point to correct user profile URLs', async () => {
        render(
            <BrowserRouter>
                <AuthProvider>
                    <UserDetail />
                </AuthProvider>
            </BrowserRouter>
        );

        // Wait for user data to load
        await waitFor(() => {
            const profileLinks = screen.getAllByRole('link').filter(link =>
                /^\/users\/[a-zA-Z0-9]+$/.test(link.getAttribute('href'))
            );
            expect(profileLinks.length).toBeGreaterThan(0);
        });
    });
}); 