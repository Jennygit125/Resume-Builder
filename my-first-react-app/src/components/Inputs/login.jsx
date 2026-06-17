import { useState, useEffect } from 'react';
import { useNavigate, useRevalidator, useSearchParams } from 'react-router';
import { api, supabase } from '../../utils/api.js';

function LoginForm ({ onSwitch, onForgot, defaultUsername, successMessage }){
    const navigate = useNavigate();
    const revalidator = useRevalidator();
    const [searchParams] = useSearchParams();
    const [username, setUsername] = useState(defaultUsername || '');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginHistory, setLoginHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Check for session expired message
  const isSessionExpired = searchParams.get('message') === 'session_expired';

  // Sync username if registration provides a default value after mount
  useEffect(() => {
    if (defaultUsername) setUsername(defaultUsername);
  }, [defaultUsername]);

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevents page reload on login
    setIsLoading(true);
    setLoginError('');
    setProgress(0);

    // Start a 60-second countdown timer for the progress bar
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + (100 / 60); // Increment relative to 60 seconds
      });
    }, 1000);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username,
        password: password,
        options: {
          // Set session persistence based on rememberMe checkbox
          shouldCreateUser: false, // Only sign in existing users
          persistSession: rememberMe, // 'session' or 'local'
        },
      });

      if (error) throw error;

      if (data.session) {
        const firstName = data.user.user_metadata.firstName || username;

        localStorage.setItem("access_token", data.session.access_token);
        localStorage.setItem("refresh_token", data.session.refresh_token);
        localStorage.setItem("first_name", firstName);

        // Trigger revalidation so the Root loader (and the Header) picks up the new name
        revalidator.revalidate();
        
        const timestamp = new Date().getTime();
        setLoginHistory((prevHistory) => [{ id: timestamp, user: firstName, time: new Date().toLocaleTimeString(), remembered: rememberMe ? "Yes" : "No" }, ...prevHistory]);
        navigate("/dashboard");
      } else {
        // Handle backend-specific error messages (e.g. 401 Unauthorized)
        setLoginError(data.message || 'Invalid username or password.');
      }
    } catch (error) {
      console.error('Login Error details:', error);
      setLoginError('Network error: server down ?');
    } finally {
      clearInterval(timer);
      setProgress(0);
      setIsLoading(false);
      setPassword('');
    }
  };

  const handleOAuthLogin = async (provider) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (error) {
      setLoginError(error.message);
    }
  };

    return(
            <form onSubmit={handleSubmit}>

                {successMessage && <div className="success-banner">{successMessage}</div>}
                {isSessionExpired && !loginError && (
                  <div className="login-error" style={{ backgroundColor: '#fff4f4', color: '#d32f2f', border: '1px solid #ffcdd2' }}>
                    Your session has expired. Please log in again to continue.
                  </div>
                )}
                {loginError && <div className="login-error">{loginError}</div>}

                <h2 className="title">Login</h2>

                <div className="inputGroup">
                    <label htmlFor="username">Username</label>
                    <input type="text" id="username" name="username" placeholder="Username or email" value={username}
                    onChange={(e) => setUsername(e.target.value)} required/>
                </div>

                <div className="inputGroup">
                    <label htmlFor="password">Password</label>
                    <div className="password-wrapper">
                        <input type={showPassword ? "text" : "password"} id="password" name="password" placeholder="Password"
                        value={password} onChange = {(e) => setPassword(e.target.value)} required/>
                        <button 
                          type="button" 
                          className="password-toggle"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            {showPassword 
                              ? <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                              : <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            }
                          </svg>
                        </button>
                    </div>
                </div>
                       <div className="options">
                        <label htmlFor="rememberMe" className="remember">
                        <input type="checkbox" id="rememberMe" name="rememberMe"
                        checked={rememberMe} 
                        onChange={(e)=> setRememberMe(e.target.checked)}/>
                        <span>Remember me </span>
                        </label>
                        <button type="button" onClick={onForgot} className="link-button">
                          Forgot Password
                        </button>
                        </div>
                        
                        {isLoading && (
                          <div className="progress-container">
                            <div 
                              className="progress-bar" 
                              style={{ width: `${progress}%` }}
                            ></div>
                            <span className="progress-text">Connecting to server (up to 60s)...</span>
                          </div>
                        )}

                        <button 
                          type="submit" 
                          className="loginButton" 
                          disabled={isLoading}
                        >
                          {isLoading ? 'Logging in...' : 'Login'}
                        </button>
                        
                        <button type="button" onClick={onSwitch} className="signUpLog">
                          sign up
                        </button>

                        <div className="social-divider">
                          <span>or</span>
                        </div>

                        <div className="social-group">
                          <button
                            type="button"
                            className="social-btn"
                            onClick={() => handleOAuthLogin('google')}
                          >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                              <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              />
                              <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              />
                              <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.16H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.84l3.66-2.75z"
                              />
                              <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.16l3.66 2.75c.87-2.6 3.3-4.53 6.14-4.53z"
                              />
                            </svg>
                            Google
                          </button>
                          <button
                            type="button"
                            className="social-btn"
                            onClick={() => handleOAuthLogin('github')}
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 3.071 1.305 3.819.997.108-.775.44-1.305.805-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.22 0 4.609-2.807 5.628-5.487 5.927.43.372.814 1.103.814 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                            GitHub
                          </button>
                        </div>

                        {loginHistory.length > 0 && (
          <div className="history-log">
            <h3>Recent Login History</h3>
            <ul>
              {loginHistory.map((item) => (
                <li key={item.id}>
                   <strong>{item.user}</strong> logged in at {item.time} (Remember: {item.remembered})
                </li>
              ))}
            </ul>
          </div>
        )}
            </form>
            )
}
export default LoginForm;