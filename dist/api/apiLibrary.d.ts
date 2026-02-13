declare class Api {
    private axiosInstance;
    private baseURL;
    constructor();
    setAuthToken(token: string): Promise<void>;
    get(endpoint: string): Promise<any>;
    post(endpoint: string, data: any): Promise<any>;
    put(endpoint: string, data: any): Promise<any>;
    delete(endpoint: string): Promise<any>;
    patch(endpoint: string, data: any): Promise<any>;
    request(method: 'get' | 'post' | 'put' | 'delete' | 'patch', endpoint: string, data?: any): Promise<any>;
}
declare const _default: Api;
export default _default;
//# sourceMappingURL=apiLibrary.d.ts.map