import axios, { AxiosInstance, AxiosResponse } from 'axios';

class Api {
    private axiosInstance: AxiosInstance;
    private baseURL: string;

    constructor() {
        this.baseURL = 'http://localhost:3000';
        this.axiosInstance = axios.create({
            baseURL: this.baseURL,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
    public async get(endpoint: string): Promise<any> {
        try {
            const response: AxiosResponse = await this.axiosInstance.get(endpoint);
            return response.data;
        } catch (error) {
            throw new Error(`GET ${endpoint} failed: ${error}`);
        }
    }

    public async post(endpoint: string, data: any): Promise<any> {
        try {
            const response: AxiosResponse = await this.axiosInstance.post(endpoint, data);
            return response.data;
        } catch (error) {
            throw new Error(`POST ${endpoint} failed: ${error}`);
        }
    }
    public async put(endpoint: string, data: any): Promise<any> {
        try {
            const response: AxiosResponse = await this.axiosInstance.put(endpoint, data);
            return response.data;
        } catch (error) {
            throw new Error(`PUT ${endpoint} failed: ${error}`);
        }
    }
    public async delete(endpoint: string): Promise<any> {
        try {
            const response: AxiosResponse = await this.axiosInstance.delete(endpoint);
            return response.data;
        } catch (error) {
            throw new Error(`DELETE ${endpoint} failed: ${error}`);
        }
    }

    public async request(method: 'get' | 'post' | 'put' | 'delete', endpoint: string, data?: any): Promise<any> {
        switch (method) {
            case 'get':
                return this.get(endpoint);
            case 'post':
                return this.post(endpoint, data);
            case 'put':
                return this.put(endpoint, data);
            case 'delete':
                return this.delete(endpoint);
            default:
                throw new Error(`Unsupported method: ${method}`);
        }
    }
}

export default new Api();