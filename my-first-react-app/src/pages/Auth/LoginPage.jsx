import AuthContainer from "./AuthContainer";

/**
 * Guard for the auth page. If a valid session exists, redirect to dashboard
 * before the login content is rendered.
 */


export default function LoginPage() {
  return (
    <div className="login-page-wrapper">
      <div className="login-card">
        {/* Left Side: Marketing/Encouragement */}
        <div className="login-marketing-side">
          <h2 className="marketing-title">
            Unlock Your Career Potential
          </h2>
          <p className="marketing-text">
            Join thousands of professionals who are building interview-winning resumes with ease.
          </p>
          <ul className="marketing-list">
            <li className="flex items-center">
              <svg className="w-6 h-6 mr-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              ATS-Optimized Templates
            </li>
            <li className="flex items-center">
              <svg className="w-6 h-6 mr-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              AI-Powered Content Suggestions
            </li>
            <li className="flex items-center">
              <svg className="w-6 h-6 mr-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              Easy Export & Sharing
            </li>
          </ul>

          <p className="marketing-footer">
            Already a member? Sign in on the right to continue editing your masterpiece.
          </p>
        </div>

        {/* Right Side: AuthContainer */}
        <div className="login-auth-side">
          <AuthContainer />
        </div>
      </div>
    </div>
  );
}

