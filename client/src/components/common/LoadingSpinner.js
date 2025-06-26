import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const LoadingSpinner = ({ message = 'Loading...', ...props }) => {
    // Handle null/undefined message by using default
    const displayMessage = message || 'Loading...';

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
            {...props}
        >
            <CircularProgress
                aria-busy="true"
                aria-label="Loading"
            />
            <Typography color="text.secondary">{displayMessage}</Typography>
        </Box>
    );
};

export default LoadingSpinner; 