import axios from "axios";

// Create a custom axios instance with default configuration
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  // timeout: 30000, // 30 seconds
});

// Add request interceptor for authentication if needed
apiClient.interceptors.request.use(
  (config) => {
    // You can add auth token here if needed
    // const token = getToken();
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors here
    if (error.response) {
      // Server responded with a status code outside the 2xx range
      console.error("API Error:", error.response.data);
    } else if (error.request) {
      // Request was made but no response was received
      console.error("Network Error:", error.message);
    } else {
      // Something happened in setting up the request
      console.error("Request Error:", error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
