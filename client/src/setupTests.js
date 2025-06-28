// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Suppress noisy console.error and console.warn during tests
const originalError = console.error;
const originalWarn = console.warn;
const originalLog = console.log;

beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation((...args) => {
        // Allow test failures and assertion errors to show
        if (args[0] && typeof args[0] === 'string' && args[0].includes('expect')) {
            originalError(...args);
        }
        // Otherwise, suppress
    });
    jest.spyOn(console, 'warn').mockImplementation(() => { });
    jest.spyOn(console, 'log').mockImplementation(() => { });
});

afterAll(() => {
    if (console.error.mockRestore) {
        console.error.mockRestore();
    }
    if (console.warn.mockRestore) {
        console.warn.mockRestore();
    }
    if (console.log.mockRestore) {
        console.log.mockRestore();
    }
});

global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;
