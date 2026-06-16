import { Link } from "react-router";
import About from "../pages/About";
import Services from "../pages/Services";
import Contact from "../pages/Contact";
import previewImg from "../assets/preview-img.avif";

function Greeting() {
  return (
    <div className="flex flex-col gap-20 pb-20">
      {/* Hero Section */}
      <section id="home" className="bg-gradient-to-b from-white to-gray-50 pt-16 px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6 animate-classy-fade">
            Landing your dream job starts with a <span className="text-brand-blue">Perfect Resume</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 leading-relaxed animate-classy-fade [animation-delay:200ms] opacity-0">
            Use our professional, AI-powered resume editor to build a stunning CV in minutes. 
            ATS-friendly templates designed to get you hired.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-classy-fade [animation-delay:400ms] opacity-0">
            <Link 
              to="/auth" 
              className="px-8 py-4 bg-brand-blue text-white font-bold rounded-full hover:bg-button-hover transition-all shadow-lg hover:shadow-xl text-lg"
            >
              Build My Resume Now
            </Link>
            <Link 
              to="#services" 
              className="px-8 py-4 bg-white text-gray-700 font-bold rounded-full border border-gray-200 hover:bg-gray-50 transition-all text-lg"
            >
              View Templates
            </Link>
          </div>
        </div>
        <div className="mt-16 max-w-5xl mx-auto rounded-t-2xl shadow-2xl border-x border-t border-gray-100 overflow-hidden">
          <img src={previewImg} alt="Resume Editor Preview" className="w-full opacity-90" />
        </div>
      </section>

      {/* Quick Advertising Features */}
      <section className="px-8 max-w-6xl mx-auto grid md:grid-cols-3 gap-12">
        <div className="text-center p-6">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-brand-blue font-bold text-2xl">1</div>
          <h3 className="text-xl font-bold mb-3">Modern Templates</h3>
          <p className="text-gray-600">Choose from dozens of recruiter-approved layouts that look great on any device.</p>
        </div>
        <div className="text-center p-6">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-brand-blue font-bold text-2xl">2</div>
          <h3 className="text-xl font-bold mb-3">AI Content Suggestions</h3>
          <p className="text-gray-600">Stop struggling with writer's block. Get pre-written bullet points for thousands of jobs.</p>
        </div>
        <div className="text-center p-6">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-brand-blue font-bold text-2xl">3</div>
          <h3 className="text-xl font-bold mb-3">Instant PDF Export</h3>
          <p className="text-gray-600">Download your resume in high-quality PDF format, ready to send to your next employer.</p>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="scroll-mt-20 animate-classy-fade">
        <About />
      </section>

      {/* Services Section */}
      <section id="services" className="scroll-mt-20 bg-gray-50 py-10 animate-classy-fade">
        <Services />
      </section>

      {/* Contact Section */}
      <section id="contact" className="scroll-mt-20 animate-classy-fade">
        <Contact />
      </section>

      {/* Bottom CTA */}
      <section className="mx-8 bg-brand-blue rounded-3xl p-12 text-center text-white mb-20">
        <h2 className="text-3xl font-bold mb-4">Ready to upgrade your career?</h2>
        <p className="text-blue-100 mb-8 max-w-2xl mx-auto text-lg">Join over 50,000 job seekers who have used our tools to land interviews at top tech companies.</p>
        <Link to="/auth" className="inline-block bg-white text-brand-blue px-10 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-lg">Get Started Free</Link>
      </section>
    </div>
  );
}

export default Greeting;
