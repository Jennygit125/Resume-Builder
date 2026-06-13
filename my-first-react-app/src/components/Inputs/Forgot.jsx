const ForgotForm = ({ onBackToLogin }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Reset link sent");
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="title">Reset Password</h2>
      <div className="inputGroup">
        <label htmlFor="email">Email</label>
        <input type="email" id="email" placeholder="Enter your email" required />
      </div>
      <button type="submit" className="loginButton">Send Reset Link</button>
      <button type="button" onClick={onBackToLogin} className="signUpLog">
        Back to Login
      </button>
    </form>
  );
};
export default ForgotForm;