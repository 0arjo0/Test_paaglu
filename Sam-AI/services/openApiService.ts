

import { ProductInput, GeneratedContent, PolicyFile, HistoryItem, CATEGORIES } from "../types";

const API_BASE_URL = 'http://localhost:5000/api';

// Helper to get current username
const getUsername = () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr).username : 'demo';
};

// Helper for Fetch Wrapper
const apiCall = async (endpoint: string, method: string = 'GET', body?: any) => {
    const username = getUsername();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-user-id': username
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `API Error: ${response.statusText}`);
        }
        return data;
    } catch (e: any) {
        // Pass through validation errors cleanly
        if (e.message && e.message.includes("VALIDATION_ERROR")) {
            throw e;
        }
        console.error(`API Call Failed [${endpoint}]:`, e);
        throw e;
    }
};

// Check Health
export const checkServerHealth = async (): Promise<boolean> => {
    try {
        const res = await fetch('http://localhost:5000/health');
        return res.ok;
    } catch {
        return false;
    }
};

export const isMockMode = () => false;

// --- Auth ---
export const loginUser = async (username: string, password: string): Promise<any> => {
    // We use fetch directly here since we don't have a username for header yet
    const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Login failed');
    return data;
};

// --- Product Generation ---

export const generateProductContent = async (input: ProductInput): Promise<GeneratedContent> => {
    return await apiCall('/generate', 'POST', input);
};

export const regenerateWithMarketDemand = async (input: ProductInput, marketDemand: string): Promise<GeneratedContent> => {
    return await apiCall('/regenerate-market', 'POST', { input, marketDemand });
};

// --- Vision Ops ---

export const detectImageCategory = async (base64: string, mimeType: string): Promise<{ category: string, productName: string } | null> => {
    try {
        const result = await apiCall('/detect-category', 'POST', { 
            imageBase64: base64, 
            imageMimeType: mimeType,
            categories: CATEGORIES.join(', ')
        });
        // Returns { category: string, productName: string }
        return result;
    } catch (e) {
        console.error("Detect Category Failed:", e);
        return null;
    }
};

// --- History ---

export const getHistory = async (): Promise<HistoryItem[]> => {
    return await apiCall('/history');
};

export const saveHistoryItem = async (item: HistoryItem): Promise<void> => {
    return await apiCall('/history', 'POST', item);
};

export const updateHistoryItem = async (id: string, updates: Partial<HistoryItem>): Promise<void> => {
    return await apiCall(`/history/${id}`, 'PATCH', updates);
};

export const deleteHistoryItem = async (id: string): Promise<void> => {
    return await apiCall(`/history/${id}`, 'DELETE');
};

// --- Policies ---

export const getPolicies = async (): Promise<PolicyFile[]> => {
    return await apiCall('/policies');
};

export const uploadPolicy = async (filename: string, content: string): Promise<void> => {
    return await apiCall('/policies', 'POST', { filename, content });
};

export const deletePolicy = async (filename: string): Promise<void> => {
    return await apiCall(`/policies/${filename}`, 'DELETE');
};

// --- Integrations ---
export const publishToPlatform = async (platform: string, content: GeneratedContent, productName: string): Promise<{ success: boolean, publishedUrl: string }> => {
    return await apiCall('/integrations/publish', 'POST', { platform, content, productName });
};