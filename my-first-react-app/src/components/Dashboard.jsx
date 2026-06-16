import { useState } from "react";
import { useLoaderData, useNavigate, redirect, Link, useRevalidator } from "react-router";
import { useLogout, isTokenExpired } from "../utils/auth.js";
import { api } from "./api.js";

/**
 * Loading Skeleton that matches the Dashboard layout
 */
const DashboardSkeleton = () => (
  <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-classy-fade">
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 pb-6 border-b border-gray-100">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
      </div>
      <div className="flex items-center gap-3">
        <div className="h-10 w-28 bg-purple-100 rounded-xl animate-pulse" />
        <div className="h-10 w-40 bg-blue-100 rounded-xl animate-pulse" />
        <div className="h-10 w-10 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    </header>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-app-card p-6 rounded-2xl shadow-sm border border-app-border space-y-4">
          <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
          <div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
        </div>
      ))}
    </div>

    <section className="bg-app-card rounded-3xl shadow-xl shadow-gray-100/50 border border-app-border overflow-hidden">
      <div className="px-8 py-6 border-b border-app-border flex justify-between items-center">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-app-bg/50">
            <tr className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-400">
              <th className="px-8 py-4">Title</th>
              <th className="px-8 py-4">Last Modified</th>
              <th className="px-8 py-4">Status</th>
              <th className="px-8 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-app-border">
            {[1, 2, 3].map((i) => (
              <tr key={i}>
                <td className="px-8 py-5"><div className="h-5 w-48 bg-gray-100 rounded animate-pulse" /></td>
                <td className="px-8 py-5"><div className="h-4 w-24 bg-gray-50 rounded animate-pulse" /></td>
                <td className="px-8 py-5"><div className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" /></td>
                <td className="px-8 py-5"><div className="flex justify-end gap-2"><div className="h-9 w-9 bg-gray-50 rounded-lg animate-pulse" /><div className="h-9 w-9 bg-gray-50 rounded-lg animate-pulse" /></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  </div>
);

/**
 * clientLoader runs on the client before the component renders.
 * This is the modern way to protect routes
 */
export async function clientLoader() {
  const accessToken = localStorage.getItem("access_token");
  const refreshToken = localStorage.getItem("refresh_token");
  const firstName = localStorage.getItem("first_name");

  // Bypass for testing
  if (firstName === "Tester") {
    return { firstName: "Tester", resumes: [], stats: { total: 0, downloads: 0, views: 0 } };
  }

  // Basic Auth Gate
  if (!accessToken || !firstName) {
    throw redirect("/auth");
  }

  // Auto-logout if the session is unrecoverable (Refresh token expired)
  if (refreshToken && isTokenExpired(refreshToken)) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("first_name");
    throw redirect("/auth");
  }

  try {
    const [resumes, stats] = await Promise.all([
      api.getResumes(),
      api.getDashboardStats()
    ]);
    return { firstName, resumes, stats };
  } catch (error) {
    console.error("Failed to load dashboard data:", error);
    return { firstName, resumes: [], stats: { total: 0, downloads: 0, views: 0 } };
  }
}

export default function Dashboard() {
  const navigate = useNavigate();
  const logout = useLogout();
  const loaderData = useLoaderData(); // Get data from the loader
  const revalidator = useRevalidator();
  
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Safety Guard: Handle initial hydration where loader data might be null
  if (!loaderData) {
    return <DashboardSkeleton />;
  }

  const { firstName, resumes, stats } = loaderData;

  const handleAiAction = async () => {
    // Logic for AI generation call
    setIsAiModalOpen(false);
    alert("AI is crafting your resume. You will be notified when it's ready!");
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteResume(deleteTarget.id);
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
      revalidator.revalidate(); // Refresh the list
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-classy-fade">
      {/* Header Section */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 pb-6 border-b border-gray-100">
        <div>
          <h1 className="text-3xl font-extrabold text-app-text tracking-tight">
            Welcome, <span className="text-brand-blue">{firstName}</span>!
          </h1>
          <p className="text-gray-500 mt-1">Manage your professional resumes and track your applications.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsAiModalOpen(true)} className="px-5 py-2.5 bg-purple-600 text-white font-bold rounded-xl shadow-lg hover:bg-purple-700 hover:scale-105 transition-all active:scale-95 text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13.464 15.05a1 1 0 010 1.414l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 0z" /></svg>
            AI Builder
          </button>
          <Link to="/dashboard/new" className="px-5 py-2.5 bg-brand-blue text-white font-bold rounded-xl shadow-lg hover:bg-button-hover hover:scale-105 transition-all active:scale-95 text-sm">
            + Create New Resume
          </Link>
          <button 
            onClick={logout}
            className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
            title="Logout"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <div className="bg-app-card p-6 rounded-2xl shadow-sm border border-app-border">
          <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Total Resumes</span>
          <div className="text-3xl font-black text-brand-blue mt-2">{stats.total}</div>
        </div>
        <div className="bg-app-card p-6 rounded-2xl shadow-sm border border-app-border">
          <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Downloads</span>
          <div className="text-3xl font-black text-brand-blue mt-2">{stats.downloads}</div>
        </div>
        <div className="bg-app-card p-6 rounded-2xl shadow-sm border border-app-border">
          <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Profile Views</span>
          <div className="text-3xl font-black text-brand-blue mt-2">{stats.views}</div>
        </div>
      </div>

      {/* Content Section */}
      <section className="bg-app-card rounded-3xl shadow-xl shadow-gray-100/50 border border-app-border overflow-hidden">
        <div className="px-8 py-6 border-b border-app-border flex justify-between items-center">
          <h2 className="text-xl font-bold text-app-text">Your Resumes</h2>
          <button className="text-sm font-bold text-brand-blue hover:underline">View all</button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-app-bg/50">
              <tr className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-400">
                <th className="px-8 py-4">Title</th>
                <th className="px-8 py-4">Last Modified</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border">
              {resumes.length > 0 ? resumes.map((resume) => (
                <tr key={resume.id} className="hover:bg-app-bg/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="font-bold text-app-text group-hover:text-brand-blue transition-colors cursor-pointer">{resume.title}</div>
                  </td>
                  <td className="px-8 py-5 text-sm text-gray-500">{resume.lastModified}</td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      resume.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {resume.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 text-gray-400 hover:text-brand-blue transition-colors" title="Analyze"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg></button>
                      <button className="p-2 text-gray-400 hover:text-brand-blue transition-colors" title="Edit"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                      <button 
                        onClick={() => { setDeleteTarget(resume); setIsDeleteModalOpen(true); }}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors" 
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="px-8 py-10 text-center text-gray-400 italic">No resumes found. Click "Create New" to start.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* AI Resume Creation/Analysis Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-app-card w-full max-w-xl rounded-3xl shadow-2xl border border-app-border overflow-hidden">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-app-text tracking-tight">AI Resume Magic</h2>
                <button onClick={() => setIsAiModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-2xl">×</button>
              </div>
              <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                Paste a job description or describe your dream role. Our AI will generate a tailored resume or analyze your existing ones against the target.
              </p>
              <textarea 
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g., I'm applying for a Senior React position at Google. Here is the job description..."
                className="w-full h-48 p-4 bg-app-bg border border-app-border rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none transition-all text-sm resize-none mb-6"
              />
              <div className="flex gap-4">
                <button onClick={handleAiAction} className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-all shadow-lg active:scale-95">Generate with AI</button>
                <button onClick={handleAiAction} className="flex-1 py-3 bg-white text-purple-600 border border-purple-200 font-bold rounded-xl hover:bg-purple-50 transition-all active:scale-95">Analyze Match</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-app-card w-full max-w-md rounded-3xl shadow-2xl border border-app-border overflow-hidden">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-app-text mb-2">Delete Resume?</h2>
              <p className="text-gray-500 mb-8 text-sm">
                Are you sure you want to delete <span className="font-bold text-app-text">"{deleteTarget?.title}"</span>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all">Cancel</button>
                <button onClick={confirmDelete} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-200">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}