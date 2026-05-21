import axios, { AxiosInstance, AxiosResponse, AxiosProgressEvent } from 'axios';

class Api {
    private axiosInstance: AxiosInstance;
    private baseURL: string;
    private isRefreshing = false;
    private refreshSubscribers: Array<(token: string) => void> = [];

    constructor() {
        this.baseURL = '';
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

        this.axiosInstance.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;

                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;

                    const refreshToken = localStorage.getItem('refreshToken');
                    
                    if (!refreshToken) {
                        localStorage.removeItem('accessToken');
                        localStorage.removeItem('refreshToken');
                        window.location.href = '/login';
                        return Promise.reject(error);
                    }

                    if (!this.isRefreshing) {
                        this.isRefreshing = true;

                        try {
                            const response = await axios.post('/api/auth/refresh', {
                                refreshToken,
                            });

                            if (response.data?.data?.accessToken) {
                                const newAccessToken = response.data.data.accessToken;
                                const newRefreshToken = response.data.data.refreshToken;
                                
                                localStorage.setItem('accessToken', newAccessToken);
                                if (newRefreshToken) {
                                    localStorage.setItem('refreshToken', newRefreshToken);
                                }
                                
                                this.axiosInstance.defaults.headers['Authorization'] = `Bearer ${newAccessToken}`;

                                this.refreshSubscribers.forEach(callback => callback(newAccessToken));
                                this.refreshSubscribers = [];

                                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                                return this.axiosInstance(originalRequest);
                            }
                        } catch (refreshError) {
                            localStorage.removeItem('accessToken');
                            localStorage.removeItem('refreshToken');
                            window.location.href = '/login';
                            return Promise.reject(refreshError);
                        } finally {
                            this.isRefreshing = false;
                        }
                    } else {
                        return new Promise(resolve => {
                            this.refreshSubscribers.push((token: string) => {
                                originalRequest.headers['Authorization'] = `Bearer ${token}`;
                                resolve(this.axiosInstance(originalRequest));
                            });
                        });
                    }
                }

                return Promise.reject(error);
            }
        );
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