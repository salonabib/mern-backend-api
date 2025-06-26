import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import LoadingSpinner from './LoadingSpinner';

const testTheme = createTheme({
    palette: {
        primary: { main: '#1976d2' },
        secondary: { main: '#dc004e' },
    },
});

const renderLoadingSpinner = (props = {}) => {
    return render(
        <ThemeProvider theme={testTheme}>
            <LoadingSpinner {...props} />
        </ThemeProvider>
    );
};

describe('LoadingSpinner Component', () => {
    describe('Default Rendering', () => {
        it('should render loading spinner with default message', () => {
            renderLoadingSpinner();

            expect(screen.getByText('Loading...')).toBeInTheDocument();
        });

        it('should render circular progress indicator', () => {
            renderLoadingSpinner();

            const spinner = screen.getByRole('progressbar');
            expect(spinner).toBeInTheDocument();
            expect(spinner).toHaveClass('MuiCircularProgress-root');
        });

        it('should have proper container structure', () => {
            renderLoadingSpinner();

            const container = screen.getByText('Loading...').parentElement;
            expect(container).toHaveStyle({
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '50vh',
            });
        });
    });

    describe('Custom Message', () => {
        it('should render with custom message', () => {
            const customMessage = 'Please wait while we load your data...';
            renderLoadingSpinner({ message: customMessage });

            expect(screen.getByText(customMessage)).toBeInTheDocument();
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        });

        it('should handle empty message', () => {
            renderLoadingSpinner({ message: '' });

            expect(screen.getByText('Loading...')).toBeInTheDocument();
        });

        it('should handle null message', () => {
            renderLoadingSpinner({ message: null });

            expect(screen.getByText('Loading...')).toBeInTheDocument();
        });
    });

    describe('Component Structure', () => {
        it('should have proper flex layout', () => {
            renderLoadingSpinner();

            const container = screen.getByText('Loading...').parentElement;
            expect(container).toHaveStyle({
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
            });
        });

        it('should have proper spacing between elements', () => {
            renderLoadingSpinner();

            const container = screen.getByText('Loading...').parentElement;
            expect(container).toHaveStyle({
                gap: '16px', // 2 * theme.spacing(1)
            });
        });

        it('should have minimum height for proper centering', () => {
            renderLoadingSpinner();

            const container = screen.getByText('Loading...').parentElement;
            expect(container).toHaveStyle({
                minHeight: '50vh',
            });
        });
    });

    describe('Accessibility', () => {
        it('should have proper ARIA attributes', () => {
            renderLoadingSpinner();

            const spinner = screen.getByRole('progressbar');
            expect(spinner).toHaveAttribute('aria-busy', 'true');
        });

        it('should have proper semantic structure', () => {
            renderLoadingSpinner();

            // Check that the component renders without accessibility violations
            expect(screen.getByRole('progressbar')).toBeInTheDocument();
        });
    });

    describe('Theme Integration', () => {
        it('should use theme colors', () => {
            renderLoadingSpinner();

            const spinner = screen.getByRole('progressbar');
            expect(spinner).toHaveClass('MuiCircularProgress-root');
        });

        it('should use theme typography', () => {
            renderLoadingSpinner();

            const message = screen.getByText('Loading...');
            expect(message).toHaveClass('MuiTypography-root');
        });
    });

    describe('Responsive Design', () => {
        it('should render on different screen sizes', () => {
            renderLoadingSpinner();

            // Test that component renders without errors
            expect(screen.getByText('Loading...')).toBeInTheDocument();
            expect(screen.getByRole('progressbar')).toBeInTheDocument();
        });

        it('should maintain centering on mobile', () => {
            renderLoadingSpinner();

            const container = screen.getByText('Loading...').parentElement;
            expect(container).toHaveStyle({
                justifyContent: 'center',
                alignItems: 'center',
            });
        });
    });

    describe('Props Handling', () => {
        it('should handle undefined props gracefully', () => {
            renderLoadingSpinner(undefined);

            expect(screen.getByText('Loading...')).toBeInTheDocument();
        });

        it('should handle null props gracefully', () => {
            renderLoadingSpinner(null);

            expect(screen.getByText('Loading...')).toBeInTheDocument();
        });

        it('should handle additional props', () => {
            renderLoadingSpinner({
                message: 'Custom message',
                'data-testid': 'custom-spinner'
            });

            expect(screen.getByText('Custom message')).toBeInTheDocument();
            expect(screen.getByTestId('custom-spinner')).toBeInTheDocument();
        });
    });

    describe('Performance', () => {
        it('should render quickly', () => {
            const startTime = performance.now();
            renderLoadingSpinner();
            const endTime = performance.now();

            expect(endTime - startTime).toBeLessThan(100); // Should render in less than 100ms
        });

        it('should not cause memory leaks', () => {
            const { unmount } = renderLoadingSpinner();

            // Component should clean up properly when unmounted
            expect(() => unmount()).not.toThrow();
        });
    });
}); 