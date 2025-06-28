const isNodeTest = process.env.TEST_ENV === 'node';

module.exports = {
    // Test environment
    testEnvironment: isNodeTest ? 'node' : 'jsdom',

    // Setup files
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

    // Transform files
    transform: {
        '^.+\\.(js|jsx)$': 'babel-jest',
    },

    // Transform ESM dependencies
    transformIgnorePatterns: [
        '/node_modules/(?!(mongodb-memory-server|mongodb-memory-server-core|bson|mongodb|@mongodb-js|uuid|@aws-sdk|mongodb-connection-string-url|bson.mjs|mongodb-memory-server-core/node_modules/bson|mongodb-memory-server-core/node_modules/mongodb)/)'
    ],

    // Module name mapping for CSS and other assets
    moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
            '<rootDir>/__mocks__/fileMock.js',
        '^mongodb-memory-server$': '<rootDir>/__mocks__/mongodb-memory-server.js',
    },

    // Test file patterns
    testMatch: [
        '<rootDir>/routes/**/*.test.js',
        '<rootDir>/models/**/*.test.js',
        '<rootDir>/middleware/**/*.test.js',
        '<rootDir>/client/src/**/*.test.js',
        '<rootDir>/client/src/**/*.test.jsx',
        '<rootDir>/src/**/*.test.js',
    ],

    // Ignore patterns
    testPathIgnorePatterns: [
        '<rootDir>/node_modules/',
        '<rootDir>/client/node_modules/',
    ],

    // Coverage configuration
    collectCoverageFrom: [
        'routes/**/*.js',
        'models/**/*.js',
        'middleware/**/*.js',
        'client/src/**/*.{js,jsx}',
        '!**/*.test.{js,jsx}',
        '!**/node_modules/**',
    ],

    // Clear mocks between tests
    clearMocks: true,

    // Test timeout
    testTimeout: 10000,
}; 