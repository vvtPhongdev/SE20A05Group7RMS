import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (mockEmail: string) => {
    setEmail(mockEmail);
    setPassword('Password123!');
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <div style={logoStyle}>WR</div>
          <h1 style={titleStyle}>Works Reruiter</h1>
          <p style={subtitleStyle}>Recruitment Workflow Management System</p>
        </div>

        {error && <div style={errorStyle}>{error}</div>}

        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@acme.com"
              required
              style={inputStyle}
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={inputStyle}
            />
          </div>

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={dividerContainerStyle}>
          <hr style={dividerStyle} />
          <span style={dividerTextStyle}>Quick Demo Login</span>
          <hr style={dividerStyle} />
        </div>

        <div style={quickLoginGridStyle}>
          <button
            onClick={() => handleQuickLogin('admin@acme.com')}
            style={quickLoginButtonStyle}
          >
            🔑 Admin / Boss
          </button>
          <button
            onClick={() => handleQuickLogin('depthead@acme.com')}
            style={quickLoginButtonStyle}
          >
            🏢 Dept Head
          </button>
          <button
            onClick={() => handleQuickLogin('hr@acme.com')}
            style={quickLoginButtonStyle}
          >
            🎯 HR Manager
          </button>
          <button
            onClick={() => handleQuickLogin('candidate@acme.com')}
            style={quickLoginButtonStyle}
          >
            👤 Candidate
          </button>
        </div>
      </div>
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  backgroundColor: 'var(--wr-bg-page)',
  fontFamily: 'var(--wr-font-sans)',
  padding: '1rem',
  boxSizing: 'border-box',
};

const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--wr-bg-surface)',
  border: '1px solid var(--wr-border-default)',
  borderRadius: 'var(--wr-radius-xl)',
  boxShadow: 'var(--wr-shadow-lg)',
  width: '100%',
  maxWidth: '440px',
  padding: '2.5rem',
  boxSizing: 'border-box',
  backdropFilter: 'blur(8px)',
};

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '2rem',
};

const logoStyle: React.CSSProperties = {
  width: '48px',
  height: '48px',
  borderRadius: 'var(--wr-radius-lg)',
  backgroundColor: 'var(--wr-accent-primary)',
  color: '#ffffff',
  display: 'inline-flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontWeight: 'var(--wr-font-bold)',
  fontSize: 'var(--wr-text-lg)',
  marginBottom: '1rem',
};

const titleStyle: React.CSSProperties = {
  fontSize: 'var(--wr-text-2xl)',
  fontWeight: 'var(--wr-font-bold)',
  color: 'var(--wr-text-primary)',
  margin: '0 0 0.5rem 0',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 'var(--wr-text-sm)',
  color: 'var(--wr-text-secondary)',
  margin: 0,
};

const errorStyle: React.CSSProperties = {
  backgroundColor: 'var(--wr-error-bg)',
  border: '1px solid var(--wr-error-border)',
  color: 'var(--wr-error-text)',
  padding: '0.75rem 1rem',
  borderRadius: 'var(--wr-radius-md)',
  fontSize: 'var(--wr-text-sm)',
  marginBottom: '1.5rem',
};

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem',
};

const formGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const labelStyle: React.CSSProperties = {
  fontSize: 'var(--wr-text-xs)',
  fontWeight: 'var(--wr-font-semibold)',
  color: 'var(--wr-text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const inputStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  borderRadius: 'var(--wr-radius-md)',
  border: '1px solid var(--wr-border-default)',
  fontSize: 'var(--wr-text-base)',
  fontFamily: 'inherit',
  color: 'var(--wr-text-primary)',
  backgroundColor: '#ffffff',
  transition: 'border-color var(--wr-transition-fast)',
  boxSizing: 'border-box',
  width: '100%',
};

const buttonStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  borderRadius: 'var(--wr-radius-md)',
  border: 'none',
  backgroundColor: 'var(--wr-accent-primary)',
  color: 'var(--wr-accent-primary-text)',
  fontSize: 'var(--wr-text-base)',
  fontWeight: 'var(--wr-font-semibold)',
  cursor: 'pointer',
  transition: 'background-color var(--wr-transition-fast)',
  marginTop: '0.5rem',
};

const dividerContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  margin: '2rem 0 1.5rem 0',
};

const dividerStyle: React.CSSProperties = {
  flex: 1,
  border: 'none',
  borderTop: '1px solid var(--wr-border-subtle)',
};

const dividerTextStyle: React.CSSProperties = {
  fontSize: 'var(--wr-text-xs)',
  color: 'var(--wr-text-muted)',
  padding: '0 0.75rem',
  fontWeight: 'var(--wr-font-medium)',
};

const quickLoginGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '0.75rem',
};

const quickLoginButtonStyle: React.CSSProperties = {
  padding: '0.625rem',
  borderRadius: 'var(--wr-radius-md)',
  border: '1px solid var(--wr-border-default)',
  backgroundColor: 'var(--wr-bg-elevated)',
  color: 'var(--wr-text-secondary)',
  fontSize: 'var(--wr-text-xs)',
  fontWeight: 'var(--wr-font-medium)',
  cursor: 'pointer',
  textAlign: 'center',
  transition: 'all var(--wr-transition-fast)',
  fontFamily: 'inherit',
};
