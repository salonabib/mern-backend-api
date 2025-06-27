import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    Alert,
    CircularProgress,
    Grid,
    Avatar,
    IconButton,
} from '@mui/material';
import { Save, ArrowBack, PhotoCamera, Delete } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const EditProfile = () => {
    const { user, updateProfile } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        about: '',
        bio: '',
    });
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState('');
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                about: user.about || '',
                bio: user.bio || '',
            });
            // Set photo preview if user has a photo
            if (user.photo) {
                setPhotoPreview(`/api/users/${user._id}/photo`);
            }
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        // Clear error when user starts typing
        if (errors[e.target.name]) {
            setErrors({
                ...errors,
                [e.target.name]: '',
            });
        }
        // Clear success message when user starts editing
        if (successMessage) {
            setSuccessMessage('');
        }
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setErrors({ photo: 'Please select an image file' });
                return;
            }

            // Validate file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                setErrors({ photo: 'Image size must be less than 5MB' });
                return;
            }

            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
            setErrors({ ...errors, photo: '' });
        }
    };

    const handleRemovePhoto = () => {
        setPhotoFile(null);
        setPhotoPreview('');
        setErrors({ ...errors, photo: '' });
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.firstName.trim()) {
            newErrors.firstName = 'First name is required';
        } else if (formData.firstName.length > 50) {
            newErrors.firstName = 'First name cannot exceed 50 characters';
        }

        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Last name is required';
        } else if (formData.lastName.length > 50) {
            newErrors.lastName = 'Last name cannot exceed 50 characters';
        }

        if (formData.about && formData.about.length > 500) {
            newErrors.about = 'About cannot exceed 500 characters';
        }

        if (formData.bio && formData.bio.length > 500) {
            newErrors.bio = 'Bio cannot exceed 500 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const updateData = { ...formData };
            if (photoFile) {
                updateData.photo = photoFile;
            }

            const result = await updateProfile(updateData);
            if (result.success) {
                setSuccessMessage('Profile updated successfully!');
                setTimeout(() => {
                    navigate('/profile');
                }, 2000);
            } else {
                setErrors({ submit: result.error });
            }
        } catch (err) {
            setErrors({ submit: 'Failed to update profile. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/profile');
    };

    if (!user) {
        return null;
    }

    return (
        <Container maxWidth="md">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Paper elevation={3} sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                        <Button
                            variant="outlined"
                            startIcon={<ArrowBack />}
                            onClick={handleCancel}
                            sx={{ mr: 2 }}
                        >
                            Back to Profile
                        </Button>
                        <Typography variant="h4" component="h1">
                            Edit Profile
                        </Typography>
                    </Box>

                    {successMessage && (
                        <Alert severity="success" sx={{ mb: 3 }}>
                            {successMessage}
                        </Alert>
                    )}

                    {errors.submit && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {errors.submit}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit} noValidate>
                        {/* Photo Upload Section */}
                        <Box sx={{ mb: 4, textAlign: 'center' }}>
                            <Box sx={{ position: 'relative', display: 'inline-block' }}>
                                <Avatar
                                    src={photoPreview}
                                    alt={user.firstName}
                                    sx={{
                                        width: 120,
                                        height: 120,
                                        mb: 2,
                                        border: '3px solid #e0e0e0'
                                    }}
                                >
                                    {user.firstName?.charAt(0)}
                                </Avatar>
                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                    <input
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        id="photo-upload"
                                        type="file"
                                        onChange={handlePhotoChange}
                                    />
                                    <label htmlFor="photo-upload">
                                        <IconButton
                                            color="primary"
                                            aria-label="upload picture"
                                            component="span"
                                            disabled={isSubmitting}
                                        >
                                            <PhotoCamera />
                                        </IconButton>
                                    </label>
                                    {photoPreview && (
                                        <IconButton
                                            color="error"
                                            aria-label="remove picture"
                                            onClick={handleRemovePhoto}
                                            disabled={isSubmitting}
                                        >
                                            <Delete />
                                        </IconButton>
                                    )}
                                </Box>
                            </Box>
                            {errors.photo && (
                                <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                                    {errors.photo}
                                </Typography>
                            )}
                            <Typography variant="body2" color="text.secondary">
                                Upload a profile photo (max 5MB)
                            </Typography>
                        </Box>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    margin="normal"
                                    fullWidth
                                    id="firstName"
                                    label="First Name"
                                    name="firstName"
                                    autoComplete="given-name"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    error={!!errors.firstName}
                                    helperText={errors.firstName}
                                    disabled={isSubmitting}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    margin="normal"
                                    fullWidth
                                    id="lastName"
                                    label="Last Name"
                                    name="lastName"
                                    autoComplete="family-name"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    error={!!errors.lastName}
                                    helperText={errors.lastName}
                                    disabled={isSubmitting}
                                />
                            </Grid>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <TextField
                                margin="normal"
                                fullWidth
                                id="about"
                                label="About"
                                name="about"
                                multiline
                                rows={3}
                                value={formData.about}
                                onChange={handleChange}
                                error={!!errors.about}
                                helperText={errors.about || "Tell us about yourself (max 500 characters)"}
                                disabled={isSubmitting}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <TextField
                                margin="normal"
                                fullWidth
                                id="bio"
                                label="Bio"
                                name="bio"
                                multiline
                                rows={4}
                                value={formData.bio}
                                onChange={handleChange}
                                error={!!errors.bio}
                                helperText={errors.bio || "A longer bio about yourself (max 500 characters)"}
                                disabled={isSubmitting}
                            />
                        </Grid>

                        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                            <Button
                                variant="outlined"
                                onClick={handleCancel}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={isSubmitting}
                                startIcon={isSubmitting ? <CircularProgress size={20} /> : <Save />}
                            >
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default EditProfile; 