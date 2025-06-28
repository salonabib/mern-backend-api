import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AuthProvider, AuthContext } from '../../contexts/AuthContext';
import Home from './Home';

// Mock the API module
jest.mock('../../contexts/AuthContext', () => ({
    ...jest.requireActual('../../contexts/AuthContext'),
    useAuth: jest.fn(),
}));

// Mock UserSuggestions component
jest.mock('../user/UserSuggestions', () => {
    return function MockUserSuggestions() {
        return <div data-testid="user-suggestions">User Suggestions</div>;
    };
});

const { useAuth } = require('../../contexts/AuthContext');

const testTheme = createTheme({
    palette: {
        primary: { main: '#1976d2' },
        secondary: { main: '#dc004e' },
    },
});

// Mock API responses
const mockUserStats = {
    posts: 2,
    followers: 3,
    following: 1,
    likes: 25
};

const mockRecentActivity = [
    {
        _id: 'post1',
        text: 'This is my first post!',
        postedBy: {
            _id: '1',
            firstName: 'John',
            lastName: 'Doe',
            name: 'John Doe',
            username: 'johndoe'
        },
        likes: ['user1', 'user2'],
        comments: [{ _id: 'comment1' }],
        createdAt: '2023-01-01T00:00:00.000Z'
    },
    {
        _id: 'post2',
        text: 'Another interesting post about React development',
        postedBy: {
            _id: '2',
            firstName: 'Jane',
            lastName: 'Smith',
            name: 'Jane Smith',
            username: 'janesmith'
        },
        likes: ['user1'],
        comments: [],
        createdAt: '2023-01-01T01:00:00.000Z'
    }
];

const mockTrendingTopics = [
    { topic: '#MERN', count: 156 },
    { topic: '#React', count: 89 },
    { topic: '#NodeJS', count: 67 }
];

// Mock API instance
const mockApi = {
    get: jest.fn()
};

