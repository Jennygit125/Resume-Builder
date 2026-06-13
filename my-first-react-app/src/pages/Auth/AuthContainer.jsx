import {useState} from 'react';
import LoginForm from '../../components/Inputs/login';
import SignUpForm from '../../components/Inputs/signUp';
import ForgotForm from '../../components/Inputs/Forgot'
import './Login.css'
const AuthContainer = () => {
    const [authMode, setAuthMode] = useState('login');
    const [prefilledUsername, setPrefilledUsername] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    
    /**
     * Swaps the "puzzle pieces" (Forms) within the Auth container.
     */
    const handleSwitch = (mode) => (e, data = '', message = '') => {
    if (e) e.preventDefault();
    if (data) setPrefilledUsername(data);
    setSuccessMessage(message);
    setAuthMode(mode);
  };
    return(
        <>
        {authMode === 'login' && (
        <LoginForm 
          onSwitch={handleSwitch('signup')} 
          onForgot={handleSwitch('forgot')} 
          defaultUsername={prefilledUsername}
          successMessage={successMessage}
        />
      )}
      {authMode === 'signup' &&(<SignUpForm onSwitch={handleSwitch('login')}/>
      )}
      {authMode === 'forgot' &&(<ForgotForm onBackToLogin={handleSwitch('login')}/>
      )}
      </>
    );
    };

export default AuthContainer;