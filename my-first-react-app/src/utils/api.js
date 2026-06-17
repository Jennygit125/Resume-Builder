import { createClient } from '@supabase/supabase-js';

// Defensive URL cleaning: Trim whitespace and remove trailing slashes
// This prevents "Invalid path" errors common in Supabase Auth
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim().replace(/\/$/, "");
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Safeguard: Ensure environment variables are present
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing from environment variables.");
  if (import.meta.env.DEV) alert("Supabase environment variables missing!");
}

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_PRESET;

    // If profilePic is a base64 string or new file, upload to Cloudinary
    if (imageUrl.startsWith('data:image')) {
      if (!cloudName || !uploadPreset) {
        console.error("Cloudinary Configuration Missing: Ensure VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_PRESET are set.");
        throw new Error("Image upload service is currently unavailable.");
      }
      const formData = new FormData();
      formData.append('file', resumeData.profilePic);
      formData.append('upload_preset', uploadPreset);

      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
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