// Import axios for HTTP requests
import axios from "axios";
// Base URL of your backend
const API_BASE_URL = 'http://localhost:5000/api';
//// API service object
const api = {
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