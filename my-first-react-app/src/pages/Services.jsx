export default function Services() {
  const features = [
    "Professional Resume Builder",
    "Cover Letter Generator",
    "LinkedIn Profile Optimization",
    "ATS Scan & Feedback",
    "Job Interview Preparation"
  ];

  return (
    <div className="max-w-4xl mx-auto px-8 py-16">
      <h1 className="text-4xl font-bold mb-8 text-center">Our Services</h1>
      <div className="grid sm:grid-cols-2 gap-6">
        {features.map(f => (
          <div key={f} className="p-6 border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow bg-white">
            <h3 className="text-xl font-semibold text-brand-blue">{f}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}