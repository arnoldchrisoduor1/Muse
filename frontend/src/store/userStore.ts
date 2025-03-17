import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

// Define the initial user state
const initialUserState = {
  id: null,
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  profile: {
    avatar: null,
    bio: '',
    create_at: null,
    updated_at: null
  },
  is_active: false,
  isAuthenticated: false
};

// API base URL
const API_BASE_URL = 'http://127.0.0.1:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Create the user store with persistence
const useUserStore = create(
  persist(
    (set, get) => ({
      // Initial state
      ...initialUserState,
      
      // Actions
      signup: async (userData) => {
        console.log("Signing up using", userData);
        const { username, email, password, password_confirm } = userData;
        
        // Validate password match
        if (password !== password_confirm) {
          throw new Error('Passwords do not match');
        }
        
        try {
          console.log('Attempting to sign up with:', { username, email });
          
          const response = await api.post('/api/users/users/', {
            username,
            email,
            password,
            password_confirm
          });
          
          console.log('Signup response data:', response.data);
        
          console.log("User created", response.data);

          return response.data;
        } catch (error) {
          console.error('Signup error:', error.response?.data || error.message);
          throw error.response?.data || error;
        }
      },
      
      // Update user profile information
      updateProfile: async (profileData) => {
        const { first_name, last_name, bio } = profileData;
        const currentUser = get();
        
        try {
          const response = await api.put(`/api/users/users/${currentUser.id}/`, {
            first_name,
            last_name,
            profile: {
              bio
            }
          });
          
          set({
            ...currentUser,
            ...response.data
          });
          
          return response.data;
        } catch (error) {
          console.error('Profile update error:', error.response?.data || error.message);
          throw error.response?.data || error;
        }
      },
      
      // Update avatar
      updateAvatar: async (avatarFile) => {
        const currentUser = get();
        
        try {
          // Create form data for file upload
          const formData = new FormData();
          formData.append('avatar', avatarFile);
          
          // Need to override content-type header for multipart/form-data
          const response = await axios.put(
            `${API_BASE_URL}/api/users/users/${currentUser.id}/profile/`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
                'Accept': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
              }
            }
          );
          
          set({
            ...currentUser,
            profile: {
              ...currentUser.profile,
              ...response.data
            }
          });
          
          return response.data;
        } catch (error) {
          console.error('Avatar update error:', error.response?.data || error.message);
          throw error.response?.data || error;
        }
      },
      
      // Login user
      login: async (userData) => {
        console.log("Loggin in with", userData);
        const { username, password } = userData;
        try {
          const response = await api.post('/api/auth/token/', {
            username,
            password
          });
          const { access, refresh, user } = response.data;
          
          // Store tokens in localStorage
          localStorage.setItem('accessToken', access);
          localStorage.setItem('refreshToken', refresh);
          
          set({
            ...user,
            isAuthenticated: true
          });
          console.log("Login response:", response.data);
          console.log("user", user);
          return user;
        } catch (error) {
          console.error('Login error:', error.response?.data || error.message);
          throw error.response?.data || error;
        }
      },
      
      // Logout: clear user state and tokens
      logout: () => {
        // Remove tokens from localStorage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        set(initialUserState);
      },
      
      // Reset store to initial state (useful for testing)
      reset: () => {
        set(initialUserState);
      }
    }),
    {
      name: 'user-storage', // Name for localStorage key
      getStorage: () => localStorage, // Use localStorage for persistence
    }
  )
);

export default useUserStore;