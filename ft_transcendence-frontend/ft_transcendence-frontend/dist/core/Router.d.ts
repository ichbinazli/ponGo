export interface Route {
    path: string;
    handler: () => void;
}
export declare class Router {
    private routes;
    private currentPath;
    constructor();
    addRoute(path: string, handler: () => void): void;
    navigate(path: string): void;
    handleRouteChange(): void;
    init(): void;
    private handleNotFound;
}
//# sourceMappingURL=Router.d.ts.map