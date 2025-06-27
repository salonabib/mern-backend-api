import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import EditProfile from './EditProfile';

// Mock the AuthContext
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
    bio: 'Software developer',
    avatar: 'https://example.com/avatar.jpg',
};

const renderEditProfile = () => {
    return render(
        <ThemeProvider theme={testTheme}>
            <BrowserRouter>
                <EditProfile />
            </BrowserRouter>
        </ThemeProvider>
    );
};

describe('EditProfile Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseAuth.mockReturnValue({
            user: mockUser,
            isAuthenticated: true,
            loading: false,
            error: null,
            updateProfile: jest.fn(),
        });
    });

    describe('Rendering', () => {
        it('should render edit profile form', () => {
            renderEditProfile();

            expect(screen.getByText('Edit Profile')).toBeInTheDocument();
        });

        it('should display form fields', () => {
            renderEditProfile();

            expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/bio/i)).toBeInTheDocument();
        });

        it('should not render when user is not authenticated', () => {
            mockUseAuth.mockReturnValue({
                user: null,
                isAuthenticated: false,
                loading: false,
                error: null,
                updateProfile: jest.fn(),
            });

            renderEditProfile();

            // Should redirect or show error
            expect(screen.queryByText('Edit Profile')).not.toBeInTheDocument();
        });
    });
}); 