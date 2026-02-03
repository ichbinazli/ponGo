import Api from '../api/apiLibrary';

export interface Route {
    path: string;
    handler: () => void;
}

export class Router {
    private routes: Map<string, () => void> = new Map();
    private currentPath: string = '';

    constructor() {
        this.currentPath = window.location.pathname;
        this.setupPopstateHandler();
    }

    private setupPopstateHandler(): void {
        window.addEventListener('popstate', () => {
            this.handleRouteChange();
        });
    }

    public addRoute(path: string, handler: () => void): void {
        this.routes.set(path, handler);
    }

    public async navigate(path: string): Promise<void> {
        if (path !== this.currentPath) {
            this.currentPath = path;
            window.history.pushState({}, '', path);
            this.handleRouteChange();
        }
        let response = await Api.get('/api/users/me');
        let unauthorizedPages = ['/register', '/reset-password', '/login'];
        if (!response.success && !unauthorizedPages.includes(window.location.pathname)) {
            window.location.href = '/login';
        }
        if (unauthorizedPages.includes(window.location.pathname))
            document.getElementById('navigation')!.style.display = 'none';
        else
            document.getElementById('navigation')!.style.display = 'block';
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
