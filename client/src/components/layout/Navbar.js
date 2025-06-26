import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    IconButton,
    Menu,
    MenuItem,
    Avatar,
    Divider,
} from '@mui/material';
import {
    AccountCircle,
    People,
    Home,
    Login,
    PersonAdd,
    Logout,
    Settings,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);

    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        logout();
        handleClose();
        navigate('/');
    };

    const handleProfile = () => {
        handleClose();
        navigate('/profile');
    };

    const handleEditProfile = () => {
        handleClose();
        navigate('/profile/edit');
    };

    const handleUsers = () => {
        handleClose();
        navigate('/users');
    };

    return (
        <AppBar position="static">
            <Toolbar>
                <Typography
                    variant="h6"
                    component={RouterLink}
                    to="/"
                    sx={{
                        flexGrow: 1,
                        textDecoration: 'none',
                        color: 'inherit',
                        fontWeight: 'bold',
                    }}
                >
                    MERN App
                </Typography>

                {isAuthenticated ? (
                    <>
                        <Button
                            color="inherit"
                            component={RouterLink}
                            to="/"
                            startIcon={<Home />}
                        >
                            Home
                        </Button>

                        {user?.role === 'admin' && (
                            <Button
                                color="inherit"
                                component={RouterLink}
                                to="/users"
                                startIcon={<People />}
                            >
                                Users
                            </Button>
                        )}

                        <IconButton
                            size="large"
                            aria-label="account of current user"
                            aria-controls="menu-appbar"
                            aria-haspopup="true"
                            onClick={handleMenu}
                            color="inherit"
                        >
                            {user?.avatar ? (
                                <Avatar
                                    src={user.avatar}
                                    alt={user.firstName}
                                    sx={{ width: 32, height: 32 }}
                                />
                            ) : (
                                <AccountCircle />
                            )}
                        </IconButton>
                        <Menu
                            id="menu-appbar"
                            anchorEl={anchorEl}
                            anchorOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            open={Boolean(anchorEl)}
                            onClose={handleClose}
                        >
                            <MenuItem onClick={handleProfile}>
                                <AccountCircle sx={{ mr: 1 }} />
                                Profile
                            </MenuItem>
                            <MenuItem onClick={handleEditProfile}>
                                <Settings sx={{ mr: 1 }} />
                                Edit Profile
                            </MenuItem>
                            {user?.role === 'admin' && (
                                <MenuItem onClick={handleUsers}>
                                    <People sx={{ mr: 1 }} />
                                    Manage Users
                                </MenuItem>
                            )}
                            <Divider />
                            <MenuItem onClick={handleLogout}>
                                <Logout sx={{ mr: 1 }} />
                                Logout
                            </MenuItem>
                        </Menu>
                    </>
                ) : (
                    <>
                        <Button
                            color="inherit"
                            component={RouterLink}
                            to="/login"
                            startIcon={<Login />}
                        >
                            Login
                        </Button>
                        <Button
                            color="inherit"
                            component={RouterLink}
                            to="/register"
                            startIcon={<PersonAdd />}
                        >
                            Register
                        </Button>
                    </>
                )}
            </Toolbar>
        </AppBar>
    );
};

export default Navbar; 