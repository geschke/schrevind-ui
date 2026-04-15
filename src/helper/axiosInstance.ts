import axiosInstance  from 'axios';
//import { useAuthStore } from '@/stores/authStore';
import { config } from '@/config';


const axios = axiosInstance.create({
    baseURL: `${config.apiUrl}${config.apiPrefix}`, // Your backend URL
    withCredentials: true, // Include credentials (cookies) in requests
    //timeout: 10000, // Timeout in milliseconds
});

function normalizeFieldErrors(value: unknown): Record<string, string> {
    if (!value || typeof value !== 'object') {
        return {};
    }

    return Object.fromEntries(
        Object.entries(value as Record<string, unknown>)
            .filter(([field, code]) => field.trim() !== '' && typeof code === 'string' && code.trim() !== '')
            .map(([field, code]) => [field, String(code)])
    );
}

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
        const responseData = error.response?.data;

        if (error.response && responseData?.message) {
            errorCode = responseData.message;
        } else if (error.request) {
            errorCode = 'NETWORK_ERROR';
        }

        const appError = new Error(errorCode) as Error & {
            code?: string;
            status?: number;
            backendMessage?: string;
            fieldErrors?: Record<string, string>;
            backendData?: unknown;
        };
        appError.code = errorCode;
        appError.status = error.response?.status;
        appError.backendMessage = responseData?.message;
        appError.fieldErrors = normalizeFieldErrors(responseData?.fieldErrors);
        appError.backendData = responseData;

        return Promise.reject(appError);
    }
);

export default axios;
