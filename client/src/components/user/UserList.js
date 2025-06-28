import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    TextField,
    Button,
    Chip,
    Avatar,
    IconButton,
    Alert,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import {
    Search,
    Edit,
    Delete,
    Visibility,
    Add,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const UserList = () => {
    const { api } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalUsers, setTotalUsers] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page + 1,
                limit: rowsPerPage,
            });

            if (searchTerm) {
                params.append('search', searchTerm);
            }

            if (roleFilter !== 'all') {
                params.append('role', roleFilter);
            }

            const response = await api.get(`/users?${params}`);
            setUsers(response.data.data);
            setTotalUsers(response.data.total);
        } catch (err) {
            setError('Failed to fetch users');
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    }, [api, page, rowsPerPage, searchTerm, roleFilter]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
        setPage(0);
    };

    const handleRoleFilterChange = (event) => {
        setRoleFilter(event.target.value);
        setPage(0);
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) {
            return;
        }

        try {
            await api.delete(`/users/${userId}`);
            fetchUsers(); // Refresh the list
        } catch (err) {
            setError('Failed to delete user');
            console.error('Error deleting user:', err);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    if (loading && users.length === 0) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Paper elevation={3} sx={{ p: 4 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                        <Typography variant="h4" component="h1">
                            User Management
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            component={RouterLink}
                            to="/users/new"
                        >
                            Add User
                        </Button>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    {/* Filters */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                        <TextField
                            label="Search Users"
                            variant="outlined"
                            size="small"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            startIcon={<Search />}
                            sx={{ minWidth: 200 }}
                        />
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel>Role</InputLabel>
                            <Select
                                value={roleFilter}
                                label="Role"
                                onChange={handleRoleFilterChange}
                            >
                                <MenuItem value="all">All Roles</MenuItem>
                                <MenuItem value="user">User</MenuItem>
                                <MenuItem value="admin">Admin</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>

                    {/* Users Table */}
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>User</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Role</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Joined</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user._id} hover>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Avatar
                                                    src={user.photo ? `/api/users/${user._id}/photo` : null}
                                                    alt={user.firstName}
                                                    sx={{ width: 40, height: 40, mr: 2 }}
                                                >
                                                    {user.firstName?.charAt(0)}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="body2" fontWeight="medium">
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
                                        </TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={user.role === 'admin' ? 'Admin' : 'User'}
                                                color={user.role === 'admin' ? 'primary' : 'default'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={user.isActive ? 'Active' : 'Inactive'}
                                                color={user.isActive ? 'success' : 'error'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <IconButton
                                                    size="small"
                                                    component={RouterLink}
                                                    to={`/users/${user._id}`}
                                                    color="primary"
                                                >
                                                    <Visibility />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    component={RouterLink}
                                                    to={`/users/${user._id}/edit`}
                                                    color="primary"
                                                >
                                                    <Edit />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDeleteUser(user._id)}
                                                    color="error"
                                                >
                                                    <Delete />
                                                </IconButton>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Pagination */}
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        component="div"
                        count={totalUsers}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />

                    {users.length === 0 && !loading && (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography color="text.secondary">
                                No users found matching your criteria.
                            </Typography>
                        </Box>
                    )}
                </Paper>
            </Box>
        </Container>
    );
};

export default UserList; 