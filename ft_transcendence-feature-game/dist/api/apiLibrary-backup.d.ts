declare class Api {
    private axiosInstance;
    private baseURL;
    constructor();
    get(endpoint: string): Promise<any>;
    post(endpoint: string, data: any): Promise<any>;
    put(endpoint: string, data: any): Promise<any>;
    delete(endpoint: string): Promise<any>;
    request(method: 'get' | 'post' | 'put' | 'delete', endpoint: string, data?: any): Promise<any>;
}
declare const _default: Api;
export default _default;
//# sourceMappingURL=apiLibrary-backup.d.ts.map