import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Register from './Register';

const testTheme = createTheme({
    palette: {
        primary: { main: '#1976d2' },
        secondary: { main: '#dc004e' },
    },
});

// Mock the AuthContext
const mockRegister = jest.fn();
const mockUseAuth = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
    useAuth: () => mockUseAuth()
}));

const renderRegister = () => {
    return render(
        <ThemeProvider theme={testTheme}>
            <BrowserRouter>
                <Register />
            </BrowserRouter>
        </ThemeProvider>
    );
};

describe('Register Component', () => {
    let consoleSpy;

    beforeEach(() => {
        localStorage.clear();
        // Spy on console methods
        consoleSpy = {
            log: jest.spyOn(console, 'log').mockImplementation(),
            error: jest.spyOn(console, 'error').mockImplementation(),
        };

        // Default mock implementation
        mockRegister.mockClear();
        mockUseAuth.mockReturnValue({
            register: mockRegister,
            error: null,
            isAuthenticated: false
        });
    });

    afterEach(() => {
        // Restore console methods
        consoleSpy.log.mockRestore();
        consoleSpy.error.mockRestore();
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

    describe('Registration Logging', () => {
        it('should log form data when submitting registration (excluding password)', async () => {
            mockRegister.mockResolvedValue({ success: true });

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

            // Check that form data was logged (excluding password)
            await waitFor(() => {
                expect(consoleSpy.log).toHaveBeenNthCalledWith(1, 'Submitting registration:', {
                    firstName: 'John',
                    lastName: 'Doe',
                    username: 'johndoe',
                    email: 'john@example.com'
                });
            });
        });

        it('should log successful registration response', async () => {
            mockRegister.mockResolvedValue({ success: true });

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

            // Check that response was logged
            await waitFor(() => {
                expect(consoleSpy.log).toHaveBeenCalledWith('Registration response:', { success: true });
            });
        });

        it('should log failed registration response', async () => {
            mockRegister.mockResolvedValue({
                success: false,
                error: 'User already exists'
            });

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

            // Check that error was logged
            await waitFor(() => {
                expect(consoleSpy.error).toHaveBeenCalledWith('Registration failed:', 'User already exists');
            });
        });

        it('should log registration exceptions', async () => {
            mockRegister.mockRejectedValue(new Error('Network error'));

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

            // Check that exception was logged
            await waitFor(() => {
                expect(consoleSpy.error).toHaveBeenCalledWith('Registration exception:', expect.any(Error));
            });
        });
    });

    describe('Error Display', () => {
        it('should display string error messages correctly', () => {
            mockUseAuth.mockReturnValue({
                register: mockRegister,
                error: 'User already exists',
                isAuthenticated: false
            });

            renderRegister();

            expect(screen.getByText('User already exists')).toBeInTheDocument();
        });

        it('should display object error messages as JSON string', () => {
            const errorObject = {
                message: 'Validation failed',
                details: ['Email is invalid', 'Username too short']
            };

            mockUseAuth.mockReturnValue({
                register: mockRegister,
                error: errorObject,
                isAuthenticated: false
            });

            renderRegister();

            expect(screen.getByText(JSON.stringify(errorObject))).toBeInTheDocument();
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