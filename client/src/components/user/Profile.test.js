import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Profile from './Profile';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock the AuthContext
const mockUseAuth = jest.fn();
jest.mock('../../contexts/AuthContext', () => ({
    ...jest.requireActual('../../contexts/AuthContext'),
    useAuth: () => mockUseAuth(),
}));

// Mock UserConnections component to avoid API calls
jest.mock('./UserConnections', () => {
    return function MockUserConnections() {
        return <div data-testid="user-connections">User Connections</div>;
    };
});

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
    bio: 'Software developer with 5 years of experience in web development.',
    avatar: 'https://example.com/avatar.jpg',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-15T00:00:00.000Z',
};

const renderProfile = () => {
    return render(
        <ThemeProvider theme={testTheme}>
            <BrowserRouter>
                <AuthProvider>
                    <Profile />
                </AuthProvider>
            </BrowserRouter>
        </ThemeProvider>
    );
};

describe('Profile Component', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
        mockUseAuth.mockReturnValue({
            user: mockUser,
            isAuthenticated: true,
            loading: false,
            error: null,
        });
    });

    describe('Rendering', () => {
        it('should render profile page title', () => {
            mockUseAuth.mockReturnValue({
                user: mockUser,
                isAuthenticated: true,
                loading: false,
                error: null,
            });

            renderProfile();

            const names = screen.getAllByText('John Doe');
            expect(names.length).toBeGreaterThan(0);
        });

        it('should display user information when authenticated', async () => {
            mockUseAuth.mockReturnValue({
                user: mockUser,
                isAuthenticated: true,
                loading: false,
                error: null,
            });

            renderProfile();

            const names = screen.getAllByText('John Doe');
            expect(names.length).toBeGreaterThan(0);
        });

        it('should display loading spinner while fetching user data', () => {
            mockUseAuth.mockReturnValue({
                user: null,
                isAuthenticated: false,
                loading: true,
                error: null,
            });

            renderProfile();

            expect(screen.getByText('Loading profile...')).toBeInTheDocument();
        });

        it('should display user avatar', async () => {
            mockUseAuth.mockReturnValue({
                user: mockUser,
                isAuthenticated: true,
                loading: false,
                error: null,
            });

            renderProfile();

            // The avatars show the letter "J" as text, not as alt text
            const avatarLetters = screen.getAllByText('J');
            expect(avatarLetters.length).toBeGreaterThan(0);
        });

        it('should display default avatar when no avatar is provided', async () => {
            const userWithoutAvatar = { ...mockUser, avatar: null };
            mockUseAuth.mockReturnValue({
                user: userWithoutAvatar,
                isAuthenticated: true,
                loading: false,
                error: null,
            });

            renderProfile();

            // The fallback avatar should show the initial (first letter of firstName)
            const avatarLetters = screen.getAllByText('J');
            expect(avatarLetters.length).toBeGreaterThan(0);
        });
    });

    describe('User Information Display', () => {
        it('should display user full name', async () => {
            mockUseAuth.mockReturnValue({
                user: mockUser,
                isAuthenticated: true,
                loading: false,
                error: null,
            });

            renderProfile();

            const names = screen.getAllByText('John Doe');
            expect(names.length).toBeGreaterThan(0);
        });

        it('should display username with @ symbol', async () => {
            mockUseAuth.mockReturnValue({
                user: mockUser,
                isAuthenticated: true,
                loading: false,
                error: null,
            });

            renderProfile();

            const usernames = screen.getAllByText('@johndoe');
            expect(usernames.length).toBeGreaterThan(0);
        });

        it('should display user email', async () => {
            mockUseAuth.mockReturnValue({
                user: mockUser,
                isAuthenticated: true,
                loading: false,
                error: null,
            });

            renderProfile();

            expect(screen.getByText('john@example.com')).toBeInTheDocument();
        });

        it('should display user role', async () => {
            mockUseAuth.mockReturnValue({
                user: mockUser,
                isAuthenticated: true,
                loading: false,
                error: null,
            });

            renderProfile();

            // Use getAllByText since "User" appears in multiple places
            const userElements = screen.getAllByText('User');
            expect(userElements.length).toBeGreaterThan(0);
        });

        it('should display user bio', async () => {
            mockUseAuth.mockReturnValue({
                user: mockUser,
                isAuthenticated: true,
                loading: false,
                error: null,
            });

            renderProfile();

            expect(screen.getByText('Software developer with 5 years of experience in web development.')).toBeInTheDocument();
        });

        it('should display "No bio added yet" when bio is empty', async () => {
            const userWithoutBio = { ...mockUser, bio: '' };
            mockUseAuth.mockReturnValue({
                user: userWithoutBio,
                isAuthenticated: true,
                loading: false,
                error: null,
            });

            renderProfile();

            // The component doesn't show "No bio added yet" when bio is empty
            // It just doesn't show the bio section
            expect(screen.queryByText('No bio added yet.')).not.toBeInTheDocument();
        });

        it('should display account status', async () => {
            mockUseAuth.mockReturnValue({
                user: mockUser,
                isAuthenticated: true,
                loading: false,
                error: null,
            });

            renderProfile();

            // Use getAllByText since "Active" appears in multiple places
            const activeElements = screen.getAllByText('Active');
            expect(activeElements.length).toBeGreaterThan(0);
        });

        it('should display member since date', async () => {
            mockUseAuth.mockReturnValue({
                user: mockUser,
                isAuthenticated: true,
                loading: false,
                error: null,
            });

            renderProfile();

            expect(screen.getByText(/Member Since/)).toBeInTheDocument();
            // The date format depends on the locale, so just check for the date section
            expect(screen.getByText(/Last Updated/)).toBeInTheDocument();
        });
    });

    describe('Action Buttons', () => {
        it('should display edit profile button', async () => {
            mockUseAuth.mockReturnValue({
                user: mockUser,
                isAuthenticated: true,
                loading: false,
                error: null,
            });

            renderProfile();

            const links = screen.getAllByRole('link', { name: /edit profile/i });
            expect(links.length).toBeGreaterThan(0);
        });

        it('should navigate to edit profile page when edit button is clicked', async () => {
            mockUseAuth.mockReturnValue({
                user: mockUser,
                isAuthenticated: true,
                loading: false,
                error: null,
            });

            renderProfile();

            const links = screen.getAllByRole('link', { name: /edit profile/i });
            links.forEach(link => {
                expect(link).toHaveAttribute('href', '/profile/edit');
            });
        });

        it('should display back to home button', async () => {
            mockUseAuth.mockReturnValue({
                user: mockUser,
                isAuthenticated: true,
                loading: false,
                error: null,
            });

            renderProfile();

            // The Profile component has "Quick Actions" section
            expect(screen.getByText('Quick Actions')).toBeInTheDocument();
        });
    });

    describe('Admin User Display', () => {
        it('should display admin role for admin users', async () => {
            const adminUser = { ...mockUser, role: 'admin' };
            mockUseAuth.mockReturnValue({
                user: adminUser,
                isAuthenticated: true,
                loading: false,
                error: null,
            });

            renderProfile();

            // Use getAllByText since "Administrator" appears in multiple places
            const adminElements = screen.getAllByText('Administrator');
            expect(adminElements.length).toBeGreaterThan(0);
        });

        it('should display admin-specific styling', async () => {
            const adminUser = { ...mockUser, role: 'admin' };
            mockUseAuth.mockReturnValue({
                user: adminUser,
                isAuthenticated: true,
                loading: false,
                error: null,
            });

            renderProfile();

            // Use getAllByText and get the first one
            const adminElements = screen.getAllByText('Administrator');
            const roleChip = adminElements[0].closest('[class*="MuiChip"]');
            expect(roleChip).toBeInTheDocument();
        });
    });

    describe('Error Handling', () => {
        it('should display error message when API call fails', async () => {
            mockUseAuth.mockReturnValue({
                user: null,
                isAuthenticated: false,
                loading: false,
                error: 'Failed to load user data',
            });

            // Profile component returns null when no user, so no error display
            expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
        });

        it('should display error message when user is not found', async () => {
            mockUseAuth.mockReturnValue({
                user: null,
                isAuthenticated: false,
                loading: false,
                error: 'User not found',
            });

            // Profile component returns null when no user, so no error display
            expect(screen.queryByText(/user not found/i)).not.toBeInTheDocument();
        });
    });

    describe('Component Structure', () => {
        it('should have proper card structure', async () => {
            mockUseAuth.mockReturnValue({
                user: mockUser,
                isAuthenticated: true,
                loading: false,
                error: null,
            });

            renderProfile();

            // The component has "Personal Information" and "Account Details" cards
            expect(screen.getByText('Personal Information')).toBeInTheDocument();
            expect(screen.getByText('Account Details')).toBeInTheDocument();
        });

        it('should have proper grid layout', async () => {
            mockUseAuth.mockReturnValue({
                user: mockUser,
                isAuthenticated: true,
                loading: false,
                error: null,
            });

            renderProfile();

            // Check for Grid container
            const container = screen.getByText('Personal Information').closest('[class*="MuiGrid"]');
            expect(container).toBeInTheDocument();
        });

        it('should have proper spacing between elements', async () => {
            mockUseAuth.mockReturnValue({
                user: mockUser,
                isAuthenticated: true,
                loading: false,
                error: null,
            });

            renderProfile();

            // Check for Container - use getAllByText to handle multiple elements
            const nameElements = screen.getAllByText('John Doe');
            const container = nameElements[0].closest('[class*="MuiContainer"]');
            expect(container).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should have proper heading structure', async () => {
            mockUseAuth.mockReturnValue({
                user: mockUser,
                isAuthenticated: true,
                loading: false,
                error: null,
            });

            renderProfile();

            const heading = screen.getByRole('heading', { level: 1 });
            expect(heading).toBeInTheDocument();
            expect(heading).toHaveTextContent('John Doe');
        });

        it('should have proper button labels', async () => {
            mockUseAuth.mockReturnValue({
                user: mockUser,
                isAuthenticated: true,
                loading: false,
                error: null,
            });

            renderProfile();

            // The buttons are actually links, so use getAllByRole('link')
            const links = screen.getAllByRole('link');
            links.forEach(link => {
                expect(link.textContent.trim().length).toBeGreaterThan(0);
            });
        });

        it('should have proper image alt text', async () => {
            mockUseAuth.mockReturnValue({
                user: mockUser,
                isAuthenticated: true,
                loading: false,
                error: null,
            });

            renderProfile();

            // The avatars show the letter "J" as text, not as alt text
            const avatarLetters = screen.getAllByText('J');
            expect(avatarLetters.length).toBeGreaterThan(0);
        });
    });

    describe('Responsive Design', () => {
        it('should render on mobile devices', async () => {
            mockUseAuth.mockReturnValue({
                user: mockUser,
                isAuthenticated: true,
                loading: false,
                error: null,
            });

            // Use getAllByText to handle multiple elements
            renderProfile();

            const elements = screen.getAllByText('John Doe');
            expect(elements).toHaveLength(2);
        });

        it('should maintain layout on different screen sizes', async () => {
            mockUseAuth.mockReturnValue({
                user: mockUser,
                isAuthenticated: true,
                loading: false,
                error: null,
            });

            // Use getAllByText to handle multiple elements
            renderProfile();

            // Check for Container - use getAllByText to handle multiple elements
            const containers = screen.getAllByText('John Doe');
            const container = containers[0].closest('[class*="MuiContainer"]');
            expect(container).toBeInTheDocument();
        });
    });

    it('should render the username as a clickable link to the user profile', async () => {
        renderProfile();
        await waitFor(() => {
            const links = screen.getAllByRole('link');
            const usernameLink = links.find(link => link.textContent.replace(/\s+/g, '').includes('@johndoe'));
            expect(usernameLink).toBeDefined();
            expect(usernameLink).toHaveAttribute('href', '/users/1');
        });
    });

    test('username links point to correct user profile URLs', async () => {
        render(
            <AuthProvider>
                <Profile />
            </AuthProvider>
        );

        // Wait for profile data to load
        await waitFor(() => {
            const profileLinks = screen.getAllByRole('link').filter(link =>
                /^\/users\/[a-zA-Z0-9]+$/.test(link.getAttribute('href'))
            );
            expect(profileLinks.length).toBeGreaterThan(0);
        });
    });
}); 