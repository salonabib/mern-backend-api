import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';

// Mock the AuthContext to avoid authentication issues in tests
jest.mock('./contexts/AuthContext', () => ({
  ...jest.requireActual('./contexts/AuthContext'),
  useAuth: () => ({
    isAuthenticated: false,
    loading: false,
    user: null,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    clearError: jest.fn(),
  }),
}));

// Create a test theme
const testTheme = createTheme();

// Wrapper component for testing
const TestWrapper = ({ children }) => (
  <ThemeProvider theme={testTheme}>
    <AuthProvider>
      {children}
    </AuthProvider>
  </ThemeProvider>
);

test('renders app with navigation', () => {
  render(<App />, { wrapper: TestWrapper });

  // Check that the app bar is rendered (this is the navbar)
  const appBar = screen.getByRole('banner');
  expect(appBar).toBeInTheDocument();

  // Check that the main content area is rendered
  const mainContent = screen.getAllByRole('main')[0];
  expect(mainContent).toBeInTheDocument();
});

test('renders home page by default', () => {
  render(<App />, { wrapper: TestWrapper });

  // Check that the home page content is rendered
  const welcomeHeading = screen.getByText('Welcome to MERN Stack App');
  expect(welcomeHeading).toBeInTheDocument();

  // Check that the features section is rendered
  const featuresHeading = screen.getByText('Features');
  expect(featuresHeading).toBeInTheDocument();
});
