// ... existing code ...
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios;
const mockAxiosInstance = mockedAxios.create();

// ... existing code ...
beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockAxiosInstance.get.mockResponse = undefined;
    mockAxiosInstance.get.mockError = undefined;
    mockAxiosInstance.post.mockResponse = undefined;
    mockAxiosInstance.post.mockError = undefined;
    mockAxiosInstance.get.calls = [];
    mockAxiosInstance.post.calls = [];
});
// ... existing code ...
it('should login successfully', async () => {
    const mockResponse = {
        data: {
            success: true,
            token: 'new-token',
            user: { id: '1', email: 'test@example.com' }
        }
    };
    mockAxiosInstance.post.mockResponse = mockResponse;
    renderWithAuth(<TestComponent />);
    const loginButton = screen.getByText('Login');
    await act(async () => {
        await userEvent.click(loginButton);
    });
    await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
        expect(screen.getByTestId('user-info')).toHaveTextContent('test@example.com');
        expect(localStorage.getItem('token')).toBe('new-token');
    });
});

it('should handle login error', async () => {
    const mockError = {
        response: {
            data: { message: 'Invalid credentials' }
        }
    };
    mockAxiosInstance.post.mockError = mockError;
    renderWithAuth(<TestComponent />);
    const loginButton = screen.getByText('Login');
    await act(async () => {
        await userEvent.click(loginButton);
    });
    await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Invalid credentials');
        expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    });
});

it('should register successfully', async () => {
    const mockResponse = {
        data: {
            success: true,
            token: 'new-token',
            user: { id: '1', email: 'test@example.com' }
        }
    };
    mockAxiosInstance.post.mockResponse = mockResponse;
    renderWithAuth(<TestComponent />);
    const registerButton = screen.getByText('Register');
    await act(async () => {
        await userEvent.click(registerButton);
    });
    await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
        expect(screen.getByTestId('user-info')).toHaveTextContent('test@example.com');
        expect(localStorage.getItem('token')).toBe('new-token');
    });
});

it('should handle registration error', async () => {
    const mockError = {
        response: {
            data: { message: 'User already exists' }
        }
    };
    mockAxiosInstance.post.mockError = mockError;
    renderWithAuth(<TestComponent />);
    const registerButton = screen.getByText('Register');
    await act(async () => {
        await userEvent.click(registerButton);
    });
    await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('User already exists');
        expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    });
});

it('should add token to requests', async () => {
    localStorage.setItem('token', 'test-token');
    const mockUser = { id: '1' };
    mockAxiosInstance.get.mockResponse = { data: { user: mockUser } };
    renderWithAuth(<TestComponent />);
    await waitFor(() => {
        // Find the call with /auth/me and check headers
        const call = (mockAxiosInstance.get.calls || []).find(([url]) => url === '/auth/me');
        expect(call).toBeDefined();
        const config = call[1];
        expect(config.headers).toBeDefined();
        expect(config.headers.Authorization).toBe('Bearer test-token');
    });
});

it('should handle 401 errors and redirect to login', async () => {
    localStorage.setItem('token', 'test-token');
    delete window.location;
    window.location = { href: '' };
    mockAxiosInstance.get.mockError = { response: { status: 401 } };
    renderWithAuth(<TestComponent />);
    await waitFor(() => {
        expect(localStorage.getItem('token')).toBeNull();
        expect(window.location.href).toBe('/login');
    });
});
// ... existing code ... 