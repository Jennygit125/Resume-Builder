import { usePDF } from '@react-pdf/renderer';
import { useState, useEffect } from 'react';
import ResumeDocument from './ResumeDocument.jsx';
import { api } from '../../../utils/api.js';

export default function ResumePreview({ 
  resumeData, 
  activeView, 
  setActiveView, 
  zoom, 
  setZoom, 
  resumeRef 
}) {
  const [instance, updateInstance] = usePDF({ document: <ResumeDocument data={resumeData} /> });
  const [progress, setProgress] = useState(0);
  const [isPending, setIsPending] = useState(false);

  // Re-generate PDF instance with debouncing to improve performance while typing
  useEffect(() => {
    setIsPending(true);
    const timer = setTimeout(() => {
      updateInstance(<ResumeDocument data={resumeData} />);
      setIsPending(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [resumeData, updateInstance]);

  // Log generation errors for debugging
  useEffect(() => {
    if (instance.error) {
      console.error("PDF Generation Error:", instance.error);
    }
  }, [instance.error]);

  // Simulate progress percentage while the PDF engine is working
  useEffect(() => {
    let interval;
    if (instance.loading) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) return 95; // Stall at 95% until generation completes
          return prev + Math.random() * 10;
        });
      }, 150);
    } else {
      setProgress(100);
      const timeout = setTimeout(() => setProgress(0), 1000); // Reset bar after 1s
      return () => clearTimeout(timeout);
    }
    return () => clearInterval(interval);
  }, [instance.loading]);

  const handleDownload = async () => {
    // Requirement: Ensure Cloudinary image is generated before download
    // If profilePic is still a base64 string, we must save to get the Cloudinary URL
    if (resumeData.profilePic?.startsWith('data:image')) {
      try {
        await api.saveResume(resumeData);
      } catch (err) {
        console.error("Failed to sync image to Cloudinary before download:", err);
        // We proceed with the local image if the save fails to not block the user,
        // but the 'official' saveResume logic handles the Cloudinary conversion.
      }
    }

    if (instance.url) {
      const link = document.createElement('a');
      link.href = instance.url;
      link.download = `${resumeData.firstName || 'Resume'}_CV.pdf`;
      link.click();
    }
  };

  return (
    <div className={`preview-column custom-scrollbar ${activeView === 'form' ? 'hidden lg:flex' : 'flex'} flex-col items-center pt-0`}>
      {/* Semantic Header for Preview Controls */}
      <header className="preview-controls">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveView('form')}
            className="lg:hidden px-4 py-1.5 bg-app-card text-app-text border border-app-border text-xs font-bold rounded-lg shadow-sm active:scale-95 transition-all"
          >
            ← Back
          </button>
          
          {/* Size Controls */}
          <div className="zoom-controls">
            <button type="button" onClick={() => setZoom(Math.max(0.4, zoom - 0.1))} className="zoom-btn">−</button>
            <div className="flex items-center gap-2 min-w-[50px] justify-center">
              {isPending && <div className="w-3 h-3 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />}
              <span className="zoom-label">{Math.round(zoom * 100)}%</span>
            </div>
            <button type="button" onClick={() => setZoom(Math.min(1.5, zoom + 0.1))} className="zoom-btn">+</button>
          </div>
        </div>

        <button 
          type="button"
          onClick={handleDownload}
          disabled={isPending || instance.loading}
          className="download-btn relative overflow-hidden group min-w-[140px]"
        >
          {instance.loading && (
            <div 
              className="absolute bottom-0 left-0 h-1 bg-white/40 transition-all duration-300 ease-out z-20"
              style={{ width: `${progress}%` }}
            />
          )}
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isPending ? 'Syncing...' : instance.loading ? `Preparing ${Math.round(progress)}%` : 'Download PDF'}
          </span>
        </button>
      </header>

      <div 
        className="resume-preview-wrapper" 
      >
        <div className="resume-paper" id="resume-paper-target" ref={resumeRef}>
          <header className="preview-header">
            {resumeData.profilePic && (
              <img src={resumeData.profilePic} alt="Profile" className="w-24 h-24 rounded-full mx-auto mb-6 object-cover border-2 border-brand-blue/10 p-1 shadow-sm" />
            )}
            <h1 className="preview-name">
              {resumeData.firstName || "Your"} {resumeData.lastName || "Name"}
            </h1>
            <p className="preview-job-title">{resumeData.jobTitle || "Professional Title"}</p>
            <div className="preview-contact-grid">
              <div className="contact-item">{resumeData.email || "hello@example.com"}</div>
              {resumeData.phone && <div className="contact-item">{resumeData.phone}</div>}
              {resumeData.location && <div className="contact-item">{resumeData.location}</div>}
              {resumeData.linkedIn && <div className="contact-item">{resumeData.linkedIn}</div>}
              {resumeData.github && <div className="contact-item">{resumeData.github}</div>}
              {resumeData.portfolio && <div className="contact-item">{resumeData.portfolio}</div>}
            </div>
          </header>

          <div className="preview-body-layout">
            {/* Main Column */}
            <div className="preview-main-column">
              <section className="mb-8">
                <h2 className="preview-section-title">Professional Profile</h2>
                <p className="preview-text">{resumeData.summary || "Summary goes here..."}</p>
              </section>

              {(resumeData.experience || []).length > 0 && (
                <section className="mb-8">
                  <h2 className="preview-section-title border-b border-gray-100 pb-1">Experience</h2>
                  <div className="space-y-6 mt-4">
                    {(resumeData.experience || []).map((exp, index) => (
                      <div key={index} className="animate-classy-fade">
                        <div className="preview-item-header">
                          <h3 className="preview-item-title !text-[10px]">{exp.role || "Job Title"}</h3>
                          <span className="preview-date">{exp.startDate} — {exp.isCurrent ? "Present" : exp.endDate}</span>
                        </div>
                        <div className="preview-item-subtitle mb-2">{exp.company}{exp.location && `, ${exp.location}`}</div>
                        <p className="preview-text !text-[11px]">{exp.description}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {(resumeData.projects || []).length > 0 && (
                <section className="mb-8">
                  <h2 className="preview-section-title border-b border-gray-100 pb-1">Key Projects</h2>
                  <div className="space-y-4 mt-4">
                    {(resumeData.projects || []).map((proj, index) => (
                      <div key={index} className="animate-classy-fade">
                        <div className="preview-item-header">
                          <h3 className="preview-item-title text-sm">{proj.title || "Project Title"}</h3>
                          {proj.link && <span className="preview-date underline text-brand-blue">{proj.link}</span>}
                        </div>
                        <p className="preview-text !text-[11px]">{proj.description}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar Column */}
            <div className="preview-sidebar">
              {(resumeData.certifications || []).length > 0 && (
                <section className="mb-8">
                  <h2 className="preview-section-title">Certifications</h2>
                  <div className="space-y-4">
                    {(resumeData.certifications || []).map((cert, index) => (
                      <div key={index} className="animate-classy-fade">
                        <div className="font-bold text-gray-900 text-[11px] leading-tight mb-1">{cert.name || "Certification"}</div>
                        <div className="text-brand-blue font-bold text-[9px] leading-tight">{cert.issuer}</div>
                        <div className="text-gray-400 text-[8px] font-black uppercase">{cert.date}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {(resumeData.skills || []).length > 0 && (
                <section className="mb-8">
                  <h2 className="preview-section-title">Skills</h2>
                  <div className="flex flex-col gap-2">
                    {(resumeData.skills || []).map((skill, index) => (
                      <div key={index} className="text-[11px] font-bold text-gray-700 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-brand-blue rounded-full" />
                        {skill}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {(resumeData.education || []).length > 0 && (
                <section className="mb-8">
                  <h2 className="preview-section-title">Education</h2>
                  <div className="space-y-5">
                    {(resumeData.education || []).map((edu, index) => (
                      <div key={index} className="animate-classy-fade break-inside-avoid">
                        <div className="font-bold text-gray-900 text-xs leading-tight mb-1">{edu.degree || "Degree"}</div>
                        <div className="text-brand-blue font-bold text-[10px] leading-tight mb-1">{edu.school}</div>
                        <div className="text-gray-400 text-[9px] font-black uppercase tracking-tighter">{edu.startDate} — {edu.endDate}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {(resumeData.customSections || []).map((sec, index) => (
                sec.title && (
                  <section key={index} className="mb-8 animate-classy-fade">
                    <h2 className="preview-section-title">{sec.title}</h2>
                    <p className="preview-text !text-[10px]">{sec.description}</p>
                  </section>
                )
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}