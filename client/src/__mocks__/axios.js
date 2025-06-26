const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
    },
};

const axios = jest.fn(() => mockAxiosInstance);
axios.create = jest.fn(() => mockAxiosInstance);
axios.get = mockAxiosInstance.get;
axios.post = mockAxiosInstance.post;
axios.put = mockAxiosInstance.put;
axios.delete = mockAxiosInstance.delete;
axios.interceptors = mockAxiosInstance.interceptors;

module.exports = axios; 