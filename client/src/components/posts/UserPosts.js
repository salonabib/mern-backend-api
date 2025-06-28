import React, { useState, useEffect, useCallback } from 'react';
import {
    Container,
    Typography,
    Box,
    Grid,
    CircularProgress,
    Alert,
    Button,
    Avatar,
    Paper,
} from '@mui/material';
import { Refresh, Add } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import CreatePost from './CreatePost';
import Post from './Post';
import { Link as RouterLink } from 'react-router-dom';

const UserPosts = ({ userId, userInfo }) => {
    const { user: currentUser, api } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreatePost, setShowCreatePost] = useState(false);

    const fetchUserPosts = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const response = await api.get(`/posts/by-user/${userId}`);

            if (response.data.success) {
                setPosts(response.data.data);
            } else {
                setError(response.data.message || 'Failed to fetch posts');
            }
        } catch (err) {
            console.error('Error fetching user posts:', err);
            setError(err.response?.data?.message || 'Failed to fetch posts. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [api, userId]);

    useEffect(() => {
        fetchUserPosts();
    }, [fetchUserPosts]);

    const handlePostCreated = (newPost) => {
        setPosts(prevPosts => [newPost, ...prevPosts]);
        setShowCreatePost(false);
    };

    const handlePostUpdated = (updatedPost) => {
        setPosts(prevPosts =>
            prevPosts.map(post =>
                post._id === updatedPost._id ? updatedPost : post
            )
        );
    };

    const handlePostDeleted = (postId) => {
        setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
    };

    const handleRefresh = () => {
        fetchUserPosts();
    };

    const isOwnProfile = currentUser?._id === userId;
    const photoUrl = userInfo?.photo ? `/api/users/${userId}/photo` : null;

    if (loading && posts.length === 0) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Grid container spacing={4}>
                    {/* Main Content */}
                    <Grid size={{ xs: 12, md: 8 }}>
                        {/* User Header */}
                        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Avatar
                                    src={photoUrl}
                                    alt={userInfo?.name}
                                    sx={{ width: 64, height: 64, mr: 3 }}
                                >
                                    {userInfo?.name?.charAt(0)}
                                </Avatar>
                                <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="h4" component="h1" gutterBottom>
                                        {userInfo?.name}
                                    </Typography>
                                    <Typography
                                        variant="h6"
                                        color="text.secondary"
                                        gutterBottom
                                        component={RouterLink}
                                        to={`/users/${userInfo?._id}`}
                                        sx={{
                                            textDecoration: 'none',
                                            color: 'inherit',
                                            '&:hover': {
                                                color: 'primary.main',
                                                textDecoration: 'underline'
                                            }
                                        }}
                                    >
                                        @{userInfo?.username}
                                    </Typography>
                                    {userInfo?.about && (
                                        <Typography variant="body1" color="text.secondary">
                                            {userInfo.about}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>

                            {/* Actions */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6" color="text.secondary">
                                    {posts.length} post{posts.length !== 1 ? 's' : ''}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                        variant="outlined"
                                        startIcon={<Refresh />}
                                        onClick={handleRefresh}
                                        disabled={loading}
                                    >
                                        Refresh
                                    </Button>
                                    {isOwnProfile && (
                                        <Button
                                            variant="contained"
                                            startIcon={<Add />}
                                            onClick={() => setShowCreatePost(!showCreatePost)}
                                        >
                                            New Post
                                        </Button>
                                    )}
                                </Box>
                            </Box>
                        </Paper>

                        {/* Error Alert */}
                        {error && (
                            <Alert severity="error" sx={{ mb: 3 }}>
                                {error}
                            </Alert>
                        )}

                        {/* Create Post (only for own profile) */}
                        {isOwnProfile && showCreatePost && (
                            <CreatePost onPostCreated={handlePostCreated} />
                        )}

                        {/* Posts List */}
                        {posts.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography variant="h6" color="text.secondary" gutterBottom>
                                    {isOwnProfile
                                        ? 'You haven\'t created any posts yet.'
                                        : `${userInfo?.name} hasn\'t created any posts yet.`
                                    }
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    {isOwnProfile
                                        ? 'Share your thoughts with the world!'
                                        : 'Check back later for new posts!'
                                    }
                                </Typography>
                                {isOwnProfile && (
                                    <Button
                                        variant="contained"
                                        onClick={() => setShowCreatePost(true)}
                                    >
                                        Create Your First Post
                                    </Button>
                                )}
                            </Box>
                        ) : (
                            <Box>
                                {posts.map((post) => (
                                    <Post
                                        key={post._id}
                                        post={post}
                                        onPostUpdated={handlePostUpdated}
                                        onPostDeleted={handlePostDeleted}
                                    />
                                ))}

                                {loading && posts.length > 0 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                        <CircularProgress />
                                    </Box>
                                )}
                            </Box>
                        )}
                    </Grid>

                    {/* Sidebar - could add user stats, recent activity, etc. */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper elevation={2} sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                User Stats
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Posts
                                    </Typography>
                                    <Typography variant="body2" fontWeight="medium">
                                        {posts.length}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Total Likes
                                    </Typography>
                                    <Typography variant="body2" fontWeight="medium">
                                        {posts.reduce((total, post) => total + (post.likes?.length || 0), 0)}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Total Comments
                                    </Typography>
                                    <Typography variant="body2" fontWeight="medium">
                                        {posts.reduce((total, post) => total + (post.comments?.length || 0), 0)}
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </Container>
    );
};

export default UserPosts; 