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
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h5" component="h2" gutterBottom>
                                        Personal Information
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                        <Avatar
                                            src={user?.avatar}
                                            alt={user?.firstName}
                                            sx={{ width: 80, height: 80, mr: 3 }}
                                        >
                                            {user?.firstName?.charAt(0)}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="h4" gutterBottom>
                                                {user?.firstName} {user?.lastName}
                                            </Typography>
                                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                                @{user?.username}
                                            </Typography>
                                            <Typography color="text.secondary">
                                                {user?.email}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    {user?.bio && (
                                        <Typography variant="body1" paragraph>
                                            {user.bio}
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h5" component="h2" gutterBottom>
                                        Account Details
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <Box>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                Role
                                            </Typography>
                                            <Typography variant="body1">
                                                {user?.role === 'admin' ? 'Administrator' : 'User'}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                Status
                                            </Typography>
                                            <Typography variant="body1">
                                                {user?.isActive ? 'Active' : 'Inactive'}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                Member Since
                                            </Typography>
                                            <Typography variant="body1">
                                                {new Date(user?.createdAt).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                Last Updated
                                            </Typography>
                                            <Typography variant="body1">
                                                {new Date(user?.updatedAt).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                    </Box>
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