import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    Card,
    CardContent,
    Button,
    Avatar,
    Alert,
    CircularProgress,
    Grid,
    Paper,
    Chip,
    Divider,
} from '@mui/material';
import { ArrowBack, Edit } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const UserDetail = () => {
    const { id } = useParams();
    const { user: currentUser } = useAuth();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                setLoading(true);
                // This would be replaced with actual API call
                // const response = await api.get(`/users/${id}`);
                // setUser(response.data.user);

                // Mock data for now
                setUser({
                    _id: id,
                    firstName: 'John',
                    lastName: 'Doe',
                    username: 'johndoe',
                    email: 'john@example.com',
                    role: 'user',
                    isActive: true,
                    avatar: '',
                    bio: 'This is a sample bio for the user.',
                    createdAt: '2024-01-01T00:00:00.000Z',
                    updatedAt: '2024-01-01T00:00:00.000Z',
                });
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchUser();
        }
    }, [id]);

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