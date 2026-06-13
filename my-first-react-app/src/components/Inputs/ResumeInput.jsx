import { useState, useRef } from 'react';
import { Link } from 'react-router';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import './ResumeInput.css';

const initialState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  jobTitle: "",
  location: "",
  linkedIn: "",
  github: "",
  portfolio: "",
  summary: "",
  skills: [],
  experience: [],
  education: [],
  projects: [],
  customSections: []
};

export default function EditResume() {
  const [resumeData, setResumeData] = useState(initialState);
  const resumeRef = useRef(null);
  const [zoom, setZoom] = useState(0.8); // Default zoom level
  const [activeView, setActiveView] = useState('form'); // 'form' or 'preview'

  const [skillInput, setSkillInput] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setResumeData(prev => ({ ...prev, [name]: value }));
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = skillInput.trim().replace(',', '');
      if (val && !resumeData.skills.includes(val)) {
        setResumeData(prev => ({ ...prev, skills: [...prev.skills, val] }));
        setSkillInput("");
      }
    }
  };

  const removeSkill = (skillToRemove) => {
    setResumeData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove)
    }));
  };

  const addExperience = () => {
    setResumeData(prev => ({
      ...prev,
      experience: [...prev.experience, { company: "", role: "", location: "", startDate: "", endDate: "", isCurrent: false, description: "" }]
    }));
  };

  const handleExperienceChange = (index, e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    const updatedExperience = [...resumeData.experience];
    // Defensive copying of the specific object being modified
    updatedExperience[index] = { ...updatedExperience[index], [name]: val };
    setResumeData(prev => ({ ...prev, experience: updatedExperience }));
  };

  const removeExperience = (index) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  const addEducation = () => {
    setResumeData(prev => ({
      ...prev,
      education: [...prev.education, { school: "", degree: "", location: "", startDate: "", endDate: "" }]
    }));
  };

  const handleEducationChange = (index, e) => {
    const { name, value } = e.target;
    const updatedEducation = [...resumeData.education];
    updatedEducation[index] = { ...updatedEducation[index], [name]: value };
    setResumeData(prev => ({ ...prev, education: updatedEducation }));
  };

  const removeEducation = (index) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const addProject = () => {
    setResumeData(prev => ({
      ...prev,
      projects: [...prev.projects, { title: "", link: "", description: "" }]
    }));
  };

  const handleProjectChange = (index, e) => {
    const { name, value } = e.target;
    const updatedProjects = [...resumeData.projects];
    updatedProjects[index] = { ...updatedProjects[index], [name]: value };
    setResumeData(prev => ({ ...prev, projects: updatedProjects }));
  };

  const removeProject = (index) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index)
    }));
  };

  const addCustomSection = () => {
    setResumeData(prev => ({
      ...prev,
      customSections: [...prev.customSections, { title: "", description: "" }]
    }));
  };

  const handleCustomSectionChange = (index, e) => {
    const { name, value } = e.target;
    const updatedSections = [...resumeData.customSections];
    updatedSections[index] = { ...updatedSections[index], [name]: value };
    setResumeData(prev => ({ ...prev, customSections: updatedSections }));
  };

  const removeCustomSection = (index) => {
    setResumeData(prev => ({
      ...prev,
      customSections: prev.customSections.filter((_, i) => i !== index)
    }));
  };

  const handleClearAll = () => {
    // High-quality UX: Don't interrupt the user if there's nothing to clear
    const hasData = Object.values(resumeData).some(val => 
      Array.isArray(val) ? val.length > 0 : val !== ""
    );

    if (!hasData && !skillInput) return;

    if (window.confirm("Are you sure you want to clear all data? This action cannot be undone.")) {
      setResumeData({ ...initialState });
      setSkillInput("");
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('resume-paper-target');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2, // 2 is optimal for performance vs sharpness
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // CRITICAL: Reset transform on the cloned element so capture is 1:1
          const clonedElement = clonedDoc.getElementById('resume-paper-target');
          if (clonedElement) {
            clonedElement.style.transform = 'none';
          }
        }
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      // Map high-res canvas dimensions back to A4 mm units
      const imgProps = pdf.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      pdf.save(`${resumeData.firstName || 'Resume'}_${resumeData.lastName || ''}.pdf`);
    } catch (error) {
      console.error('PDF Generation Error:', error);
    }
  };

  return (
    <div className="resume-editor-container">
      {/* Left Side: Side Form */}
      <div className={`form-column custom-scrollbar ${activeView === 'preview' ? 'hidden lg:block' : 'block'}`}>
        <div className="form-header">
          <h2 className="form-title">Edit Resume</h2>
          <div className="flex items-center gap-4">
            {/* Mobile Next Button */}
            <button
              type="button"
              onClick={() => setActiveView('preview')}
              className="lg:hidden px-4 py-1.5 bg-brand-blue text-white text-xs font-bold rounded-lg shadow-md active:scale-95 transition-all mb-1"
            >
              Next: Preview
            </button>
            <button 
              type="button" 
              onClick={handleClearAll} 
              className="clear-btn"
            >
              Clear
            </button>
            <Link to="/dashboard" className="save-exit-link">
              Save & Exit
            </Link>
          </div>
        </div>

        <form className="resume-form">
          {/* Personal Information */}
          <section>
            <h3 className="section-label">Personal Details</h3>
            <div className="input-grid">
              <div className="input-group">
                <label className="input-label">First Name</label>
                <input 
                  name="firstName" 
                  placeholder="e.g. John" 
                  value={resumeData.firstName} 
                  onChange={handleChange} 
                  className="form-input"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Last Name</label>
                <input 
                  name="lastName" 
                  placeholder="e.g. Doe" 
                  value={resumeData.lastName} 
                  onChange={handleChange} 
                  className="form-input"
                />
              </div>
            </div>
            <div className="input-grid mt-4">
              <div className="input-group">
                <label className="input-label">Job Title</label>
                <input 
                  name="jobTitle" 
                  placeholder="e.g. Software Engineer" 
                  value={resumeData.jobTitle} 
                  onChange={handleChange} 
                  className="form-input"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Email</label>
                <input 
                  name="email" 
                  type="email"
                  placeholder="e.g. john@doe.com" 
                  value={resumeData.email} 
                  onChange={handleChange} 
                  className="form-input"
                />
              </div>
            </div>
            <div className="input-grid mt-4">
              <div className="input-group">
                <label className="input-label">Phone</label>
                <input name="phone" placeholder="e.g. +1 555 000 000" value={resumeData.phone} onChange={handleChange} className="form-input" />
              </div>
              <div className="input-group">
                <label className="input-label">Location</label>
                <input name="location" placeholder="e.g. New York, NY" value={resumeData.location} onChange={handleChange} className="form-input" />
              </div>
            </div>
            <div className="input-grid mt-4">
              <div className="input-group">
                <label className="input-label">LinkedIn</label>
                <input name="linkedIn" placeholder="linkedin.com/in/username" value={resumeData.linkedIn} onChange={handleChange} className="form-input" />
              </div>
              <div className="input-group">
                <label className="input-label">GitHub</label>
                <input name="github" placeholder="github.com/username" value={resumeData.github} onChange={handleChange} className="form-input" />
              </div>
            </div>
            <div className="input-group mt-4">
              <label className="input-label">Portfolio Website</label>
              <input name="portfolio" placeholder="e.g. yourportfolio.com" value={resumeData.portfolio} onChange={handleChange} className="form-input" />
            </div>
          </section>

          {/* Skills Section */}
          <section>
            <h3 className="section-label">Skills</h3>
            <div className="skills-container">
              {resumeData.skills.map((skill, index) => (
                <span key={index} className="skill-pill">
                  {skill}
                  <button 
                    type="button" 
                    onClick={() => removeSkill(skill)}
                    className="skill-remove-btn"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input 
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                placeholder={resumeData.skills.length === 0 ? "Type a skill and press Enter..." : ""}
                className="skill-input"
              />
            </div>
            <p className="mt-2 text-[10px] text-gray-400 italic">Tip: Press Enter or use a comma to add a skill.</p>
          </section>

          {/* Professional Summary */}
          <section>
            <h3 className="section-label">Summary</h3>
            <div className="input-group">
              <textarea 
                name="summary" 
                rows="5"
                placeholder="Tell your professional story..." 
                value={resumeData.summary} 
                onChange={handleChange} 
                className="form-textarea"
              />
            </div>
          </section>

          {/* Experience Section */}
          <section>
            <div className="section-header-row">
              <h3 className="section-label !mb-0">Work Experience</h3>
              <button 
                type="button" 
                onClick={addExperience}
                className="add-button"
              >
                + Add Position
              </button>
            </div>
            
            <div className="space-y-6">
              {resumeData.experience.map((exp, index) => (
                <div key={index} className="dynamic-item-card group">
                  <button 
                    type="button"
                    onClick={() => removeExperience(index)}
                    className="item-remove-btn"
                  >
                    ×
                  </button>
                  <div className="input-group mb-4">
                    <label className="input-label">Job Title</label>
                    <input 
                      name="role" 
                      value={exp.role} 
                      onChange={(e) => handleExperienceChange(index, e)}
                      placeholder="e.g. Senior Software Engineer"
                      className="form-input"
                    />
                  </div>
                  <div className="input-grid mb-4">
                    <div className="input-group">
                      <label className="input-label">Company</label>
                      <input 
                        name="company" 
                        value={exp.company} 
                        onChange={(e) => handleExperienceChange(index, e)}
                        placeholder="e.g. Google"
                        className="form-input"
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Location</label>
                      <input 
                        name="location" 
                        value={exp.location} 
                        onChange={(e) => handleExperienceChange(index, e)}
                        placeholder="e.g. Mountain View, CA"
                        className="form-input"
                      />
                    </div>
                  </div>
                  <div className="input-grid">
                    <div className="input-group">
                      <label className="input-label">Start Date</label>
                      <input 
                        name="startDate" 
                        value={exp.startDate} 
                        onChange={(e) => handleExperienceChange(index, e)}
                        placeholder="MM/YYYY"
                        className="form-input"
                      />
                    </div>
                    {!exp.isCurrent && (
                      <div className="input-group">
                        <label className="input-label">End Date</label>
                        <input 
                          name="endDate" 
                          value={exp.endDate} 
                          onChange={(e) => handleExperienceChange(index, e)}
                          placeholder="MM/YYYY"
                          className="form-input"
                        />
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      name="isCurrent" 
                      checked={exp.isCurrent} 
                      onChange={(e) => handleExperienceChange(index, e)} 
                      className="accent-brand-blue"
                    />
                    <span className="text-[10px] font-bold text-gray-500 uppercase">I currently work here</span>
                  </div>
                  <div className="input-group mt-4">
                    <label className="input-label">Role & Responsibilities</label>
                    <textarea 
                      name="description" 
                      value={exp.description} 
                      onChange={(e) => handleExperienceChange(index, e)}
                      rows="3"
                      placeholder="What did you achieve?"
                      className="form-textarea"
                    />
                  </div>
                </div>
              ))}
              {resumeData.experience.length === 0 && (
                <p className="text-center py-4 text-xs text-gray-400 italic">No experience added yet.</p>
              )}
            </div>
          </section>

          {/* Education Section */}
          <section>
            <div className="section-header-row">
              <h3 className="section-label !mb-0">Education</h3>
              <button 
                type="button" 
                onClick={addEducation}
                className="add-button"
              >
                + Add Education
              </button>
            </div>
            
            <div className="space-y-6">
              {resumeData.education.map((edu, index) => (
                <div key={index} className="dynamic-item-card group">
                  <button 
                    type="button"
                    onClick={() => removeEducation(index)}
                    className="item-remove-btn"
                  >
                    ×
                  </button>
                  <div className="input-grid mb-4">
                    <div className="input-group">
                      <label className="input-label">School / University</label>
                      <input 
                        name="school" 
                        value={edu.school} 
                        onChange={(e) => handleEducationChange(index, e)}
                        placeholder="e.g. Stanford University"
                        className="form-input"
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Location</label>
                      <input 
                        name="location" 
                        value={edu.location} 
                        onChange={(e) => handleEducationChange(index, e)}
                        placeholder="e.g. Stanford, CA"
                        className="form-input"
                      />
                    </div>
                  </div>
                  <div className="input-grid">
                    <div className="input-group">
                      <label className="input-label">Start Date</label>
                      <input 
                        name="startDate" 
                        value={edu.startDate} 
                        onChange={(e) => handleEducationChange(index, e)}
                        placeholder="YYYY"
                        className="form-input"
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">End Date (or Expected)</label>
                      <input 
                        name="endDate" 
                        value={edu.endDate} 
                        onChange={(e) => handleEducationChange(index, e)}
                        placeholder="YYYY"
                        className="form-input"
                      />
                    </div>
                  </div>
                  <div className="input-group mt-4">
                    <label className="input-label">Degree / Field of Study</label>
                    <input 
                      name="degree" 
                      value={edu.degree} 
                      onChange={(e) => handleEducationChange(index, e)}
                      placeholder="e.g. B.S. in Computer Science"
                      className="form-input"
                    />
                  </div>
                </div>
              ))}
              {resumeData.education.length === 0 && (
                <p className="text-center py-4 text-xs text-gray-400 italic">No education added yet.</p>
              )}
            </div>
          </section>

          {/* Projects Section */}
          <section>
            <div className="section-header-row">
              <h3 className="section-label !mb-0">Key Projects</h3>
              <button 
                type="button" 
                onClick={addProject}
                className="add-button"
              >
                + Add Project
              </button>
            </div>
            
            <div className="space-y-6">
              {resumeData.projects.map((proj, index) => (
                <div key={index} className="dynamic-item-card group">
                  <button 
                    type="button"
                    onClick={() => removeProject(index)}
                    className="item-remove-btn"
                  >
                    ×
                  </button>
                  <div className="input-grid">
                    <div className="input-group">
                      <label className="input-label">Project Title</label>
                      <input 
                        name="title" 
                        value={proj.title} 
                        onChange={(e) => handleProjectChange(index, e)}
                        placeholder="e.g. Resume Builder"
                        className="form-input"
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Link (Optional)</label>
                      <input 
                        name="link" 
                        value={proj.link} 
                        onChange={(e) => handleProjectChange(index, e)}
                        placeholder="e.g. github.com/my-repo"
                        className="form-input"
                      />
                    </div>
                  </div>
                  <div className="input-group mt-4">
                    <label className="input-label">Description</label>
                    <textarea 
                      name="description" 
                      value={proj.description} 
                      onChange={(e) => handleProjectChange(index, e)}
                      rows="3"
                      placeholder="Built using React 19 and Tailwind CSS..."
                      className="form-textarea"
                    />
                  </div>
                </div>
              ))}
              {resumeData.projects.length === 0 && (
                <p className="text-center py-4 text-xs text-gray-400 italic">No projects added yet.</p>
              )}
            </div>
          </section>

          {/* Custom Sections */}
          <section>
            <div className="section-header-row">
              <h3 className="section-label !mb-0">Custom Sections</h3>
              <button 
                type="button" 
                onClick={addCustomSection}
                className="add-button"
              >
                + Add Section
              </button>
            </div>
            
            <div className="space-y-6">
              {resumeData.customSections.map((sec, index) => (
                <div key={index} className="dynamic-item-card group">
                  <button 
                    type="button"
                    onClick={() => removeCustomSection(index)}
                    className="item-remove-btn"
                  >
                    ×
                  </button>
                  <div className="input-group">
                    <label className="input-label">Section Title</label>
                    <input name="title" value={sec.title} onChange={(e) => handleCustomSectionChange(index, e)} placeholder="e.g. Languages or Certifications" className="form-input" />
                  </div>
                  <div className="input-group mt-4">
                    <label className="input-label">Content</label>
                    <textarea name="description" value={sec.description} onChange={(e) => handleCustomSectionChange(index, e)} rows="3" placeholder="Enter details..." className="form-textarea" />
                  </div>
                </div>
              ))}
              {resumeData.customSections.length === 0 && (
                <p className="text-center py-4 text-xs text-gray-400 italic">No custom sections added yet.</p>
              )}
            </div>
          </section>
        </form>
      </div>

      {/* Right Side: Real-time Preview */}
      <div className={`preview-column custom-scrollbar ${activeView === 'form' ? 'hidden lg:flex' : 'flex'} flex-col items-center pt-0`}>
        {/* Semantic Header for Preview Controls */}
        <header className="preview-controls">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveView('form')}
              className="lg:hidden px-4 py-1.5 bg-white text-gray-600 border border-gray-200 text-xs font-bold rounded-lg shadow-sm active:scale-95 transition-all"
            >
              ← Back
            </button>
            
            {/* Size Controls */}
            <div className="zoom-controls">
              <button type="button" onClick={() => setZoom(Math.max(0.4, zoom - 0.1))} className="zoom-btn">−</button>
              <span className="zoom-label">{Math.round(zoom * 100)}%</span>
              <button type="button" onClick={() => setZoom(Math.min(1.5, zoom + 0.1))} className="zoom-btn">+</button>
            </div>
          </div>

          <button 
            type="button" 
            onClick={handleDownloadPDF} 
            className="download-btn"
          >
            Download PDF
          </button>
        </header>

        <div 
          className="resume-preview-wrapper"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
        >
          <div 
            className="resume-preview-wrapper"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
          >
            <div className="resume-paper" id="resume-paper-target" ref={resumeRef}>
              <header className="preview-header">
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

                  {resumeData.experience.length > 0 && (
                    <section className="mb-8">
                      <h2 className="preview-section-title border-b border-gray-100 pb-1">Experience</h2>
                      <div className="space-y-6 mt-4">
                        {resumeData.experience.map((exp, index) => (
                          <div key={index} className="animate-classy-fade">
                            <div className="preview-item-header">
                              <h3 className="preview-item-title">{exp.role || "Job Title"}</h3>
                              <span className="preview-date">{exp.startDate} — {exp.isCurrent ? "Present" : exp.endDate}</span>
                            </div>
                            <div className="preview-item-subtitle mb-2">{exp.company}{exp.location && `, ${exp.location}`}</div>
                            <p className="preview-text !text-[11px]">{exp.description}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {resumeData.projects.length > 0 && (
                    <section className="mb-8">
                      <h2 className="preview-section-title border-b border-gray-100 pb-1">Key Projects</h2>
                      <div className="space-y-4 mt-4">
                        {resumeData.projects.map((proj, index) => (
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
                  {resumeData.skills.length > 0 && (
                    <section className="mb-8">
                      <h2 className="preview-section-title">Skills</h2>
                      <div className="flex flex-col gap-2">
                        {resumeData.skills.map((skill, index) => (
                          <div key={index} className="text-[11px] font-bold text-gray-700 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-brand-blue rounded-full" />
                            {skill}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {resumeData.education.length > 0 && (
                    <section className="mb-8">
                      <h2 className="preview-section-title">Education</h2>
                      <div className="space-y-5">
                        {resumeData.education.map((edu, index) => (
                          <div key={index} className="animate-classy-fade">
                            <div className="font-bold text-gray-900 text-xs leading-tight mb-1">{edu.degree || "Degree"}</div>
                            <div className="text-brand-blue font-bold text-[10px] leading-tight mb-1">{edu.school}</div>
                            <div className="text-gray-400 text-[9px] font-black uppercase tracking-tighter">{edu.startDate} — {edu.endDate}</div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {resumeData.customSections.map((sec, index) => (
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
      </div>
    </div>
  </div>
  );
}