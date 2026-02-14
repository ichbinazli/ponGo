/**
 * Swagger/OpenAPI Configuration
 * API Documentation for ft_transcendence Backend
 */

import { FastifyInstance } from 'fastify';

// OpenAPI specification
export const openApiSpec = {
    openapi: '3.0.3',
    info: {
        title: 'ft_transcendence API',
        description: 'Backend API for the ft_transcendence Pong Game Platform',
        version: '1.0.0',
        contact: {
            name: 'ft_transcendence Team',
        },
    },
    servers: [
        {
            url: 'https://localhost:3000',
            description: 'Development server',
        },
    ],
    tags: [
        { name: 'Auth', description: 'Authentication endpoints' },
        { name: 'Users', description: 'User management endpoints' },
        { name: 'Friends', description: 'Friendship system endpoints' },
        { name: 'OAuth', description: 'OAuth 2.0 authentication' },
        { name: '2FA', description: 'Two-factor authentication' },
        { name: 'GDPR', description: 'GDPR compliance endpoints' },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
        schemas: {
            // Common schemas
            Error: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: false },
                    error: { type: 'string', example: 'Error message' },
                },
            },
            Success: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'object' },
                },
            },
            // User schema
            User: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    email: { type: 'string', format: 'email' },
                    displayName: { type: 'string' },
                    avatarUrl: { type: 'string', nullable: true },
                    isOnline: { type: 'boolean' },
                    twoFactorEnabled: { type: 'boolean' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                },
            },
            // Auth schemas
            RegisterRequest: {
                type: 'object',
                required: ['email', 'password', 'displayName'],
                properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 8 },
                    displayName: { type: 'string', minLength: 3, maxLength: 20 },
                },
            },
            LoginRequest: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' },
                },
            },
            AuthResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    data: {
                        type: 'object',
                        properties: {
                            accessToken: { type: 'string' },
                            refreshToken: { type: 'string' },
                            user: { $ref: '#/components/schemas/User' },
                        },
                    },
                },
            },
            // Friendship schema
            Friendship: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    userId: { type: 'string', format: 'uuid' },
                    friendId: { type: 'string', format: 'uuid' },
                    status: { type: 'string', enum: ['pending', 'accepted', 'blocked'] },
                    createdAt: { type: 'string', format: 'date-time' },
                },
            },
            // Match schema
            Match: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    player1Id: { type: 'string', format: 'uuid' },
                    player2Id: { type: 'string', format: 'uuid' },
                    player1Score: { type: 'integer' },
                    player2Score: { type: 'integer' },
                    winnerId: { type: 'string', format: 'uuid' },
                    gameType: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' },
                },
            },
            // 2FA schemas
            TwoFactorSetup: {
                type: 'object',
                properties: {
                    secret: { type: 'string' },
                    qrCode: { type: 'string', description: 'Data URL for QR code image' },
                },
            },
        },
    },
    paths: {
        // Auth endpoints
        '/api/auth/register': {
            post: {
                tags: ['Auth'],
                summary: 'Register a new user',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/RegisterRequest' },
                        },
                    },
                },
                responses: {
                    '201': {
                        description: 'User registered successfully',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/AuthResponse' },
                            },
                        },
                    },
                    '400': {
                        description: 'Validation error',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                    '409': {
                        description: 'Email or display name already exists',
                    },
                },
            },
        },
        '/api/auth/login': {
            post: {
                tags: ['Auth'],
                summary: 'Login with email and password',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/LoginRequest' },
                        },
                    },
                },
                responses: {
                    '200': {
                        description: 'Login successful',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/AuthResponse' },
                            },
                        },
                    },
                    '401': { description: 'Invalid credentials' },
                },
            },
        },
        '/api/auth/refresh': {
            post: {
                tags: ['Auth'],
                summary: 'Refresh access token',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    refreshToken: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': { description: 'Token refreshed' },
                    '401': { description: 'Invalid refresh token' },
                },
            },
        },
        '/api/auth/logout': {
            post: {
                tags: ['Auth'],
                summary: 'Logout current session',
                security: [{ bearerAuth: [] }],
                responses: {
                    '200': { description: 'Logged out successfully' },
                },
            },
        },
        '/api/auth/me': {
            get: {
                tags: ['Auth'],
                summary: 'Get current user info',
                security: [{ bearerAuth: [] }],
                responses: {
                    '200': {
                        description: 'Current user data',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/User' },
                            },
                        },
                    },
                },
            },
        },
        '/api/auth/sessions': {
            get: {
                tags: ['Auth'],
                summary: 'Get all active sessions',
                security: [{ bearerAuth: [] }],
                responses: {
                    '200': { description: 'List of active sessions' },
                },
            },
        },
        // User endpoints
        '/api/users/search': {
            get: {
                tags: ['Users'],
                summary: 'Search users by display name',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'q',
                        in: 'query',
                        required: true,
                        schema: { type: 'string' },
                    },
                ],
                responses: {
                    '200': { description: 'Search results' },
                },
            },
        },
        '/api/users/{id}': {
            get: {
                tags: ['Users'],
                summary: 'Get user profile by ID',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                    },
                ],
                responses: {
                    '200': {
                        description: 'User profile',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/User' },
                            },
                        },
                    },
                    '404': { description: 'User not found' },
                },
            },
        },
        '/api/users/me': {
            get: {
                tags: ['Users'],
                summary: 'Get own profile',
                security: [{ bearerAuth: [] }],
                responses: {
                    '200': { description: 'Own profile data' },
                },
            },
            patch: {
                tags: ['Users'],
                summary: 'Update own profile',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    displayName: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': { description: 'Profile updated' },
                },
            },
        },
        '/api/users/me/avatar': {
            post: {
                tags: ['Users'],
                summary: 'Upload avatar',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                properties: {
                                    avatar: {
                                        type: 'string',
                                        format: 'binary',
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': { description: 'Avatar uploaded' },
                    '400': { description: 'Invalid file' },
                },
            },
        },
        // Friend endpoints
        '/api/friends': {
            get: {
                tags: ['Friends'],
                summary: 'Get friend list',
                security: [{ bearerAuth: [] }],
                responses: {
                    '200': { description: 'List of friends' },
                },
            },
        },
        '/api/friends/request/{id}': {
            post: {
                tags: ['Friends'],
                summary: 'Send friend request',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                    },
                ],
                responses: {
                    '201': { description: 'Request sent' },
                    '400': { description: 'Invalid request' },
                },
            },
        },
        '/api/friends/accept/{id}': {
            post: {
                tags: ['Friends'],
                summary: 'Accept friend request',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                    },
                ],
                responses: {
                    '200': { description: 'Request accepted' },
                },
            },
        },
        // OAuth endpoints
        '/api/oauth/providers': {
            get: {
                tags: ['OAuth'],
                summary: 'Get available OAuth providers',
                responses: {
                    '200': {
                        description: 'List of providers',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        providers: {
                                            type: 'array',
                                            items: { type: 'string' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        '/api/oauth/{provider}': {
            get: {
                tags: ['OAuth'],
                summary: 'Start OAuth flow',
                parameters: [
                    {
                        name: 'provider',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', enum: ['42'] },
                    },
                ],
                responses: {
                    '302': { description: 'Redirect to provider' },
                },
            },
        },
        // 2FA endpoints
        '/api/2fa/status': {
            get: {
                tags: ['2FA'],
                summary: 'Get 2FA status',
                security: [{ bearerAuth: [] }],
                responses: {
                    '200': {
                        description: '2FA status',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        enabled: { type: 'boolean' },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        '/api/2fa/setup': {
            post: {
                tags: ['2FA'],
                summary: 'Setup 2FA',
                security: [{ bearerAuth: [] }],
                responses: {
                    '200': {
                        description: '2FA setup data',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/TwoFactorSetup' },
                            },
                        },
                    },
                },
            },
        },
        '/api/2fa/verify': {
            post: {
                tags: ['2FA'],
                summary: 'Verify 2FA code',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    code: { type: 'string', minLength: 6, maxLength: 6 },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': { description: 'Code verified' },
                    '401': { description: 'Invalid code' },
                },
            },
        },
        // GDPR endpoints
        '/api/gdpr/info': {
            get: {
                tags: ['GDPR'],
                summary: 'Get privacy information',
                responses: {
                    '200': { description: 'Privacy policy info' },
                },
            },
        },
        '/api/gdpr/export': {
            get: {
                tags: ['GDPR'],
                summary: 'Export all user data',
                security: [{ bearerAuth: [] }],
                responses: {
                    '200': {
                        description: 'User data export',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    description: 'All user data in JSON format',
                                },
                            },
                        },
                    },
                },
            },
        },
        '/api/gdpr/anonymize': {
            post: {
                tags: ['GDPR'],
                summary: 'Anonymize account (soft delete)',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    password: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': { description: 'Account anonymized' },
                },
            },
        },
        '/api/gdpr/delete': {
            delete: {
                tags: ['GDPR'],
                summary: 'Delete account (hard delete)',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    password: { type: 'string' },
                                    confirmation: { type: 'string', example: 'DELETE MY ACCOUNT' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': { description: 'Account deleted' },
                },
            },
        },
    },
};

/**
 * Register Swagger UI routes
 */
export const registerSwagger = async (server: FastifyInstance): Promise<void> => {
    // Serve OpenAPI spec as JSON
    server.get('/api/docs/openapi.json', async () => {
        return openApiSpec;
    });

    // Serve Swagger UI HTML
    server.get('/api/docs', async (_request, reply) => {
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ft_transcendence API Documentation</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css">
    <style>
        body { margin: 0; padding: 0; }
        .swagger-ui .topbar { display: none; }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
    <script>
        window.onload = function() {
            SwaggerUIBundle({
                url: '/api/docs/openapi.json',
                dom_id: '#swagger-ui',
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIBundle.SwaggerUIStandalonePreset
                ],
                layout: "BaseLayout",
                deepLinking: true,
            });
        };
    </script>
</body>
</html>`;
        return reply.type('text/html').send(html);
    });
};
