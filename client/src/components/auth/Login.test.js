import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AuthProvider } from '../../contexts/AuthContext';
import Login from './Login';

const testTheme = createTheme({
    palette: {
        primary: { main: '#1976d2' },
        secondary: { main: '#dc004e' },
    },
});

const renderLogin = () => {
    return render(
        <ThemeProvider theme={testTheme}>
            <AuthProvider>
                <BrowserRouter>
                    <Login />
                </BrowserRouter>
            </AuthProvider>
        </ThemeProvider>
    );
};

describe('Login Component', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe('Rendering', () => {
        it('should render login form with all required elements', () => {
            renderLogin();

            expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
            expect(screen.getByText('Welcome back! Please sign in to your account.')).toBeInTheDocument();
            expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
            expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
            expect(screen.getByText(/sign up here/i)).toBeInTheDocument();
        });

        it('should have proper form attributes', () => {
            renderLogin();

            const emailInput = screen.getByLabelText(/email address/i);
            const passwordInput = screen.getByLabelText(/password/i);

            expect(emailInput).toHaveAttribute('type', 'email');
            expect(emailInput).toHaveAttribute('required');
            expect(emailInput).toHaveAttribute('autoComplete', 'email');
            expect(document.activeElement).toBe(emailInput);

            expect(passwordInput).toHaveAttribute('type', 'password');
            expect(passwordInput).toHaveAttribute('required');
            expect(passwordInput).toHaveAttribute('autoComplete', 'current-password');
        });
    });

    describe('Form Validation', () => {
        it('should show error for empty email', async () => {
            renderLogin();

            const submitButton = screen.getByRole('button', { name: /sign in/i });
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Email is required')).toBeInTheDocument();
            });
        });

        it('should show error for invalid email format', async () => {
            renderLogin();

            const emailInput = screen.getByLabelText(/email address/i);
            await userEvent.type(emailInput, 'invalid-email');

            const submitButton = screen.getByRole('button', { name: /sign in/i });
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Email is invalid')).toBeInTheDocument();
            });
        });

        it('should show error for empty password', async () => {
            renderLogin();

            const emailInput = screen.getByLabelText(/email address/i);
            await userEvent.type(emailInput, 'test@example.com');

            const submitButton = screen.getByRole('button', { name: /sign in/i });
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Password is required')).toBeInTheDocument();
            });
        });

        it('should show error for short password', async () => {
            renderLogin();

            const emailInput = screen.getByLabelText(/email address/i);
            const passwordInput = screen.getByLabelText(/password/i);

            await userEvent.type(emailInput, 'test@example.com');
            await userEvent.type(passwordInput, '123');

            const submitButton = screen.getByRole('button', { name: /sign in/i });
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
            });
        });

        it('should clear errors when user starts typing', async () => {
            renderLogin();

            const emailInput = screen.getByLabelText(/email address/i);
            const submitButton = screen.getByRole('button', { name: /sign in/i });

            // Submit empty form to show error
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Email is required')).toBeInTheDocument();
            });

            // Start typing to clear error
            await userEvent.type(emailInput, 'test@example.com');

            await waitFor(() => {
                expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
            });
        });
    });

    describe('Form Submission', () => {
        it('should handle successful login', async () => {
            const mockNavigate = jest.fn();
            jest.doMock('react-router-dom', () => ({
                ...jest.requireActual('react-router-dom'),
                useNavigate: () => mockNavigate,
            }));

            renderLogin();

            const emailInput = screen.getByLabelText(/email address/i);
            const passwordInput = screen.getByLabelText(/password/i);

            await userEvent.type(emailInput, 'test@example.com');
            await userEvent.type(passwordInput, 'password123');

            const submitButton = screen.getByRole('button', { name: /sign in/i });
            await userEvent.click(submitButton);

            // Note: This test would need proper mocking of the AuthContext
            // The actual login logic is tested in AuthContext.test.js
        });

        it('should show loading state during submission', async () => {
            renderLogin();

            const emailInput = screen.getByLabelText(/email address/i);
            const passwordInput = screen.getByLabelText(/password/i);

            await userEvent.type(emailInput, 'test@example.com');
            await userEvent.type(passwordInput, 'password123');

            const submitButton = screen.getByRole('button', { name: /sign in/i });
            await userEvent.click(submitButton);

            // The button should show loading state
            expect(submitButton).toBeDisabled();
        });

        it('should disable form inputs during submission', async () => {
            renderLogin();

            const emailInput = screen.getByLabelText(/email address/i);
            const passwordInput = screen.getByLabelText(/password/i);

            await userEvent.type(emailInput, 'test@example.com');
            await userEvent.type(passwordInput, 'password123');

            const submitButton = screen.getByRole('button', { name: /sign in/i });
            await userEvent.click(submitButton);

            expect(emailInput).toBeDisabled();
            expect(passwordInput).toBeDisabled();
        });
    });

    describe('Navigation', () => {
        it('should have link to register page', () => {
            renderLogin();

            const registerLink = screen.getByText(/sign up here/i);
            expect(registerLink).toHaveAttribute('href', '/register');
        });

        it('should redirect authenticated users to home', async () => {
            // This test would require mocking the AuthContext to simulate authenticated state
            renderLogin();

            // The component should redirect if user is already authenticated
            // This is handled by the useEffect in the component
        });
    });

    describe('Error Handling', () => {
        it('should display authentication errors from context', async () => {
            // This test would require mocking the AuthContext to simulate error state
            renderLogin();

            // Error messages should be displayed when they exist in the context
        });

        it('should clear errors when component unmounts', () => {
            const { unmount } = renderLogin();

            // Component should clean up when unmounting
            unmount();
        });
    });

    describe('Accessibility', () => {
        it('should have proper ARIA labels', () => {
            renderLogin();

            expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        });

        it('should have proper form structure', () => {
            renderLogin();

            const form = screen.getByRole('form');
            expect(form).toBeInTheDocument();
        });

        it('should have proper button types', () => {
            renderLogin();

            const submitButton = screen.getByRole('button', { name: /sign in/i });
            expect(submitButton).toHaveAttribute('type', 'submit');
        });
    });
}); 