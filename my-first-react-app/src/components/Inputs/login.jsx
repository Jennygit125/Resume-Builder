import React, { useState } from 'react';
import './login.css';


function LoginForm (){
    const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loginHistory, setLoginHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault(); // Prevents page reload on login
    setIsLoading(true);

    const newLoginRecord = {
      user: username,
      time: new Date().toLocaleTimeString(),
      remembered: rememberMe ? "Yes" : "No"
    };
    
    setLoginHistory((prevHistory) => [newLoginRecord, ...prevHistory]);

    setPassword('');
  };

    return(
        <div>
            <form onSubmit={handleSubmit}>

                <h2 className="title">Login</h2>

                <div className="inputGroup">
                    <label htmlFor="username">Username</label>
                    <input type="text" id="username" name="username" placeholder="Username or email" value={username}
                    onChange={(e) => setUsername(e.target.value)} required/>
                </div>

                <div className="inputGroup">
                    <label htmlFor="password">Password</label>
                    <input type="password" id="password" name="password" placeholder="Password"
                    value={password} onChange = {(e) => setPassword(e.target.value)} required/>
                </div>
                       <div className="options">
                        <label htmlFor="rememberMe" className="remember">
                        <input type="checkbox" id="rememberMe" name="rememberMe"
                        checked={rememberMe} 
                        onChange={(e)=> setRememberMe(e.target.checked)}/>
                        <span>Remember me </span>
                        </label>
                        <a href='/forgot'>Forgot Password</a>
                        </div>
                        
                        <button type="submit" className="loginButton" disabled={isLoading}>{isLoading ? 'Logging in...' : 'login'}</button>
                        <a href="/SignUpForm" className= "signUpLog">sign up</a>
                        {loginHistory.length > 0 && (
          <div className="history-log">
            <h3>Recent Login History</h3>
            <ul>
              {loginHistory.map((item, index) => (
                <li key={index}>
                   <strong>{item.user}</strong> logged in at {item.time} (Remember: {item.remembered})
                </li>
              ))}
            </ul>
          </div>
        )}
            </form>
        </div>
            )
}
export default LoginForm;