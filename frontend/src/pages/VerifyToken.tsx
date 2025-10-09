import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function VerifyToken() {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const { verifyToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('No token provided');
      return;
    }

    verifyToken(token)
      .then(() => navigate('/users'))
      .catch(err => setError(err.response?.data?.error || 'Invalid token'));
  }, []);

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Verifying...</h1>
        {error ? (
          <>
            <p style={{ color: 'var(--gray-400)' }}>{error}</p>
            <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Back to Login
            </button>
          </>
        ) : (
          <p>Please wait...</p>
        )}
      </div>
    </div>
  );
}