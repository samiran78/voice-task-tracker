// Import axios for HTTP requests
import axios from "axios";
// Base URL of your backend
const API_BASE_URL = 'http://localhost:5001/api';
// Add token to requests
axios.interceptors.request.use(
    (config) => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.token) {
            config.headers['Authorization'] = `Bearer ${user.token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

//// API service object
const api = {
    // Auth endpoints
    register: async (userData) => {
        const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
        if (response.data && response.data.data) {
            localStorage.setItem('user', JSON.stringify(response.data.data));
        }
        return response.data;
    },
    login: async (userData) => {
        const response = await axios.post(`${API_BASE_URL}/auth/login`, userData);
        if (response.data && response.data.data) {
            localStorage.setItem('user', JSON.stringify(response.data.data));
        }
        return response.data;
    },
    logout: () => {
        localStorage.removeItem('user');
    },

    //to get all tasks
    getAllTasks: async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/tasks/getAllTasks`);
            return response.data;
        } catch (error) {
            console.error('Error fetching tasks:', error);
            throw error;
        }
    },
    //to create new task via frontend
    createTask: async (taskData) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/tasks/createTask`, taskData);
            return response.data;
        } catch (error) {
            console.error('Error creating task:', error);
            throw error;
        }
    },

    // Parse voice input
    parseVoiceTranscript: async (transcript) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/voice/parse`, { transcript });
            return response.data;
        } catch (error) {
            console.error('Error parsing voice:', error);
            throw error;
        }
    }
}
export default api;