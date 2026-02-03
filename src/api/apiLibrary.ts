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
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            },
            validateStatus: () => {
                return true; 
            },
        });
    }

    public async setAuthToken(token: string): Promise<void> {
        this.axiosInstance.defaults.headers['Authorization'] = `Bearer ${token}`;
    }

    // ... diğer metodlar aynı kalabilir ...
    
    public async get(endpoint: string): Promise<any> {
        try {
            const response: AxiosResponse = await this.axiosInstance.get(endpoint);
            // Artık 429 gelse bile burası çalışır ve response.data döner.
            return response.data;
        } catch (error) {
            // Sadece ağ hataları (internet yok vs.) buraya düşer.
            throw new Error(`GET ${endpoint} failed: ${error}`);
        }
    }

    // Diğer post, put, delete metodları da artık 429'u yakalayacaktır.
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

    public async patch(endpoint: string, data: any): Promise<any> {
        try {
            const response: AxiosResponse = await this.axiosInstance.patch(endpoint, data);
            return response.data;
        } catch (error) {
            throw new Error(`PATCH ${endpoint} failed: ${error}`);
        }
    }

    public async request(method: 'get' | 'post' | 'put' | 'delete' | 'patch', endpoint: string, data?: any): Promise<any> {
        switch (method) {
            case 'get':
                return this.get(endpoint);
            case 'post':
                return this.post(endpoint, data);
            case 'put':
                return this.put(endpoint, data);
            case 'delete':
                return this.delete(endpoint);
            case 'patch':
                return this.patch(endpoint, data);
            default:
                throw new Error(`Unsupported method: ${method}`);
        }
    }
}

export default new Api();