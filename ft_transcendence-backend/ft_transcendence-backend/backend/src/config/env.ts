import { config } from 'dotenv';
import { z } from 'zod';

// Load environment variables
config();

// Environment schema validation
const envSchema = z.object({
    // Server
    PORT: z.string().default('3000'),
    HOST: z.string().default('0.0.0.0'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    // Database
    DATABASE_PATH: z.string().default('./database/transcendence.db'),

    // JWT
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_ACCESS_EXPIRY: z.string().default('15m'),
    JWT_REFRESH_EXPIRY: z.string().default('7d'),

    // OAuth - Google
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GOOGLE_CALLBACK_URL: z.string().optional(),

    // OAuth - GitHub
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    GITHUB_CALLBACK_URL: z.string().optional(),

    // OAuth - 42
    FORTYTWO_CLIENT_ID: z.string().optional(),
    FORTYTWO_CLIENT_SECRET: z.string().optional(),
    FORTYTWO_CALLBACK_URL: z.string().optional(),

    // 2FA
    TWO_FACTOR_APP_NAME: z.string().default('ft_transcendence'),
    TWO_FACTOR_ISSUER: z.string().default('ft_transcendence'),

    // SSL
    SSL_KEY_PATH: z.string().default('./certs/key.pem'),
    SSL_CERT_PATH: z.string().default('./certs/cert.pem'),

    // CORS
    CORS_ORIGIN: z.string().default('https://localhost:5173'),

    // Rate Limiting
    RATE_LIMIT_MAX: z.string().default('100'),
    RATE_LIMIT_WINDOW_MS: z.string().default('60000'),

    // Upload
    UPLOAD_DIR: z.string().default('./uploads'),
    MAX_FILE_SIZE: z.string().default('5242880'),

    // Bcrypt
    BCRYPT_SALT_ROUNDS: z.string().default('12'),
});

// Parse and validate environment
const parseEnv = () => {
    try {
        return envSchema.parse(process.env);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const missing = error.errors.map((e) => e.path.join('.')).join(', ');
            throw new Error(`❌ Missing or invalid environment variables: ${missing}`);
        }
        throw error;
    }
};

const parsedEnv = parseEnv();

// Export typed environment configuration
export const env = {
    // Server
    port: parseInt(parsedEnv.PORT, 10),
    host: parsedEnv.HOST,
    nodeEnv: parsedEnv.NODE_ENV,
    isDevelopment: parsedEnv.NODE_ENV === 'development',
    isProduction: parsedEnv.NODE_ENV === 'production',
    isTest: parsedEnv.NODE_ENV === 'test',

    // Database
    databasePath: parsedEnv.DATABASE_PATH,

    // JWT
    jwt: {
        secret: parsedEnv.JWT_SECRET,
        accessExpiry: parsedEnv.JWT_ACCESS_EXPIRY,
        refreshExpiry: parsedEnv.JWT_REFRESH_EXPIRY,
    },

    // OAuth
    oauth: {
        google: {
            clientId: parsedEnv.GOOGLE_CLIENT_ID,
            clientSecret: parsedEnv.GOOGLE_CLIENT_SECRET,
            callbackUrl: parsedEnv.GOOGLE_CALLBACK_URL,
        },
        github: {
            clientId: parsedEnv.GITHUB_CLIENT_ID,
            clientSecret: parsedEnv.GITHUB_CLIENT_SECRET,
            callbackUrl: parsedEnv.GITHUB_CALLBACK_URL,
        },
        fortyTwo: {
            clientId: parsedEnv.FORTYTWO_CLIENT_ID,
            clientSecret: parsedEnv.FORTYTWO_CLIENT_SECRET,
            callbackUrl: parsedEnv.FORTYTWO_CALLBACK_URL,
        },
    },

    // 2FA
    twoFactor: {
        appName: parsedEnv.TWO_FACTOR_APP_NAME,
        issuer: parsedEnv.TWO_FACTOR_ISSUER,
    },

    // SSL
    ssl: {
        keyPath: parsedEnv.SSL_KEY_PATH,
        certPath: parsedEnv.SSL_CERT_PATH,
    },

    // CORS
    corsOrigin: parsedEnv.CORS_ORIGIN,

    // Rate Limiting
    rateLimit: {
        max: parseInt(parsedEnv.RATE_LIMIT_MAX, 10),
        windowMs: parseInt(parsedEnv.RATE_LIMIT_WINDOW_MS, 10),
    },

    // Upload
    upload: {
        dir: parsedEnv.UPLOAD_DIR,
        maxFileSize: parseInt(parsedEnv.MAX_FILE_SIZE, 10),
    },

    // Bcrypt
    bcryptSaltRounds: parseInt(parsedEnv.BCRYPT_SALT_ROUNDS, 10),
} as const;

export type Env = typeof env;
