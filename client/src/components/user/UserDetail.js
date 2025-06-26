import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    Box,
    Avatar,
    Button,
    Grid,
    Card,
    CardContent,
    Chip,
    Divider,
    CircularProgress,
    Alert,
} from '@mui/material';
import {
    ArrowBack,
    Edit,
    Email,
    Person,
    CalendarToday,
    Badge,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const UserDetail = () => {
    const { id } = useParams();
    const { api, user: currentUser } = useAuth();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchUser = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get(`/users/${id}`);
            setUser(response.data.data);
        } catch (err) {
            setError('Failed to fetch user details');
            console.error('Error fetching user:', err);
        } finally {
            setLoading(false);
        }
    }, [api, id]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <Container maxWidth="md">
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (error || !user) {
        return (
            <Container maxWidth="md">
                <Box sx={{ mt: 4, mb: 4 }}>
                    <Alert severity="error">
                        {error || 'User not found'}
                    </Alert>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBack />}
                        component={RouterLink}
                        to="/users"
                        sx={{ mt: 2 }}
                    >
                        Back to Users
                    </Button>
                </Box>
            </Container>
        );
    }

    const canEdit = currentUser?.role === 'admin' || currentUser?.id === user._id;

    return (
        <Container maxWidth="md">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Paper elevation={3} sx={{ p: 4 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                        <Button
                            variant="outlined"
                            startIcon={<ArrowBack />}
                            component={RouterLink}
                            to="/users"
                            sx={{ mr: 2 }}
                        >
                            Back to Users
                        </Button>
                        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
                            User Details
                        </Typography>
                        {canEdit && (
                            <Button
                                variant="contained"
                                component={RouterLink}
                                to={`/users/${id}/edit`}
                                startIcon={<Edit />}
                            >
                                Edit User
                            </Button>
                        )}
                    </Box>

                    {/* User Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                        <Avatar
                            src={user.avatar}
                            alt={user.firstName}
                            sx={{ width: 120, height: 120, mr: 3 }}
                        >
                            {user.firstName?.charAt(0)}
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h3" component="h2" gutterBottom>
                                {user.firstName} {user.lastName}
                            </Typography>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                @{user.username}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Chip
                                    label={user.role === 'admin' ? 'Administrator' : 'User'}
                                    color={user.role === 'admin' ? 'primary' : 'default'}
                                />
                                <Chip
                                    label={user.isActive ? 'Active' : 'Inactive'}
                                    color={user.isActive ? 'success' : 'error'}
                                />
                            </Box>
                        </Box>
                    </Box>

                    <Divider sx={{ mb: 4 }} />

                    {/* User Information */}
                    <Grid container spacing={4}>
                        <Grid xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" component="h3" gutterBottom>
                                        Personal Information
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Person sx={{ mr: 2, color: 'primary.main' }} />
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Full Name
                                            </Typography>
                                            <Typography variant="body1">
                                                {user.firstName} {user.lastName}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Badge sx={{ mr: 2, color: 'primary.main' }} />
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Username
                                            </Typography>
                                            <Typography variant="body1">
                                                @{user.username}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Email sx={{ mr: 2, color: 'primary.main' }} />
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Email Address
                                            </Typography>
                                            <Typography variant="body1">
                                                {user.email}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <CalendarToday sx={{ mr: 2, color: 'primary.main' }} />
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Member Since
                                            </Typography>
                                            <Typography variant="body1">
                                                {formatDate(user.createdAt)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" component="h3" gutterBottom>
                                        Account Information
                                    </Typography>
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Account Status
                                        </Typography>
                                        <Chip
                                            label={user.isActive ? 'Active Account' : 'Inactive Account'}
                                            color={user.isActive ? 'success' : 'error'}
                                            variant="outlined"
                                        />
                                    </Box>

                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            User Role
                                        </Typography>
                                        <Chip
                                            label={user.role === 'admin' ? 'Administrator' : 'Regular User'}
                                            color={user.role === 'admin' ? 'primary' : 'default'}
                                            variant="outlined"
                                        />
                                    </Box>

                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Last Updated
                                        </Typography>
                                        <Typography variant="body1">
                                            {formatDate(user.updatedAt)}
                                        </Typography>
                                    </Box>

                                    {user.bio && (
                                        <Box>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                Bio
                                            </Typography>
                                            <Typography variant="body1">
                                                {user.bio}
                                            </Typography>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Actions */}
                    <Box sx={{ mt: 4, textAlign: 'center' }}>
                        <Typography variant="h6" gutterBottom>
                            Actions
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                            {canEdit && (
                                <Button
                                    variant="outlined"
                                    component={RouterLink}
                                    to={`/users/${id}/edit`}
                                    startIcon={<Edit />}
                                >
                                    Edit User
                                </Button>
                            )}
                            {currentUser?.role === 'admin' && currentUser?.id !== user._id && (
                                <Button
                                    variant="outlined"
                                    component={RouterLink}
                                    to="/users"
                                >
                                    Manage Users
                                </Button>
                            )}
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default UserDetail; 