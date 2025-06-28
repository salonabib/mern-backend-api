import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CreatePost from './CreatePost';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mocked-url');

// Mock the AuthContext
const mockApi = {
    post: jest.fn(),
};

const mockUser = {
    _id: 'user123',
    firstName: 'John',
    lastName: 'Doe',
    username: 'johndoe',
    photo: null,
};

const mockAuthContext = {
    user: mockUser,
    api: mockApi,
    isAuthenticated: true,
};

// Mock the useAuth hook
jest.mock('../../contexts/AuthContext', () => ({
    ...jest.requireActual('../../contexts/AuthContext'),
    useAuth: () => mockAuthContext,
}));

const theme = createTheme();

const renderWithProviders = (component) => {
    return render(
        <ThemeProvider theme={theme}>
            <BrowserRouter>
                <AuthProvider>
                    {component}
                </AuthProvider>
            </BrowserRouter>
        </ThemeProvider>
    );
};

describe('CreatePost Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render the create post form', () => {
            renderWithProviders(<CreatePost />);

            expect(screen.getByText('John Doe')).toBeInTheDocument();
            expect(screen.getByText('@johndoe')).toBeInTheDocument();
            expect(screen.getByPlaceholderText("What's on your mind?")).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /post/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
        });

        it('should display user avatar with photo when available', () => {
            const userWithPhoto = {
                ...mockUser,
                photo: true,
            };
            mockAuthContext.user = userWithPhoto;

            renderWithProviders(<CreatePost />);

            const avatar = screen.getByAltText('John');
            expect(avatar).toHaveAttribute('src', '/api/users/user123/photo');
        });

        it('should display user avatar with initials when no photo', () => {
            renderWithProviders(<CreatePost />);

            const avatar = screen.getByAltText('John');
            expect(avatar).toBeInTheDocument();
        });

        it('should render the username as a clickable link to the user profile', async () => {
            const user = {
                _id: 'user123',
                firstName: 'John',
                lastName: 'Doe',
                username: 'johndoe',
            };
            render(
                <ThemeProvider theme={createTheme()}>
                    <BrowserRouter>
                        <CreatePost user={user} />
                    </BrowserRouter>
                </ThemeProvider>
            );
            await waitFor(() => {
                const links = screen.getAllByRole('link');
                const usernameLink = links.find(link => link.textContent.replace(/\s+/g, '').includes('@johndoe'));
                expect(usernameLink).toBeDefined();
                expect(usernameLink).toHaveAttribute('href', '/users/user123');
            });
        });

        it('username links point to correct user profile URLs', async () => {
            renderWithProviders(<CreatePost />);

            // Wait for user data to load
            await waitFor(() => {
                expect(screen.getByText('@johndoe')).toBeInTheDocument();
            });

            const usernameLink = screen.getByText('@johndoe').closest('a');
            expect(usernameLink).toHaveAttribute('href', '/users/user123');
        });
    });

    describe('Form Interaction', () => {
        it('should update text input when user types', async () => {
            const user = userEvent.setup();
            renderWithProviders(<CreatePost />);

            const textInput = screen.getByPlaceholderText("What's on your mind?");
            await user.type(textInput, 'Hello, world!');

            expect(textInput).toHaveValue('Hello, world!');
        });

        it('should enable post button when text is entered', async () => {
            const user = userEvent.setup();
            renderWithProviders(<CreatePost />);

            const postButton = screen.getByRole('button', { name: /post/i });
            const textInput = screen.getByPlaceholderText("What's on your mind?");

            expect(postButton).toBeDisabled();

            await user.type(textInput, 'Hello, world!');

            expect(postButton).toBeEnabled();
        });

        it('should disable post button when text is empty', async () => {
            const user = userEvent.setup();
            renderWithProviders(<CreatePost />);

            const postButton = screen.getByRole('button', { name: /post/i });
            const textInput = screen.getByPlaceholderText("What's on your mind?");

            await user.type(textInput, 'Hello');
            expect(postButton).toBeEnabled();

            await user.clear(textInput);
            expect(postButton).toBeDisabled();
        });
    });

    describe('Photo Upload', () => {
        it('should show error for invalid file type', async () => {
            renderWithProviders(<CreatePost />);

            const file = new File(['fake-data'], 'test.txt', { type: 'text/plain' });
            const fileInput = document.querySelector('#post-photo-upload');

            fireEvent.change(fileInput, { target: { files: [file] } });

            expect(screen.getByText('Please select a valid image file')).toBeInTheDocument();
        });

        it('should show error for file too large', async () => {
            renderWithProviders(<CreatePost />);

            // Create a file larger than 10MB
            const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
            const fileInput = document.querySelector('#post-photo-upload');

            fireEvent.change(fileInput, { target: { files: [largeFile] } });

            expect(screen.getByText('Image size must be less than 10MB')).toBeInTheDocument();
        });
    });

    describe('Form Submission', () => {
        it('should submit post with text only', async () => {
            const user = userEvent.setup();
            const onPostCreated = jest.fn();
            mockApi.post.mockResolvedValue({
                data: {
                    success: true,
                    data: {
                        _id: 'post123',
                        text: 'Hello, world!',
                        postedBy: mockUser,
                    },
                },
            });

            renderWithProviders(<CreatePost onPostCreated={onPostCreated} />);

            const textInput = screen.getByPlaceholderText("What's on your mind?");
            const postButton = screen.getByRole('button', { name: /post/i });

            await user.type(textInput, 'Hello, world!');
            await user.click(postButton);

            await waitFor(() => {
                expect(mockApi.post).toHaveBeenCalledWith('/posts', expect.any(FormData), {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
            });

            expect(onPostCreated).toHaveBeenCalledWith({
                _id: 'post123',
                text: 'Hello, world!',
                postedBy: mockUser,
            });
        });

        it('should submit post with text and photo', async () => {
            const user = userEvent.setup();
            const onPostCreated = jest.fn();
            mockApi.post.mockResolvedValue({
                data: {
                    success: true,
                    data: {
                        _id: 'post123',
                        text: 'Hello with photo!',
                        postedBy: mockUser,
                        photo: { data: 'fake-data', contentType: 'image/jpeg' },
                    },
                },
            });

            renderWithProviders(<CreatePost onPostCreated={onPostCreated} />);

            const textInput = screen.getByPlaceholderText("What's on your mind?");
            const fileInput = document.querySelector('#post-photo-upload');
            const postButton = screen.getByRole('button', { name: /post/i });

            const file = new File(['fake-image-data'], 'test.jpg', { type: 'image/jpeg' });

            await user.type(textInput, 'Hello with photo!');
            await user.upload(fileInput, file);
            await user.click(postButton);

            await waitFor(() => {
                expect(mockApi.post).toHaveBeenCalledWith('/posts', expect.any(FormData), {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
            });
        });

        it('should show error when submission fails', async () => {
            const user = userEvent.setup();
            mockApi.post.mockRejectedValue({
                response: {
                    data: {},
                },
            });

            renderWithProviders(<CreatePost />);

            const textInput = screen.getByPlaceholderText("What's on your mind?");
            const postButton = screen.getByRole('button', { name: /post/i });

            await user.type(textInput, 'Hello, world!');
            await user.click(postButton);

            await waitFor(() => {
                expect(screen.getByText('Failed to create post. Please try again.')).toBeInTheDocument();
            });
        });

        it('should show error when text is empty', async () => {
            renderWithProviders(<CreatePost />);

            const textInput = screen.getByPlaceholderText("What's on your mind?");

            // Try to submit the form without text by triggering the submit event on the form element
            const formElement = textInput.closest('form');
            fireEvent.submit(formElement);

            expect(screen.getByText('Please enter some text for your post')).toBeInTheDocument();
        });

        it('should reset form after successful submission', async () => {
            const user = userEvent.setup();
            const onPostCreated = jest.fn();
            mockApi.post.mockResolvedValue({
                data: {
                    success: true,
                    data: {
                        _id: 'post123',
                        text: 'Hello, world!',
                        postedBy: mockUser,
                    },
                },
            });

            renderWithProviders(<CreatePost onPostCreated={onPostCreated} />);

            const textInput = screen.getByPlaceholderText("What's on your mind?");
            const postButton = screen.getByRole('button', { name: /post/i });

            await user.type(textInput, 'Hello, world!');
            await user.click(postButton);

            await waitFor(() => {
                expect(textInput).toHaveValue('');
            });
        });
    });

    describe('Cancel Functionality', () => {
        it('should clear form when cancel is clicked', async () => {
            const user = userEvent.setup();
            renderWithProviders(<CreatePost />);

            const textInput = screen.getByPlaceholderText("What's on your mind?");
            const cancelButton = screen.getByRole('button', { name: /cancel/i });

            await user.type(textInput, 'Hello, world!');
            expect(textInput).toHaveValue('Hello, world!');

            await user.click(cancelButton);
            expect(textInput).toHaveValue('');
        });
    });

    describe('Loading States', () => {
        it('should show loading state during submission', async () => {
            const user = userEvent.setup();
            let resolvePromise;
            const promise = new Promise((resolve) => {
                resolvePromise = resolve;
            });
            mockApi.post.mockReturnValue(promise);

            renderWithProviders(<CreatePost />);

            const textInput = screen.getByPlaceholderText("What's on your mind?");
            const postButton = screen.getByRole('button', { name: /post/i });

            await user.type(textInput, 'Hello, world!');
            await user.click(postButton);

            expect(screen.getByText('Posting...')).toBeInTheDocument();
            expect(postButton).toBeDisabled();

            resolvePromise();
        });

        it('should disable form inputs during submission', async () => {
            const user = userEvent.setup();
            let resolvePromise;
            const promise = new Promise((resolve) => {
                resolvePromise = resolve;
            });
            mockApi.post.mockReturnValue(promise);

            renderWithProviders(<CreatePost />);

            const textInput = screen.getByPlaceholderText("What's on your mind?");
            const fileInput = document.querySelector('#post-photo-upload');
            const postButton = screen.getByRole('button', { name: /post/i });

            await user.type(textInput, 'Hello, world!');
            await user.click(postButton);

            expect(textInput).toBeDisabled();
            expect(fileInput).toBeDisabled();

            resolvePromise();
        });
    });

    describe('Error Handling', () => {
        it('should clear error when user starts typing', async () => {
            const user = userEvent.setup();
            mockApi.post.mockRejectedValue({
                response: {
                    data: {},
                },
            });

            renderWithProviders(<CreatePost />);

            const textInput = screen.getByPlaceholderText("What's on your mind?");
            const postButton = screen.getByRole('button', { name: /post/i });

            await user.type(textInput, 'Hello, world!');
            await user.click(postButton);

            await waitFor(() => {
                expect(screen.getByText('Failed to create post. Please try again.')).toBeInTheDocument();
            });

            await user.type(textInput, ' more text');

            expect(screen.queryByText('Failed to create post. Please try again.')).not.toBeInTheDocument();
        });
    });
}); 