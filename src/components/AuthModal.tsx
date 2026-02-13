import React, { useState } from 'react';
import { AuthService } from '../services/AuthService';
import './AuthModal.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type AuthMode = 'signin' | 'signup' | 'reset';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        await AuthService.signUp(email, password, displayName);
        onSuccess();
        onClose();
      } else if (mode === 'signin') {
        await AuthService.signIn(email, password);
        onSuccess();
        onClose();
      } else if (mode === 'reset') {
        await AuthService.resetPassword(email);
        setResetEmailSent(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setError('');
    setResetEmailSent(false);
  };

  const switchMode = (newMode: AuthMode) => {
    resetForm();
    setMode(newMode);
  };

  return (
    <div className="auth-modal-overlay" onClick={handleOverlayClick}>
      <div className="auth-modal">
        <button className="auth-modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="auth-modal-header">
          <h2>
            {mode === 'signin' && 'Welcome Back'}
            {mode === 'signup' && 'Create Account'}
            {mode === 'reset' && 'Reset Password'}
          </h2>
          <p>
            {mode === 'signin' && 'Sign in to access your personalized dashboard'}
            {mode === 'signup' && 'Join Layne\'s World to get started'}
            {mode === 'reset' && 'Enter your email to receive a password reset link'}
          </p>
        </div>

        {resetEmailSent ? (
          <div className="auth-success-message">
            <p>✓ Password reset email sent! Check your inbox.</p>
            <button
              className="auth-button"
              onClick={() => switchMode('signin')}
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}

            {mode === 'signup' && (
              <div className="auth-form-group">
                <label htmlFor="displayName">Name</label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your name"
                  required
                  disabled={loading}
                />
              </div>
            )}

            <div className="auth-form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>

            {mode !== 'reset' && (
              <div className="auth-form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  minLength={6}
                  disabled={loading}
                />
              </div>
            )}

            <button
              type="submit"
              className="auth-button auth-button-primary"
              disabled={loading}
            >
              {loading ? 'Please wait...' : (
                <>
                  {mode === 'signin' && 'Sign In'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'reset' && 'Send Reset Link'}
                </>
              )}
            </button>

            <div className="auth-links">
              {mode === 'signin' && (
                <>
                  <button
                    type="button"
                    className="auth-link"
                    onClick={() => switchMode('reset')}
                  >
                    Forgot password?
                  </button>
                  <span className="auth-separator">•</span>
                  <button
                    type="button"
                    className="auth-link"
                    onClick={() => switchMode('signup')}
                  >
                    Create account
                  </button>
                </>
              )}

              {mode === 'signup' && (
                <>
                  Already have an account?
                  <button
                    type="button"
                    className="auth-link"
                    onClick={() => switchMode('signin')}
                  >
                    Sign in
                  </button>
                </>
              )}

              {mode === 'reset' && (
                <button
                  type="button"
                  className="auth-link"
                  onClick={() => switchMode('signin')}
                >
                  Back to sign in
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
