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

// Creating an axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Adding a request interceptor to include the authentication token
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

// Define persist configuration
type PoetryPersistConfig = PersistOptions<PoetryState, PoetryState>;

const persistConfig: PoetryPersistConfig = {
  name: 'poetry-storage',
  getStorage: () => localStorage,
};

// Creating a Poetry store with persistence, fixing the type issues
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
        console.log("getting poems");
        set({ isLoading: true, error: null });
        try {
          const response = await api.get<PoemsResponse>('/api/poems/');
          set({ 
            poems: response.data.results, 
            isLoading: false 
          });
          console.log(response.data.results)
          return response.data.results;
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.response?.data?.message || error.message 
          });
          throw error.response?.data || error;
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