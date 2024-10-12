// src/components/AuthPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  signInWithGoogle,
  logInWithEmailAndPassword,
  registerWithEmailAndPassword
} from '../firebase'; // Adjust this import path as needed

function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (isSignUp) {
      await registerWithEmailAndPassword(name, email, password, organizationName);
    } else {
      await logInWithEmailAndPassword(email, password);
    }
    navigate('/');
  };

  const handleGoogleSignIn = async () => {
    await signInWithGoogle();
    navigate('/');
  };

  return (
    <div className="auth-page">
      <h2>{isSignUp ? 'Sign Up' : 'Login'}</h2>
      
      <button onClick={handleGoogleSignIn} className="google-btn">
        {isSignUp ? 'Sign up with Google' : 'Sign in with Google'}
      </button>
      
      <div className="divider">
        <span>or</span>
      </div>

      <form onSubmit={handleEmailSubmit}>
        {isSignUp && (
          <>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
              required
            />
            <input
              type="text"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="Organization Name"
              required
            />
          </>
        )}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <button type="submit">
          {isSignUp ? 'Sign Up with Email' : 'Login with Email'}
        </button>
      </form>

      <p>
        {isSignUp
          ? 'Already have an account? '
          : "Don't have an account? "}
        <button onClick={() => setIsSignUp(!isSignUp)} className="toggle-auth">
          {isSignUp ? 'Login' : 'Sign Up'}
        </button>
      </p>
    </div>
  );
}

export default AuthPage;