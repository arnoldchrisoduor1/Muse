import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from 'axios';

const initialPoetryState = {
    id: null,
    user: null,
    username: '',
    title: '',
    contant: '',
    slug: '',
    description: '',
    image_url: '',
    created_at: '',
    updated_at: '',
    likes_count: 0,
    comments_count: 0
}

const API_BASE_URL = 'http://127.0.0.1:8000';

// Creating an axios instance.
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
})

// Adding a request interceptor to include the authentication token.
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if(token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

//TODO: Create types for function Inputs

// Now creating a Poetry store with persistence.
const usePoetryStore = create(
    persist(
        (set, get) => ({
            ...initialPoetryState,
            createPoem: async (poetryData) => {
                console.log("creating poetry with:", poetryData);
                const { title, description, content, thoughts } = poetryData;
                //TODO: Verify details befor sending.
                try {
                    const response = await api.post('/api/poems/', {
                        title,
                        description,
                        content,
                        thoughts
                    });
                    console.log("Poem created: ", response.data);
                    return response.data;
                } catch (error: any) {
                    console.error('Poetry creation error:', error.response?.data || error.message);
                    throw error.response?.data || error;
                }
            }

        }),
        {
            // This is the name for the local storage key.
            name: 'poetry-storage',
            // using localstorage for persistence
            getStorage: () => localStorage,
        }
    )
)

export default usePoetryStore;