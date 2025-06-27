// Import testing library utilities
import '@testing-library/jest-dom';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRE = '1h';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test-db';

// Mock console methods to reduce noise in tests
global.console = {
    ...console,
    // Uncomment to ignore a specific log level
    // log: jest.fn(),
    // debug: jest.fn(),
    // info: jest.fn(),
    // warn: jest.fn(),
    // error: jest.fn(),
};

global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder; 