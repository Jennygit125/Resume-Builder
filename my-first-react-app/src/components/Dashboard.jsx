import { useState, useEffect } from "react";
import { useLoaderData, useNavigate, redirect, Link, useRevalidator } from "react-router";
import { useLogout } from "../utils/auth.js";
import { requireAuth, handleAuthError } from "../utils/authGuard.js";
import { api } from '../utils/api.js';
import { pdf } from '@react-pdf/renderer';
import ResumeDocument from "../pages/ResumeUpdate/Forms/ResumeDocument.jsx";

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
  // requireAuth handles token validation and redirection globally
  const { firstName } = await requireAuth();
  const MAX_RETRIES = 3;
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const [resumes, stats] = await Promise.all([
        api.getResumes(),
        api.getDashboardStats()
      ]);
      
      // If successful, return the data immediately
      return { firstName, resumes, stats, hasError: false, syncedAt: new Date().toISOString() };
    } catch (error) {
      lastError = error;
      console.warn(`Dashboard fetch attempt ${attempt}/${MAX_RETRIES} failed.`);
      
      // If we have attempts left, wait a bit before trying again
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  // If we reach here, all retries failed
  return handleAuthError(lastError).catch(() => ({ 
    firstName, 
    resumes: [], 
    stats: { total: 0, downloads: 0, views: 0 },
    hasError: true,
    syncedAt: null
  }));
}

