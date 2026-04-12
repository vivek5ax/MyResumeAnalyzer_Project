import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import LoginPage from './LoginPage';
import SignupPage from './SignupPage';
import '../styles/auth.css';

export default function AuthGate({ children }) {
  const { isAuthenticated, loading, login } = useAuth();
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-spinner">
          <div className="spinner-dot"></div>
          <div className="spinner-dot"></div>
          <div className="spinner-dot"></div>
        </div>
        <p>Initializing Resume Analyzer...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return authMode === 'login' ? (
      <LoginPage
        onLoginSuccess={(authData) => {
          login(authData);
        }}
        onSwitchToSignup={() => setAuthMode('signup')}
      />
    ) : (
      <SignupPage
        onSignupSuccess={(authData) => {
          login(authData);
        }}
        onSwitchToLogin={() => setAuthMode('login')}
      />
    );
  }

  return children;
}
