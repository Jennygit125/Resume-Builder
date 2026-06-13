import { useLoaderData, useNavigate, redirect, Link } from "react-router";
import { useLogout, isTokenExpired } from "../utils/auth";

/**
 * clientLoader runs on the client before the component renders.
 * This is the modern v7 way to protect routes in SPA mode.
 */
export async function clientLoader() {
  const accessToken = localStorage.getItem("access_token");
  const refreshToken = localStorage.getItem("refresh_token");
  const firstName = localStorage.getItem("first_name");

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

  return { firstName };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const logout = useLogout();
  const loaderData = useLoaderData(); // Get data from the loader

  const resumes = [
    { id: 1, title: "Software Engineer 2025", lastModified: "2 hours ago", status: "Completed" },
    { id: 2, title: "Marketing Specialist Draft", lastModified: "Yesterday", status: "In Progress" },
    { id: 3, title: "Executive Director CV", lastModified: "3 days ago", status: "Completed" },
  ];

  // Safety Guard: Handle initial hydration where loader data might be null
  if (!loaderData) {
    return <div className="p-8 text-gray-500 animate-pulse">Loading dashboard...</div>;
  }

  const { firstName } = loaderData;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-classy-fade">
      {/* Header Section */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 pb-6 border-b border-gray-100">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Welcome, <span className="text-brand-blue">{firstName}</span>!
          </h1>
          <p className="text-gray-500 mt-1">Manage your professional resumes and track your applications.</p>
        </div>
        <div className="flex items-center gap-3">
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
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Total Resumes</span>
          <div className="text-3xl font-black text-brand-blue mt-2">12</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Downloads</span>
          <div className="text-3xl font-black text-brand-blue mt-2">48</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Profile Views</span>
          <div className="text-3xl font-black text-brand-blue mt-2">156</div>
        </div>
      </div>

      {/* Content Section */}
      <section className="bg-white rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-50 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Your Resumes</h2>
          <button className="text-sm font-bold text-brand-blue hover:underline">View all</button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-[10px] uppercase tracking-[0.2em] font-black text-gray-400">
                <th className="px-8 py-4">Title</th>
                <th className="px-8 py-4">Last Modified</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {resumes.map((resume) => (
                <tr key={resume.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="font-bold text-gray-900 group-hover:text-brand-blue transition-colors cursor-pointer">{resume.title}</div>
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
                      <button className="p-2 text-gray-400 hover:text-brand-blue transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                      <button className="p-2 text-gray-400 hover:text-brand-blue transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}