// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Suppress console errors and warnings for non-critical issues
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
    console.error = (...args) => {
        // Suppress TouchRipple warnings and other Material-UI act() warnings
        if (
            typeof args[0] === 'string' &&
            (args[0].includes('TouchRipple') ||
                args[0].includes('act(...)') ||
                args[0].includes('not wrapped in act'))
        ) {
            return;
        }
        originalError.call(console, ...args);
    };

    console.warn = (...args) => {
        // Suppress Material-UI Grid deprecation warnings
        if (
            typeof args[0] === 'string' &&
            (args[0].includes('MUI Grid') ||
                args[0].includes('item prop has been removed') ||
                args[0].includes('xs prop has been removed') ||
                args[0].includes('md prop has been removed'))
        ) {
            return;
        }
        originalWarn.call(console, ...args);
    };
});

afterAll(() => {
    console.error = originalError;
    console.warn = originalWarn;
});
