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
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-screen w-full flex items-center justify-center bg-workflow-ivory overflow-hidden">
      <main className="w-full max-w-[1440px] h-screen flex flex-col md:flex-row shadow-2xl bg-clean-surface">
        {/* LEFT COLUMN: Brand & Messaging */}
        <section className="hidden md:flex md:w-[60%] h-full bg-workflow-ivory relative flex-col p-margin-lg overflow-hidden border-r border-border-warm">
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 geometric-bg pointer-events-none"></div>
          <div className="relative z-10 flex flex-col h-full">
            {/* Header Info */}
            <div className="mb-auto">
              <h1 className="font-headline-xl text-deep-charcoal mb-4 max-w-xl">
                Recruitment Workflow Management System
              </h1>
              <p className="font-body-lg text-slate-ink max-w-md">
                Streamline hiring decisions. Track every step. A unified platform for enterprise talent acquisition.
              </p>
            </div>
            {/* Main Illustration Centerpiece */}
            <div className="flex-grow flex items-center justify-center py-margin-lg">
              <div className="w-full max-w-2xl transform hover:scale-[1.02] transition-transform duration-700 ease-out">
                <img
                  alt="Workflow Illustration"
                  className="w-full h-auto drop-shadow-sm"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBpBTBbhUGzc3jsdiHn5uQ8SUu4dfQWvltqWhgUoFsR9Pyc9eCCG19MS47PX7k0ElDn_-qIMk8u6ERwQyK_zse4Ak56a1odBnbuFSOKN5GLk2L9KZvBm7vAovoGdRzgeSXTioj6dWlND4mR_T9X6c2xOJ4FGC6SjIYWyXSj4uQB7RlXIhb8E5x8CrNeH641nt_8kRvRYnJL9pHUZuSgyOtGOmWt3F077sNBpihsEgsaoExgGLXUF5uUEOFNYhac5_towyQs0-SbONE"
                />
              </div>
            </div>
            {/* Social Proof Footer */}
            <div className="mt-auto space-y-6">
              <p className="font-label-sm text-slate-ink uppercase tracking-wider">
                Trusted by leading Vietnamese enterprises
              </p>
              <div className="opacity-80">
                <img
                  alt="Partner Logos"
                  className="h-12 w-auto object-contain"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCT4x19rHrOIVlVSmgEM1h4TOuQmrmErI7KHZ1Rw9izMHp8uqPMO_bNatVlxS0fpt0ANdtVw8P6Jqs5kyoCpVPftuA9r8JWQEfTPVVIcjFxkDmX7KAYYBOiSujO-s3y9iU6UZMw9oSgwLfsSo3zt3Vxn0QYDBbGYYxLst1FoUe6Z4n7rkbug7IfTbH0hp1ZeBRFAcHhU8hltldPXBuWkEwKWzFJQuLyOy5XwUeaqL8WqHJkcqRHI1puqUZfvPEjNHCIMVnTLQnhwXk"
                />
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Login Form */}
        <section className="w-full md:w-[40%] h-full bg-clean-surface flex items-center justify-center p-margin-md relative overflow-y-auto">
          <div className="w-full max-w-[400px] flex flex-col items-center py-8">
            {/* Brand Logo & Welcome */}
            <div className="text-center mb-margin-lg w-full">
              <div className="flex items-center justify-center gap-2 mb-6">
                <span className="font-headline-lg text-teal-command font-extrabold tracking-tighter">RMS</span>
              </div>
              <h2 className="font-headline-lg text-deep-charcoal mb-1">Welcome back</h2>
              <p className="font-body-md text-slate-ink">Sign in to your account</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 py-3 px-4 rounded-xl text-sm w-full mb-6">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="w-full space-y-margin-sm">
              {/* Email Field */}
              <div className="space-y-2">
                <label className="font-label-md text-on-surface-variant block" htmlFor="email">
                  Email Address
                </label>
                <div className="relative group">
                  <input
                    className="w-full h-12 px-4 bg-clean-surface border border-border-warm rounded-xl font-body-md text-deep-charcoal focus:ring-2 focus:ring-teal-command focus:border-teal-command outline-none transition-all placeholder:text-slate-ink/40"
                    id="email"
                    placeholder="your.name@company.com"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="font-label-md text-on-surface-variant block" htmlFor="password">
                  Password
                </label>
                <div className="relative group">
                  <input
                    className="w-full h-12 px-4 bg-clean-surface border border-border-warm rounded-xl font-body-md text-deep-charcoal focus:ring-2 focus:ring-teal-command focus:border-teal-command outline-none transition-all placeholder:text-slate-ink/40"
                    id="password"
                    placeholder="••••••••"
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-ink hover:text-teal-command transition-colors cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]" id="visibilityIcon">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Actions Row */}
              <div className="flex items-center justify-between py-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      className="peer h-5 w-5 rounded border-border-warm text-teal-command focus:ring-teal-command transition-all cursor-pointer"
                      type="checkbox"
                    />
                  </div>
                  <span className="font-label-md text-slate-ink group-hover:text-deep-charcoal transition-colors">
                    Remember me
                  </span>
                </label>
                <a className="font-label-md text-teal-command hover:underline font-semibold transition-all" href="#">
                  Forgot password?
                </a>
              </div>

              {/* Submit Button */}
              <button
                disabled={loading}
                className="w-full h-12 bg-teal-command text-white font-label-md rounded-xl hover:bg-primary transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>

              {/* Divider */}
              <div className="relative flex items-center gap-4 py-4">
                <div className="flex-grow border-t border-border-warm"></div>
                <span className="font-label-sm text-slate-ink/60 uppercase">or continue with</span>
                <div className="flex-grow border-t border-border-warm"></div>
              </div>

              {/* Social Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  className="h-12 border border-border-warm rounded-xl flex items-center justify-center gap-3 font-label-md text-deep-charcoal hover:bg-workflow-ivory transition-colors cursor-pointer"
                  type="button"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    ></path>
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    ></path>
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      fill="#FBBC05"
                    ></path>
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    ></path>
                  </svg>
                  Google
                </button>
                <button
                  className="h-12 border border-border-warm rounded-xl flex items-center justify-center gap-3 font-label-md text-deep-charcoal hover:bg-workflow-ivory transition-colors cursor-pointer"
                  type="button"
                >
                  <svg className="w-5 h-5" viewBox="0 0 23 23">
                    <path d="M0 0h23v23H0z" fill="#f3f3f3"></path>
                    <path d="M1 1h10v10H1z" fill="#f35325"></path>
                    <path d="M12 1h10v10H12z" fill="#81bc06"></path>
                    <path d="M1 12h10v10H1z" fill="#05a6f0"></path>
                    <path d="M12 12h10v10H12z" fill="#ffba08"></path>
                  </svg>
                  Microsoft
                </button>
              </div>

              {/* Quick Demo Login Section */}
              <div className="relative flex items-center gap-4 py-2 pt-4">
                <div className="flex-grow border-t border-border-warm"></div>
                <span className="font-label-sm text-slate-ink/60 uppercase">Quick Demo Login</span>
                <div className="flex-grow border-t border-border-warm"></div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@acme.com')}
                  className="h-10 border border-border-warm rounded-xl flex items-center justify-center gap-1.5 font-label-md text-xs text-deep-charcoal hover:bg-workflow-ivory transition-colors cursor-pointer"
                >
                  🔑 Admin / Boss
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('depthead@acme.com')}
                  className="h-10 border border-border-warm rounded-xl flex items-center justify-center gap-1.5 font-label-md text-xs text-deep-charcoal hover:bg-workflow-ivory transition-colors cursor-pointer"
                >
                  🏢 Dept Head
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('hr@acme.com')}
                  className="h-10 border border-border-warm rounded-xl flex items-center justify-center gap-1.5 font-label-md text-xs text-deep-charcoal hover:bg-workflow-ivory transition-colors cursor-pointer"
                >
                  🎯 HR Manager
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('candidate@acme.com')}
                  className="h-10 border border-border-warm rounded-xl flex items-center justify-center gap-1.5 font-label-md text-xs text-deep-charcoal hover:bg-workflow-ivory transition-colors cursor-pointer"
                >
                  👤 Candidate
                </button>
              </div>
            </form>

            {/* Footer Contact */}
            <p className="mt-margin-lg font-body-sm text-slate-ink text-center">
              Don't have an account?{' '}
              <a className="text-teal-command font-semibold hover:underline" href="#">
                Contact your admin
              </a>
            </p>
          </div>

          {/* Simple Decorative Element */}
          <div className="absolute bottom-margin-md text-slate-ink/20 flex gap-4">
            <span className="font-label-sm">Privacy Policy</span>
            <span className="font-label-sm">Terms of Service</span>
          </div>
        </section>
      </main>
    </div>
  );
};