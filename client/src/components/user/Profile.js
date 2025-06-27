import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
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
} from '@mui/material';
import { Edit } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

const Profile = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return <LoadingSpinner message="Loading profile..." />;
    }

    if (!user) {
        return null;
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <Container maxWidth="md">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Paper elevation={3} sx={{ p: 4 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                        <Avatar
                            src={user.avatar}
                            alt={user.firstName}
                            sx={{ width: 120, height: 120, mr: 3 }}
                        >
                            {user.firstName?.charAt(0)}
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h3" component="h1" gutterBottom>
                                {user.firstName} {user.lastName}
                            </Typography>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                @{user.username}
                            </Typography>
                            <Chip
                                label={user.role === 'admin' ? 'Administrator' : 'User'}
                                color={user.role === 'admin' ? 'primary' : 'default'}
                                sx={{ mr: 1 }}
                            />
                            <Chip
                                label={user.isActive ? 'Active' : 'Inactive'}
                                color={user.isActive ? 'success' : 'error'}
                            />
                        </Box>
                        <Button
                            variant="contained"
                            component={RouterLink}
                            to="/profile/edit"
                            startIcon={<Edit />}
                        >
                            Edit Profile
                        </Button>
                    </Box>

                    <Divider sx={{ mb: 4 }} />

                    {/* Profile Information */}
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
                                    <Button
                                        variant="contained"
                                        component={RouterLink}
                                        to="/profile/edit"
                                        startIcon={<Edit />}
                                        role="button"
                                    >
                                        Edit Profile
                                    </Button>
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

                    {/* Quick Actions */}
                    <Box sx={{ mt: 4, textAlign: 'center' }}>
                        <Typography variant="h6" gutterBottom>
                            Quick Actions
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Button
                                variant="outlined"
                                component={RouterLink}
                                to="/profile/edit"
                                startIcon={<Edit />}
                            >
                                Edit Profile
                            </Button>
                            {user.role === 'admin' && (
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

export default Profile; 