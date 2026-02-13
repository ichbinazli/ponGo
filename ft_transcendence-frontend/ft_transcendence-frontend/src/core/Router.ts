export interface Route {
    path: string;
    handler: () => void;
}

export class Router {
    private routes: Map<string, () => void> = new Map();
    private currentPath: string = '';

    constructor() {
        this.currentPath = window.location.pathname;
    }

    public addRoute(path: string, handler: () => void): void {
        this.routes.set(path, handler);
    }

    public navigate(path: string): void {
        if (path !== this.currentPath) {
            this.currentPath = path;
            window.history.pushState({}, '', path);
            this.handleRouteChange();
        }
    }

    public handleRouteChange(): void {
        const path = window.location.pathname;
        this.currentPath = path;
        
        const handler = this.routes.get(path);
        if (handler) {
            try {
                handler();
            } catch (error) {
                console.error('Route handler error:', error);
                this.handleNotFound();
            }
        } else {
            this.handleNotFound();
        }
    }

    public init(): void {
        this.handleRouteChange();
    }

    private handleNotFound(): void {
        // Redirect to home page for unknown routes
        if (this.currentPath !== '/') {
            this.navigate('/');
        }
    }
}
