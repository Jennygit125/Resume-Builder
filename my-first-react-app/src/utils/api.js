import { isTokenExpired, refreshAccessToken } from "./auth.js";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

/**
 * A wrapper around fetch that automatically adds the Bearer token
 * and handles base URL configuration.
 */
export async function apiFetch(endpoint, options = {}) {
  // Fallback to empty string for relative paths. 
  // On Vercel, if your backend is in the /api directory, VITE_API_BASE_URL should be set to "/api" 
  // or left empty if the endpoint includes the /api prefix.
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
  
  const accessToken = localStorage.getItem("access_token");

  // Standardize headers
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Automatically add the Bearer token if it exists
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const config = {
    ...options,
    headers,
  };

  const startTime = Date.now();
  // Standard 60s limit for wake-up cycles. 
  // Note: Vercel Hobby tier serverless functions timeout at 10s.
  const TIMEOUT_LIMIT = 60000; 

  while (Date.now() - startTime < TIMEOUT_LIMIT) {
    const controller = new AbortController();
    const remainingTime = TIMEOUT_LIMIT - (Date.now() - startTime);
    const timeoutId = setTimeout(() => controller.abort(), remainingTime);

    // Robust URL joining to prevent double slashes or missing slashes
    // This ensures compatibility with Vercel's API directory routing
    const fullUrl = `${API_BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

    try {
      console.log(`🚀 Fetching (${Math.round((Date.now() - startTime) / 1000)}s): ${fullUrl}`);
      const response = await fetch(fullUrl, {
        ...config,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      // If the backend returns "Service Unavailable" or "Bad Gateway" while booting, retry
      if ([502, 503, 504].includes(response.status)) {
        console.warn(`Backend is waking up (Status ${response.status}), retrying...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }

      if (response.status === 401) {
        // Attempt to silent refresh before giving up
        const refreshToken = localStorage.getItem("refresh_token");
        if (refreshToken && !isTokenExpired(refreshToken)) {
          try {
            const newToken = await refreshAccessToken();
            // Update the header for the retry attempt
            config.headers["Authorization"] = `Bearer ${newToken}`;
            continue; // Jump back to the start of the while loop to retry the fetch
          } catch (refreshError) {
            console.error("Silent refresh failed:", refreshError);
          }
        }

        console.warn("Unauthorized request. Redirecting to login...");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("first_name");
        localStorage.removeItem("username");
        window.location.href = "/auth?message=session_expired";
        return null;
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Retry on network errors (TypeError) if we haven't hit the 60s limit
      if (error.name === "TypeError" && (Date.now() - startTime < TIMEOUT_LIMIT)) {
        console.warn("Network unreachable, backend might be sleeping. Retrying in 2s...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }

      if (error.name === "AbortError") {
        throw new Error("The server is taking too long to respond. Please try again.");
      }
      console.error("API Fetch Error:", error);
      throw error;
    }
  }
  
  throw new Error("The server is taking too long to respond. Please try again.");
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  // Resume Operations
  getResumes: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', user.id)
      .order('last_modified', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  getResumeById: async (id) => {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  getDashboardStats: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { count, error } = await supabase
      .from('resumes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    
    if (error) throw error;
    
    return { total: count || 0, downloads: 0, views: 0 };
  },

  deleteResume: async (id) => {
    const { error } = await supabase
      .from('resumes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { success: true };
  },

  duplicateResume: async (id) => {
    const { data: original, error: fetchError } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const duplicatedContent = { ...original.content };
    delete duplicatedContent.id; // Strip old ID from content if present

    const { data, error } = await supabase
      .from('resumes')
      .insert({
        user_id: original.user_id,
        title: `${original.title} (Copy)`,
        content: duplicatedContent,
        status: 'Draft',
        last_modified: new Date().toISOString()
      })
      .select();

    if (error) throw error;
    return data[0];
  },

  saveResume: async (resumeData) => {
    // 1. Get current user first to ensure session is valid
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("You must be logged in to save a resume.");

    let imageUrl = resumeData.profilePic || "";

    // If profilePic is a base64 string or new file, upload to Cloudinary
    if (imageUrl.startsWith('data:image')) {
      const formData = new FormData();
      formData.append('file', resumeData.profilePic);
      formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_PRESET);

      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      );
      
      const cloudData = await cloudRes.json();
      imageUrl = cloudData.secure_url;
    }

    // Prepare the payload for Supabase
    const resumePayload = {
      user_id: user.id,
      title: resumeData.jobTitle || 'Untitled Resume',
      content: { ...resumeData, profilePic: imageUrl },
      status: 'Completed',
      last_modified: new Date().toISOString()
    };

    // Include ID if we are updating an existing record
    if (resumeData.id) resumePayload.id = resumeData.id;

    // 2. Direct save to Supabase 'resumes' table
    const { data, error } = await supabase
      .from('resumes')
      .upsert(resumePayload)
      .select();

    if (error) throw error;
    return data[0];
  },

  // AI Integration
  generateAiResume: async (prompt) => {
    const { data, error } = await supabase.functions.invoke('generate-resume', {
      body: { prompt }
    });
    if (error) throw error;
    return data;
  },

  chatWithAi: async (message) => {
    const { data, error } = await supabase.functions.invoke('generate-resume', {
      body: { prompt: message, mode: 'chat' }
    });
    if (error) throw error;
    return data?.reply;
  },

  improveText: async (text) => {
    const { data, error } = await supabase.functions.invoke('generate-resume', {
      body: { prompt: text, mode: 'improve' }
    });
    if (error) throw error;
    return data?.improvedText;
  },

  analyzeResume: async (resumeId) => {
    const { data, error } = await supabase.functions.invoke('analyze-resume', {
      body: { resumeId }
    });
    if (error) throw error;
    return data;
  },

  linkOAuthProvider: async (provider) => {
    const { data, error } = await supabase.auth.linkIdentity({
      provider,
      options: {
        // Ensure this matches your Supabase redirect whitelist
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) throw error;
    return data;
  },
};