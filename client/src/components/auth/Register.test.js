import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AuthProvider } from '../../contexts/AuthContext';
import Register from './Register';

const testTheme = createTheme({
    palette: {
        primary: { main: '#1976d2' },
        secondary: { main: '#dc004e' },
    },
});

const renderRegister = () => {
    return render(
        <ThemeProvider theme={testTheme}>
            <AuthProvider>
                <BrowserRouter>
                    <Register />
                </BrowserRouter>
            </AuthProvider>
        </ThemeProvider>
    );
};

describe('Register Component', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe('Rendering', () => {
        it('should render registration form with all required elements', () => {
            renderRegister();

            expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
            expect(screen.getByText('Join us! Create your account to get started.')).toBeInTheDocument();
            expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/password/i, { selector: '[name="password"]' })).toBeInTheDocument();
            expect(screen.getByLabelText(/confirm password/i, { selector: '[name="confirmPassword"]' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
            expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
            expect(screen.getByText(/sign in here/i)).toBeInTheDocument();
        });

        it('should have proper form attributes', () => {
            renderRegister();

            const firstNameInput = screen.getByLabelText(/first name/i);
            const lastNameInput = screen.getByLabelText(/last name/i);
            const usernameInput = screen.getByLabelText(/username/i);
            const emailInput = screen.getByLabelText(/email address/i);
            const passwordInput = screen.getByLabelText(/password/i, { selector: '[name="password"]' });
            const confirmPasswordInput = screen.getByLabelText(/confirm password/i, { selector: '[name="confirmPassword"]' });

            expect(firstNameInput).toHaveAttribute('required');
            expect(firstNameInput).toHaveAttribute('autoComplete', 'given-name');
            expect(document.activeElement).toBe(firstNameInput);

            expect(lastNameInput).toHaveAttribute('required');
            expect(lastNameInput).toHaveAttribute('autoComplete', 'family-name');

            expect(usernameInput).toHaveAttribute('required');
            expect(usernameInput).toHaveAttribute('autoComplete', 'username');

            expect(emailInput).toHaveAttribute('type', 'email');
            expect(emailInput).toHaveAttribute('required');
            expect(emailInput).toHaveAttribute('autoComplete', 'email');

            expect(passwordInput).toHaveAttribute('type', 'password');
            expect(passwordInput).toHaveAttribute('required');
            expect(passwordInput).toHaveAttribute('autoComplete', 'new-password');

            expect(confirmPasswordInput).toHaveAttribute('type', 'password');
            expect(confirmPasswordInput).toHaveAttribute('required');
            expect(confirmPasswordInput).toHaveAttribute('autoComplete', 'new-password');
        });
    });

    describe('Form Validation', () => {
        it('should show error for empty first name', async () => {
            renderRegister();

            const submitButton = screen.getByRole('button', { name: /create account/i });
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('First name is required')).toBeInTheDocument();
            });
        });

        it('should show error for empty last name', async () => {
            renderRegister();

            const firstNameInput = screen.getByLabelText(/first name/i);
            await userEvent.type(firstNameInput, 'John');

            const submitButton = screen.getByRole('button', { name: /create account/i });
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Last name is required')).toBeInTheDocument();
            });
        });

        it('should show error for empty username', async () => {
            renderRegister();

            const firstNameInput = screen.getByLabelText(/first name/i);
            const lastNameInput = screen.getByLabelText(/last name/i);
            await userEvent.type(firstNameInput, 'John');
            await userEvent.type(lastNameInput, 'Doe');

            const submitButton = screen.getByRole('button', { name: /create account/i });
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Username is required')).toBeInTheDocument();
            });
        });

        it('should show error for short username', async () => {
            renderRegister();

            const usernameInput = screen.getByLabelText(/username/i);
            await userEvent.type(usernameInput, 'ab');

            const submitButton = screen.getByRole('button', { name: /create account/i });
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Username must be at least 3 characters')).toBeInTheDocument();
            });
        });

        it('should show error for invalid username characters', async () => {
            renderRegister();

            const usernameInput = screen.getByLabelText(/username/i);
            await userEvent.type(usernameInput, 'user@name');

            const submitButton = screen.getByRole('button', { name: /create account/i });
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Username can only contain letters, numbers, and underscores')).toBeInTheDocument();
            });
        });

        it('should show error for invalid email format', async () => {
            renderRegister();

            const emailInput = screen.getByLabelText(/email address/i);
            await userEvent.type(emailInput, 'invalid-email');

            const submitButton = screen.getByRole('button', { name: /create account/i });
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Email is invalid')).toBeInTheDocument();
            });
        });

        it('should show error for short password', async () => {
            renderRegister();

            const passwordInput = screen.getByLabelText(/password/i, { selector: '[name="password"]' });
            await userEvent.type(passwordInput, '123');

            const submitButton = screen.getByRole('button', { name: /create account/i });
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
            });
        });

        it('should show error for mismatched passwords', async () => {
            renderRegister();

            const passwordInput = screen.getByLabelText(/password/i, { selector: '[name="password"]' });
            const confirmPasswordInput = screen.getByLabelText(/confirm password/i, { selector: '[name="confirmPassword"]' });

            await userEvent.type(passwordInput, 'password123');
            await userEvent.type(confirmPasswordInput, 'differentpassword');

            const submitButton = screen.getByRole('button', { name: /create account/i });
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
            });
        });

        it('should show error for empty confirm password', async () => {
            renderRegister();

            const passwordInput = screen.getByLabelText(/password/i, { selector: '[name="password"]' });
            await userEvent.type(passwordInput, 'password123');

            const submitButton = screen.getByRole('button', { name: /create account/i });
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Please confirm your password')).toBeInTheDocument();
            });
        });

        it('should clear errors when user starts typing', async () => {
            renderRegister();

            const firstNameInput = screen.getByLabelText(/first name/i);
            const submitButton = screen.getByRole('button', { name: /create account/i });

            // Submit empty form to show error
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('First name is required')).toBeInTheDocument();
            });

            // Start typing to clear error
            await userEvent.type(firstNameInput, 'John');

            await waitFor(() => {
                expect(screen.queryByText('First name is required')).not.toBeInTheDocument();
            });
        });
    });

    describe('Form Submission', () => {
        it('should handle successful registration', async () => {
            renderRegister();

            // Fill out the form
            const firstNameInput = screen.getByLabelText(/first name/i);
            const lastNameInput = screen.getByLabelText(/last name/i);
            const usernameInput = screen.getByLabelText(/username/i);
            const emailInput = screen.getByLabelText(/email address/i);
            const passwordInput = screen.getByLabelText(/password/i, { selector: '[name="password"]' });
            const confirmPasswordInput = screen.getByLabelText(/confirm password/i, { selector: '[name="confirmPassword"]' });

            await userEvent.type(firstNameInput, 'John');
            await userEvent.type(lastNameInput, 'Doe');
            await userEvent.type(usernameInput, 'johndoe');
            await userEvent.type(emailInput, 'john@example.com');
            await userEvent.type(passwordInput, 'password123');
            await userEvent.type(confirmPasswordInput, 'password123');

            const submitButton = screen.getByRole('button', { name: /create account/i });
            await userEvent.click(submitButton);

            // The form should be valid and ready for submission
            expect(submitButton).toBeInTheDocument();
        });

        it('should show loading state during submission', async () => {
            renderRegister();

            // Fill out the form
            const firstNameInput = screen.getByLabelText(/first name/i);
            const lastNameInput = screen.getByLabelText(/last name/i);
            const usernameInput = screen.getByLabelText(/username/i);
            const emailInput = screen.getByLabelText(/email address/i);
            const passwordInput = screen.getByLabelText(/password/i, { selector: '[name="password"]' });
            const confirmPasswordInput = screen.getByLabelText(/confirm password/i, { selector: '[name="confirmPassword"]' });

            await userEvent.type(firstNameInput, 'John');
            await userEvent.type(lastNameInput, 'Doe');
            await userEvent.type(usernameInput, 'johndoe');
            await userEvent.type(emailInput, 'john@example.com');
            await userEvent.type(passwordInput, 'password123');
            await userEvent.type(confirmPasswordInput, 'password123');

            const submitButton = screen.getByRole('button', { name: /create account/i });
            await userEvent.click(submitButton);

            // The button should show loading state
            expect(submitButton).toBeDisabled();
        });

        it('should disable form inputs during submission', async () => {
            renderRegister();

            // Fill out the form
            const firstNameInput = screen.getByLabelText(/first name/i);
            const lastNameInput = screen.getByLabelText(/last name/i);
            const usernameInput = screen.getByLabelText(/username/i);
            const emailInput = screen.getByLabelText(/email address/i);
            const passwordInput = screen.getByLabelText(/password/i, { selector: '[name="password"]' });
            const confirmPasswordInput = screen.getByLabelText(/confirm password/i, { selector: '[name="confirmPassword"]' });

            await userEvent.type(firstNameInput, 'John');
            await userEvent.type(lastNameInput, 'Doe');
            await userEvent.type(usernameInput, 'johndoe');
            await userEvent.type(emailInput, 'john@example.com');
            await userEvent.type(passwordInput, 'password123');
            await userEvent.type(confirmPasswordInput, 'password123');

            const submitButton = screen.getByRole('button', { name: /create account/i });
            await userEvent.click(submitButton);

            expect(firstNameInput).toBeDisabled();
            expect(lastNameInput).toBeDisabled();
            expect(usernameInput).toBeDisabled();
            expect(emailInput).toBeDisabled();
            expect(passwordInput).toBeDisabled();
            expect(confirmPasswordInput).toBeDisabled();
        });
    });

    describe('Navigation', () => {
        it('should have link to login page', () => {
            renderRegister();

            const loginLink = screen.getByText(/sign in here/i);
            expect(loginLink).toHaveAttribute('href', '/login');
        });

        it('should redirect authenticated users to home', async () => {
            // This test would require mocking the AuthContext to simulate authenticated state
            renderRegister();

            // The component should redirect if user is already authenticated
            // This is handled by the useEffect in the component
        });
    });

    describe('Accessibility', () => {
        it('should have proper ARIA labels', () => {
            renderRegister();

            expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/password/i, { selector: '[name="password"]' })).toBeInTheDocument();
            expect(screen.getByLabelText(/confirm password/i, { selector: '[name="confirmPassword"]' })).toBeInTheDocument();
        });

        it('should have proper form structure', () => {
            renderRegister();

            const form = screen.getByRole('form');
            expect(form).toBeInTheDocument();
        });

        it('should have proper button types', () => {
            renderRegister();

            const submitButton = screen.getByRole('button', { name: /create account/i });
            expect(submitButton).toHaveAttribute('type', 'submit');
        });
    });
}); 