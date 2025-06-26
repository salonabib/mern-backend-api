import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
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
} from '@mui/material';
import {
    Edit,
    Email,
    Person,
    CalendarToday,
    Badge,
} from '@mui/icons-material';
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
                        <Grid xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" component="h2" gutterBottom>
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
                                    <Typography variant="h6" component="h2" gutterBottom>
                                        Additional Information
                                    </Typography>
                                    {user.bio ? (
                                        <Box sx={{ mb: 3 }}>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                Bio
                                            </Typography>
                                            <Typography variant="body1">
                                                {user.bio}
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <Box sx={{ mb: 3 }}>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                Bio
                                            </Typography>
                                            <Typography variant="body1" color="text.secondary" fontStyle="italic">
                                                No bio added yet.
                                            </Typography>
                                        </Box>
                                    )}

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

                                    <Box>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Last Updated
                                        </Typography>
                                        <Typography variant="body1">
                                            {formatDate(user.updatedAt)}
                                        </Typography>
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