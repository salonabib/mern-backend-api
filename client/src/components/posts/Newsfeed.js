import React, { useState, useEffect, useCallback } from 'react';
import {
    Container,
    Typography,
    Box,
    Grid,
    CircularProgress,
    Alert,
    Button,
    Tabs,
    Tab,
} from '@mui/material';
import { Refresh, Add } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import CreatePost from './CreatePost';
import Post from './Post';
import UserSuggestions from '../user/UserSuggestions';

const Newsfeed = () => {
    const { api } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState(0);
    const [showCreatePost, setShowCreatePost] = useState(false);

    const fetchPosts = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const endpoint = activeTab === 0 ? '/posts/feed' : '/posts';
            const response = await api.get(endpoint);

            if (response.data.success) {
                setPosts(response.data.data);
            } else {
                setError(response.data.message || 'Failed to fetch posts');
            }
        } catch (err) {
            console.error('Error fetching posts:', err);
            setError(err.response?.data?.message || 'Failed to fetch posts. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [api, activeTab]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

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

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleRefresh = () => {
        fetchPosts();
    };

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
                        {/* Header */}
                        <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h4" component="h1">
                                    {activeTab === 0 ? 'Newsfeed' : 'All Posts'}
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
                                    <Button
                                        variant="contained"
                                        startIcon={<Add />}
                                        onClick={() => setShowCreatePost(!showCreatePost)}
                                    >
                                        New Post
                                    </Button>
                                </Box>
                            </Box>

                            {/* Tabs */}
                            <Tabs value={activeTab} onChange={handleTabChange}>
                                <Tab label="Newsfeed" />
                                <Tab label="All Posts" />
                            </Tabs>
                        </Box>

                        {/* Error Alert */}
                        {error && (
                            <Alert severity="error" sx={{ mb: 3 }}>
                                {error}
                            </Alert>
                        )}

                        {/* Create Post */}
                        {showCreatePost && (
                            <CreatePost onPostCreated={handlePostCreated} />
                        )}

                        {/* Posts List */}
                        {posts.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography variant="h6" color="text.secondary" gutterBottom>
                                    {activeTab === 0
                                        ? 'No posts from people you follow yet.'
                                        : 'No posts available.'
                                    }
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    {activeTab === 0
                                        ? 'Follow some users to see their posts in your newsfeed!'
                                        : 'Be the first to create a post!'
                                    }
                                </Typography>
                                {activeTab === 1 && (
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

                    {/* Sidebar */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Box sx={{ position: 'sticky', top: 24 }}>
                            <UserSuggestions />
                        </Box>
                    </Grid>
                </Grid>
            </Box>
        </Container>
    );
};

export default Newsfeed; 