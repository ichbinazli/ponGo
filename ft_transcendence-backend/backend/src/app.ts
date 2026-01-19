import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { env } from './config/env.js';
import { initializeDatabase, closeDatabase } from './database/index.js';
import { registerJwtPlugin } from './services/jwt.service.js';
import { authRoutes } from './routes/auth.routes.js';
import { userRoutes } from './routes/user.routes.js';
import { friendRoutes } from './routes/friend.routes.js';
import { oauthRoutes } from './routes/oauth.routes.js';
import { twoFactorRoutes } from './routes/twoFactor.routes.js';
import { gdprRoutes } from './routes/gdpr.routes.js';
import { statsRoutes } from './routes/stats.routes.js';
import { matchRoutes } from './routes/match.routes.js';
import { registerSwagger } from './plugins/swagger.js';

// Create Fastify instance with HTTPS
const createServer = (): FastifyInstance => {
    const httpsOptions =
        env.isProduction || existsSync(env.ssl.keyPath)
            ? {
                https: {
                    key: readFileSync(env.ssl.keyPath),
                    cert: readFileSync(env.ssl.certPath),
                },
            }
            : {};

    const server = Fastify({
        logger: {
            level: env.isDevelopment ? 'debug' : 'info',
            transport: env.isDevelopment
                ? {
                    target: 'pino-pretty',
                    options: {
                        colorize: true,
                        translateTime: 'HH:MM:ss Z',
                        ignore: 'pid,hostname',
                    },
                }
                : undefined,
        },
        ...httpsOptions,
    });

    return server;
};

// Register plugins
const registerPlugins = async (server: FastifyInstance): Promise<void> => {
    // Security headers
    await server.register(helmet, {
        contentSecurityPolicy: env.isProduction,
    });

    // CORS
    await server.register(cors, {
        origin: env.corsOrigin,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // Rate limiting
    await server.register(rateLimit, {
        max: env.rateLimit.max,
        timeWindow: env.rateLimit.windowMs,
    });

    // Static files for uploads
    await server.register(fastifyStatic, {
        root: join(process.cwd(), env.upload.dir),
        prefix: '/uploads/',
        decorateReply: false,
    });

    // JWT authentication
    await registerJwtPlugin(server);
};

// Register routes
const registerRoutes = async (server: FastifyInstance): Promise<void> => {
    // Health check endpoint
    server.get('/health', async () => {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        };
    });

    // API root
    server.get('/api', async () => {
        return {
            name: 'ft_transcendence API',
            version: '1.0.0',
            documentation: '/api/docs',
        };
    });

    // Auth routes
    await server.register(authRoutes, { prefix: '/api/auth' });

    // User routes
    await server.register(userRoutes, { prefix: '/api/users' });

    // Friend routes
    await server.register(friendRoutes, { prefix: '/api/friends' });

    // OAuth routes
    await server.register(oauthRoutes, { prefix: '/api/oauth' });

    // 2FA routes
    await server.register(twoFactorRoutes, { prefix: '/api/2fa' });

    // GDPR routes
    await server.register(gdprRoutes, { prefix: '/api/gdpr' });

    // Stats routes (leaderboard, global stats)
    await server.register(statsRoutes, { prefix: '/api/stats' });

    // Match routes (for Game module)
    await server.register(matchRoutes, { prefix: '/api/matches' });

    // API Documentation (Swagger)
    await registerSwagger(server);
};

// Error handler
const registerErrorHandler = (server: FastifyInstance): void => {
    server.setErrorHandler((error, request, reply) => {
        server.log.error(error);

        // Validation errors
        if (error.validation) {
            return reply.status(400).send({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid request data',
                    details: error.validation,
                },
            });
        }

        // JWT errors
        if (error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER') {
            return reply.status(401).send({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authorization token required',
                },
            });
        }

        // Rate limit errors
        if (error.statusCode === 429) {
            return reply.status(429).send({
                success: false,
                error: {
                    code: 'RATE_LIMITED',
                    message: 'Too many requests, please try again later',
                },
            });
        }

        // Generic error
        const statusCode = error.statusCode || 500;
        return reply.status(statusCode).send({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: env.isProduction ? 'An error occurred' : error.message,
            },
        });
    });
};

// Not found handler
const registerNotFoundHandler = (server: FastifyInstance): void => {
    server.setNotFoundHandler((request, reply) => {
        reply.status(404).send({
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: `Route ${request.method} ${request.url} not found`,
            },
        });
    });
};

// Main application bootstrap
const bootstrap = async (): Promise<void> => {
    const server = createServer();

    // Initialize database
    try {
        await initializeDatabase();
        server.log.info('✅ Database initialized');
    } catch (error) {
        server.log.error('❌ Database initialization failed:', error);
        process.exit(1);
    }

    // Register all plugins and routes
    await registerPlugins(server);
    await registerRoutes(server);
    registerErrorHandler(server);
    registerNotFoundHandler(server);

    // Graceful shutdown
    const shutdown = async (signal: string): Promise<void> => {
        server.log.info(`Received ${signal}, shutting down gracefully...`);
        closeDatabase();
        await server.close();
        process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    // Start server
    try {
        const address = await server.listen({
            port: env.port,
            host: env.host,
        });

        const protocol = existsSync(env.ssl.keyPath) ? 'https' : 'http';
        server.log.info(`🚀 Server running at ${protocol}://${env.host}:${env.port}`);
        server.log.info(`📖 API documentation at ${protocol}://${env.host}:${env.port}/api`);
        server.log.info(`💚 Health check at ${protocol}://${env.host}:${env.port}/health`);
    } catch (error) {
        server.log.error(error);
        process.exit(1);
    }
};

// Run the server
bootstrap();
