import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    Card,
    CardContent,
    Grid,
    Button,
    Avatar,
} from '@mui/material';
import {
    Home as HomeIcon,
    Security,
    Speed,
    Code,
    Login,
    PersonAdd,
    Feed,
    People,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import UserSuggestions from '../user/UserSuggestions';

const Home = () => {
    const { isAuthenticated, user } = useAuth();

    const features = [
        {
            icon: <Security sx={{ fontSize: 40 }} />,
            title: 'Secure Authentication',
            description: 'JWT-based authentication with password hashing and role-based access control.',
        },
        {
            icon: <Speed sx={{ fontSize: 40 }} />,
            title: 'Fast & Responsive',
            description: 'Built with React and Material-UI for a smooth, modern user experience.',
        },
        {
            icon: <Code sx={{ fontSize: 40 }} />,
            title: 'Full Stack MERN',
            description: 'Complete MERN stack application with MongoDB, Express, React, and Node.js.',
        },
    ];

    if (isAuthenticated) {
        // Get photo URL if user has a photo
        const photoUrl = user?.photo ? `/api/users/${user._id}/photo` : null;

        return (
            <Container maxWidth="lg" component="main" role="main">
                <Box sx={{ mt: 4, mb: 6 }}>
                    <Typography variant="h3" component="h1" gutterBottom align="center">
                        Welcome back, {user?.firstName}!
                    </Typography>
                    <Typography variant="h6" color="text.secondary" align="center" paragraph>
                        You're successfully logged into your MERN Social application.
                    </Typography>
                </Box>

                <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Grid container spacing={4}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Card sx={{ height: '100%' }}>
                                    <CardContent>
                                        <Typography variant="h5" component="h2" gutterBottom>
                                            Your Profile
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <Avatar
                                                src={photoUrl}
                                                alt={user?.firstName}
                                                sx={{ width: 64, height: 64, mr: 2 }}
                                            >
                                                {user?.firstName?.charAt(0)}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="h6">
                                                    {user?.firstName} {user?.lastName}
                                                </Typography>
                                                <Typography color="text.secondary">
                                                    @{user?.username}
                                                </Typography>
                                                <Typography color="text.secondary">
                                                    {user?.email}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Button
                                            variant="outlined"
                                            component={RouterLink}
                                            to="/profile"
                                            fullWidth
                                        >
                                            View Profile
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <Card sx={{ height: '100%' }}>
                                    <CardContent>
                                        <Typography variant="h5" component="h2" gutterBottom>
                                            Social Features
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            <Button
                                                variant="contained"
                                                component={RouterLink}
                                                to="/newsfeed"
                                                startIcon={<Feed />}
                                                fullWidth
                                            >
                                                Go to Newsfeed
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                component={RouterLink}
                                                to="/profile/edit"
                                                fullWidth
                                            >
                                                Edit Profile
                                            </Button>
                                            {user?.role === 'admin' && (
                                                <Button
                                                    variant="contained"
                                                    component={RouterLink}
                                                    to="/users"
                                                    startIcon={<People />}
                                                    fullWidth
                                                >
                                                    Manage Users
                                                </Button>
                                            )}
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        <Box sx={{ mt: 6 }}>
                            <Typography variant="h4" component="h2" gutterBottom align="center">
                                Application Features
                            </Typography>
                            <Grid container spacing={4} sx={{ mt: 2 }}>
                                {features.map((feature, index) => (
                                    <Grid size={{ xs: 12, md: 4 }} key={index}>
                                        <Card sx={{ height: '100%', textAlign: 'center' }}>
                                            <CardContent>
                                                <Box sx={{ color: 'primary.main', mb: 2 }}>
                                                    {feature.icon}
                                                </Box>
                                                <Typography variant="h6" component="h3" gutterBottom>
                                                    {feature.title}
                                                </Typography>
                                                <Typography color="text.secondary">
                                                    {feature.description}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    </Grid>

                    {/* Sidebar with User Suggestions */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <UserSuggestions />
                    </Grid>
                </Grid>
            </Container>
        );
    }

    // Landing page for non-authenticated users
    return (
        <Container maxWidth="lg" component="main" role="main">
            <Box sx={{ mt: 8, mb: 6, textAlign: 'center' }}>
                <HomeIcon sx={{ fontSize: 80, color: 'primary.main', mb: 3 }} />
                <Typography variant="h2" component="h1" gutterBottom>
                    Welcome to MERN Social
                </Typography>
                <Typography variant="h5" color="text.secondary" paragraph>
                    A full-stack social media application built with the MERN stack.
                </Typography>
                <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button
                        variant="contained"
                        size="large"
                        component={RouterLink}
                        to="/register"
                        startIcon={<PersonAdd />}
                    >
                        Get Started
                    </Button>
                    <Button
                        variant="outlined"
                        size="large"
                        component={RouterLink}
                        to="/login"
                        startIcon={<Login />}
                    >
                        Sign In
                    </Button>
                </Box>
            </Box>

            <Box sx={{ mt: 8 }}>
                <Typography variant="h4" component="h2" gutterBottom align="center">
                    Features
                </Typography>
                <Grid container spacing={4} sx={{ mt: 2 }}>
                    {features.map((feature, index) => (
                        <Grid size={{ xs: 12, md: 4 }} key={index}>
                            <Card sx={{ height: '100%', textAlign: 'center' }}>
                                <CardContent>
                                    <Box sx={{ color: 'primary.main', mb: 2 }}>
                                        {feature.icon}
                                    </Box>
                                    <Typography variant="h6" component="h3" gutterBottom>
                                        {feature.title}
                                    </Typography>
                                    <Typography color="text.secondary">
                                        {feature.description}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        </Container>
    );
};

export default Home; 