export default function Dashboard() {
  const navigate = useNavigate();
  const logout = useLogout();
  const loaderData = useLoaderData(); // Get data from the loader
  const revalidator = useRevalidator();
  
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [selectedResumeIdForAnalysis, setSelectedResumeIdForAnalysis] = useState("");
  const [animatedScore, setAnimatedScore] = useState(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDownloading, setIsDownloading] = useState(null); // Tracks ID of resume being downloaded
  const [isAiLoading, setIsAiLoading] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
  };

  const formatTime = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Handle the count-up animation for the AI Analysis score
  useEffect(() => {
    if (isAnalysisModalOpen && analysisResult) {
      setAnimatedScore(0);
      const target = analysisResult.score;
      if (target === 0) return;

      const duration = 1200; // 1.2 seconds for the animation
      const startTime = Date.now();

      const timer = setInterval(() => {
        const timePassed = Date.now() - startTime;
        let progress = timePassed / duration;
        if (progress > 1) progress = 1;

        // Cubic ease-out for a smooth finish
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        setAnimatedScore(Math.floor(easedProgress * target));

        if (progress === 1) clearInterval(timer);
      }, 16); // ~60fps

      return () => clearInterval(timer);
    }
  }, [isAnalysisModalOpen, analysisResult]);

  // Safety Guard: Handle initial hydration where loader data might be null
  if (!loaderData) {
    return <DashboardSkeleton />;
  }

  const { firstName, resumes, stats, hasError, syncedAt } = loaderData;

  if (hasError) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-classy-fade">
        <div className="bg-app-card rounded-3xl shadow-xl border border-red-100 p-12 text-center flex flex-col items-center justify-center space-y-6">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-black text-app-text tracking-tight mb-2">Connection Issue</h2>
            <p className="text-gray-500 max-w-md mx-auto">We couldn't load your dashboard data. The server might be waking up or there's a network problem.</p>
          </div>
          <button 
            onClick={() => revalidator.revalidate()} 
            disabled={revalidator.state === "loading"}
            className="px-8 py-3 bg-brand-blue text-white font-bold rounded-xl shadow-lg hover:bg-button-hover transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
          >
            {revalidator.state === "loading" ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            )}
            {revalidator.state === "loading" ? "Retrying..." : "Retry Connection"}
          </button>
        </div>
      </div>
    );
  }

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    try {
      const data = await api.generateAiResume(aiPrompt);
      if (data) {
        // Save to draft and navigate to the new resume page
        localStorage.setItem("resume_draft", JSON.stringify(data));
        setIsAiModalOpen(false);
        navigate("/dashboard/new");
      }
    } catch (error) {
      console.error("AI Generation Error:", error);
      alert("Failed to generate resume. Please try again.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAiAnalyze = async (resumeId, jobDescription = null) => {
    setIsAiLoading(true);
    try {
      const analysis = await api.analyzeResume(resumeId, jobDescription);
      setAnalysisResult(analysis);
      setIsAnalysisModalOpen(true);
      setIsAiModalOpen(false); // Close the input modal if it was open
      setAiPrompt("");
    } catch (error) {
      console.error("Analysis failed:", error);
      alert("Failed to analyze resume.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleDuplicate = async (resumeId) => {
    try {
      await api.duplicateResume(resumeId);
      revalidator.revalidate();
    } catch (error) {
      console.error("Duplicate failed:", error);
    }
  };

  const handleDownload = async (resume) => {
    setIsDownloading(resume.id);
    try {
      let blob;
      try {
        // Primary attempt with custom fonts
        blob = await pdf(<ResumeDocument data={resume.content} />).toBlob();
      } catch (fontError) {
        console.warn("Custom font rendering failed, retrying with default font...", fontError);
        alert("The custom font for this resume failed to load. A standard font will be used for the PDF download instead.");
        // Fallback attempt with standard PDF font (Helvetica)
        blob = await pdf(<ResumeDocument data={resume.content} fontFamily="Helvetica" />).toBlob();
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${resume.content.firstName || 'Resume'}_CV.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Critical PDF generation failure:", error);
      alert("Could not generate PDF. Please try again later.");
    } finally {
      setIsDownloading(null);
    }
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
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            Manage your professional resumes and track your applications.
            {syncedAt && (
              <span className="hidden sm:inline-flex items-center text-[10px] text-gray-400 font-bold uppercase tracking-tight bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                Last synced: {formatTime(syncedAt)}
              </span>
            )}
          </p>
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
                  <td className="px-8 py-5 text-sm text-gray-500">{formatDate(resume.last_modified)}</td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      resume.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {resume.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleAiAnalyze(resume.id)}
                        className="p-2 text-gray-400 hover:text-brand-blue transition-colors" 
                        title="Analyze"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                      </button>
                      <Link to={`/dashboard/edit/${resume.id}`} className="p-2 text-gray-400 hover:text-brand-blue transition-colors" title="Edit">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </Link>
                      <button 
                        onClick={() => handleDownload(resume)}
                        disabled={isDownloading === resume.id}
                        className="p-2 text-gray-400 hover:text-brand-blue transition-colors disabled:opacity-50" 
                        title="Download PDF"
                      >
                        {isDownloading === resume.id ? (
                          <div className="w-5 h-5 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        )}
                      </button>
                      <button 
                        onClick={() => handleDuplicate(resume.id)}
                        className="p-2 text-gray-400 hover:text-brand-blue transition-colors" 
                        title="Duplicate"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                        </svg>
                      </button>
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
                className="w-full h-40 p-4 bg-app-bg border border-app-border rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none transition-all text-sm resize-none mb-4"
              />
              
              {resumes.length > 0 && (
                <div className="mb-6 text-left">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Target Resume for Analysis</label>
                  <select
                    value={selectedResumeIdForAnalysis || resumes[0]?.id}
                    onChange={(e) => setSelectedResumeIdForAnalysis(e.target.value)}
                    className="w-full p-3 bg-app-bg border border-app-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500 text-app-text appearance-none cursor-pointer"
                  >
                    {resumes.map(r => (
                      <option key={r.id} value={r.id}>{r.title}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-4">
                <button 
                  onClick={handleAiGenerate} 
                  disabled={isAiLoading || !aiPrompt.trim()}
                  className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {isAiLoading ? "Processing..." : "Generate with AI"}
                </button>
                <button 
                  onClick={() => handleAiAnalyze(selectedResumeIdForAnalysis || resumes[0]?.id, aiPrompt)}
                  disabled={isAiLoading || !aiPrompt.trim() || !resumes.length}
                  className="flex-1 py-3 bg-white text-purple-600 border border-purple-200 font-bold rounded-xl hover:bg-purple-50 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isAiLoading ? "Analyzing..." : "Analyze Match"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis Results Modal */}
      {isAnalysisModalOpen && analysisResult && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-app-card w-full max-w-2xl rounded-3xl shadow-2xl border border-app-border overflow-hidden">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-app-text tracking-tight">Analysis Results</h2>
                <button onClick={() => setIsAnalysisModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-2xl">×</button>
              </div>

              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start mb-8">
                {/* Score Circle */}
                <div className="relative flex-shrink-0">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100" />
                    <circle 
                      cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" 
                      strokeDasharray={364.4}
                      strokeDashoffset={364.4 - (364.4 * animatedScore) / 100}
                      className="text-brand-blue" 
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-app-text">{animatedScore}%</span>
                    <span className="text-[8px] font-black uppercase text-gray-400 tracking-tighter">Match Score</span>
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Optimization Suggestions</h3>
                  <div className="space-y-3">
                    {analysisResult.suggestions?.length > 0 ? (
                      analysisResult.suggestions.map((suggestion, idx) => (
                        <div key={idx} className="flex gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                          <span className="text-brand-blue font-bold">•</span>
                          {suggestion}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400 italic text-sm">No specific suggestions. Your resume looks great!</p>
                    )}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setIsAnalysisModalOpen(false)}
                className="w-full py-3 bg-brand-blue text-white font-bold rounded-xl hover:bg-button-hover transition-all shadow-lg active:scale-95"
              >
                Got it, thanks!
              </button>
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