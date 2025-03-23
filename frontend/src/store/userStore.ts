import { create } from 'zustand';
import { persist, PersistOptions } from 'zustand/middleware';
import axios from 'axios';

// Define User interfaces
interface UserProfile {
  avatar_url: string | null;
  bio: string;
  create_at: string | null;
  updated_at: string | null;
}

interface User {
  id: number | null;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profile: UserProfile;
  is_active: boolean;
  isAuthenticated: boolean;
}

// Define UserStore interface
interface UserState {
  user: User;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  signup: (userData: {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
  }) => Promise<any>;
  
  login: (userData: {
    username: string;
    password: string;
  }) => Promise<User>;
  
  updateProfile: (profileData: {
    first_name: string;
    last_name: string;
    bio: string;
  }) => Promise<any>;
  
  uploadAvatar: (avatarFile: File) => Promise<any>;
  updateAvatarUrl: (avatarUrl: string) => Promise<any>;
  
  logout: () => void;
  
  reset: () => void;
}

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

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

// Initial User State
const initialUserState: Pick<UserState, 'user' | 'isLoading' | 'error'> = {
  user: {
    id: null,
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    profile: {
      avatar_url: null,
      bio: '',
      create_at: null,
      updated_at: null
    },
    is_active: false,
    isAuthenticated: false
  },
  isLoading: false,
  error: null
};

// Define persist configuration
type UserPersistConfig = PersistOptions<UserState, UserState>;

const persistConfig: UserPersistConfig = {
  name: 'user-storage',
  getStorage: () => localStorage,
};

// Create the Zustand Store
const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      ...initialUserState,

      // Actions
      signup: async (userData) => {
        set({ isLoading: true, error: null });
        const { username, email, password, password_confirm } = userData;

        if (password !== password_confirm) {
          set({ isLoading: false, error: 'Passwords do not match' });
          throw new Error('Passwords do not match');
        }

        try {
          const response = await api.post('/api/users/users/', {
            username,
            email,
            password,
            password_confirm
          });

          set({ isLoading: false });
          return response.data;
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || error.message
          });
          throw error.response?.data || error;
        }
      },

      getSingleUser: async(user_id: number) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get(`/api/users/users/public/${user_id}/`);
          set({ isLoading: false });
          return response.data;
        } catch(error: any) {
          set({ isLoading: false });
          set({error: error.response?.data?.message || error.message});
          throw error.reponse?.data || error;
        }
      },

      updateProfile: async (profileData) => {
        set({ isLoading: true, error: null });
        const { first_name, last_name, bio } = profileData;
        
        try {
          const response = await api.put('/api/users/users/me/profile/', {
            first_name,
            last_name,
            bio
          });

          set({
            isLoading: false,
            user: {
              ...get().user,
              ...response.data
            }
          });

          return response.data;
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || error.message
          });
          throw error.response?.data || error;
        }
      },

      uploadAvatar: async (avatarFile) => {
        set({ isLoading: true, error: null });
        console.log("avatar filetype", avatarFile.type);
        
        try {
          // Step 1: Get the presigned URL for upload
          const urlResponse = await api.get('/api/users/users/image-url/', {
            params: { content_type: avatarFile.type || 'image/jpeg' }
          });
          const { uploadURL, objectURL } = urlResponse.data;
          
          // Step 2: Upload the file directly to S3
          console.log("uploading image to s3: ", avatarFile);
          const response = await axios({
            method: 'PUT',
            url: uploadURL,
            headers: { 
              'Content-Type': avatarFile.type || 'image/jpeg'
            },
            data: avatarFile
          });

          console.log("upload to s3 response:", response);
          
          // Step 3: Update the user's avatar URL in the backend
          const updateResponse = await api.put('/api/users/users/me/avatar/', {
            avatar_url: objectURL
          });

          console.log("update image url to user response: ", updateResponse);
          
          // Step 4: Update local state
          set({
            isLoading: false,
            user: {
              ...get().user,
              ...updateResponse.data
            }
          });
          
          console.log(objectURL);
          return objectURL;
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || error.message
          });
          console.log(error);
          throw error.response?.data || error;
        }
      },
      
      updateAvatarUrl: async (avatarUrl) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await api.put('/api/users/me/avatar/', {
            avatar_url: avatarUrl
          });
          
          set({
            isLoading: false,
            user: {
              ...get().user,
              ...response.data
            }
          });
          
          return response.data;
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || error.message
          });
          throw error.response?.data || error;
        }
      },

      login: async (userData) => {
        set({ isLoading: true, error: null });
        const { username, password } = userData;
        
        try {
          const response = await api.post('/api/auth/token/', {
            username,
            password
          });
          const { access, refresh, user } = response.data;

          localStorage.setItem('accessToken', access);
          localStorage.setItem('refreshToken', refresh);

          set({
            isLoading: false,
            user: {
              ...user,
              isAuthenticated: true
            }
          });

          return user;
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || error.message
          });
          throw error.response?.data || error;
        }
      },

      logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        set({ ...initialUserState });
      },

      reset: () => {
        set({ ...initialUserState });
      }
    }),
    persistConfig
  )
);

// Export the store and API for easy access
export { useUserStore, api };