export interface Route {
    path: string;
    handler: () => void;
}
export declare class Router {
    private routes;
    private currentPath;
    constructor();
    private setupPopstateHandler;
    addRoute(path: string, handler: () => void): void;
    navigate(path: string): Promise<void>;
    handleRouteChange(): void;
    init(): void;
    private handleNotFound;
}
//# sourceMappingURL=Router.d.ts.map