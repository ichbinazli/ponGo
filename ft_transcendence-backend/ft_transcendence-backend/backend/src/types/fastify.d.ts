import '@fastify/jwt';

declare module '@fastify/jwt' {
    interface FastifyJWT {
        user: {
            id: number;
            email: string;
            displayName: string;
        };
    }
}

declare module 'fastify' {
    interface FastifyRequest {
        user: {
            id: number;
            email: string;
            displayName: string;
        };
    }
}
