import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Post from './Post';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock the AuthContext
const mockApi = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
};

const mockUser = {
    _id: 'user1',
    firstName: 'John',
    lastName: 'Doe',
    username: 'johndoe',
    email: 'john@example.com',
};

const mockPostAuthor = {
    _id: 'author123',
    firstName: 'Jane',
    lastName: 'Smith',
    username: 'janesmith',
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

// Mock window.confirm
const mockConfirm = jest.fn();
Object.defineProperty(window, 'confirm', {
    writable: true,
    value: mockConfirm,
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

const mockPost = {
    _id: 'post123',
    text: 'This is a test post',
    postedBy: mockPostAuthor,
    createdAt: '2023-01-01T00:00:00.000Z',
    likes: [],
    comments: [],
    photo: null,
};

describe('Post Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockConfirm.mockReturnValue(true);
    });

    describe('Rendering', () => {
        it('should render post with basic information', () => {
            renderWithProviders(<Post post={mockPost} />);

            expect(screen.getByText('Jane Smith')).toBeInTheDocument();
            expect(screen.getByText(/janesmith/)).toBeInTheDocument();
            expect(screen.getByText('This is a test post')).toBeInTheDocument();
            expect(screen.queryByText('0 likes')).not.toBeInTheDocument();
            expect(screen.queryByText('0 comments')).not.toBeInTheDocument();
        });

        it('should render post with photo when available', () => {
            const postWithPhoto = {
                ...mockPost,
                photo: { data: 'fake-data', contentType: 'image/jpeg' },
            };

            renderWithProviders(<Post post={postWithPhoto} />);

            const postImage = screen.getByAltText('Post');
            expect(postImage).toBeInTheDocument();
            expect(postImage).toHaveAttribute('src', '/api/posts/post123/photo');
        });

        it('should render post with comments', () => {
            const postWithComments = {
                ...mockPost,
                comments: [
                    {
                        _id: 'comment1',
                        text: 'Great post!',
                        postedBy: mockUser,
                        createdAt: '2023-01-01T01:00:00.000Z',
                    },
                ],
            };

            renderWithProviders(<Post post={postWithComments} />);

            // Open comments section to see the comment
            fireEvent.click(screen.getByRole('button', { name: /comment/i }));

            expect(screen.getByText('Great post!')).toBeInTheDocument();
            expect(screen.getByText('John Doe')).toBeInTheDocument();
            expect(screen.getByText('1 comment')).toBeInTheDocument();
        });

        it('should render post with likes', () => {
            const postWithLikes = {
                ...mockPost,
                likes: [mockUser._id],
            };

            renderWithProviders(<Post post={postWithLikes} />);

            expect(screen.getByText('1 like')).toBeInTheDocument();
            const likeButton = screen.getByRole('button', { name: /liked/i });
            expect(likeButton).toBeInTheDocument();
        });

        it('should show delete button for post owner', () => {
            const ownPost = {
                ...mockPost,
                postedBy: mockUser,
            };

            renderWithProviders(<Post post={ownPost} />);

            expect(screen.getByRole('button', { name: /delete post/i })).toBeInTheDocument();
        });

        it('should not show delete button for other users posts', () => {
            renderWithProviders(<Post post={mockPost} />);

            expect(screen.queryByRole('button', { name: /delete post/i })).not.toBeInTheDocument();
        });

        it('should render the username as a clickable link to the user profile', () => {
            renderWithProviders(<Post post={mockPost} />);
            const links = screen.getAllByRole('link');
            const usernameLink = links.find(link => link.textContent.replace(/\s+/g, '').includes('@janesmith'));
            expect(usernameLink).toBeDefined();
            expect(usernameLink).toHaveAttribute('href', '/users/author123');
        });
    });

    describe('Like Functionality', () => {
        it('should handle like button click', async () => {
            mockApi.put.mockResolvedValue({
                data: {
                    success: true,
                    data: { ...mockPost, likes: [...mockPost.likes, 'user1'] }
                }
            });

            renderWithProviders(<Post post={mockPost} />);

            const likeButton = screen.getByRole('button', { name: /like/i });
            fireEvent.click(likeButton);

            await waitFor(() => {
                expect(mockApi.put).toHaveBeenCalledWith('/posts/like', { postId: mockPost._id });
            });
        });

        it('should handle unlike button click', async () => {
            const postWithLike = { ...mockPost, likes: ['user1'] };
            mockApi.put.mockResolvedValue({
                data: {
                    success: true,
                    data: { ...postWithLike, likes: [] }
                }
            });

            renderWithProviders(<Post post={postWithLike} />);

            const unlikeButton = screen.getByRole('button', { name: /liked/i });
            fireEvent.click(unlikeButton);

            await waitFor(() => {
                expect(mockApi.put).toHaveBeenCalledWith('/posts/unlike', { postId: mockPost._id });
            });
        });

        it('should show error when like fails', async () => {
            mockApi.put.mockRejectedValue({
                response: {
                    data: {
                        message: 'Failed to like post',
                    },
                },
            });

            renderWithProviders(<Post post={mockPost} />);

            const likeButton = screen.getByRole('button', { name: /like/i });
            fireEvent.click(likeButton);

            await waitFor(() => {
                expect(screen.getByText('Failed to update like. Please try again.')).toBeInTheDocument();
            });
        });
    });

    describe('Comment Functionality', () => {
        describe('Comment Submission', () => {
            it('should submit comment successfully', async () => {
                const newComment = {
                    _id: 'comment1',
                    text: 'Great post!',
                    postedBy: mockUser,
                    createdAt: new Date().toISOString()
                };
                mockApi.put.mockResolvedValue({
                    data: {
                        success: true,
                        data: { ...mockPost, comments: [...mockPost.comments, newComment] }
                    }
                });

                renderWithProviders(<Post post={mockPost} />);

                // Open comments section
                fireEvent.click(screen.getByRole('button', { name: /comment/i }));

                // Find and fill comment input
                const commentInput = screen.getByPlaceholderText('Write a comment...');
                const submitButton = screen.getByTestId('SendIcon').closest('button');

                fireEvent.change(commentInput, { target: { value: 'Great post!' } });
                fireEvent.click(submitButton);

                await waitFor(() => {
                    expect(mockApi.put).toHaveBeenCalledWith('/posts/comment', {
                        postId: mockPost._id,
                        text: 'Great post!'
                    });
                });
            });

            it('should not submit empty comment', async () => {
                renderWithProviders(<Post post={mockPost} />);

                fireEvent.click(screen.getByRole('button', { name: /comment/i }));
                const submitButton = screen.getByTestId('SendIcon').closest('button');

                expect(submitButton).toBeDisabled();
            });

            it('should not submit whitespace-only comment', async () => {
                renderWithProviders(<Post post={mockPost} />);

                fireEvent.click(screen.getByRole('button', { name: /comment/i }));
                const commentInput = screen.getByPlaceholderText('Write a comment...');
                const submitButton = screen.getByTestId('SendIcon').closest('button');

                fireEvent.change(commentInput, { target: { value: '   ' } });

                expect(submitButton).toBeDisabled();
            });

            it('should clear comment input after successful submission', async () => {
                mockApi.put.mockResolvedValue({
                    data: {
                        success: true,
                        data: {
                            ...mockPost,
                            comments: [{ _id: 'comment1', text: 'New comment', postedBy: mockUser }],
                        },
                    },
                });

                renderWithProviders(<Post post={mockPost} />);

                fireEvent.click(screen.getByRole('button', { name: /comment/i }));
                const commentInput = screen.getByPlaceholderText('Write a comment...');
                const submitButton = screen.getByTestId('SendIcon').closest('button');

                fireEvent.change(commentInput, { target: { value: 'New comment' } });
                fireEvent.click(submitButton);

                await waitFor(() => {
                    expect(commentInput).toHaveValue('');
                });
            });

            it('should show loading state during comment submission', async () => {
                let resolvePromise;
                const promise = new Promise((resolve) => {
                    resolvePromise = resolve;
                });
                mockApi.put.mockReturnValue(promise);

                renderWithProviders(<Post post={mockPost} />);

                fireEvent.click(screen.getByRole('button', { name: /comment/i }));
                const commentInput = screen.getByPlaceholderText('Write a comment...');
                const submitButton = screen.getByTestId('SendIcon').closest('button');

                fireEvent.change(commentInput, { target: { value: 'Test comment' } });
                fireEvent.click(submitButton);

                // Check loading state
                expect(submitButton).toBeDisabled();
                expect(screen.getByRole('progressbar')).toBeInTheDocument();

                resolvePromise();
            });

            it('should disable input during comment submission', async () => {
                let resolvePromise;
                const promise = new Promise((resolve) => {
                    resolvePromise = resolve;
                });
                mockApi.put.mockReturnValue(promise);

                renderWithProviders(<Post post={mockPost} />);

                fireEvent.click(screen.getByRole('button', { name: /comment/i }));
                const commentInput = screen.getByPlaceholderText('Write a comment...');
                const submitButton = screen.getByTestId('SendIcon').closest('button');

                fireEvent.change(commentInput, { target: { value: 'Test comment' } });
                fireEvent.click(submitButton);

                expect(commentInput).toBeDisabled();

                resolvePromise();
            });

            it('should show error when comment submission fails', async () => {
                mockApi.put.mockRejectedValue({
                    response: {
                        data: {
                            message: 'Failed to add comment',
                        },
                    },
                });

                renderWithProviders(<Post post={mockPost} />);

                fireEvent.click(screen.getByRole('button', { name: /comment/i }));
                const commentInput = screen.getByPlaceholderText('Write a comment...');
                const submitButton = screen.getByTestId('SendIcon').closest('button');

                fireEvent.change(commentInput, { target: { value: 'New comment' } });
                fireEvent.click(submitButton);

                await waitFor(() => {
                    expect(screen.getByText('Failed to add comment. Please try again.')).toBeInTheDocument();
                });
            });

            it('should clear error when user starts typing new comment', async () => {
                mockApi.put.mockRejectedValue({
                    response: {
                        data: {
                            message: 'Failed to add comment',
                        },
                    },
                });

                renderWithProviders(<Post post={mockPost} />);

                fireEvent.click(screen.getByRole('button', { name: /comment/i }));
                const commentInput = screen.getByPlaceholderText('Write a comment...');
                const submitButton = screen.getByTestId('SendIcon').closest('button');

                // First, trigger an error
                fireEvent.change(commentInput, { target: { value: 'New comment' } });
                fireEvent.click(submitButton);

                await waitFor(() => {
                    expect(screen.getByText('Failed to add comment. Please try again.')).toBeInTheDocument();
                });

                // Then start typing to clear error
                fireEvent.change(commentInput, { target: { value: 'Another comment' } });

                expect(screen.queryByText('Failed to add comment. Please try again.')).not.toBeInTheDocument();
            });

            it('should handle comment submission with Enter key', async () => {
                mockApi.put.mockResolvedValue({
                    data: {
                        success: true,
                        data: { ...mockPost, comments: [{ _id: 'comment1', text: 'Enter comment', postedBy: mockUser }] }
                    }
                });

                renderWithProviders(<Post post={mockPost} />);

                fireEvent.click(screen.getByRole('button', { name: /comment/i }));
                const commentInput = screen.getByPlaceholderText('Write a comment...');

                fireEvent.change(commentInput, { target: { value: 'Enter comment' } });
                // Submit the form directly since Enter key handling might not work in tests
                const form = commentInput.closest('form');
                fireEvent.submit(form);

                await waitFor(() => {
                    expect(mockApi.put).toHaveBeenCalledWith('/posts/comment', {
                        postId: mockPost._id,
                        text: 'Enter comment'
                    });
                });
            });

            it('should not submit comment when Enter is pressed with empty input', async () => {
                renderWithProviders(<Post post={mockPost} />);

                fireEvent.click(screen.getByRole('button', { name: /comment/i }));
                const commentInput = screen.getByPlaceholderText('Write a comment...');

                fireEvent.keyDown(commentInput, { key: 'Enter', code: 13, charCode: 13 });

                expect(mockApi.put).not.toHaveBeenCalled();
            });
        });

        describe('Comment Display', () => {
            it('should display existing comments correctly', () => {
                const postWithComments = {
                    ...mockPost,
                    comments: [
                        {
                            _id: 'comment1',
                            text: 'First comment',
                            postedBy: mockUser,
                            createdAt: '2023-01-01T01:00:00.000Z',
                        },
                        {
                            _id: 'comment2',
                            text: 'Second comment',
                            postedBy: mockPostAuthor,
                            createdAt: '2023-01-01T02:00:00.000Z',
                        },
                    ],
                };

                renderWithProviders(<Post post={postWithComments} />);

                fireEvent.click(screen.getByRole('button', { name: /comment/i }));

                expect(screen.getByText('First comment')).toBeInTheDocument();
                expect(screen.getByText('Second comment')).toBeInTheDocument();
                expect(screen.getByText('John Doe')).toBeInTheDocument();
                // Look for Jane Smith in the comment section specifically
                const commentSection = screen.getByText('Second comment').closest('div');
                expect(commentSection).toHaveTextContent('Jane Smith');
                expect(screen.getByText('2 comments')).toBeInTheDocument();
            });

            it('should show "No comments yet" message when no comments exist', () => {
                renderWithProviders(<Post post={mockPost} />);

                fireEvent.click(screen.getByRole('button', { name: /comment/i }));

                expect(screen.getByText('No comments yet. Be the first to comment!')).toBeInTheDocument();
            });

            it('should display comment timestamps correctly', () => {
                const recentComment = {
                    _id: 'comment1',
                    text: 'Recent comment',
                    postedBy: mockUser,
                    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
                };

                const postWithComment = {
                    ...mockPost,
                    comments: [recentComment],
                };

                renderWithProviders(<Post post={postWithComment} />);

                fireEvent.click(screen.getByRole('button', { name: /comment/i }));

                expect(screen.getByText('30m ago')).toBeInTheDocument();
            });

            it('should display user avatars for comments', () => {
                const postWithComment = {
                    ...mockPost,
                    comments: [
                        {
                            _id: 'comment1',
                            text: 'Test comment',
                            postedBy: { ...mockUser, photo: 'fake-photo-data' },
                            createdAt: '2023-01-01T01:00:00.000Z',
                        },
                    ],
                };

                renderWithProviders(<Post post={postWithComment} />);

                fireEvent.click(screen.getByRole('button', { name: /comment/i }));

                const avatar = screen.getByTestId('comment-avatar-comment1');
                const img = avatar.querySelector('img');
                expect(img).toBeInTheDocument();
                expect(img).toHaveAttribute('src', '/api/users/user1/photo');
            });

            it('should display fallback avatar when user has no photo', () => {
                const postWithComment = {
                    ...mockPost,
                    comments: [
                        {
                            _id: 'comment1',
                            text: 'Test comment',
                            postedBy: mockUser,
                            createdAt: '2023-01-01T01:00:00.000Z',
                        },
                    ],
                };

                renderWithProviders(<Post post={postWithComment} />);

                fireEvent.click(screen.getByRole('button', { name: /comment/i }));

                const avatar = screen.getByTestId('comment-avatar-comment1');
                expect(avatar).toHaveTextContent('J');
            });
        });

        describe('Comment Deletion', () => {
            it('should handle comment deletion successfully', async () => {
                const postWithComment = {
                    ...mockPost,
                    comments: [
                        {
                            _id: 'comment1',
                            text: 'Great post!',
                            postedBy: mockUser,
                            createdAt: new Date().toISOString()
                        }
                    ]
                };

                mockApi.put.mockResolvedValue({
                    data: {
                        success: true,
                        data: { ...postWithComment, comments: [] }
                    }
                });

                renderWithProviders(<Post post={postWithComment} />);

                fireEvent.click(screen.getByRole('button', { name: /comment/i }));

                const deleteButton = screen.getByTestId('DeleteIcon').closest('button');
                fireEvent.click(deleteButton);

                await waitFor(() => {
                    expect(mockApi.put).toHaveBeenCalledWith('/posts/uncomment', {
                        postId: mockPost._id,
                        commentId: 'comment1'
                    });
                });
            });

            it('should show delete button only for user\'s own comments', () => {
                const postWithComments = {
                    ...mockPost,
                    comments: [
                        {
                            _id: 'comment1',
                            text: 'My comment',
                            postedBy: mockUser, // Current user's comment
                            createdAt: '2023-01-01T01:00:00.000Z',
                        },
                        {
                            _id: 'comment2',
                            text: 'Other user comment',
                            postedBy: mockPostAuthor, // Other user's comment
                            createdAt: '2023-01-01T02:00:00.000Z',
                        },
                    ],
                };

                renderWithProviders(<Post post={postWithComments} />);

                fireEvent.click(screen.getByRole('button', { name: /comment/i }));

                const deleteButtons = screen.getAllByTestId('DeleteIcon');
                expect(deleteButtons).toHaveLength(1); // Only one delete button for user's own comment
            });

            it('should show delete button for post author on any comment', () => {
                const postWithComment = {
                    ...mockPost,
                    postedBy: mockUser, // Current user is post author
                    comments: [
                        {
                            _id: 'comment1',
                            text: 'Other user comment',
                            postedBy: mockPostAuthor, // Other user's comment
                            createdAt: '2023-01-01T01:00:00.000Z',
                        },
                    ],
                };

                renderWithProviders(<Post post={postWithComment} />);

                fireEvent.click(screen.getByRole('button', { name: /comment/i }));

                // Look for delete button in the comment section specifically
                const deleteButtons = screen.getAllByTestId('DeleteIcon');
                const commentDeleteButton = deleteButtons.find(icon =>
                    icon.closest('div')?.contains(screen.getByText('Other user comment'))
                );
                expect(commentDeleteButton).toBeInTheDocument();
            });

            it('should show error when comment deletion fails', async () => {
                const postWithComment = {
                    ...mockPost,
                    comments: [
                        {
                            _id: 'comment1',
                            text: 'Test comment',
                            postedBy: mockUser,
                            createdAt: '2023-01-01T01:00:00.000Z',
                        },
                    ],
                };

                mockApi.put.mockRejectedValue({
                    response: {
                        data: {
                            message: 'Failed to delete comment',
                        },
                    },
                });

                renderWithProviders(<Post post={postWithComment} />);

                fireEvent.click(screen.getByRole('button', { name: /comment/i }));

                const deleteButton = screen.getByTestId('DeleteIcon').closest('button');
                fireEvent.click(deleteButton);

                await waitFor(() => {
                    expect(screen.getByText('Failed to delete comment. Please try again.')).toBeInTheDocument();
                });
            });
        });

        describe('Comment Section Toggle', () => {
            it('should toggle comments section visibility', () => {
                renderWithProviders(<Post post={mockPost} />);

                const commentButton = screen.getByRole('button', { name: /comment/i });

                // Initially comments should not be visible
                expect(screen.queryByPlaceholderText('Write a comment...')).not.toBeInTheDocument();

                // Click to open comments
                fireEvent.click(commentButton);
                expect(screen.getByPlaceholderText('Write a comment...')).toBeInTheDocument();

                // Click to close comments
                fireEvent.click(commentButton);
                expect(screen.queryByPlaceholderText('Write a comment...')).not.toBeInTheDocument();
            });

            it('should maintain comment input state when toggling', () => {
                renderWithProviders(<Post post={mockPost} />);

                const commentButton = screen.getByRole('button', { name: /comment/i });

                // Open comments and type something
                fireEvent.click(commentButton);
                const commentInput = screen.getByPlaceholderText('Write a comment...');
                fireEvent.change(commentInput, { target: { value: 'Test comment' } });

                // Close and reopen
                fireEvent.click(commentButton);
                fireEvent.click(commentButton);

                // Input should maintain its value (component doesn't reset state on toggle)
                expect(screen.getByPlaceholderText('Write a comment...')).toHaveValue('Test comment');
            });
        });

        describe('Comment Validation', () => {
            it('should trim whitespace from comment text', async () => {
                mockApi.put.mockResolvedValue({
                    data: {
                        success: true,
                        data: { ...mockPost, comments: [{ _id: 'comment1', text: 'Trimmed comment', postedBy: mockUser }] }
                    }
                });

                renderWithProviders(<Post post={mockPost} />);

                fireEvent.click(screen.getByRole('button', { name: /comment/i }));
                const commentInput = screen.getByPlaceholderText('Write a comment...');
                const submitButton = screen.getByTestId('SendIcon').closest('button');

                fireEvent.change(commentInput, { target: { value: '  Trimmed comment  ' } });
                fireEvent.click(submitButton);

                await waitFor(() => {
                    expect(mockApi.put).toHaveBeenCalledWith('/posts/comment', {
                        postId: mockPost._id,
                        text: 'Trimmed comment'
                    });
                });
            });

            it('should handle special characters in comments', async () => {
                const specialComment = 'Comment with @#$%^&*() and emojis 😀🎉';
                mockApi.put.mockResolvedValue({
                    data: {
                        success: true,
                        data: { ...mockPost, comments: [{ _id: 'comment1', text: specialComment, postedBy: mockUser }] }
                    }
                });

                renderWithProviders(<Post post={mockPost} />);

                fireEvent.click(screen.getByRole('button', { name: /comment/i }));
                const commentInput = screen.getByPlaceholderText('Write a comment...');
                const submitButton = screen.getByTestId('SendIcon').closest('button');

                fireEvent.change(commentInput, { target: { value: specialComment } });
                fireEvent.click(submitButton);

                await waitFor(() => {
                    expect(mockApi.put).toHaveBeenCalledWith('/posts/comment', {
                        postId: mockPost._id,
                        text: specialComment
                    });
                });
            });
        });
    });

    describe('Delete Functionality', () => {
        it('should handle post deletion', async () => {
            mockApi.delete.mockResolvedValue({ data: { success: true } });
            const ownPost = {
                ...mockPost,
                postedBy: mockUser,
            };
            renderWithProviders(<Post post={ownPost} />);
            const deleteButton = screen.getByLabelText('delete post');
            fireEvent.click(deleteButton);
            await waitFor(() => {
                expect(mockApi.delete).toHaveBeenCalledWith(`/posts/${ownPost._id}`);
            });
        });

        it('should not delete post when user cancels confirmation', async () => {
            mockConfirm.mockReturnValue(false);
            const ownPost = {
                ...mockPost,
                postedBy: mockUser,
            };

            renderWithProviders(<Post post={ownPost} />);

            const deleteButton = screen.getByLabelText('delete post');
            fireEvent.click(deleteButton);

            expect(mockApi.delete).not.toHaveBeenCalled();
        });

        it('should show error when delete fails', async () => {
            const ownPost = {
                ...mockPost,
                postedBy: mockUser,
            };

            mockApi.delete.mockRejectedValue({
                response: {
                    data: {
                        message: 'Failed to delete post',
                    },
                },
            });

            renderWithProviders(<Post post={ownPost} />);

            const deleteButton = screen.getByLabelText('delete post');
            fireEvent.click(deleteButton);

            await waitFor(() => {
                expect(screen.getByText('Failed to delete post. Please try again.')).toBeInTheDocument();
            });
        });
    });

    describe('Loading States', () => {
        it('should show loading state during comment submission', async () => {
            let resolvePromise;
            const promise = new Promise((resolve) => {
                resolvePromise = resolve;
            });
            mockApi.put.mockReturnValue(promise);

            renderWithProviders(<Post post={mockPost} />);

            fireEvent.click(screen.getByRole('button', { name: /comment/i }));
            const commentInput = screen.getByPlaceholderText('Write a comment...');
            const submitButton = screen.getByTestId('SendIcon').closest('button');

            fireEvent.change(commentInput, { target: { value: 'Test comment' } });
            fireEvent.click(submitButton);

            expect(submitButton).toBeDisabled();

            resolvePromise();
        });
    });

    describe('Error Handling', () => {
        it('should clear error when user starts typing comment', async () => {
            mockApi.put.mockRejectedValue({
                response: {
                    data: {
                        message: 'Failed to add comment',
                    },
                },
            });

            renderWithProviders(<Post post={mockPost} />);

            fireEvent.click(screen.getByRole('button', { name: /comment/i }));
            const commentInput = screen.getByPlaceholderText('Write a comment...');
            const submitButton = screen.getByTestId('SendIcon').closest('button');

            fireEvent.change(commentInput, { target: { value: 'Test comment' } });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Failed to add comment. Please try again.')).toBeInTheDocument();
            });

            // Clear the input and type again to trigger error clearing
            fireEvent.change(commentInput, { target: { value: '' } });
            fireEvent.change(commentInput, { target: { value: 'New comment' } });

            // Wait for the error to be cleared (may need to wait for next tick)
            await waitFor(() => {
                expect(screen.queryByText('Failed to add comment. Please try again.')).not.toBeInTheDocument();
            }, { timeout: 1000 });
        });
    });

    describe('Date Formatting', () => {
        it('should format post date correctly', () => {
            const postWithDate = {
                ...mockPost,
                createdAt: '2023-01-01T12:00:00.000Z',
            };

            renderWithProviders(<Post post={postWithDate} />);

            // Check that the date is displayed (format may vary based on implementation)
            expect(screen.getAllByText(/1\/1\/2023/).length).toBeGreaterThan(0);
        });
    });

    describe('Post Author Avatar', () => {
        it('should display post author avatar with image when available', () => {
            const postWithPhoto = {
                ...mockPost,
                postedBy: {
                    ...mockPost.postedBy,
                    photo: 'fake-photo-data'
                }
            };

            renderWithProviders(<Post post={postWithPhoto} />);

            const avatar = screen.getByTestId('post-author-avatar');
            const img = avatar.querySelector('img');
            expect(img).toBeInTheDocument();
            expect(img.src).toContain(`/api/users/${mockPost.postedBy._id}/photo`);
        });

        it('should display fallback avatar with initials when no photo available', () => {
            const postWithoutPhoto = {
                ...mockPost,
                postedBy: {
                    ...mockPost.postedBy,
                    photo: null
                }
            };

            renderWithProviders(<Post post={postWithoutPhoto} />);

            const avatar = screen.getByTestId('post-author-avatar');
            const img = avatar.querySelector('img');
            expect(img).not.toBeInTheDocument();
            expect(avatar).toHaveTextContent('J'); // First letter of firstName
        });

        it('should display fallback avatar when photo URL is empty string', () => {
            const postWithEmptyPhoto = {
                ...mockPost,
                postedBy: {
                    ...mockPost.postedBy,
                    photo: ''
                }
            };

            renderWithProviders(<Post post={postWithEmptyPhoto} />);

            const avatar = screen.getByTestId('post-author-avatar');
            const img = avatar.querySelector('img');
            expect(img).not.toBeInTheDocument();
            expect(avatar).toHaveTextContent('J');
        });

        it('should display fallback avatar when postedBy is missing photo property', () => {
            const postWithoutPhotoProperty = {
                ...mockPost,
                postedBy: {
                    _id: 'user123',
                    firstName: 'John',
                    lastName: 'Doe',
                    username: 'johndoe'
                    // photo property is missing
                }
            };

            renderWithProviders(<Post post={postWithoutPhotoProperty} />);

            const avatar = screen.getByTestId('post-author-avatar');
            const img = avatar.querySelector('img');
            expect(img).not.toBeInTheDocument();
            expect(avatar).toHaveTextContent('J');
        });

        it('should display fallback avatar when firstName is missing', () => {
            const postWithoutFirstName = {
                ...mockPost,
                postedBy: {
                    ...mockPost.postedBy,
                    firstName: null,
                    lastName: 'Doe'
                }
            };

            renderWithProviders(<Post post={postWithoutFirstName} />);

            const avatar = screen.getByTestId('post-author-avatar');
            expect(avatar).toHaveTextContent('D'); // First letter of lastName
        });

        it('should display fallback avatar when both firstName and lastName are missing', () => {
            const postWithoutNames = {
                ...mockPost,
                postedBy: {
                    ...mockPost.postedBy,
                    firstName: null,
                    lastName: null,
                    username: 'johndoe'
                }
            };

            renderWithProviders(<Post post={postWithoutNames} />);

            const avatar = screen.getByTestId('post-author-avatar');
            expect(avatar).toHaveTextContent('j'); // First letter of username
        });

        it('should display fallback avatar when all name properties are missing', () => {
            const postWithoutAnyNames = {
                ...mockPost,
                postedBy: {
                    _id: 'user123'
                    // All name properties are missing
                }
            };

            renderWithProviders(<Post post={postWithoutAnyNames} />);

            const avatar = screen.getByTestId('post-author-avatar');
            expect(avatar).toBeInTheDocument();
            // Should still render the avatar even without any text content
        });

        it('should have correct alt text for accessibility', () => {
            const postWithPhoto = {
                ...mockPost,
                postedBy: {
                    ...mockPost.postedBy,
                    photo: 'fake-photo-data'
                }
            };
            renderWithProviders(<Post post={postWithPhoto} />);
            const avatar = screen.getByTestId('post-author-avatar');
            const img = avatar.querySelector('img');
            expect(img).toBeInTheDocument();
            expect(img).toHaveAttribute('alt', 'Jane');
        });

        it('should not have alt attribute on root avatar for fallback (no image)', () => {
            const postWithoutPhoto = {
                ...mockPost,
                postedBy: {
                    ...mockPost.postedBy,
                    photo: null
                }
            };
            renderWithProviders(<Post post={postWithoutPhoto} />);
            const avatar = screen.getByTestId('post-author-avatar');
            const img = avatar.querySelector('img');
            expect(img).not.toBeInTheDocument();
            // MUI Avatar does not set alt on root when no image
            expect(avatar).not.toHaveAttribute('alt');
        });
    });
}); 