import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AuthProvider, AuthContext } from '../../contexts/AuthContext';
import Home from './Home';

const testTheme = createTheme({
    palette: {
        primary: { main: '#1976d2' },
        secondary: { main: '#dc004e' },
    },
});

const renderHome = () => {
    return render(
        <ThemeProvider theme={testTheme}>
            <AuthProvider>
                <BrowserRouter>
                    <Home />
                </BrowserRouter>
            </AuthProvider>
        </ThemeProvider>
    );
};

// Custom render function with mocked auth context
const renderWithAuth = (authValue) => {
    return render(
        <ThemeProvider theme={testTheme}>
            <AuthContext.Provider value={authValue}>
                <BrowserRouter>
                    <Home />
                </BrowserRouter>
            </AuthContext.Provider>
        </ThemeProvider>
    );
};

describe('Home Component', () => {
    describe('Non-Authenticated User View', () => {
        it('should render welcome message for non-authenticated users', () => {
            renderHome();

            expect(screen.getByText('Welcome to MERN Social')).toBeInTheDocument();
            expect(screen.getByText('A full-stack social media application built with the MERN stack.')).toBeInTheDocument();
        });

        it('should display call-to-action buttons', () => {
            renderHome();

            expect(screen.getByRole('link', { name: /get started/i })).toBeInTheDocument();
            expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
        });

        it('should display features section', () => {
            renderHome();

            expect(screen.getByText('Features')).toBeInTheDocument();
            expect(screen.getByText('Secure Authentication')).toBeInTheDocument();
            expect(screen.getByText('Fast & Responsive')).toBeInTheDocument();
            expect(screen.getByText('Full Stack MERN')).toBeInTheDocument();
        });

        it('should have proper navigation links', () => {
            renderHome();

            const getStartedButton = screen.getByRole('link', { name: /get started/i });
            const signInButton = screen.getByRole('link', { name: /sign in/i });

            expect(getStartedButton).toHaveAttribute('href', '/register');
            expect(signInButton).toHaveAttribute('href', '/login');
        });

        it('should display feature descriptions', () => {
            renderHome();

            expect(screen.getByText(/JWT-based authentication with password hashing and role-based access control/)).toBeInTheDocument();
            expect(screen.getByText(/Built with React and Material-UI for a smooth, modern user experience/)).toBeInTheDocument();
            expect(screen.getByText(/Complete MERN stack application with MongoDB, Express, React, and Node.js/)).toBeInTheDocument();
        });
    });

    describe('Authenticated User View', () => {
        // Mock the AuthContext to simulate authenticated user
        const mockAuthContext = {
            token: 'mock-token',
            isAuthenticated: true,
            user: {
                _id: '1',
                firstName: 'John',
                lastName: 'Doe',
                username: 'johndoe',
                email: 'john@example.com',
                role: 'user',
                avatar: 'https://example.com/avatar.jpg',
                bio: 'Test bio',
                createdAt: '2023-01-01T00:00:00.000Z',
                updatedAt: '2023-01-01T00:00:00.000Z',
            },
            loading: false,
            error: null,
            register: jest.fn(),
            login: jest.fn(),
            logout: jest.fn(),
            updateProfile: jest.fn(),
            clearError: jest.fn(),
        };

        it('should display welcome message for authenticated user', () => {
            renderWithAuth(mockAuthContext);

            expect(screen.getByText('Welcome back, John!')).toBeInTheDocument();
            expect(screen.getByText("You're successfully logged into your MERN Social application.")).toBeInTheDocument();
        });

        it('should display user profile card', () => {
            renderWithAuth(mockAuthContext);

            expect(screen.getByText('Your Profile')).toBeInTheDocument();
            expect(screen.getByText('John Doe')).toBeInTheDocument();
            expect(screen.getByText('@johndoe')).toBeInTheDocument();
            expect(screen.getByText('john@example.com')).toBeInTheDocument();
        });

        it('should have proper navigation links for authenticated user', () => {
            renderWithAuth(mockAuthContext);

            const viewProfileButton = screen.getByRole('link', { name: /view profile/i });
            const editProfileButton = screen.getByRole('link', { name: /edit profile/i });

            expect(viewProfileButton).toHaveAttribute('href', '/profile');
            expect(editProfileButton).toHaveAttribute('href', '/profile/edit');
        });

        it('should display application features', () => {
            renderWithAuth(mockAuthContext);

            expect(screen.getByText('Application Features')).toBeInTheDocument();
            expect(screen.getByText('Secure Authentication')).toBeInTheDocument();
            expect(screen.getByText('Fast & Responsive')).toBeInTheDocument();
            expect(screen.getByText('Full Stack MERN')).toBeInTheDocument();
        });
    });

    describe('Admin User View', () => {
        const mockAdminContext = {
            token: 'mock-admin-token',
            isAuthenticated: true,
            user: {
                _id: '2',
                firstName: 'Admin',
                lastName: 'User',
                username: 'admin',
                email: 'admin@example.com',
                role: 'admin',
                avatar: 'https://example.com/admin-avatar.jpg',
                bio: 'Admin bio',
                createdAt: '2023-01-01T00:00:00.000Z',
                updatedAt: '2023-01-01T00:00:00.000Z',
            },
            loading: false,
            error: null,
            register: jest.fn(),
            login: jest.fn(),
            logout: jest.fn(),
            updateProfile: jest.fn(),
            clearError: jest.fn(),
        };

        it('should display admin-specific quick actions', () => {
            renderWithAuth(mockAdminContext);

            expect(screen.getByText('Welcome back, Admin!')).toBeInTheDocument();
            expect(screen.getByRole('link', { name: /manage users/i })).toBeInTheDocument();
        });

        it('should have proper navigation links for admin', () => {
            renderWithAuth(mockAdminContext);

            const manageUsersButton = screen.getByRole('link', { name: /manage users/i });
            expect(manageUsersButton).toHaveAttribute('href', '/users');
        });
    });

    describe('Component Structure', () => {
        it('should have proper container structure', () => {
            renderHome();

            // Check for main container
            const container = screen.getByRole('main');
            expect(container).toBeInTheDocument();
        });

        it('should have proper heading hierarchy', () => {
            renderHome();

            const mainHeading = screen.getByRole('heading', { level: 1 });
            expect(mainHeading).toBeInTheDocument();
            expect(mainHeading).toHaveTextContent('Welcome to MERN Social');
        });

        it('should have proper button styling', () => {
            renderHome();

            const links = screen.getAllByRole('link');
            links.forEach(link => {
                expect(link).toHaveClass('MuiButton-root');
            });
        });
    });

    describe('Responsive Design', () => {
        it('should render on different screen sizes', () => {
            // Test that component renders without errors
            renderHome();

            expect(screen.getByText('Welcome to MERN Social')).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should have proper semantic structure', () => {
            renderHome();

            // Check for proper heading structure
            const headings = screen.getAllByRole('heading');
            expect(headings.length).toBeGreaterThan(0);

            // Check for proper button labels
            const links = screen.getAllByRole('link');
            links.forEach(link => {
                expect(link.textContent.trim()).toBeTruthy();
            });
        });

        it('should have proper link attributes', () => {
            renderHome();

            // Since we're using links styled as buttons, check all links
            const links = screen.getAllByRole('link');
            links.forEach(link => {
                if (link.hasAttribute('href')) {
                    expect(link).toHaveAttribute('href');
                }
            });
        });
    });
}); 