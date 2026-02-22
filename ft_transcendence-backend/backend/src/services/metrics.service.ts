import { Registry, collectDefaultMetrics, Counter, Histogram } from 'prom-client';

// Create a dedicated registry for the backend
export const metricsRegistry = new Registry();

// Collect default Node.js/process metrics (memory, CPU, event loop, etc.)
collectDefaultMetrics({ register: metricsRegistry });

// -------------------------------------------------------------------
// Custom HTTP metrics
// -------------------------------------------------------------------

/** Total number of HTTP requests broken down by method, route, status */
export const httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [metricsRegistry],
});

/** Request duration histogram (seconds) */
export const httpRequestDurationSeconds = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [metricsRegistry],
});
