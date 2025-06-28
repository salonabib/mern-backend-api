import React, { useState } from 'react';
import {
    Card,
    CardContent,
    CardActions,
    Typography,
    Box,
    Avatar,
    IconButton,
    Button,
    TextField,
    Divider,
    Chip,
    Alert,
    CircularProgress,
} from '@mui/material';
import {
    Favorite,
    FavoriteBorder,
    Comment,
    Share,
    Send,
    Delete,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { Link as RouterLink } from 'react-router-dom';

const Post = ({ post, onPostUpdated, onPostDeleted }) => {
    const { user, api } = useAuth();
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [isLiking, setIsLiking] = useState(false);
    const [isCommenting, setIsCommenting] = useState(false);
    const [error, setError] = useState('');

    const isLiked = post.likes?.includes(user?._id);
    const isAuthor = post.postedBy?._id === user?._id;
    const photoUrl = post.postedBy?.photo ? `/api/users/${post.postedBy._id}/photo` : null;

    // Helper function to get avatar initials with fallback logic
    const getAvatarInitials = (user) => {
        if (user?.name) return user.name.charAt(0);
        if (user?.firstName) return user.firstName.charAt(0);
        if (user?.lastName) return user.lastName.charAt(0);
        if (user?.username) return user.username.charAt(0);
        return '';
    };

    // Helper function to get alt text with fallback logic
    const getAvatarAltText = (user) => {
        if (user?.name) return user.name;
        if (user?.firstName) return user.firstName;
        if (user?.lastName) return user.lastName;
        if (user?.username) return user.username;
        return '';
    };

    const handleLike = async () => {
        if (!user) return;

        setIsLiking(true);
        setError('');

        try {
            const endpoint = isLiked ? '/posts/unlike' : '/posts/like';
            const response = await api.put(endpoint, { postId: post._id });

            if (response.data.success && onPostUpdated) {
                onPostUpdated(response.data.data);
            }
        } catch (err) {
            console.error('Error toggling like:', err);
            setError('Failed to update like. Please try again.');
        } finally {
            setIsLiking(false);
        }
    };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !user) return;

        setIsCommenting(true);
        setError('');

        try {
            const response = await api.put('/posts/comment', {
                postId: post._id,
                text: newComment.trim(),
            });

            if (response.data.success) {
                setNewComment('');
                if (onPostUpdated) {
                    onPostUpdated(response.data.data);
                }
            }
        } catch (err) {
            console.error('Error adding comment:', err);
            setError('Failed to add comment. Please try again.');
        } finally {
            setIsCommenting(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            const response = await api.put(`/posts/uncomment`, {
                postId: post._id,
                commentId,
            });

            if (response.data.success && onPostUpdated) {
                onPostUpdated(response.data.data);
            }
        } catch (err) {
            console.error('Error deleting comment:', err);
            setError('Failed to delete comment. Please try again.');
        }
    };

    const handleDeletePost = async () => {
        if (!window.confirm('Are you sure you want to delete this post?')) return;

        try {
            const response = await api.delete(`/posts/${post._id}`);

            if (response.data.success && onPostDeleted) {
                onPostDeleted(post._id);
            }
        } catch (err) {
            console.error('Error deleting post:', err);
            setError('Failed to delete post. Please try again.');
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            const diffInMinutes = Math.floor((now - date) / (1000 * 60));
            return `${diffInMinutes}m ago`;
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)}h ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    return (
        <Card sx={{ mb: 2 }}>
            <CardContent>
                {/* Post Header */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <Avatar
                        src={photoUrl}
                        alt={getAvatarAltText(post.postedBy)}
                        data-testid="post-author-avatar"
                        sx={{ width: 48, height: 48, mr: 2 }}
                    >
                        {getAvatarInitials(post.postedBy)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" fontWeight="medium">
                            User ID: {post.postedBy?._id}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            <Typography
                                component={RouterLink}
                                to={`/users/${post.postedBy?._id}`}
                                sx={{
                                    textDecoration: 'none',
                                    color: 'inherit',
                                    '&:hover': {
                                        color: 'primary.main',
                                        textDecoration: 'underline'
                                    }
                                }}
                            >
                                @{post.postedBy?.username}
                            </Typography>
                            {' '}• {formatDate(post.createdAt)}
                        </Typography>
                    </Box>
                    {isAuthor && (
                        <IconButton
                            size="small"
                            onClick={handleDeletePost}
                            color="error"
                            aria-label="delete post"
                        >
                            <Delete />
                        </IconButton>
                    )}
                </Box>

                {/* Post Content */}
                <Typography variant="body1" sx={{ mb: 2 }}>
                    {post.text}
                </Typography>

                {/* Post Photo */}
                {post.photo && (
                    <Box sx={{ mb: 2 }}>
                        <img
                            src={`/api/posts/${post._id}/photo`}
                            alt="Post"
                            style={{
                                width: '100%',
                                maxHeight: 400,
                                objectFit: 'cover',
                                borderRadius: 8,
                            }}
                        />
                    </Box>
                )}

                {/* Error Alert */}
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* Post Stats */}
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    {post.likes?.length > 0 && (
                        <Chip
                            label={`${post.likes.length} like${post.likes.length !== 1 ? 's' : ''}`}
                            size="small"
                            color="primary"
                            variant="outlined"
                        />
                    )}
                    {post.comments?.length > 0 && (
                        <Chip
                            label={`${post.comments.length} comment${post.comments.length !== 1 ? 's' : ''}`}
                            size="small"
                            color="secondary"
                            variant="outlined"
                        />
                    )}
                </Box>
            </CardContent>

            <Divider />

            {/* Post Actions */}
            <CardActions sx={{ justifyContent: 'space-around', py: 1 }}>
                <Button
                    startIcon={
                        isLiking ? (
                            <CircularProgress size={16} />
                        ) : isLiked ? (
                            <Favorite color="error" />
                        ) : (
                            <FavoriteBorder />
                        )
                    }
                    onClick={handleLike}
                    disabled={isLiking}
                    color={isLiked ? 'error' : 'inherit'}
                    sx={{ flex: 1 }}
                >
                    {isLiked ? 'Liked' : 'Like'}
                </Button>

                <Button
                    startIcon={<Comment />}
                    onClick={() => setShowComments(!showComments)}
                    sx={{ flex: 1 }}
                >
                    Comment
                </Button>

                <Button
                    startIcon={<Share />}
                    sx={{ flex: 1 }}
                >
                    Share
                </Button>
            </CardActions>

            {/* Comments Section */}
            {showComments && (
                <>
                    <Divider />
                    <Box sx={{ p: 2 }}>
                        {/* Add Comment */}
                        <Box component="form" onSubmit={handleComment} sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Write a comment..."
                                    value={newComment}
                                    onChange={(e) => {
                                        setNewComment(e.target.value);
                                        if (error) setError('');
                                    }}
                                    disabled={isCommenting}
                                />
                                <IconButton
                                    type="submit"
                                    disabled={!newComment.trim() || isCommenting}
                                    color="primary"
                                >
                                    {isCommenting ? (
                                        <CircularProgress size={20} />
                                    ) : (
                                        <Send />
                                    )}
                                </IconButton>
                            </Box>
                        </Box>

                        {/* Comments List */}
                        {post.comments?.length > 0 ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {post.comments.map((comment) => (
                                    <Box key={comment._id} sx={{ display: 'flex', gap: 1 }}>
                                        <Avatar
                                            src={comment.postedBy?.photo ? `/api/users/${comment.postedBy._id}/photo` : null}
                                            data-testid={`comment-avatar-${comment._id}`}
                                            sx={{ width: 32, height: 32 }}
                                        >
                                            {getAvatarInitials(comment.postedBy)}
                                        </Avatar>
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                <Typography variant="subtitle2" fontWeight="medium">
                                                    User ID: {comment.postedBy?._id}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {formatDate(comment.createdAt)}
                                                </Typography>
                                            </Box>
                                            <Typography variant="body2">
                                                {comment.text}
                                            </Typography>
                                        </Box>
                                        {(comment.postedBy?._id === user?._id || isAuthor) && (
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDeleteComment(comment._id)}
                                                color="error"
                                            >
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        )}
                                    </Box>
                                ))}
                            </Box>
                        ) : (
                            <Typography variant="body2" color="text.secondary" textAlign="center">
                                No comments yet. Be the first to comment!
                            </Typography>
                        )}
                    </Box>
                </>
            )}
        </Card>
    );
};

export default Post; 