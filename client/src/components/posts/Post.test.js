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
        it('should handle comment submission', async () => {
            const newComment = {
                _id: 'comment1',
                text: 'Great post!',
                postedBy: {
                    _id: 'user1',
                    firstName: 'John',
                    lastName: 'Doe',
                    username: 'johndoe'
                },
                createdAt: new Date().toISOString()
            };
            mockApi.post.mockResolvedValue({
                data: {
                    success: true,
                    data: { ...mockPost, comments: [...mockPost.comments, newComment] }
                }
            });
            renderWithProviders(<Post post={mockPost} />);
            fireEvent.click(screen.getByRole('button', { name: /comment/i }));
            const commentInput = screen.getByPlaceholderText('Write a comment...');
            const submitButton = screen.getByTestId('SendIcon').closest('button');
            fireEvent.change(commentInput, { target: { value: 'Great post!' } });
            fireEvent.click(submitButton);
            await waitFor(() => {
                expect(mockApi.post).toHaveBeenCalledWith('/posts/comment', { postId: mockPost._id, text: 'Great post!' });
            });
        });

        it('should not submit empty comment', async () => {
            renderWithProviders(<Post post={mockPost} />);

            fireEvent.click(screen.getByRole('button', { name: /comment/i }));
            const submitButton = screen.getByTestId('SendIcon').closest('button');
            expect(submitButton).toBeDisabled();
        });

        it('should clear comment input after successful submission', async () => {
            mockApi.post.mockResolvedValue({
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

        it('should show error when comment submission fails', async () => {
            mockApi.post.mockRejectedValue({
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

    describe('Comment Deletion', () => {
        it('should handle comment deletion', async () => {
            const postWithComment = {
                ...mockPost,
                comments: [
                    {
                        _id: 'comment1',
                        text: 'Great post!',
                        postedBy: {
                            _id: 'user1',
                            firstName: 'John',
                            lastName: 'Doe',
                            username: 'johndoe'
                        },
                        createdAt: new Date().toISOString()
                    }
                ]
            };

            mockApi.delete.mockResolvedValue({
                data: {
                    success: true,
                    data: { ...postWithComment, comments: [] }
                }
            });

            renderWithProviders(<Post post={postWithComment} />);

            // Open comments section first
            fireEvent.click(screen.getByRole('button', { name: /comment/i }));

            const deleteButton = screen.getByTestId('DeleteIcon').closest('button');
            fireEvent.click(deleteButton);

            await waitFor(() => {
                expect(mockApi.delete).toHaveBeenCalledWith('/posts/uncomment', {
                    data: { postId: mockPost._id, commentId: 'comment1' }
                });
            });
        });

        it('should not show delete button for other users comments', () => {
            const postWithOtherComment = {
                ...mockPost,
                comments: [
                    {
                        _id: 'comment1',
                        text: 'Test comment',
                        postedBy: mockPostAuthor,
                        createdAt: '2023-01-01T01:00:00.000Z',
                    },
                ],
            };

            renderWithProviders(<Post post={postWithOtherComment} />);

            // Open comments section first
            fireEvent.click(screen.getByRole('button', { name: /comment/i }));

            expect(screen.queryByTestId('DeleteIcon')).not.toBeInTheDocument();
        });
    });

    describe('Loading States', () => {
        it('should show loading state during comment submission', async () => {
            let resolvePromise;
            const promise = new Promise((resolve) => {
                resolvePromise = resolve;
            });
            mockApi.post.mockReturnValue(promise);

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
            mockApi.post.mockRejectedValue({
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
}); 