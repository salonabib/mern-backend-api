import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import UserList from './UserList';

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

const mockUsers = [
    {
        _id: '2',
        firstName: 'Jane',
        lastName: 'Smith',
        username: 'janesmith',
        email: 'jane@example.com',
        bio: 'Frontend developer',
        avatar: 'https://example.com/jane.jpg',
        role: 'user',
        isActive: true,
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
        role: 'user',
        isActive: true,
        followers: [],
        following: [],
    },
    {
        _id: '4',
        firstName: 'Alice',
        lastName: 'Brown',
        username: 'alicebrown',
        email: 'alice@example.com',
        bio: 'Designer',
        avatar: 'https://example.com/alice.jpg',
        role: 'admin',
        isActive: true,
        followers: [],
        following: [],
    },
];

const renderUserList = () => {
    return render(
        <ThemeProvider theme={testTheme}>
            <BrowserRouter>
                <UserList />
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

describe('UserList Component', () => {
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
        it('should render user list page title', async () => {
            mockApi.get.mockResolvedValueOnce({
                data: { data: mockUsers, total: 3 }
            });

            renderUserList();

            await waitFor(() => {
                expect(screen.getByText('User Management')).toBeInTheDocument();
            });
        });

        it('should display search input', async () => {
            mockApi.get.mockResolvedValueOnce({
                data: { data: mockUsers, total: 3 }
            });

            renderUserList();

            await waitFor(() => {
                expect(screen.getByLabelText(/search users/i)).toBeInTheDocument();
            });
        });

        it('should display filter options', async () => {
            mockApi.get.mockResolvedValueOnce({
                data: { data: mockUsers, total: 3 }
            });

            renderUserList();

            await waitFor(() => {
                expect(screen.getByText('All Roles')).toBeInTheDocument();
            });
        });

        it('should display loading state initially', () => {
            renderUserList();

            expect(screen.getByRole('progressbar')).toBeInTheDocument();
        });
    });

    describe('User Display', () => {
        beforeEach(async () => {
            mockApi.get.mockResolvedValueOnce({
                data: { data: mockUsers, total: 3 }
            });
        });

        it('should display users when data is loaded', async () => {
            renderUserList();

            await waitFor(() => {
                expect(screen.getByText('Jane Smith')).toBeInTheDocument();
                expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
                expect(screen.getByText('Alice Brown')).toBeInTheDocument();
            });
        });

        it('should display user information correctly', async () => {
            renderUserList();

            await waitFor(() => {
                expect(screen.getByText('jane@example.com')).toBeInTheDocument();
                expect(screen.getByText('bob@example.com')).toBeInTheDocument();
                expect(screen.getByText('alice@example.com')).toBeInTheDocument();
            });
        });

        it('should display user avatars', async () => {
            renderUserList();

            await waitFor(() => {
                // Check for Avatar fallback text (first letter of first name)
                expect(screen.getByText('J')).toBeInTheDocument();
                expect(screen.getByText('B')).toBeInTheDocument();
                expect(screen.getByText('A')).toBeInTheDocument();
            });
        });

        it.skip('should display empty state when no users', async () => {
            mockApi.get.mockResolvedValueOnce({
                data: { data: [], total: 0 }
            });

            renderUserList();

            // Use a function matcher to handle text that might be split across elements
            expect(await screen.findByText((content, element) => {
                return element.textContent.toLowerCase().includes('no users found');
            })).toBeInTheDocument();
        });

        it.skip('should display error state when API fails', async () => {
            mockApi.get.mockRejectedValueOnce(new Error('Network error'));

            renderUserList();

            // Check for the Alert component with error message
            expect(await screen.findByRole('alert')).toBeInTheDocument();
            expect(screen.getByText('Failed to fetch users')).toBeInTheDocument();
        });
    });

    describe('Search and Filtering', () => {
        it('should filter users by search term', async () => {
            mockApi.get.mockResolvedValueOnce({
                data: { data: mockUsers, total: mockUsers.length }
            });

            renderUserList();

            await waitFor(() => {
                expect(screen.getByText('Jane Smith')).toBeInTheDocument();
            });

            const searchInput = screen.getByLabelText(/search users/i);
            await userEvent.type(searchInput, 'jane');

            expect(mockApi.get).toHaveBeenCalledWith(
                expect.stringContaining('search=jane')
            );
        });

        it('should filter users by role', async () => {
            mockApi.get.mockResolvedValueOnce({
                data: { data: mockUsers, total: mockUsers.length }
            });

            renderUserList();

            // Wait for loading to complete and users to be displayed
            await waitFor(() => {
                expect(screen.getByText('Jane Smith')).toBeInTheDocument();
            });

            // Now interact with the role filter
            const user = userEvent.setup();
            const comboboxes = screen.getAllByRole('combobox');
            const roleSelect = comboboxes[0];
            await user.click(roleSelect);

            // Click the correct Admin option in the dropdown
            const adminOptions = screen.getAllByText('Admin');
            const dropdownOption = adminOptions.find(el => el.tagName === 'LI' && el.getAttribute('role') === 'option');
            await user.click(dropdownOption);

            expect(mockApi.get).toHaveBeenCalledWith(
                expect.stringContaining('role=admin')
            );
        });
    });

    describe('Pagination', () => {
        it('should display pagination controls when multiple pages', async () => {
            mockApi.get.mockResolvedValueOnce({
                data: { data: mockUsers, total: 25 }
            });

            renderUserList();

            await waitFor(() => {
                expect(screen.getByText('Jane Smith')).toBeInTheDocument();
            });

            // Check for pagination controls
            expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
        });

        it('should navigate to next page', async () => {
            mockApi.get.mockResolvedValueOnce({
                data: { data: mockUsers, total: 25 }
            });

            renderUserList();

            await waitFor(() => {
                expect(screen.getByText('Jane Smith')).toBeInTheDocument();
            });

            const nextButton = screen.getByRole('button', { name: /next/i });
            await userEvent.click(nextButton);

            expect(mockApi.get).toHaveBeenCalledWith(
                expect.stringContaining('page=2')
            );
        });
    });

    describe('Navigation', () => {
        beforeEach(async () => {
            mockApi.get.mockResolvedValueOnce({
                data: {
                    success: true,
                    data: mockUsers,
                    total: 3,
                },
            });
        });

        it('should navigate to user profile when view button is clicked', async () => {
            renderUserList();

            await waitFor(() => {
                const viewButtons = screen.getAllByTestId('VisibilityIcon');
                expect(viewButtons[0].closest('a')).toHaveAttribute('href', '/users/2');
            });
        });
    });
}); 