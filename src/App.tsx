import { useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './config/firebase';
import './App.css';
import Dashboard from './components/Dashboard';
import { AuthModal } from './components/AuthModal';
import { config } from './config/environment';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (!currentUser) {
        setShowAuthModal(true);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app-auth-required">
        <div className="auth-required-content">
          <h1 className="auth-required-title">Welcome to Layne's World</h1>
          <p className="auth-required-subtitle">
            Your personal dashboard for staying organized and informed
          </p>
          <button
            className="auth-required-button"
            onClick={() => setShowAuthModal(true)}
          >
            Sign In to Continue
          </button>
        </div>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
          }}
        />
      </div>
    );
  }

  return <Dashboard useMockData={config.useMockData} />;
}

export default App;
