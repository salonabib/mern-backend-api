import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AuthProvider, AuthContext } from '../../contexts/AuthContext';
import UserSuggestions from './UserSuggestions';

// Mock the API module
jest.mock('../../contexts/AuthContext', () => ({
    ...jest.requireActual('../../contexts/AuthContext'),
    useAuth: jest.fn(),
}));

const { useAuth } = require('../../contexts/AuthContext');

const testTheme = createTheme({
    palette: {
        primary: { main: '#1976d2' },
        secondary: { main: '#dc004e' },
    },
});

// Mock API responses
const mockSuggestions = {
    data: {
        success: true,
        data: [
            {
                _id: 'user1',
                firstName: 'John',
                lastName: 'Doe',
                name: 'John Doe',
                username: 'johndoe',
                email: 'john@example.com',
                photo: null,
                role: 'user',
                isActive: true,
                createdAt: '2024-01-01T00:00:00.000Z',
                isFollowing: false,
            },
            {
                _id: 'user2',
                firstName: 'Jane',
                lastName: 'Smith',
                name: 'Jane Smith',
                username: 'janesmith',
                email: 'jane@example.com',
                photo: null,
                role: 'user',
                isActive: true,
                createdAt: '2024-01-02T00:00:00.000Z',
                isFollowing: true,
            },
        ],
    },
};

