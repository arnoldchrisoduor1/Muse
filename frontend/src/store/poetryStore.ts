import { create } from "zustand";
import { persist, PersistOptions } from "zustand/middleware";
import axios from 'axios';

interface Poem {
  id: string;
  user: number;
  username: string;
  title: string;
  content: string;
  slug: string;
  description: string;
  image_url: string;
  created_at: string;
  updated_at: string;
  likes_count: number;
  is_liked: boolean;
  comments_count: number;
  thoughts?: string;
}

interface PoemsResponse {
  count: number;
  results: Poem[];
}

interface PoetryState {
  poems: Poem[];
  currentPoem: Poem | null;
  isLoading: boolean;
  error: string | null;
  createPoem: (poetryData: {
    title: string;
    description: string;
    content: string;
    thoughts: string;
  }) => Promise<Poem>;
  getPoems: () => Promise<Poem[]>;
  setCurrentPoem: (poem: Poem | null) => void;
}

const initialPoetryState = {
  poems: [],
  currentPoem: null,
  isLoading: false,
  error: null
};

const API_BASE_URL = 'http://127.0.0.1:8000';

// Creating an axios instance without the default auth headers
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Define specific methods that require authentication
const requiresAuth = (method: string, url: string): boolean => {
  // For this API, GET requests to /api/poems/ don't need auth, but POST requests do
  if (url.includes('/api/poems/') && method.toUpperCase() === 'GET') {
    return false;
  }
  // All other endpoints require auth by default 
  // (you can expand this logic for other endpoints as needed)
  return true;
};

// Modified interceptor that only adds auth for endpoints that need it
api.interceptors.request.use(
  (config) => {
    // Only add the token for endpoints that require authentication
    if (requiresAuth(config.method || '', config.url || '')) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Define persist configuration
type PoetryPersistConfig = PersistOptions<PoetryState, PoetryState>;

const persistConfig: PoetryPersistConfig = {
  name: 'poetry-storage',
  getStorage: () => localStorage,
};

// Creating a Poetry store with persistence
const usePoetryStore = create<PoetryState>()(
  persist(
    (set, get) => ({
      ...initialPoetryState,
      
      createPoem: async (poetryData) => {
        set({ isLoading: true, error: null });
        try {
          const { title, description, content, thoughts } = poetryData;
          const response = await api.post('/api/poems/', {
            title,
            description,
            content,
            thoughts
          });
          
          // Update the poems list with the new poem
          const poems = [...get().poems, response.data];
          set({ poems, isLoading: false });
          
          return response.data;
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.response?.data?.message || error.message 
          });
          throw error.response?.data || error;
        }
      },
      
      getPoems: async () => {
        set({ isLoading: true, error: null });
        try {
          // Create request config
          const config: any = {
            url: '/api/poems/',
            method: 'GET'
          };
          
          // Optionally add auth token if available
          const token = localStorage.getItem('accessToken');
          if (token) {
            config.headers = {
              Authorization: `Bearer ${token}`
            };
          }
          
          const response = await api.request<PoemsResponse>(config);
          set({ 
            poems: response.data.results, 
            isLoading: false 
          });
          return response.data.results;
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.response?.data?.message || error.message 
          });
          throw error.response?.data || error;
        }
      },

      likePoem: async (slug: string) => {
        try {
          const response = await api.post(`/api/poems/${slug}/like/`);
          return response.data; // This should have the status: "liked" or "unliked"
        } catch (error) {
          console.error("Error liking poem:", error);
          throw error;
        }
      },

      getPoemCommentsandReplies: async (slug: string) => {
        try{
            const response = await api.get(`/api/poems/${slug}/comments/`);
            return response.data;
        } catch(error: any) {
            console.error("Error getting the comments: ", error);
            throw error;
        }
      },
      
      setCurrentPoem: (poem) => {
        set({ currentPoem: poem });
      }
    }),
    persistConfig
  )
);

export default usePoetryStore;