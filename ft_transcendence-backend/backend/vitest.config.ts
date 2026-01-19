import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/**/*.test.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['src/**/*.ts'],
            exclude: [
                'src/app.ts',
                'src/database/migrate.ts',
                'src/database/seed.ts',
            ],
        },
        testTimeout: 10000,
        hookTimeout: 10000,
    },
});
