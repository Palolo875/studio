import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./vitest.setup.ts'],
        include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        exclude: [
            'node_modules',
            'dist',
            '.next',
            'coverage',
            'e2e/**/*',
        ],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'src/**/*.d.ts',
                'src/**/*.test.{ts,tsx}',
                'src/**/__tests__/**',
                '.next/',
            ],
            thresholds: {
                global: {
                    branches: 70,
                    functions: 70,
                    lines: 70,
                    statements: 70,
                },
            },
        },
        testTimeout: 10000,
        hookTimeout: 10000,
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
