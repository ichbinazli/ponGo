import axios, { AxiosInstance, AxiosResponse, AxiosProgressEvent } from 'axios';

class Api {
    private axiosInstance: AxiosInstance;
    private baseURL: string;

    constructor() {
        this.baseURL = 'https://localhost';
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

    public async patch(endpoint: string, data: any): Promise<any> {
        try {
            const response: AxiosResponse = await this.axiosInstance.patch(endpoint, data);
            return response.data;
        } catch (error) {
            throw new Error(`PATCH ${endpoint} failed: ${error}`);
        }
    }

    public async uploadFile(
        endpoint: string,
        file: File | Blob,
        fieldName: string = 'file',
        additionalData?: Record<string, any>,
        onUploadProgress?: (progressEvent: AxiosProgressEvent) => void
    ): Promise<any> {
        try {
            const formData = new FormData();
            formData.append(fieldName, file);

            // Ek veriler varsa FormData'ya ekle
            if (additionalData) {
                Object.keys(additionalData).forEach(key => {
                    formData.append(key, additionalData[key]);
                });
            }

            const config: any = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            };

            if (onUploadProgress) {
                config.onUploadProgress = onUploadProgress;
            }

            const response: AxiosResponse = await this.axiosInstance.post(endpoint, formData, config);

            return response.data;
        } catch (error) {
            throw new Error(`File upload to ${endpoint} failed: ${error}`);
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