let requestInterceptor;
let responseInterceptor;

const mockAxiosInstance = {
    get: jest.fn((url, config) => {
        config = config || {};
        if (requestInterceptor) {
            config = requestInterceptor(config);
        }
        mockAxiosInstance.get.calls = mockAxiosInstance.get.calls || [];
        mockAxiosInstance.get.calls.push([url, config]);
        console.log('MOCK GET called:', url, 'mockResponse:', mockAxiosInstance.get.mockResponse, 'mockError:', mockAxiosInstance.get.mockError);
        if (mockAxiosInstance.get.mockError) {
            if (mockAxiosInstance.get.mockError.response && mockAxiosInstance.get.mockError.response.status === 401) {
                window.location.href = '/login';
                localStorage.removeItem('token');
            }
            console.log('MOCK GET rejecting with error:', mockAxiosInstance.get.mockError);
            return Promise.reject(mockAxiosInstance.get.mockError);
        }
        if (mockAxiosInstance.get.mockResponse) {
            console.log('MOCK GET resolving with:', mockAxiosInstance.get.mockResponse);
            return Promise.resolve(mockAxiosInstance.get.mockResponse);
        }
        console.log('MOCK GET resolving with default response');
        return Promise.resolve({ data: {} });
    }),
    post: jest.fn((url, data, config) => {
        config = config || {};
        if (requestInterceptor) {
            config = requestInterceptor(config);
        }
        mockAxiosInstance.post.calls = mockAxiosInstance.post.calls || [];
        mockAxiosInstance.post.calls.push([url, data, config]);
        console.log('MOCK POST called:', url, 'mockResponse:', mockAxiosInstance.post.mockResponse, 'mockError:', mockAxiosInstance.post.mockError);
        if (mockAxiosInstance.post.mockError) {
            // Ensure error structure matches what reducer expects
            const error = {
                response: {
                    data: { message: mockAxiosInstance.post.mockError.response?.data?.message || 'Login failed' }
                }
            };
            console.log('MOCK POST rejecting with error:', error);
            return Promise.reject(error);
        }
        if (mockAxiosInstance.post.mockResponse) {
            console.log('MOCK POST resolving with:', mockAxiosInstance.post.mockResponse);
            return Promise.resolve(mockAxiosInstance.post.mockResponse);
        }
        console.log('MOCK POST resolving with default response');
        return Promise.resolve({ data: {} });
    }),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
        request: {
            use: jest.fn((fn) => {
                requestInterceptor = fn;
            }),
        },
        response: {
            use: jest.fn((success, error) => {
                responseInterceptor = error;
            }),
        },
    },
};

mockAxiosInstance.get.calls = [];
mockAxiosInstance.post.calls = [];

mockAxiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const axios = jest.fn(() => mockAxiosInstance);
axios.create = jest.fn(() => mockAxiosInstance);
axios.get = mockAxiosInstance.get;
axios.post = mockAxiosInstance.post;
axios.put = mockAxiosInstance.put;
axios.delete = mockAxiosInstance.delete;
axios.interceptors = mockAxiosInstance.interceptors;

module.exports = axios;
module.exports.mockAxiosInstance = mockAxiosInstance; 