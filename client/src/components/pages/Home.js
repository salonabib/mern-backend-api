import React, { useState, useEffect } from 'react';
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
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Divider,
    Paper,
    LinearProgress,
    IconButton,
    Badge,
    Alert,
    Fade,
    Grow,
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
    TrendingUp,
    Notifications,
    Add,
    Favorite,
    Comment,
    Share,
    Visibility,
    Group,
    PostAdd,
    TrendingUp as TrendingIcon,
    Schedule,
    EmojiEvents,
    Psychology,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import UserSuggestions from '../user/UserSuggestions';

const Home = () => {
    const { isAuthenticated, user, api } = useAuth();
    const [stats, setStats] = useState({
        posts: 0,
        followers: 0,
        following: 0,
        likes: 0
    });
    const [recentActivity, setRecentActivity] = useState([]);
    const [trendingTopics, setTrendingTopics] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isAuthenticated) {
            fetchUserStats();
            fetchRecentActivity();
            fetchTrendingTopics();
        }
    }, [isAuthenticated]);

    const fetchUserStats = async () => {
        try {
            const response = await api.get(`/users/${user._id}`);
            if (response.data.success) {
                const userData = response.data.data;
                setStats({
                    posts: userData.posts?.length || 0,
                    followers: userData.followers?.length || 0,
                    following: userData.following?.length || 0,
                    likes: userData.totalLikes || 0
                });
            }
        } catch (error) {
            console.error('Error fetching user stats:', error);
        }
    };

    const fetchRecentActivity = async () => {
        try {
            const response = await api.get('/posts/feed?limit=5');
            if (response.data.success) {
                setRecentActivity(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching recent activity:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTrendingTopics = async () => {
        // Mock trending topics - in a real app, this would come from analytics
        setTrendingTopics([
            { tag: '#MERN', count: 156, trend: 'up' },
            { tag: '#React', count: 89, trend: 'up' },
            { tag: '#JavaScript', count: 234, trend: 'up' },
            { tag: '#WebDev', count: 67, trend: 'down' },
            { tag: '#Coding', count: 123, trend: 'up' },
        ]);
    };

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

    const quickActions = [
        {
            title: 'Create Post',
            icon: <PostAdd />,
            color: 'primary',
            link: '/create-post',
            description: 'Share your thoughts'
        },
        {
            title: 'View Feed',
            icon: <Feed />,
            color: 'secondary',
            link: '/newsfeed',
            description: 'See latest posts'
        },
        {
            title: 'Find People',
            icon: <People />,
            color: 'success',
            link: '/users',
            description: 'Connect with others'
        },
        {
            title: 'Edit Profile',
            icon: <Psychology />,
            color: 'info',
            link: '/profile/edit',
            description: 'Update your info'
        }
    ];

    if (isAuthenticated) {
        // Get photo URL if user has a photo
        const photoUrl = user?.photo ? `/api/users/${user._id}/photo` : null;

        return (
            <Container maxWidth="lg" component="main" role="main">
                <Fade in timeout={800}>
                    <Box sx={{ mt: 4, mb: 6 }}>
                        <Typography variant="h3" component="h1" gutterBottom align="center">
                            Welcome back, {user?.firstName}! 👋
                        </Typography>
                        <Typography variant="h6" color="text.secondary" align="center" paragraph>
                            Here's what's happening in your social world today.
                        </Typography>
                    </Box>
                </Fade>

                <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 8 }}>
                        {/* Quick Stats Dashboard */}
                        <Grow in timeout={1000}>
                            <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                                <CardContent>
                                    <Typography variant="h5" component="h2" gutterBottom sx={{ color: 'white' }}>
                                        Your Stats 📊
                                    </Typography>
                                    <Grid container spacing={3}>
                                        <Grid size={{ xs: 6, sm: 3 }}>
                                            <Box textAlign="center">
                                                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
                                                    {stats.posts}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                                    Posts
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        <Grid size={{ xs: 6, sm: 3 }}>
                                            <Box textAlign="center">
                                                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
                                                    {stats.followers}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                                    Followers
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        <Grid size={{ xs: 6, sm: 3 }}>
                                            <Box textAlign="center">
                                                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
                                                    {stats.following}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                                    Following
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        <Grid size={{ xs: 6, sm: 3 }}>
                                            <Box textAlign="center">
                                                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
                                                    {stats.likes}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                                    Total Likes
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grow>

                        {/* Quick Actions */}
                        <Grow in timeout={1200}>
                            <Box sx={{ mb: 4 }}>
                                <Typography variant="h5" component="h2" gutterBottom>
                                    Quick Actions ⚡
                                </Typography>
                                <Grid container spacing={2}>
                                    {quickActions.map((action, index) => (
                                        <Grid size={{ xs: 6, sm: 3 }} key={index}>
                                            <Card
                                                sx={{
                                                    height: '100%',
                                                    cursor: 'pointer',
                                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                                    '&:hover': {
                                                        transform: 'translateY(-4px)',
                                                        boxShadow: 4
                                                    }
                                                }}
                                                component={RouterLink}
                                                to={action.link}
                                            >
                                                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                                                    <Box sx={{ color: `${action.color}.main`, mb: 1 }}>
                                                        {action.icon}
                                                    </Box>
                                                    <Typography variant="subtitle2" gutterBottom>
                                                        {action.title}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {action.description}
                                                    </Typography>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        </Grow>

                        {/* Recent Activity */}
                        <Grow in timeout={1400}>
                            <Card sx={{ mb: 4 }}>
                                <CardContent>
                                    <Typography variant="h5" component="h2" gutterBottom>
                                        Recent Activity 📝
                                    </Typography>
                                    {loading ? (
                                        <Box sx={{ width: '100%' }}>
                                            <LinearProgress />
                                        </Box>
                                    ) : recentActivity.length > 0 ? (
                                        <List>
                                            {recentActivity.slice(0, 3).map((post, index) => (
                                                <React.Fragment key={post._id}>
                                                    <ListItem alignItems="flex-start">
                                                        <ListItemAvatar>
                                                            <Avatar
                                                                src={post.postedBy?.photo ? `/api/users/${post.postedBy._id}/photo` : null}
                                                                alt={post.postedBy?.firstName}
                                                            >
                                                                {post.postedBy?.firstName?.charAt(0)}
                                                            </Avatar>
                                                        </ListItemAvatar>
                                                        <ListItemText
                                                            primary={
                                                                <Typography variant="subtitle2">
                                                                    {post.postedBy?.firstName} {post.postedBy?.lastName}
                                                                </Typography>
                                                            }
                                                            secondary={
                                                                <Typography
                                                                    variant="body2"
                                                                    color="text.secondary"
                                                                    sx={{
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                        display: '-webkit-box',
                                                                        WebkitLineClamp: 2,
                                                                        WebkitBoxOrient: 'vertical',
                                                                    }}
                                                                >
                                                                    {post.text}
                                                                </Typography>
                                                            }
                                                        />
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Chip
                                                                size="small"
                                                                icon={<Favorite sx={{ fontSize: 16 }} />}
                                                                label={post.likes?.length || 0}
                                                                variant="outlined"
                                                            />
                                                            <Chip
                                                                size="small"
                                                                icon={<Comment sx={{ fontSize: 16 }} />}
                                                                label={post.comments?.length || 0}
                                                                variant="outlined"
                                                            />
                                                        </Box>
                                                    </ListItem>
                                                    {index < recentActivity.length - 1 && <Divider variant="inset" component="li" />}
                                                </React.Fragment>
                                            ))}
                                        </List>
                                    ) : (
                                        <Alert severity="info">
                                            No recent activity. Start by creating your first post!
                                        </Alert>
                                    )}
                                    <Button
                                        variant="outlined"
                                        component={RouterLink}
                                        to="/newsfeed"
                                        fullWidth
                                        sx={{ mt: 2 }}
                                    >
                                        View All Posts
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grow>

                        {/* Application Features */}
                        <Grow in timeout={1600}>
                            <Box sx={{ mt: 6 }}>
                                <Typography variant="h4" component="h2" gutterBottom align="center">
                                    Application Features 🚀
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
                        </Grow>
                    </Grid>

                    {/* Sidebar */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Grow in timeout={1800}>
                            <Box>
                                {/* User Profile Card */}
                                <Card sx={{ mb: 3 }}>
                                    <CardContent>
                                        <Typography variant="h6" component="h2" gutterBottom>
                                            Your Profile 👤
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
                                                <Typography
                                                    color="text.secondary"
                                                    component={RouterLink}
                                                    to={`/users/${user?._id}`}
                                                    sx={{
                                                        textDecoration: 'none',
                                                        color: 'inherit',
                                                        '&:hover': {
                                                            color: 'primary.main',
                                                            textDecoration: 'underline'
                                                        }
                                                    }}
                                                >
                                                    @{user?.username}
                                                </Typography>
                                                <Typography color="text.secondary" variant="body2">
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

                                {/* Trending Topics */}
                                <Card sx={{ mb: 3 }}>
                                    <CardContent>
                                        <Typography variant="h6" component="h2" gutterBottom>
                                            <TrendingIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                            Trending Topics
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                            {trendingTopics.map((topic, index) => (
                                                <Chip
                                                    key={index}
                                                    label={`${topic.tag} ${topic.count}`}
                                                    size="small"
                                                    color={topic.trend === 'up' ? 'primary' : 'default'}
                                                    variant="outlined"
                                                    clickable
                                                />
                                            ))}
                                        </Box>
                                    </CardContent>
                                </Card>

                                {/* User Suggestions */}
                                <UserSuggestions />
                            </Box>
                        </Grow>
                    </Grid>
                </Grid>
            </Container>
        );
    }

    // Landing page for non-authenticated users
    return (
        <Container maxWidth="lg" component="main" role="main">
            <Fade in timeout={800}>
                <Box sx={{ mt: 8, mb: 6, textAlign: 'center' }}>
                    <HomeIcon sx={{ fontSize: 80, color: 'primary.main', mb: 3 }} />
                    <Typography variant="h2" component="h1" gutterBottom>
                        Welcome to MERN Social 🚀
                    </Typography>
                    <Typography variant="h5" color="text.secondary" paragraph>
                        Connect, share, and engage with a modern social media experience built with the MERN stack.
                    </Typography>
                    <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Button
                            variant="contained"
                            size="large"
                            component={RouterLink}
                            to="/register"
                            startIcon={<PersonAdd />}
                            sx={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
                                }
                            }}
                        >
                            Get Started Free
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
            </Fade>

            {/* Hero Stats */}
            <Grow in timeout={1000}>
                <Box sx={{ mb: 8 }}>
                    <Grid container spacing={4} sx={{ textAlign: 'center' }}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Typography variant="h3" color="primary.main" sx={{ fontWeight: 'bold' }}>
                                1000+
                            </Typography>
                            <Typography variant="h6" color="text.secondary">
                                Active Users
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Typography variant="h3" color="primary.main" sx={{ fontWeight: 'bold' }}>
                                50K+
                            </Typography>
                            <Typography variant="h6" color="text.secondary">
                                Posts Shared
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Typography variant="h3" color="primary.main" sx={{ fontWeight: 'bold' }}>
                                99.9%
                            </Typography>
                            <Typography variant="h6" color="text.secondary">
                                Uptime
                            </Typography>
                        </Grid>
                    </Grid>
                </Box>
            </Grow>

            {/* Features Section */}
            <Grow in timeout={1200}>
                <Box sx={{ mt: 8, mb: 8 }}>
                    <Typography variant="h4" component="h2" gutterBottom align="center">
                        Why Choose MERN Social? ✨
                    </Typography>
                    <Grid container spacing={4} sx={{ mt: 2 }}>
                        {features.map((feature, index) => (
                            <Grid size={{ xs: 12, md: 4 }} key={index}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        textAlign: 'center',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: 4
                                        }
                                    }}
                                >
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
            </Grow>

            {/* Additional Features */}
            <Grow in timeout={1400}>
                <Box sx={{ mb: 8 }}>
                    <Typography variant="h4" component="h2" gutterBottom align="center">
                        More Amazing Features 🎯
                    </Typography>
                    <Grid container spacing={4} sx={{ mt: 2 }}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Card sx={{ height: '100%' }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <EmojiEvents sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                                        <Typography variant="h6" component="h3">
                                            Real-time Interactions
                                        </Typography>
                                    </Box>
                                    <Typography color="text.secondary">
                                        Like, comment, and share posts in real-time. Experience seamless social interactions with instant updates and notifications.
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Card sx={{ height: '100%' }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Group sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                                        <Typography variant="h6" component="h3">
                                            Community Building
                                        </Typography>
                                    </Box>
                                    <Typography color="text.secondary">
                                        Connect with like-minded people, follow your interests, and build meaningful relationships in our growing community.
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Card sx={{ height: '100%' }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Visibility sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                                        <Typography variant="h6" component="h3">
                                            Privacy Control
                                        </Typography>
                                    </Box>
                                    <Typography color="text.secondary">
                                        Full control over your privacy settings. Choose who sees your posts and manage your online presence with confidence.
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Card sx={{ height: '100%' }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Schedule sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                                        <Typography variant="h6" component="h3">
                                            Always Available
                                        </Typography>
                                    </Box>
                                    <Typography color="text.secondary">
                                        Access your social network anytime, anywhere. Our responsive design works perfectly on desktop, tablet, and mobile devices.
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>
            </Grow>

            {/* Call to Action */}
            <Grow in timeout={1600}>
                <Box sx={{
                    mt: 8,
                    mb: 8,
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: 4,
                    p: 6,
                    color: 'white'
                }}>
                    <Typography variant="h3" component="h2" gutterBottom sx={{ color: 'white' }}>
                        Ready to Join the Community? 🎉
                    </Typography>
                    <Typography variant="h6" paragraph sx={{ color: 'rgba(255,255,255,0.9)' }}>
                        Start sharing your stories, connecting with friends, and building your online presence today.
                    </Typography>
                    <Button
                        variant="contained"
                        size="large"
                        component={RouterLink}
                        to="/register"
                        startIcon={<PersonAdd />}
                        sx={{
                            background: 'white',
                            color: 'primary.main',
                            '&:hover': {
                                background: 'rgba(255,255,255,0.9)'
                            }
                        }}
                    >
                        Create Your Account
                    </Button>
                </Box>
            </Grow>
        </Container>
    );
};

export default Home; 