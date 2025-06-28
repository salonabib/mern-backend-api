import React, { useState } from 'react';
import {
    Card,
    CardContent,
    TextField,
    Button,
    Box,
    Avatar,
    IconButton,
    Typography,
    Alert,
    CircularProgress,
} from '@mui/material';
import { PhotoCamera, Send, Clear } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { Link as RouterLink } from 'react-router-dom';

const CreatePost = ({ onPostCreated }) => {
    const { user, api } = useAuth();
    const [text, setText] = useState('');
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleTextChange = (e) => {
        setText(e.target.value);
        if (error) setError('');
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setError('Please select a valid image file');
                return;
            }

            // Validate file size (10MB limit)
            if (file.size > 10 * 1024 * 1024) {
                setError('Image size must be less than 10MB');
                return;
            }

            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
            setError('');
        }
    };

    const handleRemovePhoto = () => {
        setPhotoFile(null);
        setPhotoPreview('');
        if (photoPreview) {
            URL.revokeObjectURL(photoPreview);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!text.trim()) {
            setError('Please enter some text for your post');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('text', text.trim());
            if (photoFile) {
                formData.append('photo', photoFile);
            }

            const response = await api.post('/posts', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                // Reset form
                setText('');
                setPhotoFile(null);
                setPhotoPreview('');
                if (photoPreview) {
                    URL.revokeObjectURL(photoPreview);
                }

                // Notify parent component
                if (onPostCreated) {
                    onPostCreated(response.data.data);
                }
            } else {
                setError(response.data.message || 'Failed to create post');
            }
        } catch (err) {
            console.error('Error creating post:', err);
            setError(err.response?.data?.message || 'Failed to create post. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setText('');
        setPhotoFile(null);
        setPhotoPreview('');
        setError('');
        if (photoPreview) {
            URL.revokeObjectURL(photoPreview);
        }
    };

    const photoUrl = user?.photo ? `/api/users/${user._id}/photo` : null;

    return (
        <Card sx={{ mb: 3 }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <Avatar
                        src={photoUrl}
                        alt={user?.firstName}
                        sx={{ width: 48, height: 48, mr: 2 }}
                    >
                        {user?.firstName?.charAt(0)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" fontWeight="medium">
                            {user?.firstName} {user?.lastName}
                        </Typography>
                        <Typography
                            variant="body2"
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
                    </Box>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} noValidate>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="What's on your mind?"
                        value={text}
                        onChange={handleTextChange}
                        variant="outlined"
                        sx={{ mb: 2 }}
                        disabled={isSubmitting}
                    />

                    {photoPreview && (
                        <Box sx={{ mb: 2, position: 'relative', display: 'inline-block' }}>
                            <img
                                src={photoPreview}
                                alt="Preview"
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: 200,
                                    borderRadius: 8,
                                }}
                            />
                            <IconButton
                                size="small"
                                onClick={handleRemovePhoto}
                                sx={{
                                    position: 'absolute',
                                    top: 8,
                                    right: 8,
                                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                    color: 'white',
                                    '&:hover': {
                                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                    },
                                }}
                            >
                                <Clear />
                            </IconButton>
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <input
                                accept="image/*"
                                style={{ display: 'none' }}
                                id="post-photo-upload"
                                type="file"
                                onChange={handlePhotoChange}
                                disabled={isSubmitting}
                            />
                            <label htmlFor="post-photo-upload">
                                <IconButton
                                    color="primary"
                                    component="span"
                                    disabled={isSubmitting}
                                    aria-label="upload photo"
                                >
                                    <PhotoCamera />
                                </IconButton>
                            </label>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="outlined"
                                onClick={handleCancel}
                                disabled={isSubmitting || (!text.trim() && !photoFile)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={isSubmitting || !text.trim()}
                                startIcon={
                                    isSubmitting ? (
                                        <CircularProgress size={20} />
                                    ) : (
                                        <Send />
                                    )
                                }
                            >
                                {isSubmitting ? 'Posting...' : 'Post'}
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

export default CreatePost; 