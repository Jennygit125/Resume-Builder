import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { api } from '../../utils/api.js';
import ResumePreview from '../../pages/ResumeUpdate/Forms/PreviewRsme.jsx';
import { InputGroup, InputGrid, DynamicListSection } from './FormHelpers.jsx';


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
  customSections: [],
  profilePic: "",
  certifications: []
};

export default function EditResume() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [resumeData, setResumeData] = useState(initialState);
  const [errors, setErrors] = useState({});
  const resumeRef = useRef(null);
  const [saveStatus, setSaveStatus] = useState(null); // null | 'saving' | 'success' | 'error'
  const [zoom, setZoom] = useState(0.8); // Default zoom level
  const [activeView, setActiveView] = useState('form'); // 'form' or 'preview'

  const [skillInput, setSkillInput] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isImprovingSummary, setIsImprovingSummary] = useState(false);
  const [previousSummary, setPreviousSummary] = useState(null);
  const [showUndo, setShowUndo] = useState(false);

  // Data Hydration Logic
  useEffect(() => {
    const loadData = async () => {
      if (id) {
        // Fetch from Supabase if we have an ID
        try {
          const resume = await api.getResumeById(id);
          if (resume) {
            setResumeData({ ...resume.content, id: resume.id });
          }
        } catch (err) {
          console.error("Failed to load resume:", err);
          setErrors({ global: "Could not load the resume from the server." });
        }
      } else {
        // Otherwise check for local draft (only for "New" resumes)
        const savedDraft = localStorage.getItem("resume_draft");
        if (savedDraft) setResumeData(JSON.parse(savedDraft));
      }
    };
    loadData();
  }, [id]);

  // Load Cloudinary Widget Script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://upload-widget.cloudinary.com/global/all.js";
    script.async = true;
    document.body.appendChild(script);
    
    return () => document.body.removeChild(script);
  }, []);

  // Persistence: Auto-save to localStorage on every change
  useEffect(() => {
    localStorage.setItem("resume_draft", JSON.stringify(resumeData));
  }, [resumeData]);

  const validateForm = () => {
    const newErrors = {};

    // Validate Personal Details
    if (!resumeData.firstName.trim()) newErrors.firstName = "Required";
    if (!resumeData.lastName.trim()) newErrors.lastName = "Required";
    if (!resumeData.email.trim()) {
      newErrors.email = "Required";
    } else if (!/\S+@\S+\.\S+/.test(resumeData.email)) {
      newErrors.email = "Invalid email";
    }

    // Validate Experience
    const experienceErrors = resumeData.experience.map(exp => {
      const errs = {};
      if (!exp.role.trim()) errs.role = "Title required";
      if (!exp.company.trim()) errs.company = "Company required";
      if (!exp.startDate.trim()) errs.startDate = "Start date required";
      return errs;
    });
    if (experienceErrors.some(err => Object.keys(err).length > 0)) {
      newErrors.experience = experienceErrors;
    }

    // Validate Education
    const educationErrors = resumeData.education.map(edu => {
      const errs = {};
      if (!edu.school.trim()) errs.school = "School required";
      if (!edu.degree.trim()) errs.degree = "Degree required";
      return errs;
    });
    if (educationErrors.some(err => Object.keys(err).length > 0)) {
      newErrors.education = educationErrors;
    }

    // Validate Certifications
    const certErrors = resumeData.certifications.map(cert => {
      const errs = {};
      if (!cert.name.trim()) errs.name = "Required";
      return errs;
    });
    if (certErrors.some(err => Object.keys(err).length > 0)) {
      newErrors.certifications = certErrors;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveAndExit = async () => {
    if (validateForm()) {
      setSaveStatus('saving');
      try {
        await api.saveResume(resumeData);
        setSaveStatus('success');
        localStorage.removeItem("resume_draft"); // Clear draft on successful save
        
        // Allow the user to see the success state before navigating
        setTimeout(() => navigate("/dashboard"), 1500);
      } catch (err) {
        console.error("Save failed:", err);
        setSaveStatus('error');
        // Reset error status after a few seconds so user can try again
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } else {
      // Scroll to top to see error messages
      document.querySelector('.form-column')?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsAiGenerating(true);
    setSaveStatus('saving'); // Reuse toast for "working" feedback
    
    try {
      const data = await api.generateAiResume(aiPrompt);
      if (data) {
        setResumeData(prev => ({ ...prev, ...data }));
        setSaveStatus('success');
        setAiPrompt(""); // Clear prompt on success
      }
    } catch (err) {
      console.error("AI Generation failed:", err);
      setSaveStatus('error');
    } finally {
      setIsAiGenerating(false);
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleImproveSummary = async () => {
    if (!resumeData.summary.trim()) return;
    
    setIsImprovingSummary(true);
    setSaveStatus('saving');
    
    try {
      const currentSummary = resumeData.summary;
      const improvedText = await api.improveText(currentSummary);
      if (improvedText) {
        setPreviousSummary(currentSummary);
        setResumeData(prev => ({ ...prev, summary: improvedText }));
        setSaveStatus('success');
        setShowUndo(true);
        // Auto-hide Undo button after 8 seconds
        setTimeout(() => setShowUndo(false), 8000);
      }
    } catch (err) {
      console.error("Summary improvement failed:", err);
      setSaveStatus('error');
    } finally {
      setIsImprovingSummary(false);
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleUndoSummary = () => {
    if (previousSummary !== null) {
      setResumeData(prev => ({ ...prev, summary: previousSummary }));
      setPreviousSummary(null);
      setShowUndo(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Clear error when user types
    if (errors[name]) setErrors(prev => { const n = {...prev}; delete n[name]; return n; });
    setResumeData(prev => ({ ...prev, [name]: value }));
  };

  const openUploadWidget = () => {
    if (!window.cloudinary) {
      setErrors(prev => ({ ...prev, profilePic: "Upload service not ready. Please try again." }));
      return;
    }

    window.cloudinary.openUploadWidget(
      {
        cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
        uploadPreset: import.meta.env.VITE_CLOUDINARY_PRESET,
        sources: ['local', 'url', 'camera'],
        multiple: false,
        cropping: true,
        croppingAspectRatio: 1,
        showSkipCropButton: false,
        styles: {
          palette: {
            window: "#FFFFFF",
            sourceBg: "#F4F4F5",
            windowBorder: "#90A0B3",
            tabIcon: "#0F8FCA",
            inactiveTabIcon: "#6E7075",
            menuIcons: "#0F8FCA",
            link: "#0F8FCA",
            action: "#0F8FCA",
            inProgress: "#0078FF",
            complete: "#20B832",
            error: "#E52424",
            textDark: "#000000",
            textLight: "#FFFFFF"
          }
        }
      },
      (error, result) => {
        if (!error && result && result.event === "success") {
          setResumeData(prev => ({ ...prev, profilePic: result.info.secure_url }));
          setErrors(prev => {
            const n = { ...prev };
            delete n.profilePic;
            return n;
          });
        }
      }
    );
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

  // Generalized logic for adding items to any dynamic section
  const addItem = (section, template) => {
    setResumeData(prev => ({
      ...prev,
      [section]: [...prev[section], template]
    }));
  };

  const handleDynamicChange = (section, index, e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;

    // Clear dynamic error when user types
    if (errors[section]?.[index]?.[name]) {
      setErrors(prev => {
        const updatedSectionErrors = [...prev[section]];
        delete updatedSectionErrors[index][name];
        return { ...prev, [section]: updatedSectionErrors };
      });
    }

    setResumeData(prev => {
      const updatedArray = [...prev[section]];
      updatedArray[index] = { ...updatedArray[index], [name]: val };
      return { ...prev, [section]: updatedArray };
    });
  };

  // Generalized logic for removing items from any dynamic section
  const removeItem = (section, index) => {
    setResumeData(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index)
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
      localStorage.removeItem("resume_draft");
      setSkillInput("");
    }
  };

  return (
    <div 
      className="resume-editor-container" 
      style={{ '--resume-zoom': zoom }}
    >
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
            <button 
              type="button" 
              onClick={handleSaveAndExit} 
              disabled={saveStatus === 'saving'}
              className="save-exit-link bg-transparent border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveStatus === 'saving' ? 'Saving...' : 'Save & Exit'}
            </button>
          </div>
        </div>

        <form className="resume-form">
          {/* AI Resume Builder Section */}
          <section className="mb-10 p-6 bg-purple-50/50 rounded-3xl border border-purple-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-purple-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13.464 15.05a1 1 0 010 1.414l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 0z" /></svg>
              </div>
              <h3 className="text-lg font-black text-purple-900 tracking-tight">AI Quick-Fill</h3>
            </div>
            <p className="text-sm text-purple-700/70 mb-4 leading-relaxed">
              Paste a job description or your career history. Our AI will automatically structure and fill out the resume for you.
            </p>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g., I am a Senior Frontend Developer with experience in React and Node. Generate a resume targeted for a Lead Engineer position..."
              className="w-full h-32 p-4 bg-white border border-purple-100 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none transition-all text-sm resize-none mb-4 shadow-inner"
            />
            <button
              type="button"
              onClick={handleAiGenerate}
              disabled={isAiGenerating || !aiPrompt.trim()}
              className="w-full py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
            >
              {isAiGenerating ? (
                'Magic in progress...'
              ) : (
                'Generate Resume Content'
              )}
            </button>
          </section>

          {/* Profile Picture */}
          <section>
            <h3 className="section-label">Profile Picture</h3>
            <div className="flex items-center gap-6 mb-8 p-4 bg-app-bg/30 rounded-2xl border border-dashed border-app-border">
              <div className="relative group">
                {resumeData.profilePic ? (
                  <img src={resumeData.profilePic} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-brand-blue shadow-sm" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-app-bg flex items-center justify-center border-2 border-dashed border-app-border">
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={openUploadWidget}
                  className="text-xs font-bold text-brand-blue cursor-pointer hover:text-button-hover transition-colors bg-transparent border-none p-0 text-left"
                >
                  {resumeData.profilePic ? "Change Photo" : "Upload Photo"}
                </button>

                {resumeData.profilePic && (
                  <button type="button" onClick={() => setResumeData(prev => ({...prev, profilePic: ""}))} className="text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors text-left bg-transparent border-none cursor-pointer">Remove</button>
                )}
                {errors.profilePic && <span className="text-[10px] text-red-500 font-bold animate-classy-fade">{errors.profilePic}</span>}
              </div>
            </div>
          </section>

          {/* Personal Information */}
          <section>
            <h3 className="section-label">Personal Details</h3>
            <InputGrid>
              <InputGroup label="First Name" error={errors.firstName}>
                <input 
                  name="firstName" 
                  placeholder="e.g. John" 
                  value={resumeData.firstName} 
                  onChange={handleChange} 
                  className="form-input"
                />
              </InputGroup>
              <InputGroup label="Last Name" error={errors.lastName}>
                <input 
                  name="lastName" 
                  placeholder="e.g. Doe" 
                  value={resumeData.lastName} 
                  onChange={handleChange} 
                  className="form-input"
                />
              </InputGroup>
            </InputGrid>
            <InputGrid className="mt-4">
              <InputGroup label="Job Title">
                <input 
                  name="jobTitle" 
                  placeholder="e.g. Software Engineer" 
                  value={resumeData.jobTitle} 
                  onChange={handleChange} 
                  className="form-input"
                />
              </InputGroup>
              <InputGroup label="Email" error={errors.email}>
                <input 
                  name="email" 
                  type="email"
                  placeholder="e.g. john@doe.com" 
                  value={resumeData.email} 
                  onChange={handleChange} 
                  className="form-input"
                />
              </InputGroup>
            </InputGrid>
            <InputGrid className="mt-4">
              <InputGroup label="Phone">
                <input name="phone" placeholder="e.g. +1 555 000 000" value={resumeData.phone} onChange={handleChange} className="form-input" />
              </InputGroup>
              <InputGroup label="Location">
                <input name="location" placeholder="e.g. New York, NY" value={resumeData.location} onChange={handleChange} className="form-input" />
              </InputGroup>
            </InputGrid>
            <InputGrid className="mt-4">
              <InputGroup label="LinkedIn">
                <input name="linkedIn" placeholder="linkedin.com/in/username" value={resumeData.linkedIn} onChange={handleChange} className="form-input" />
              </InputGroup>
              <InputGroup label="GitHub">
                <input name="github" placeholder="github.com/username" value={resumeData.github} onChange={handleChange} className="form-input" />
              </InputGroup>
            </InputGrid>
            <InputGroup label="Portfolio Website" className="mt-4">
              <input name="portfolio" placeholder="e.g. yourportfolio.com" value={resumeData.portfolio} onChange={handleChange} className="form-input" />
            </InputGroup>
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
            <div className="section-header-row">
              <h3 className="section-label !mb-0">Summary</h3>
              <div className="flex items-center gap-3">
                {showUndo && (
                  <button 
                    type="button" 
                    onClick={handleUndoSummary}
                    className="text-[10px] font-black uppercase tracking-wider text-gray-400 hover:text-gray-600 transition-all flex items-center gap-1 animate-classy-fade"
                  >
                    ↺ Undo
                  </button>
                )}
                <button 
                  type="button" 
                  onClick={handleImproveSummary}
                  disabled={isImprovingSummary || !resumeData.summary.trim()}
                  className="text-[10px] font-black uppercase tracking-wider text-purple-600 hover:text-purple-700 disabled:opacity-30 transition-all flex items-center gap-1"
                >
                  {isImprovingSummary ? 'Magic...' : '✨ Improve with AI'}
                </button>
              </div>
            </div>
            <InputGroup>
              <textarea 
                name="summary" 
                rows="5"
                placeholder="Tell your professional story..." 
                value={resumeData.summary} 
                onChange={handleChange} 
                className="form-textarea"
              />
            </InputGroup>
          </section>

          {/* Experience Section */}
          <DynamicListSection 
            title="Work Experience"
            addLabel="+ Add Position"
            onAdd={() => addItem('experience', { 
              company: "", role: "", location: "", startDate: "", endDate: "", isCurrent: false, description: "" 
            })}
            items={resumeData.experience}
            onRemove={(index) => removeItem('experience', index)}
            emptyMessage="No experience added yet."
            renderItem={(exp, index) => (
              <>
                <InputGroup label="Job Title" className="mb-4" error={errors.experience?.[index]?.role}>
                  <input name="role" value={exp.role} onChange={(e) => handleDynamicChange('experience', index, e)} placeholder="e.g. Senior Software Engineer" className="form-input" />
                </InputGroup>
                <InputGrid className="mb-4">
                  <InputGroup label="Company" error={errors.experience?.[index]?.company}>
                    <input name="company" value={exp.company} onChange={(e) => handleDynamicChange('experience', index, e)} placeholder="e.g. Google" className="form-input" />
                  </InputGroup>
                  <InputGroup label="Location">
                    <input name="location" value={exp.location} onChange={(e) => handleDynamicChange('experience', index, e)} placeholder="e.g. Mountain View, CA" className="form-input" />
                  </InputGroup>
                </InputGrid>
                <InputGrid>
                  <InputGroup label="Start Date" error={errors.experience?.[index]?.startDate}>
                    <input name="startDate" value={exp.startDate} onChange={(e) => handleDynamicChange('experience', index, e)} placeholder="MM/YYYY" className="form-input" />
                  </InputGroup>
                  {!exp.isCurrent && (
                    <InputGroup label="End Date">
                      <input name="endDate" value={exp.endDate} onChange={(e) => handleDynamicChange('experience', index, e)} placeholder="MM/YYYY" className="form-input" />
                    </InputGroup>
                  )}
                </InputGrid>
                <div className="mt-3 flex items-center gap-2">
                  <input type="checkbox" name="isCurrent" checked={exp.isCurrent} onChange={(e) => handleDynamicChange('experience', index, e)} className="accent-brand-blue" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase">I currently work here</span>
                </div>
                <InputGroup label="Role & Responsibilities" className="mt-4">
                  <textarea name="description" value={exp.description} onChange={(e) => handleDynamicChange('experience', index, e)} rows="3" placeholder="What did you achieve?" className="form-textarea" />
                </InputGroup>
              </>
            )}
          />

          {/* Education Section */}
          <DynamicListSection 
            title="Education"
            addLabel="+ Add Education"
            onAdd={() => addItem('education', { 
              school: "", degree: "", location: "", startDate: "", endDate: "" 
            })}
            items={resumeData.education}
            onRemove={(index) => removeItem('education', index)}
            emptyMessage="No education added yet."
            renderItem={(edu, index) => (
              <>
                <InputGrid className="mb-4">
                  <InputGroup label="School / University" error={errors.education?.[index]?.school}>
                    <input name="school" value={edu.school} onChange={(e) => handleDynamicChange('education', index, e)} placeholder="e.g. Stanford University" className="form-input" />
                  </InputGroup>
                  <InputGroup label="Location">
                    <input name="location" value={edu.location} onChange={(e) => handleDynamicChange('education', index, e)} placeholder="e.g. Stanford, CA" className="form-input" />
                  </InputGroup>
                </InputGrid>
                <InputGrid>
                  <InputGroup label="Start Date">
                    <input name="startDate" value={edu.startDate} onChange={(e) => handleDynamicChange('education', index, e)} placeholder="YYYY" className="form-input" />
                  </InputGroup>
                  <InputGroup label="End Date (or Expected)">
                    <input name="endDate" value={edu.endDate} onChange={(e) => handleDynamicChange('education', index, e)} placeholder="YYYY" className="form-input" />
                  </InputGroup>
                </InputGrid>
                <InputGroup label="Degree / Field of Study" className="mt-4" error={errors.education?.[index]?.degree}>
                  <input name="degree" value={edu.degree} onChange={(e) => handleDynamicChange('education', index, e)} placeholder="e.g. B.S. in Computer Science" className="form-input" />
                </InputGroup>
              </>
            )}
          />

          {/* Certifications Section */}
          <DynamicListSection 
            title="Certifications"
            addLabel="+ Add Certification"
            onAdd={() => addItem('certifications', { 
              name: "", issuer: "", date: "" 
            })}
            items={resumeData.certifications}
            onRemove={(index) => removeItem('certifications', index)}
            emptyMessage="No certifications added yet."
            renderItem={(cert, index) => (
              <>
                <InputGroup label="Certification Name" error={errors.certifications?.[index]?.name}>
                  <input name="name" value={cert.name} onChange={(e) => handleDynamicChange('certifications', index, e)} placeholder="e.g. AWS Certified Solutions Architect" className="form-input" />
                </InputGroup>
                <InputGrid className="mt-4">
                  <InputGroup label="Issuer">
                    <input name="issuer" value={cert.issuer} onChange={(e) => handleDynamicChange('certifications', index, e)} placeholder="e.g. Amazon Web Services" className="form-input" />
                  </InputGroup>
                  <InputGroup label="Date">
                    <input name="date" value={cert.date} onChange={(e) => handleDynamicChange('certifications', index, e)} placeholder="MM/YYYY" className="form-input" />
                  </InputGroup>
                </InputGrid>
              </>
            )}
          />

          {/* Projects Section */}
          <DynamicListSection 
            title="Key Projects"
            addLabel="+ Add Project"
            onAdd={() => addItem('projects', { 
              title: "", link: "", description: "" 
            })}
            items={resumeData.projects}
            onRemove={(index) => removeItem('projects', index)}
            emptyMessage="No projects added yet."
            renderItem={(proj, index) => (
              <>
                <InputGrid>
                  <InputGroup label="Project Title">
                    <input name="title" value={proj.title} onChange={(e) => handleDynamicChange('projects', index, e)} placeholder="e.g. Resume Builder" className="form-input" />
                  </InputGroup>
                  <InputGroup label="Link (Optional)">
                    <input name="link" value={proj.link} onChange={(e) => handleDynamicChange('projects', index, e)} placeholder="e.g. github.com/my-repo" className="form-input" />
                  </InputGroup>
                </InputGrid>
                <InputGroup label="Description" className="mt-4">
                  <textarea name="description" value={proj.description} onChange={(e) => handleDynamicChange('projects', index, e)} rows="3" placeholder="Built using React 19 and Tailwind CSS..." className="form-textarea" />
                </InputGroup>
              </>
            )}
          />

          {/* Custom Sections */}
          <DynamicListSection 
            title="Custom Sections"
            addLabel="+ Add Section"
            onAdd={() => addItem('customSections', { 
              title: "", description: "" 
            })}
            items={resumeData.customSections}
            onRemove={(index) => removeItem('customSections', index)}
            emptyMessage="No custom sections added yet."
            renderItem={(sec, index) => (
              <>
                <InputGroup label="Section Title">
                  <input name="title" value={sec.title} onChange={(e) => handleDynamicChange('customSections', index, e)} placeholder="e.g. Languages or Certifications" className="form-input" />
                </InputGroup>
                <InputGroup label="Content" className="mt-4">
                  <textarea name="description" value={sec.description} onChange={(e) => handleDynamicChange('customSections', index, e)} rows="3" placeholder="Enter details..." className="form-textarea" />
                </InputGroup>
              </>
            )}
          />
        </form>
      </div>

      {/* Right Side: Real-time Preview */}
      <ResumePreview 
        resumeData={resumeData}
        activeView={activeView}
        setActiveView={setActiveView}
        zoom={zoom}
        setZoom={setZoom}
        resumeRef={resumeRef}
      />

      {/* Toast Notification */}
      {saveStatus && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 animate-classy-fade ${
          saveStatus === 'saving' ? 'bg-white border-app-border text-app-text' :
          saveStatus === 'success' ? 'bg-green-50 border-green-100 text-green-700' :
          'bg-red-50 border-red-100 text-red-700'
        }`}>
          {saveStatus === 'saving' && <div className="w-4 h-4 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />}
          {saveStatus === 'success' && <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>}
          {saveStatus === 'error' && <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          <span className="font-bold text-sm">
            {saveStatus === 'saving' ? 'Saving your progress...' : 
             saveStatus === 'success' ? 'Resume saved successfully!' : 
             'Failed to save. Please try again.'}
          </span>
        </div>
      )}
    </div>
  );
}