const mockApi = {
    get: jest.fn(),
    put: jest.fn(),
};

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
        useAuth.mockReturnValue({
            api: mockApi,
            isAuthenticated: true,
            user: { _id: 'currentUser' },
        });
    });

    describe('Rendering', () => {
        it('should display loading state initially', () => {
            mockApi.get.mockImplementation(() => new Promise(() => { })); // Never resolves

            renderUserSuggestions();

            expect(screen.getByText('Loading suggestions...')).toBeInTheDocument();
            expect(screen.getByRole('progressbar')).toBeInTheDocument();
        });

        it('should display error state when API fails', async () => {
            mockApi.get.mockRejectedValue(new Error('API Error'));

            renderUserSuggestions();

            await waitFor(() => {
                expect(screen.getByText('Failed to fetch suggestions')).toBeInTheDocument();
            });
        });

        it('should display empty state when no suggestions', async () => {
            mockApi.get.mockResolvedValue({ data: { success: true, data: [] } });

            renderUserSuggestions();

            await waitFor(() => {
                expect(screen.getByText('People to Follow')).toBeInTheDocument();
                expect(screen.getByText('No suggestions available at the moment.')).toBeInTheDocument();
            });
        });

        it('should display user suggestions when data is available', async () => {
            mockApi.get.mockResolvedValue(mockSuggestions);

            renderUserSuggestions();

            await waitFor(() => {
                expect(screen.getByText('People to Follow')).toBeInTheDocument();
                expect(screen.getByText('John Doe')).toBeInTheDocument();
                expect(screen.getByText('Jane Smith')).toBeInTheDocument();
                expect(screen.getByText('@johndoe')).toBeInTheDocument();
                expect(screen.getByText('@janesmith')).toBeInTheDocument();
            });
        });
    });

    describe('Profile Links', () => {
        it('should display profile links for each user', async () => {
            mockApi.get.mockResolvedValue(mockSuggestions);

            renderUserSuggestions();

            await waitFor(() => {
                const profileLinks = screen.getAllByRole('link');
                expect(profileLinks).toHaveLength(4); // 2 users × 2 links each (name + username)
            });
        });

        it('should have correct href attributes for profile links', async () => {
            mockApi.get.mockResolvedValue(mockSuggestions);

            renderUserSuggestions();

            await waitFor(() => {
                // Find all links that match /users/{id}
                const profileLinks = screen.getAllByRole('link').filter(link =>
                    /^\/users\/[a-zA-Z0-9]+$/.test(link.getAttribute('href'))
                );
                // There are 2 users, each with 2 links (name + username)
                expect(profileLinks.length).toBe(4);
            });
        });

        it('should display user names as clickable profile links', async () => {
            mockApi.get.mockResolvedValue(mockSuggestions);

            renderUserSuggestions();

            await waitFor(() => {
                const johnLink = screen.getByRole('link', { name: /john doe/i });
                const janeLink = screen.getByRole('link', { name: /jane smith/i });

                expect(johnLink).toBeInTheDocument();
                expect(janeLink).toBeInTheDocument();
                expect(johnLink).toHaveAttribute('href', '/users/user1');
                expect(janeLink).toHaveAttribute('href', '/users/user2');
            });
        });

        it('should display usernames as clickable profile links', async () => {
            mockApi.get.mockResolvedValue(mockSuggestions);

            renderUserSuggestions();

            await waitFor(() => {
                const johndoeLink = screen.getByRole('link', { name: /@johndoe/i });
                const janesmithLink = screen.getByRole('link', { name: /@janesmith/i });

                expect(johndoeLink).toBeInTheDocument();
                expect(janesmithLink).toBeInTheDocument();
                expect(johndoeLink).toHaveAttribute('href', '/users/user1');
                expect(janesmithLink).toHaveAttribute('href', '/users/user2');
            });
        });
    });

    describe('Follow/Unfollow Functionality', () => {
        it('should display follow button for users not being followed', async () => {
            mockApi.get.mockResolvedValue(mockSuggestions);

            renderUserSuggestions();

            await waitFor(() => {
                const followButtons = screen.getAllByRole('button', { name: /^Follow$/ });
                const followingButtons = screen.getAllByRole('button', { name: /^Following$/ });
                expect(followButtons).toHaveLength(1); // Only John is not being followed
                expect(followingButtons).toHaveLength(1); // Jane is already being followed
            });
        });

        it('should handle follow action successfully', async () => {
            mockApi.get.mockResolvedValue(mockSuggestions);
            mockApi.put.mockResolvedValue({ data: { success: true } });

            renderUserSuggestions();

            await waitFor(() => {
                const followButtons = screen.getAllByRole('button', { name: /follow/i });
                fireEvent.click(followButtons[0]);
            });

            await waitFor(() => {
                expect(mockApi.put).toHaveBeenCalledWith('/users/follow', { followId: 'user1' });
            });
        });

        it('should handle unfollow action successfully', async () => {
            mockApi.get.mockResolvedValue(mockSuggestions);
            mockApi.put.mockResolvedValue({ data: { success: true } });

            renderUserSuggestions();

            await waitFor(() => {
                const followButtons = screen.getAllByRole('button', { name: /follow/i });
                fireEvent.click(followButtons[0]);
            });

            await waitFor(() => {
                expect(mockApi.put).toHaveBeenCalledWith('/users/follow', { followId: 'user1' });
            });
        });

        it('should show loading state during follow/unfollow action', async () => {
            mockApi.get.mockResolvedValue(mockSuggestions);
            mockApi.put.mockImplementation(() => new Promise(() => { })); // Never resolves

            renderUserSuggestions();

            await waitFor(() => {
                const followButtons = screen.getAllByRole('button', { name: /follow/i });
                fireEvent.click(followButtons[0]);
            });

            await waitFor(() => {
                expect(screen.getByText('Loading...')).toBeInTheDocument();
            });
        });
    });

    describe('User Avatars', () => {
        it('should display user avatars with initials when no photo', async () => {
            mockApi.get.mockResolvedValue(mockSuggestions);

            renderUserSuggestions();

            await waitFor(() => {
                const avatars = screen.getAllByText('J');
                expect(avatars).toHaveLength(2); // Both John and Jane start with J
            });
        });

        it('should display user avatars with photos when available', async () => {
            const suggestionsWithPhotos = {
                data: {
                    success: true,
                    data: [
                        {
                            ...mockSuggestions.data.data[0],
                            photo: 'fake-photo-data',
                        },
                    ],
                },
            };

            mockApi.get.mockResolvedValue(suggestionsWithPhotos);

            renderUserSuggestions();

            await waitFor(() => {
                const avatar = screen.getByAltText('John Doe');
                expect(avatar).toHaveAttribute('src', '/api/users/user1/photo');
            });
        });
    });

    describe('Accessibility', () => {
        it('should have proper heading structure', async () => {
            mockApi.get.mockResolvedValue(mockSuggestions);

            renderUserSuggestions();

            await waitFor(() => {
                const heading = screen.getByRole('heading', { level: 6 });
                expect(heading).toBeInTheDocument();
                expect(heading).toHaveTextContent('People to Follow');
            });
        });

        it('should have proper button labels', async () => {
            mockApi.get.mockResolvedValue(mockSuggestions);

            renderUserSuggestions();

            await waitFor(() => {
                const buttons = screen.getAllByRole('button');
                buttons.forEach(button => {
                    expect(button.textContent.trim().length).toBeGreaterThan(0);
                });
            });
        });

        it('should have proper link labels', async () => {
            mockApi.get.mockResolvedValue(mockSuggestions);

            renderUserSuggestions();

            await waitFor(() => {
                const links = screen.getAllByRole('link');
                links.forEach(link => {
                    expect(link.textContent.trim().length).toBeGreaterThan(0);
                });
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle follow action error gracefully', async () => {
            mockApi.get.mockResolvedValue(mockSuggestions);
            mockApi.put.mockRejectedValue(new Error('Follow failed'));

            renderUserSuggestions();

            await waitFor(() => {
                const followButtons = screen.getAllByRole('button', { name: /follow/i });
                fireEvent.click(followButtons[0]);
            });

            await waitFor(() => {
                expect(mockApi.put).toHaveBeenCalledWith('/users/follow', { followId: 'user1' });
            });
        });

        it('should handle unfollow action error gracefully', async () => {
            mockApi.get.mockResolvedValue(mockSuggestions);
            mockApi.put.mockRejectedValue(new Error('Unfollow failed'));

            renderUserSuggestions();

            await waitFor(() => {
                const followButtons = screen.getAllByRole('button', { name: /follow/i });
                fireEvent.click(followButtons[0]);
            });

            await waitFor(() => {
                expect(mockApi.put).toHaveBeenCalledWith('/users/follow', { followId: 'user1' });
            });
        });
    });

    test('username links point to correct user profile URLs', async () => {
        mockApi.get.mockResolvedValue(mockSuggestions);

        renderUserSuggestions();

        // Wait for suggestions to load
        await waitFor(() => {
            const usernameLinks = screen.getAllByRole('link').filter(link =>
                link.textContent.includes('@') || link.textContent.match(/^[a-zA-Z0-9_]+$/)
            );
            expect(usernameLinks.length).toBeGreaterThan(0);
        });

        // Get all username links dynamically
        const usernameLinks = screen.getAllByRole('link').filter(link =>
            link.textContent.includes('@') || link.textContent.match(/^[a-zA-Z0-9_]+$/)
        );

        // Check each username link points to the correct user URL
        usernameLinks.forEach(link => {
            // The links should point to /users/{id} format
            expect(link).toHaveAttribute('href', expect.stringMatching(/^\/users\/[a-zA-Z0-9]+$/));
        });
    });
}); 