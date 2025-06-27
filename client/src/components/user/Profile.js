import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    Card,
    CardContent,
    Button,
    Avatar,
    Paper,
    Chip,
    Divider,
    Grid,
} from '@mui/material';
import { Edit } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import UserConnections from './UserConnections';

const Profile = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return <LoadingSpinner message="Loading profile..." />;
    }

    if (!user) {
        return null;
    }

    // Get photo URL if user has a photo
    const photoUrl = user.photo ? `/api/users/${user._id}/photo` : null;

    return (
        <Container maxWidth="lg">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Grid container spacing={4}>
                    {/* Main Profile Section */}
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Paper elevation={3} sx={{ p: 4 }}>
                            {/* Header */}
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                                <Avatar
                                    src={photoUrl}
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
                                                    src={photoUrl}
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
                                            {user?.about && (
                                                <Box sx={{ mb: 2 }}>
                                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                        About
                                                    </Typography>
                                                    <Typography variant="body1" paragraph>
                                                        {user.about}
                                                    </Typography>
                                                </Box>
                                            )}
                                            {user?.bio && (
                                                <Box sx={{ mb: 2 }}>
                                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                        Bio
                                                    </Typography>
                                                    <Typography variant="body1" paragraph>
                                                        {user.bio}
                                                    </Typography>
                                                </Box>
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
                    </Grid>

                    {/* Sidebar with Connections */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <UserConnections userId={user._id} />
                    </Grid>
                </Grid>
            </Box>
        </Container>
    );
};

export default Profile; 