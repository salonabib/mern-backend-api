import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import UserDetail from './UserDetail';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock useParams
const mockUseParams = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useParams: () => mockUseParams(),
}));

// Mock the API
const mockApi = {
    get: jest.fn(),
};

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
            api: mockApi,
            isAuthenticated: true,
        });
        mockApi.get.mockResolvedValue({
            data: { user: mockUser }
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
            const usernameLink = links.find(link => link.textContent.replace(/\s+/g, '').includes('@johndoe'));
            expect(usernameLink).toBeDefined();
            expect(usernameLink).toHaveAttribute('href', '/users/user789');
        });
    });
}); 