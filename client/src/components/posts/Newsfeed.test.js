import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Newsfeed from './Newsfeed';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock the AuthContext
const mockApi = {
    get: jest.fn(),
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

// Mock the Post component
jest.mock('./Post', () => {
    return function MockPost({ post, onPostUpdated, onPostDeleted }) {
        return (
            <div data-testid={`post-${post._id}`}>
                <span>{post.text}</span>
                <button onClick={() => onPostUpdated && onPostUpdated(post)}>Update</button>
                <button onClick={() => onPostDeleted && onPostDeleted(post._id)}>Delete</button>
            </div>
        );
    };
});

// Mock the CreatePost component
jest.mock('./CreatePost', () => {
    return function MockCreatePost({ onPostCreated }) {
        return (
            <div data-testid="create-post">
                <button onClick={() => onPostCreated && onPostCreated({ _id: 'new-post', text: 'New post' })}>
                    Create Post
                </button>
            </div>
        );
    };
});

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

const mockPosts = [
    {
        _id: 'post1',
        text: 'First post',
        postedBy: {
            _id: 'user1',
            firstName: 'Jane',
            lastName: 'Smith',
            username: 'janesmith',
        },
        createdAt: '2023-01-01T00:00:00.000Z',
        likes: [],
        comments: [],
    },
    {
        _id: 'post2',
        text: 'Second post',
        postedBy: {
            _id: 'user2',
            firstName: 'Bob',
            lastName: 'Johnson',
            username: 'bobjohnson',
        },
        createdAt: '2023-01-01T01:00:00.000Z',
        likes: [mockUser._id],
        comments: [],
    },
];

describe('Newsfeed Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render newsfeed with title', async () => {
            mockApi.get.mockResolvedValue({
                data: {
                    success: true,
                    data: mockPosts,
                    pagination: {
                        page: 1,
                        limit: 10,
                        pages: 1,
                        total: 2,
                    },
                },
            });

            renderWithProviders(<Newsfeed />);

            await waitFor(() => {
                expect(screen.getByRole('heading', { name: 'Newsfeed' })).toBeInTheDocument();
            });
        });

        it('should render create post component', async () => {
            mockApi.get.mockResolvedValue({
                data: {
                    success: true,
                    data: mockPosts,
                    pagination: {
                        page: 1,
                        limit: 10,
                        pages: 1,
                        total: 2,
                    },
                },
            });

            renderWithProviders(<Newsfeed />);

            await waitFor(() => {
                expect(screen.getByText('New Post')).toBeInTheDocument();
            });
        });

        it('should render posts when data is loaded', async () => {
            mockApi.get.mockResolvedValue({
                data: {
                    success: true,
                    data: mockPosts,
                    pagination: {
                        page: 1,
                        limit: 10,
                        pages: 1,
                        total: 2,
                    },
                },
            });

            renderWithProviders(<Newsfeed />);

            await waitFor(() => {
                expect(screen.getByTestId('post-post1')).toBeInTheDocument();
                expect(screen.getByTestId('post-post2')).toBeInTheDocument();
            });
        });

        it('should show loading spinner while fetching posts', () => {
            let resolvePromise;
            const promise = new Promise((resolve) => {
                resolvePromise = resolve;
            });
            mockApi.get.mockReturnValue(promise);

            renderWithProviders(<Newsfeed />);

            expect(screen.getByRole('progressbar')).toBeInTheDocument();

            resolvePromise();
        });

        it('should show empty state when no posts', async () => {
            mockApi.get.mockResolvedValue({
                data: {
                    success: true,
                    data: [],
                    pagination: {
                        page: 1,
                        limit: 10,
                        pages: 0,
                        total: 0,
                    },
                },
            });

            renderWithProviders(<Newsfeed />);

            await waitFor(() => {
                expect(screen.getByText('No posts from people you follow yet.')).toBeInTheDocument();
                expect(screen.getByText('Follow some users to see their posts in your newsfeed!')).toBeInTheDocument();
            });
        });
    });

    describe('Data Fetching', () => {
        it('should fetch posts on component mount', async () => {
            mockApi.get.mockResolvedValue({
                data: {
                    success: true,
                    data: mockPosts,
                    pagination: {
                        page: 1,
                        limit: 10,
                        pages: 1,
                        total: 2,
                    },
                },
            });

            renderWithProviders(<Newsfeed />);

            await waitFor(() => {
                expect(mockApi.get).toHaveBeenCalledWith('/posts/feed');
            });
        });

        it('should handle API error gracefully', async () => {
            mockApi.get.mockRejectedValue({
                response: {
                    data: {
                        message: 'Failed to fetch posts',
                    },
                },
            });

            renderWithProviders(<Newsfeed />);

            await waitFor(() => {
                expect(screen.getByText('Failed to fetch posts')).toBeInTheDocument();
            });
        });
    });

    describe('Post Updates', () => {
        it('should handle post updates from child components', async () => {
            const user = userEvent.setup();
            mockApi.get.mockResolvedValue({
                data: {
                    success: true,
                    data: mockPosts,
                    pagination: {
                        page: 1,
                        limit: 10,
                        pages: 1,
                        total: 2,
                    },
                },
            });

            renderWithProviders(<Newsfeed />);

            await waitFor(() => {
                expect(screen.getByTestId('post-post1')).toBeInTheDocument();
            });

            const updateButton = screen.getAllByText('Update')[0];
            await user.click(updateButton);

            // The post should still be in the list after update
            expect(screen.getByTestId('post-post1')).toBeInTheDocument();
        });

        it('should handle post deletion from child components', async () => {
            const user = userEvent.setup();
            mockApi.get.mockResolvedValue({
                data: {
                    success: true,
                    data: mockPosts,
                    pagination: {
                        page: 1,
                        limit: 10,
                        pages: 1,
                        total: 2,
                    },
                },
            });

            renderWithProviders(<Newsfeed />);

            await waitFor(() => {
                expect(screen.getByTestId('post-post1')).toBeInTheDocument();
            });

            const deleteButton = screen.getAllByText('Delete')[0];
            await user.click(deleteButton);

            // The post should be removed from the list
            expect(screen.queryByTestId('post-post1')).not.toBeInTheDocument();
        });
    });

    describe('Create Post Integration', () => {
        it('should add new post to the beginning of the list when created', async () => {
            const user = userEvent.setup();
            mockApi.get.mockResolvedValue({
                data: {
                    success: true,
                    data: mockPosts,
                    pagination: {
                        page: 1,
                        limit: 10,
                        pages: 1,
                        total: 2,
                    },
                },
            });

            renderWithProviders(<Newsfeed />);

            await waitFor(() => {
                expect(screen.getByTestId('post-post1')).toBeInTheDocument();
            });

            const newPostButton = screen.getByText('New Post');
            await user.click(newPostButton);

            // Wait for create post form to appear
            await waitFor(() => {
                expect(screen.getByTestId('create-post')).toBeInTheDocument();
            });

            const createButton = screen.getByText('Create Post');
            await user.click(createButton);

            // New post should be added to the list
            expect(screen.getByTestId('post-new-post')).toBeInTheDocument();
        });
    });

    describe('Error States', () => {
        it('should show error message when API returns error', async () => {
            mockApi.get.mockRejectedValue({
                response: {
                    data: {
                        message: 'Network error',
                    },
                },
            });

            renderWithProviders(<Newsfeed />);

            await waitFor(() => {
                expect(screen.getByText('Network error')).toBeInTheDocument();
            });
        });

        it('should show error message when API returns unsuccessful response', async () => {
            mockApi.get.mockResolvedValue({
                data: {
                    success: false,
                    message: 'Failed to fetch posts',
                },
            });

            renderWithProviders(<Newsfeed />);

            await waitFor(() => {
                expect(screen.getByText('Failed to fetch posts')).toBeInTheDocument();
            });
        });
    });

    describe('Loading States', () => {
        it('should show loading spinner during initial load', () => {
            let resolvePromise;
            const promise = new Promise((resolve) => {
                resolvePromise = resolve;
            });
            mockApi.get.mockReturnValue(promise);

            renderWithProviders(<Newsfeed />);

            expect(screen.getByRole('progressbar')).toBeInTheDocument();

            resolvePromise();
        });
    });
}); 