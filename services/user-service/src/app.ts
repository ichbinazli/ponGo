import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import { collectDefaultMetrics, Registry, Counter, Histogram } from 'prom-client';

// Prometheus
const register = new Registry();
register.setDefaultLabels({ service: 'user-service' });
collectDefaultMetrics({ register });

const httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [register],
});

const httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status'],
    registers: [register],
});

const app = Fastify({ logger: { level: process.env.LOG_LEVEL || 'info' } });

await app.register(fastifyHelmet);
await app.register(fastifyCors, {
    origin: process.env.CORS_ORIGIN || 'https://localhost',
    credentials: true,
});
await app.register(fastifyRateLimit, {
    max: Number(process.env.RATE_LIMIT_MAX) || 100,
    timeWindow: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
});
await app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'change-me',
});

app.addHook('onResponse', (request: any, reply: any, done: any) => {
    const responseTime = reply.getResponseTime() / 1000;
    httpRequestDuration.observe(
        { method: request.method, route: request.routerPath || 'unknown', status_code: reply.statusCode },
        responseTime,
    );
    httpRequestsTotal.inc({
        method: request.method,
        route: request.routerPath || 'unknown',
        status: reply.statusCode.toString(),
    });
    done();
});

app.get('/health', async () => ({
    status: 'ok',
    service: 'user-service',
    timestamp: new Date().toISOString(),
}));

app.get('/metrics', async (_: any, reply: any) => {
    reply.header('Content-Type', register.contentType);
    return reply.send(await register.metrics());
});

// TODO: Backend kodundan taşınacak route'lar:
// import { userRoutes } from './routes/user.routes.js';
// import { friendRoutes } from './routes/friend.routes.js';
// import { gdprRoutes } from './routes/gdpr.routes.js';
// await app.register(userRoutes, { prefix: '/api/users' });
// await app.register(friendRoutes, { prefix: '/api/friends' });
// await app.register(gdprRoutes, { prefix: '/api/gdpr' });

const PORT = Number(process.env.PORT) || 3002;
const HOST = process.env.HOST || '0.0.0.0';

try {
    await app.listen({ port: PORT, host: HOST });
    console.log(`✅ user-service running on ${HOST}:${PORT}`);
} catch (err) {
    app.log.error(err);
    process.exit(1);
}

export default app;