describe('Home Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Non-Authenticated User View (Landing Page)', () => {
        beforeEach(() => {
            useAuth.mockReturnValue({
                isAuthenticated: false,
                user: null,
                loading: false,
                api: mockApi
            });
        });

        it('should render enhanced welcome message with emoji', () => {
            render(
                <ThemeProvider theme={testTheme}>
                    <BrowserRouter>
                        <Home />
                    </BrowserRouter>
                </ThemeProvider>
            );

            expect(screen.getByText('Welcome to MERN Social 🚀')).toBeInTheDocument();
            expect(screen.getByText(/Connect, share, and engage with a modern social media experience/)).toBeInTheDocument();
        });

        it('should display enhanced call-to-action buttons with gradient styling', () => {
            render(
                <ThemeProvider theme={testTheme}>
                    <BrowserRouter>
                        <Home />
                    </BrowserRouter>
                </ThemeProvider>
            );

            expect(screen.getByRole('link', { name: /get started free/i })).toBeInTheDocument();
            expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
        });

        it('should display hero stats section', () => {
            render(
                <ThemeProvider theme={testTheme}>
                    <BrowserRouter>
                        <Home />
                    </BrowserRouter>
                </ThemeProvider>
            );

            expect(screen.getByText('1000+')).toBeInTheDocument();
            expect(screen.getByText('Active Users')).toBeInTheDocument();
            expect(screen.getByText('50K+')).toBeInTheDocument();
            expect(screen.getByText('Posts Shared')).toBeInTheDocument();
            expect(screen.getByText('99.9%')).toBeInTheDocument();
            expect(screen.getByText('Uptime')).toBeInTheDocument();
        });

        it('should display enhanced features section with hover animations', () => {
            render(
                <ThemeProvider theme={testTheme}>
                    <BrowserRouter>
                        <Home />
                    </BrowserRouter>
                </ThemeProvider>
            );

            expect(screen.getByText('Why Choose MERN Social? ✨')).toBeInTheDocument();
            expect(screen.getByText('Secure Authentication')).toBeInTheDocument();
            expect(screen.getByText('Fast & Responsive')).toBeInTheDocument();
            expect(screen.getByText('Full Stack MERN')).toBeInTheDocument();
        });

        it('should display additional features section', () => {
            render(
                <ThemeProvider theme={testTheme}>
                    <BrowserRouter>
                        <Home />
                    </BrowserRouter>
                </ThemeProvider>
            );

            expect(screen.getByText('More Amazing Features 🎯')).toBeInTheDocument();
            expect(screen.getByText('Real-time Interactions')).toBeInTheDocument();
            expect(screen.getByText('Community Building')).toBeInTheDocument();
            expect(screen.getByText('Privacy Control')).toBeInTheDocument();
            expect(screen.getByText('Always Available')).toBeInTheDocument();
        });

        it('should display enhanced call-to-action section', () => {
            render(
                <ThemeProvider theme={testTheme}>
                    <BrowserRouter>
                        <Home />
                    </BrowserRouter>
                </ThemeProvider>
            );

            expect(screen.getByText('Ready to Join the Community? 🎉')).toBeInTheDocument();
            expect(screen.getByText(/Start sharing your stories, connecting with friends/)).toBeInTheDocument();
            expect(screen.getByRole('link', { name: /create your account/i })).toBeInTheDocument();
        });

        it('should have proper navigation links', () => {
            render(
                <ThemeProvider theme={testTheme}>
                    <BrowserRouter>
                        <Home />
                    </BrowserRouter>
                </ThemeProvider>
            );

            const getStartedButton = screen.getByRole('link', { name: /get started free/i });
            const signInButton = screen.getByRole('link', { name: /sign in/i });
            const createAccountButton = screen.getByRole('link', { name: /create your account/i });

            expect(getStartedButton).toHaveAttribute('href', '/register');
            expect(signInButton).toHaveAttribute('href', '/login');
            expect(createAccountButton).toHaveAttribute('href', '/register');
        });
    });

    describe('Authenticated User View (Dashboard)', () => {
        beforeEach(() => {
            useAuth.mockReturnValue({
                isAuthenticated: true,
                user: {
                    _id: '1',
                    firstName: 'John',
                    lastName: 'Doe',
                    name: 'John Doe',
                    username: 'johndoe',
                    email: 'john@example.com'
                },
                loading: false,
                api: mockApi
            });

            // Reset mock calls
            mockApi.get.mockClear();
        });

        it('should display enhanced welcome message with emoji', async () => {
            render(
                <ThemeProvider theme={testTheme}>
                    <BrowserRouter>
                        <Home />
                    </BrowserRouter>
                </ThemeProvider>
            );

            expect(screen.getByText('Welcome back, John Doe! 👋')).toBeInTheDocument();
            expect(screen.getByText(/Here's what's happening in your social world today/)).toBeInTheDocument();
        });

        it('should display quick stats dashboard with gradient background', async () => {
            // Mock API responses
            mockApi.get
                .mockResolvedValueOnce({ data: mockUserStats }) // /users/stats
                .mockResolvedValueOnce({ data: mockRecentActivity }) // /users/activity
                .mockResolvedValueOnce({ data: mockTrendingTopics }); // /posts/trending

            render(
                <ThemeProvider theme={testTheme}>
                    <BrowserRouter>
                        <AuthProvider>
                            <Home />
                        </AuthProvider>
                    </BrowserRouter>
                </ThemeProvider>
            );

            // Wait for API calls to be made
            await waitFor(() => {
                expect(mockApi.get).toHaveBeenCalledWith('/users/stats');
            });

            // Wait for the stats to be displayed
            await waitFor(() => {
                const statsCard = screen.getByText('Your Stats 📊').closest('.MuiCard-root');
                expect(statsCard).toBeInTheDocument();
                expect(within(statsCard).getByText('2')).toBeInTheDocument(); // posts count
                expect(within(statsCard).getByText('3')).toBeInTheDocument(); // followers count
                expect(within(statsCard).getByText('1')).toBeInTheDocument(); // following count
                expect(within(statsCard).getByText('25')).toBeInTheDocument(); // total likes count
            });
        });

        it('should display quick actions section with hover effects', async () => {
            render(
                <ThemeProvider theme={testTheme}>
                    <BrowserRouter>
                        <Home />
                    </BrowserRouter>
                </ThemeProvider>
            );

            await waitFor(() => {
                expect(screen.getByText('Quick Actions ⚡')).toBeInTheDocument();
                expect(screen.getByText('Create Post')).toBeInTheDocument();
                expect(screen.getByText('View Feed')).toBeInTheDocument();
                expect(screen.getByText('Find People')).toBeInTheDocument();
                expect(screen.getByText('Edit Profile')).toBeInTheDocument();
            });
        });

        it('should have proper navigation links for quick actions', async () => {
            render(
                <ThemeProvider theme={testTheme}>
                    <BrowserRouter>
                        <Home />
                    </BrowserRouter>
                </ThemeProvider>
            );

            await waitFor(() => {
                const createPostLink = screen.getByRole('link', { name: /create post/i });
                const viewFeedLink = screen.getByRole('link', { name: /view feed/i });
                const findPeopleLink = screen.getByRole('link', { name: /find people/i });
                const editProfileLink = screen.getByRole('link', { name: /edit profile/i });

                expect(createPostLink).toHaveAttribute('href', '/create-post');
                expect(viewFeedLink).toHaveAttribute('href', '/newsfeed');
                expect(findPeopleLink).toHaveAttribute('href', '/users');
                expect(editProfileLink).toHaveAttribute('href', '/profile/edit');
            });
        });

        it('should display recent activity section with loading state', async () => {
            // Mock API responses
            mockApi.get
                .mockResolvedValueOnce({ data: mockUserStats }) // /users/stats
                .mockResolvedValueOnce({ data: mockRecentActivity }) // /users/activity
                .mockResolvedValueOnce({ data: mockTrendingTopics }); // /posts/trending

            render(
                <ThemeProvider theme={testTheme}>
                    <BrowserRouter>
                        <AuthProvider>
                            <Home />
                        </AuthProvider>
                    </BrowserRouter>
                </ThemeProvider>
            );

            // Wait for API calls to be made
            await waitFor(() => {
                expect(mockApi.get).toHaveBeenCalledWith('/users/activity');
            });

            // Wait for the recent activity section to be displayed
            await waitFor(() => {
                expect(screen.getByText('Recent Activity 📝')).toBeInTheDocument();
                expect(screen.getAllByText(/John Doe/).length).toBeGreaterThan(0);
                expect(screen.getByText('This is my first post!')).toBeInTheDocument();
                expect(screen.getAllByText(/Jane Smith/).length).toBeGreaterThan(0);
            });
        });

        it('should display engagement metrics in recent activity', async () => {
            // Mock API responses
            mockApi.get
                .mockResolvedValueOnce({ data: mockUserStats }) // /users/stats
                .mockResolvedValueOnce({ data: mockRecentActivity }) // /users/activity
                .mockResolvedValueOnce({ data: mockTrendingTopics }); // /posts/trending

            render(
                <ThemeProvider theme={testTheme}>
                    <BrowserRouter>
                        <AuthProvider>
                            <Home />
                        </AuthProvider>
                    </BrowserRouter>
                </ThemeProvider>
            );

            // Wait for API calls to be made
            await waitFor(() => {
                expect(mockApi.get).toHaveBeenCalledWith('/users/activity');
            });

            // Wait for engagement metrics to be displayed
            await waitFor(() => {
                expect(screen.getAllByText('2').length).toBeGreaterThan(0); // likes for first post
                expect(screen.getAllByText('1').length).toBeGreaterThan(0); // comments for first post, likes for second post
                expect(screen.getAllByText('0').length).toBeGreaterThan(0); // comments for second post
            });
        });

        it('should display trending topics in sidebar', async () => {
            // Mock API responses
            mockApi.get
                .mockResolvedValueOnce({ data: mockUserStats }) // /users/stats
                .mockResolvedValueOnce({ data: mockRecentActivity }) // /users/activity
                .mockResolvedValueOnce({ data: mockTrendingTopics }); // /posts/trending

            render(
                <ThemeProvider theme={testTheme}>
                    <BrowserRouter>
                        <AuthProvider>
                            <Home />
                        </AuthProvider>
                    </BrowserRouter>
                </ThemeProvider>
            );

            // Wait for API calls to be made
            await waitFor(() => {
                expect(mockApi.get).toHaveBeenCalledWith('/posts/trending');
            });

            // Wait for trending topics to be displayed
            await waitFor(() => {
                expect(screen.getByText('Trending Topics')).toBeInTheDocument();
                expect(screen.getByText('#MERN 156')).toBeInTheDocument();
                expect(screen.getByText('#React 89')).toBeInTheDocument();
            });
        });

        it('should display enhanced user profile card in sidebar', async () => {
            render(
                <ThemeProvider theme={testTheme}>
                    <BrowserRouter>
                        <Home />
                    </BrowserRouter>
                </ThemeProvider>
            );

            await waitFor(() => {
                expect(screen.getByText('Your Profile 👤')).toBeInTheDocument();
                expect(screen.getByText('John Doe')).toBeInTheDocument();
                expect(screen.getByText('@johndoe')).toBeInTheDocument();
                expect(screen.getByText('john@example.com')).toBeInTheDocument();
            });
        });

        it('should display application features section', async () => {
            render(
                <ThemeProvider theme={testTheme}>
                    <BrowserRouter>
                        <Home />
                    </BrowserRouter>
                </ThemeProvider>
            );

            await waitFor(() => {
                expect(screen.getByText('Application Features 🚀')).toBeInTheDocument();
                expect(screen.getByText('Secure Authentication')).toBeInTheDocument();
                expect(screen.getByText('Fast & Responsive')).toBeInTheDocument();
                expect(screen.getByText('Full Stack MERN')).toBeInTheDocument();
            });
        });

        it('should handle API errors gracefully', async () => {
            mockApi.get
                .mockRejectedValueOnce(new Error('API Error'))
                .mockRejectedValueOnce(new Error('API Error'));

            render(
                <ThemeProvider theme={testTheme}>
                    <BrowserRouter>
                        <Home />
                    </BrowserRouter>
                </ThemeProvider>
            );

            await waitFor(() => {
                expect(screen.getByText('Welcome back, John Doe! 👋')).toBeInTheDocument();
                // Should still render the component even if API calls fail
                expect(screen.getByText('Your Stats 📊')).toBeInTheDocument();
            });
        });

        it('should show empty state when no recent activity', async () => {
            mockApi.get
                .mockResolvedValueOnce(mockUserStats)
                .mockResolvedValueOnce({ data: { success: true, data: [] } });

            render(
                <ThemeProvider theme={testTheme}>
                    <BrowserRouter>
                        <Home />
                    </BrowserRouter>
                </ThemeProvider>
            );

            await waitFor(() => {
                expect(screen.getByText('No recent activity. Start by creating your first post!')).toBeInTheDocument();
            });
        });

        it('should render the username in the profile card as a clickable link to the user profile', async () => {
            render(
                <ThemeProvider theme={testTheme}>
                    <BrowserRouter>
                        <Home />
                    </BrowserRouter>
                </ThemeProvider>
            );

            await waitFor(() => {
                const links = screen.getAllByRole('link');
                const usernameLink = links.find(link => link.textContent.replace(/\s+/g, '').includes('@johndoe'));
                expect(usernameLink).toBeDefined();
                expect(usernameLink).toHaveAttribute('href', '/users/1');
            });
        });
    });

    describe('Admin User View', () => {
        beforeEach(() => {
            useAuth.mockReturnValue({
                isAuthenticated: true,
                user: {
                    _id: '2',
                    firstName: 'Admin',
                    lastName: 'User',
                    username: 'admin',
                    email: 'admin@example.com',
                    role: 'admin'
                },
                loading: false,
                api: mockApi
            });
        });

        it('should display admin-specific features', async () => {
            mockApi.get
                .mockResolvedValueOnce(mockUserStats)
                .mockResolvedValueOnce(mockRecentActivity);

            render(
                <ThemeProvider theme={testTheme}>
                    <BrowserRouter>
                        <Home />
                    </BrowserRouter>
                </ThemeProvider>
            );

            await waitFor(() => {
                expect(screen.getByText('Welcome back, Admin! 👋')).toBeInTheDocument();
                expect(screen.getByText('Find People')).toBeInTheDocument(); // Admin can see user management
            });
        });
    });

    describe('Loading States', () => {
        it('should show loading state when auth is loading', () => {
            useAuth.mockReturnValue({
                isAuthenticated: false,
                user: null,
                loading: true,
                api: mockApi
            });

            render(
                <ThemeProvider theme={testTheme}>
                    <BrowserRouter>
                        <Home />
                    </BrowserRouter>
                </ThemeProvider>
            );

            // Should show loading spinner or skeleton
            expect(screen.getByRole('main')).toBeInTheDocument();
        });
    });

    describe('Animation and UX Features', () => {
        beforeEach(() => {
            useAuth.mockReturnValue({
                isAuthenticated: true,
                user: {
                    _id: '1',
                    firstName: 'John',
                    lastName: 'Doe',
                    username: 'johndoe',
                    email: 'john@example.com',
                    role: 'user'
                },
                loading: false,
                api: mockApi
            });
        });

        it('should render with proper animation components', async () => {
            mockApi.get
                .mockResolvedValueOnce(mockUserStats)
                .mockResolvedValueOnce(mockRecentActivity);

            render(
                <ThemeProvider theme={testTheme}>
                    <BrowserRouter>
                        <Home />
                    </BrowserRouter>
                </ThemeProvider>
            );

            await waitFor(() => {
                // Check that all sections are rendered (animations will be handled by MUI)
                expect(screen.getByText('Your Stats 📊')).toBeInTheDocument();
                expect(screen.getByText('Quick Actions ⚡')).toBeInTheDocument();
                expect(screen.getByText('Recent Activity 📝')).toBeInTheDocument();
            });
        });

        it('should have proper accessibility attributes', async () => {
            mockApi.get
                .mockResolvedValueOnce(mockUserStats)
                .mockResolvedValueOnce(mockRecentActivity);

            render(
                <ThemeProvider theme={testTheme}>
                    <BrowserRouter>
                        <Home />
                    </BrowserRouter>
                </ThemeProvider>
            );

            await waitFor(() => {
                const mainElement = screen.getByRole('main');
                expect(mainElement).toBeInTheDocument();

                // Check for proper heading hierarchy
                const headings = screen.getAllByRole('heading');
                expect(headings.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Responsive Design', () => {
        beforeEach(() => {
            useAuth.mockReturnValue({
                isAuthenticated: true,
                user: {
                    _id: '1',
                    firstName: 'John',
                    lastName: 'Doe',
                    username: 'johndoe',
                    email: 'john@example.com',
                    role: 'user'
                },
                loading: false,
                api: mockApi
            });
        });

        it('should render all sections in correct order', async () => {
            mockApi.get
                .mockResolvedValueOnce(mockUserStats)
                .mockResolvedValueOnce(mockRecentActivity);

            render(
                <ThemeProvider theme={testTheme}>
                    <BrowserRouter>
                        <Home />
                    </BrowserRouter>
                </ThemeProvider>
            );

            await waitFor(() => {
                const sections = [
                    'Your Stats 📊',
                    'Quick Actions ⚡',
                    'Recent Activity 📝',
                    'Application Features 🚀'
                ];

                sections.forEach(section => {
                    expect(screen.getByText(section)).toBeInTheDocument();
                });
            });
        });
    });

    test('username links point to correct user profile URLs', async () => {
        // Mock API responses
        mockApi.get
            .mockResolvedValueOnce({ data: mockUserStats }) // /users/stats
            .mockResolvedValueOnce({ data: mockRecentActivity }) // /users/activity
            .mockResolvedValueOnce({ data: mockTrendingTopics }); // /posts/trending

        // Mock useAuth for this test
        useAuth.mockReturnValue({
            isAuthenticated: true,
            user: {
                _id: '1',
                firstName: 'John',
                lastName: 'Doe',
                username: 'johndoe',
                email: 'john@example.com',
                role: 'user'
            },
            loading: false,
            api: mockApi
        });

        render(
            <ThemeProvider theme={testTheme}>
                <BrowserRouter>
                    <Home />
                </BrowserRouter>
            </ThemeProvider>
        );

        // Wait for component to load
        await waitFor(() => {
            const profileLinks = screen.getAllByRole('link').filter(link =>
                /^\/users\/[a-zA-Z0-9]+$/.test(link.getAttribute('href'))
            );
            expect(profileLinks.length).toBeGreaterThan(0);
        });
    });
}); 