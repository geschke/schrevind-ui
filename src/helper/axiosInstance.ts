import axiosInstance  from 'axios';
//import { useAuthStore } from '@/stores/authStore';
import { config } from '@/config';


const axios = axiosInstance.create({
    baseURL: `${config.apiUrl}${config.apiPrefix}`, // Your backend URL
    withCredentials: true, // Include credentials (cookies) in requests
    //timeout: 10000, // Timeout in milliseconds
});

// Request Interceptor: Add auth token to each request if available
/*axios.interceptors.request.use(
    config => {
        const authStore = useAuthStore();
        const token = authStore.token; // Assuming token is stored in the auth store
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        // Reject if there is an error setting up the request
        return Promise.reject(error);
    }
);
*/
// Response Interceptor: Handle errors centrally
axios.interceptors.response.use(
    response => response, // Pass through successful responses
    error => {
        let errorCode = 'UNKNOWN_ERROR';

        if (error.response && error.response.data?.message) {
            errorCode = error.response.data.message;
        } else if (error.request) {
            errorCode = 'NETWORK_ERROR';
        }

        const appError = new Error(errorCode) as Error & {
            code?: string;
            status?: number;
            backendMessage?: string;
        };
        appError.code = errorCode;
        appError.status = error.response?.status;
        appError.backendMessage = error.response?.data?.message;

        return Promise.reject(appError);
    }
);

export default axios;
