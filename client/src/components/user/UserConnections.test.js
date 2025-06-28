import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import UserConnections from './UserConnections';

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

const mockFollowers = [
    {
        _id: '2',
        firstName: 'Jane',
        lastName: 'Smith',
        username: 'janesmith',
        email: 'jane@example.com',
        bio: 'Frontend developer',
        avatar: 'https://example.com/jane.jpg',
    },
    {
        _id: '3',
        firstName: 'Bob',
        lastName: 'Johnson',
        username: 'bobjohnson',
        email: 'bob@example.com',
        bio: 'Backend developer',
        avatar: null,
    },
];

const mockFollowing = [
    {
        _id: '4',
        firstName: 'Alice',
        lastName: 'Brown',
        username: 'alicebrown',
        email: 'alice@example.com',
        bio: 'Designer',
        avatar: 'https://example.com/alice.jpg',
    },
];

const renderUserConnections = (userId = '1') => {
    return render(
        <ThemeProvider theme={testTheme}>
            <BrowserRouter>
                <UserConnections userId={userId} />
            </BrowserRouter>
        </ThemeProvider>
    );
};

// Mock the API calls
jest.mock('axios', () => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
}));

describe('UserConnections Component', () => {
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
        it('should render connections section title', async () => {
            mockApi.get.mockResolvedValueOnce({
                data: { data: mockFollowers }
            }).mockResolvedValueOnce({
                data: { data: mockFollowing }
            });

            renderUserConnections();

            await waitFor(() => {
                expect(screen.getByText('Connections')).toBeInTheDocument();
            });
        });

        it('should display tabs for followers and following', async () => {
            mockApi.get.mockResolvedValueOnce({
                data: { data: mockFollowers }
            }).mockResolvedValueOnce({
                data: { data: mockFollowing }
            });

            renderUserConnections();

            await waitFor(() => {
                expect(screen.getByText('Followers (2)')).toBeInTheDocument();
                expect(screen.getByText('Following (1)')).toBeInTheDocument();
            });
        });

        it('should show followers tab as active by default', async () => {
            mockApi.get.mockResolvedValueOnce({
                data: { data: mockFollowers }
            }).mockResolvedValueOnce({
                data: { data: mockFollowing }
            });

            renderUserConnections();

            await waitFor(() => {
                const followersTab = screen.getByText('Followers (2)');
                expect(followersTab.closest('[role="tab"]')).toHaveAttribute('aria-selected', 'true');
            });
        });

        it('should display loading state initially', () => {
            renderUserConnections();

            expect(screen.getByText('Loading connections...')).toBeInTheDocument();
        });
    });

    describe('Followers Tab', () => {
        it('should display followers when data is loaded', async () => {
            mockApi.get.mockResolvedValueOnce({
                data: { data: mockFollowers }
            }).mockResolvedValueOnce({
                data: { data: mockFollowing }
            });

            renderUserConnections();

            await waitFor(() => {
                expect(screen.getByText('Jane Smith')).toBeInTheDocument();
                expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
            });
        });

        it('should display follower usernames', async () => {
            mockApi.get.mockResolvedValueOnce({
                data: { data: mockFollowers }
            }).mockResolvedValueOnce({
                data: { data: mockFollowing }
            });

            renderUserConnections();

            await waitFor(() => {
                expect(screen.getByText('@janesmith')).toBeInTheDocument();
                expect(screen.getByText('@bobjohnson')).toBeInTheDocument();
            });
        });

        it('should display follower avatars', async () => {
            mockApi.get.mockResolvedValueOnce({
                data: { data: mockFollowers }
            }).mockResolvedValueOnce({
                data: { data: mockFollowing }
            });

            renderUserConnections();

            await waitFor(() => {
                // Check for avatar initials instead of alt text
                expect(screen.getByText('J')).toBeInTheDocument();
                expect(screen.getByText('B')).toBeInTheDocument();
            });
        });

        it('should display default avatar for followers without photos', async () => {
            mockApi.get.mockResolvedValueOnce({
                data: { data: mockFollowers }
            }).mockResolvedValueOnce({
                data: { data: mockFollowing }
            });

            renderUserConnections();

            await waitFor(() => {
                // Bob has no avatar, should show initial
                expect(screen.getByText('B')).toBeInTheDocument();
            });
        });

        it('should display empty state when no followers', async () => {
            // Mock both API calls - first for followers (empty), second for following
            mockApi.get.mockResolvedValueOnce({
                data: { data: [] }
            }).mockResolvedValueOnce({
                data: { data: mockFollowing }
            });

            renderUserConnections();

            await waitFor(() => {
                expect(screen.getByText('No followers yet.')).toBeInTheDocument();
            });
        });

        it('should display error state when API fails', async () => {
            // Mock the first API call to fail
            mockApi.get.mockRejectedValueOnce(new Error('API Error'));

            renderUserConnections();

            await waitFor(() => {
                expect(screen.getByText('Failed to fetch connections')).toBeInTheDocument();
            });
        });

        it('should render usernames as clickable links to user profiles', async () => {
            mockApi.get.mockResolvedValueOnce({
                data: { data: mockFollowers }
            }).mockResolvedValueOnce({
                data: { data: mockFollowing }
            });

            renderUserConnections();

            await waitFor(() => {
                const links = screen.getAllByRole('link');
                const usernameLinks = links.filter(link =>
                    link.textContent.replace(/\s+/g, '').includes('@janesmith') ||
                    link.textContent.replace(/\s+/g, '').includes('@bobjohnson')
                );

                expect(usernameLinks.length).toBeGreaterThan(0);

                // Check that at least one username link has the correct href
                const janeLink = usernameLinks.find(link =>
                    link.textContent.replace(/\s+/g, '').includes('@janesmith')
                );
                if (janeLink) {
                    expect(janeLink).toHaveAttribute('href', '/users/2');
                }
            });
        });

        it('should display follow/unfollow buttons for followers', async () => {
            mockApi.get.mockResolvedValueOnce({
                data: { data: mockFollowers }
            }).mockResolvedValueOnce({
                data: { data: mockFollowing }
            });

            renderUserConnections();

            await waitFor(() => {
                expect(screen.getByText('Follow')).toBeInTheDocument();
                expect(screen.getByText('Unfollow')).toBeInTheDocument();
            });
        });
    });

    describe('Following Tab', () => {
        it('should switch to following tab when clicked', async () => {
            mockApi.get.mockResolvedValueOnce({
                data: { data: mockFollowers }
            }).mockResolvedValueOnce({
                data: { data: mockFollowing }
            });

            const user = userEvent.setup();
            renderUserConnections();

            await waitFor(async () => {
                const followingTab = screen.getByText('Following (1)');
                await user.click(followingTab);
            });

            await waitFor(() => {
                expect(screen.getByText('Alice Brown')).toBeInTheDocument();
            });
        });

        it('should display following count', async () => {
            mockApi.get.mockResolvedValueOnce({
                data: { data: mockFollowers }
            }).mockResolvedValueOnce({
                data: { data: mockFollowing }
            });

            renderUserConnections();

            await waitFor(() => {
                expect(screen.getByText('Following (1)')).toBeInTheDocument();
            });
        });

        it('should display empty state when not following anyone', async () => {
            // Clear previous mocks and set up new ones for this test
            jest.clearAllMocks();
            mockUseAuth.mockReturnValue({
                user: mockUser,
                isAuthenticated: true,
                loading: false,
                error: null,
                api: mockApi,
            });

            // Mock both API calls - first for followers, second for following (empty)
            mockApi.get.mockResolvedValueOnce({
                data: { data: mockFollowers }
            }).mockResolvedValueOnce({
                data: { data: [] }
            });

            const user = userEvent.setup();
            renderUserConnections();

            // Wait for initial load, then click following tab
            await waitFor(async () => {
                const followingTab = screen.getByText('Following (0)');
                await user.click(followingTab);
            });

            await waitFor(() => {
                expect(screen.getByText('No following yet.')).toBeInTheDocument();
            });
        });

        it('should display unfollow button for following users', async () => {
            mockApi.get.mockResolvedValueOnce({
                data: { data: mockFollowers }
            }).mockResolvedValueOnce({
                data: { data: mockFollowing }
            });

            const user = userEvent.setup();
            renderUserConnections();

            await waitFor(async () => {
                const followingTab = screen.getByText('Following (1)');
                await user.click(followingTab);
            });

            await waitFor(() => {
                expect(screen.getByText('Unfollow')).toBeInTheDocument();
            });
        });

        it('should call unfollowUser when unfollow button is clicked', async () => {
            mockApi.get.mockResolvedValueOnce({
                data: { data: mockFollowers }
            }).mockResolvedValueOnce({
                data: { data: mockFollowing }
            });

            const user = userEvent.setup();
            mockApi.put.mockResolvedValueOnce({ success: true });

            renderUserConnections();

            await waitFor(async () => {
                const followingTab = screen.getByText('Following (1)');
                await user.click(followingTab);
            });

            await waitFor(async () => {
                const unfollowButton = screen.getByText('Unfollow');
                await user.click(unfollowButton);
            });

            expect(mockApi.put).toHaveBeenCalledWith('/users/unfollow', { unfollowId: '4' });
        });
    });

    describe('Tab Switching', () => {
        it('should switch between followers and following tabs', async () => {
            mockApi.get.mockResolvedValueOnce({
                data: { data: mockFollowers }
            }).mockResolvedValueOnce({
                data: { data: mockFollowing }
            });

            const user = userEvent.setup();
            renderUserConnections();

            // Initially on followers tab
            await waitFor(() => {
                expect(screen.getByText('Jane Smith')).toBeInTheDocument();
            });

            // Switch to following tab
            await waitFor(async () => {
                const followingTab = screen.getByText('Following (1)');
                await user.click(followingTab);
            });

            await waitFor(() => {
                expect(screen.getByText('Alice Brown')).toBeInTheDocument();
            });
        });
    });
}); 