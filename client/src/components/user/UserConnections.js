import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Avatar,
    Tabs,
    Tab,
    CircularProgress,
    Alert,
    Button,
} from '@mui/material';
import { PersonRemove } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const UserConnections = ({ userId }) => {
    const { api } = useAuth();
    const [activeTab, setActiveTab] = useState(0);
    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchConnections = useCallback(async () => {
        try {
            setLoading(true);
            const [followersRes, followingRes] = await Promise.all([
                api.get(`/users/${userId}/followers`),
                api.get(`/users/${userId}/following`)
            ]);
            setFollowers(followersRes.data.data);
            setFollowing(followingRes.data.data);
        } catch (err) {
            setError('Failed to fetch connections');
            console.error('Error fetching connections:', err);
        } finally {
            setLoading(false);
        }
    }, [api, userId]);

    useEffect(() => {
        fetchConnections();
    }, [fetchConnections]);

    const handleUnfollow = async (userIdToUnfollow) => {
        try {
            await api.put('/users/unfollow', { unfollowId: userIdToUnfollow });
            // Remove from following list
            setFollowing(prev => prev.filter(user => user._id !== userIdToUnfollow));
        } catch (err) {
            console.error('Error unfollowing user:', err);
        }
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    if (loading) {
        return (
            <Card>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <CircularProgress size={24} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Loading connections...
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

    const renderUserList = (users, showUnfollow = false) => {
        if (users.length === 0) {
            return (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                        No {activeTab === 0 ? 'followers' : 'following'} yet.
                    </Typography>
                </Box>
            );
        }

        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {users.map((user) => {
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
                                    alt={user.firstName}
                                    sx={{ width: 48, height: 48, mr: 2 }}
                                >
                                    {user.firstName?.charAt(0)}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle1" fontWeight="medium">
                                        {user.firstName} {user.lastName}
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
                            {showUnfollow && (
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<PersonRemove />}
                                    onClick={() => handleUnfollow(user._id)}
                                    color="error"
                                >
                                    Unfollow
                                </Button>
                            )}
                        </Box>
                    );
                })}
            </Box>
        );
    };

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Connections
                </Typography>

                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tabs value={activeTab} onChange={handleTabChange}>
                        <Tab
                            label={`Followers (${followers.length})`}
                            id="connections-tab-0"
                            aria-controls="connections-tabpanel-0"
                        />
                        <Tab
                            label={`Following (${following.length})`}
                            id="connections-tab-1"
                            aria-controls="connections-tabpanel-1"
                        />
                    </Tabs>
                </Box>

                <Box
                    role="tabpanel"
                    hidden={activeTab !== 0}
                    id="connections-tabpanel-0"
                    aria-labelledby="connections-tab-0"
                >
                    {renderUserList(followers)}
                </Box>

                <Box
                    role="tabpanel"
                    hidden={activeTab !== 1}
                    id="connections-tabpanel-1"
                    aria-labelledby="connections-tab-1"
                >
                    {renderUserList(following, true)}
                </Box>
            </CardContent>
        </Card>
    );
};

export default UserConnections; 