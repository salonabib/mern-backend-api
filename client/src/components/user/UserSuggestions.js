import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Avatar,
    Button,
    CircularProgress,
    Alert,
} from '@mui/material';
import { PersonAdd, Check } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const UserSuggestions = () => {
    const { api } = useAuth();
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [followingStates, setFollowingStates] = useState({});

    const fetchSuggestions = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/users/suggestions');
            const suggestionsData = response.data.data;
            console.log('Fetched suggestions data:', suggestionsData);
            setSuggestions(suggestionsData);

            // Initialize following states based on backend data
            const initialFollowingStates = {};
            suggestionsData.forEach(user => {
                if (user.isFollowing) {
                    initialFollowingStates[user._id] = 'following';
                }
            });
            setFollowingStates(initialFollowingStates);
        } catch (err) {
            setError('Failed to fetch suggestions');
            console.error('Error fetching suggestions:', err);
        } finally {
            setLoading(false);
        }
    }, [api]);

    useEffect(() => {
        fetchSuggestions();
    }, [fetchSuggestions]);

    const handleFollow = async (userId) => {
        try {
            setFollowingStates(prev => ({ ...prev, [userId]: 'loading' }));
            await api.put('/users/follow', { followId: userId });
            setFollowingStates(prev => ({ ...prev, [userId]: 'following' }));
            // Remove from suggestions after following
            setSuggestions(prev => prev.filter(user => user._id !== userId));
        } catch (err) {
            setFollowingStates(prev => ({ ...prev, [userId]: 'error' }));
            console.error('Error following user:', err);
        }
    };

    const handleUnfollow = async (userId) => {
        try {
            setFollowingStates(prev => ({ ...prev, [userId]: 'loading' }));
            await api.put('/users/unfollow', { unfollowId: userId });
            setFollowingStates(prev => ({ ...prev, [userId]: 'not-following' }));
        } catch (err) {
            setFollowingStates(prev => ({ ...prev, [userId]: 'following' }));
            console.error('Error unfollowing user:', err);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <CircularProgress size={24} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Loading suggestions...
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent>
                    <Alert severity="error">{error}</Alert>
                </CardContent>
            </Card>
        );
    }

    if (!suggestions || suggestions.length === 0) {
        return (
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        People to Follow
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        No suggestions available at the moment.
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    People to Follow
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {suggestions.map((user) => {
                        console.log('Rendering user:', user);
                        const isFollowing = followingStates[user._id] === 'following';
                        const isLoading = followingStates[user._id] === 'loading';
                        const photoUrl = user.photo ? `/api/users/${user._id}/photo` : null;

                        return (
                            <Box
                                key={user._id}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    p: 2,
                                    border: '1px solid #e0e0e0',
                                    borderRadius: 1,
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                    <Avatar
                                        src={photoUrl}
                                        alt={user.name}
                                        sx={{ width: 48, height: 48, mr: 2 }}
                                    >
                                        {user.name?.charAt(0)}
                                    </Avatar>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography
                                            variant="subtitle1"
                                            fontWeight="medium"
                                            component={RouterLink}
                                            to={`/users/${user._id}`}
                                            sx={{
                                                textDecoration: 'none',
                                                color: 'inherit',
                                                '&:hover': {
                                                    color: 'primary.main',
                                                    textDecoration: 'underline'
                                                }
                                            }}
                                        >
                                            User ID: {user._id}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            component={RouterLink}
                                            to={`/users/${user._id}`}
                                            sx={{
                                                textDecoration: 'none',
                                                color: 'inherit',
                                                '&:hover': {
                                                    color: 'primary.main',
                                                    textDecoration: 'underline'
                                                }
                                            }}
                                        >
                                            @{user.username}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Button
                                    variant={isFollowing ? "outlined" : "contained"}
                                    size="small"
                                    startIcon={
                                        isLoading ? (
                                            <CircularProgress size={16} />
                                        ) : isFollowing ? (
                                            <Check />
                                        ) : (
                                            <PersonAdd />
                                        )
                                    }
                                    onClick={() =>
                                        isFollowing
                                            ? handleUnfollow(user._id)
                                            : handleFollow(user._id)
                                    }
                                    disabled={isLoading}
                                    sx={{ minWidth: 100 }}
                                >
                                    {isLoading
                                        ? 'Loading...'
                                        : isFollowing
                                            ? 'Following'
                                            : 'Follow'
                                    }
                                </Button>
                            </Box>
                        );
                    })}
                </Box>
            </CardContent>
        </Card>
    );
};

export default UserSuggestions; 