import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const LoadingSpinner = ({ message = 'Loading...' }) => {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '50vh',
                gap: 2,
            }}
        >
            <CircularProgress />
            <Typography color="text.secondary">{message}</Typography>
        </Box>
    );
};

export default LoadingSpinner; 