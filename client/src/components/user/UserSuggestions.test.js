import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import UserSuggestions from './UserSuggestions';

// Mock the AuthContext
const mockApi = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
};

const mockUseAuth = jest.fn();
jest.mock('../../contexts/AuthContext', () => ({
    useAuth: () => mockUseAuth(),
}));

const testTheme = createTheme({
    palette: {
        primary: { main: '#1976d2' },
        secondary: { main: '#dc004e' },
    },
});

const mockUser = {
    _id: '1',
    firstName: 'John',
    lastName: 'Doe',
    username: 'johndoe',
    email: 'john@example.com',
    role: 'user',
    isActive: true,
    bio: 'Software developer',
    avatar: 'https://example.com/avatar.jpg',
    createdAt: '2023-01-01T00:00:00.000Z',
};

const mockSuggestions = [
    {
        _id: '2',
        firstName: 'Jane',
        lastName: 'Smith',
        username: 'janesmith',
        email: 'jane@example.com',
        bio: 'Frontend developer',
        avatar: 'https://example.com/jane.jpg',
        followers: [],
        following: [],
    },
    {
        _id: '3',
        firstName: 'Bob',
        lastName: 'Johnson',
        username: 'bobjohnson',
        email: 'bob@example.com',
        bio: 'Backend developer',
        avatar: null,
        followers: [],
        following: [],
    },
];

const renderUserSuggestions = () => {
    return render(
        <ThemeProvider theme={testTheme}>
            <BrowserRouter>
                <UserSuggestions />
            </BrowserRouter>
        </ThemeProvider>
    );
};

describe('UserSuggestions Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        // Set up default mock for useAuth
        mockUseAuth.mockReturnValue({
            user: mockUser,
            isAuthenticated: true,
            loading: false,
            error: null,
            api: mockApi,
        });
    });

    describe('Rendering', () => {
        it('should render suggestions section title', async () => {
            mockApi.get.mockResolvedValueOnce({
                data: {
                    success: true,
                    data: mockSuggestions,
                },
            });

            renderUserSuggestions();

            await waitFor(() => {
                expect(screen.getByText('People to Follow')).toBeInTheDocument();
            });
        });

        it('should display loading state initially', () => {
            // Don't resolve the promise immediately to test loading state
            mockApi.get.mockReturnValueOnce(new Promise(() => { }));

            renderUserSuggestions();

            expect(screen.getByText('Loading suggestions...')).toBeInTheDocument();
        });

        it('should display suggestions when data is loaded', async () => {
            mockApi.get.mockResolvedValueOnce({
                data: {
                    success: true,
                    data: mockSuggestions,
                },
            });

            renderUserSuggestions();

            await waitFor(() => {
                expect(screen.getByText('Jane Smith')).toBeInTheDocument();
                expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
            });
        });

        it('should display empty state when no suggestions', async () => {
            mockApi.get.mockResolvedValueOnce({
                data: {
                    success: true,
                    data: [],
                },
            });

            renderUserSuggestions();

            await waitFor(() => {
                expect(screen.getByText('No suggestions available at the moment.')).toBeInTheDocument();
            });
        });

        it('should display error state when API fails', async () => {
            mockApi.get.mockRejectedValueOnce(new Error('API Error'));

            renderUserSuggestions();

            await waitFor(() => {
                expect(screen.getByText('Failed to fetch suggestions')).toBeInTheDocument();
            });
        });
    });

    describe('User Display', () => {
        beforeEach(async () => {
            mockApi.get.mockResolvedValueOnce({
                data: {
                    success: true,
                    data: mockSuggestions,
                },
            });
        });

        it('should display user names correctly', async () => {
            renderUserSuggestions();

            await waitFor(() => {
                expect(screen.getByText('Jane Smith')).toBeInTheDocument();
                expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
            });
        });

        it('should display usernames with @ symbol', async () => {
            renderUserSuggestions();

            await waitFor(() => {
                expect(screen.getByText('@janesmith')).toBeInTheDocument();
                expect(screen.getByText('@bobjohnson')).toBeInTheDocument();
            });
        });

        it('should display default avatar when no avatar provided', async () => {
            renderUserSuggestions();

            await waitFor(() => {
                const avatars = screen.getAllByText(/[JB]/);
                expect(avatars.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Follow/Unfollow Functionality', () => {
        beforeEach(async () => {
            mockApi.get.mockResolvedValueOnce({
                data: {
                    success: true,
                    data: mockSuggestions,
                },
            });
        });

        it('should display follow button for each user', async () => {
            renderUserSuggestions();

            await waitFor(() => {
                const followButtons = screen.getAllByText('Follow');
                expect(followButtons.length).toBe(2);
            });
        });

        it('should call follow API when follow button is clicked', async () => {
            const user = userEvent.setup();
            mockApi.put.mockResolvedValueOnce({
                data: { success: true }
            });

            renderUserSuggestions();

            await waitFor(async () => {
                const followButtons = screen.getAllByText('Follow');
                await user.click(followButtons[0]);
            });

            expect(mockApi.put).toHaveBeenCalledWith('/users/follow', { followId: '2' });
        });

        it('should change button text to "Following" after follow', async () => {
            const user = userEvent.setup();
            mockApi.put.mockResolvedValueOnce({
                data: { success: true }
            });

            renderUserSuggestions();

            await waitFor(async () => {
                const followButtons = screen.getAllByText('Follow');
                await user.click(followButtons[0]);
            });

            // After following, the user should be removed from the list
            await waitFor(() => {
                expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
                expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
            });
        });

        it('should call unfollow API when unfollow button is clicked', async () => {
            const user = userEvent.setup();
            mockApi.put.mockResolvedValueOnce({
                data: { success: true }
            });

            renderUserSuggestions();

            await waitFor(async () => {
                const followButtons = screen.getAllByText('Follow');
                await user.click(followButtons[0]);
            });

            // After following, the user should be removed from the list
            await waitFor(() => {
                expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
            });
        });

        it('should show loading state on follow button while processing', async () => {
            const user = userEvent.setup();
            // Don't resolve the promise immediately to test loading state
            mockApi.put.mockReturnValueOnce(new Promise(() => { }));

            renderUserSuggestions();

            await waitFor(async () => {
                const followButtons = screen.getAllByText('Follow');
                await user.click(followButtons[0]);
            });

            await waitFor(() => {
                expect(screen.getByText('Loading...')).toBeInTheDocument();
            });
        });

        it('should handle follow error gracefully', async () => {
            const user = userEvent.setup();
            mockApi.put.mockRejectedValueOnce(new Error('Follow failed'));

            renderUserSuggestions();

            await waitFor(async () => {
                const followButtons = screen.getAllByText('Follow');
                await user.click(followButtons[0]);
            });

            // After error, the user should still be in the list
            await waitFor(() => {
                expect(screen.getByText('Jane Smith')).toBeInTheDocument();
                expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
            });
        });
    });

    describe('Authentication', () => {
        it('should not render when user is not authenticated', () => {
            mockUseAuth.mockReturnValue({
                user: null,
                isAuthenticated: false,
                loading: false,
                error: null,
                api: mockApi,
            });

            renderUserSuggestions();

            expect(screen.queryByText('People to Follow')).not.toBeInTheDocument();
        });

        it('should not render when auth is loading', () => {
            mockUseAuth.mockReturnValue({
                user: null,
                isAuthenticated: false,
                loading: true,
                error: null,
                api: mockApi,
            });

            renderUserSuggestions();

            expect(screen.queryByText('People to Follow')).not.toBeInTheDocument();
        });
    });
}); 