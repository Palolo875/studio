import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import 'fake-indexeddb/auto';

// Mock pour les APIs du navigateur non disponibles dans Node
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock pour localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock pour performance.memory (Chrome-only API)
Object.defineProperty(performance, 'memory', {
    value: {
        usedJSHeapSize: 10000000,
        totalJSHeapSize: 20000000,
        jsHeapSizeLimit: 100000000,
    },
    writable: true,
});

// Supprimer les warnings React 19
const originalError = console.error;
console.error = (...args) => {
    if (
        typeof args[0] === 'string' &&
        args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
        return;
    }
    originalError.call(console, ...args);
};
