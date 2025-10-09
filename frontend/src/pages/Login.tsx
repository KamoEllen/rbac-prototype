import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const data = await login(email);
      setToken(data.token);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send passwordless link');
    } finally {
      setLoading(false);
    }
  };

  if (token) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1>Check Email</h1>
          <p>Passwordless link sent to {email}</p>
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--gray-900)', borderRadius: '6px' }}>
            <p style={{ fontSize: '0.75rem', marginBottom: '0.5rem', color: 'var(--gray-500)' }}>Dev: Use token</p>
            <code style={{ fontSize: '0.875rem', wordBreak: 'break-all' }}>{token}</code>
          </div>
          <button 
            onClick={() => navigate(`/verify?token=${token}`)}
            className="btn btn-primary"
            style={{ marginTop: '1rem', width: '100%' }}
          >
            Verify Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Welcome</h1>
        <p>Enter email for passwordless link</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@acme.com"
              required
            />
          </div>
          
          {error && <div className="error">{error}</div>}
          
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            <Mail size={18} />
            {loading ? 'Sending...' : 'Send Link'}
          </button>
        </form>
      </div>
    </div>
  );
}