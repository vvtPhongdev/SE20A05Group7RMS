import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoleHomePath } from '../lib/auth';


const pipelineStages = [
  { label: 'Approved', value: '93.4%', width: '93.4%', tone: 'bg-[var(--wr-success)]' },
  { label: 'Sourcing', value: '76.8%', width: '76.8%', tone: 'bg-[var(--wr-accent-primary)]' },
  { label: 'Interview', value: '48.6%', width: '48.6%', tone: 'bg-[#3b6fb5]' },
  { label: 'Offer', value: '21.7%', width: '21.7%', tone: 'bg-[var(--wr-warning)]' },
];

const activityItems = [
  {
    team: 'Platform engineering',
    status: 'Panel feedback due',
    meta: '2 candidates',
    priority: 'High',
  },
  {
    team: 'Finance operations',
    status: 'Campaign draft ready',
    meta: '5 tasks',
    priority: 'Ready',
  },
  { team: 'Customer success', status: 'Headcount approval', meta: '1 request', priority: 'Review' },
];

const EyeIcon = ({ hidden }: { hidden: boolean }) => (
  <svg
    aria-hidden="true"
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    {hidden ? (
      <>
        <path d="m3 3 18 18" />
        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
        <path d="M8.5 5.6A10.4 10.4 0 0 1 12 5c5 0 8.5 4.2 10 7a13.2 13.2 0 0 1-2.6 3.3" />
        <path d="M6.4 6.9A13.6 13.6 0 0 0 2 12c1.5 2.8 5 7 10 7a10.7 10.7 0 0 0 4.4-.9" />
      </>
    ) : (
      <>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    )}
  </svg>
);

export const Login: React.FC = () => {
  const { login, signInWithGoogle, completeSupabaseLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const authMode = searchParams.get('auth');

  useEffect(() => {
    if (authMode !== 'google') return;

    const completeGoogleLogin = async () => {
      setError(null);
      setGoogleLoading(true);

      try {
        const loggedUser = await completeSupabaseLogin(rememberMe);
        navigate(getRoleHomePath(loggedUser.role), { replace: true });
      } catch (err: any) {
        if (err.status === 404 || err.code === 'RMS_ACCOUNT_NOT_REGISTERED') {
          navigate('/signup?auth=google', { replace: true });
          return;
        }

        setError(err.message || 'Google sign-in failed. Please try again.');
      } finally {
        setGoogleLoading(false);
      }
    };

    void completeGoogleLogin();
  }, [authMode, navigate, rememberMe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const loggedUser = await login(email, password, rememberMe);
      navigate(getRoleHomePath(loggedUser.role), { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      await signInWithGoogle('/login?auth=google');
    } catch (err: any) {
      setGoogleLoading(false);
      setError(err.message || 'Could not start Google sign-in.');
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#f7f5f1] text-[var(--wr-text-primary)]">
      <main className="grid min-h-[100dvh] lg:grid-cols-[minmax(0,1.08fr)_minmax(430px,0.92fr)]">
        <section className="relative hidden overflow-hidden border-r border-[var(--wr-border-default)] bg-[#f7f5f1] px-10 py-8 lg:flex lg:flex-col xl:px-14">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.72),rgba(245,242,237,0.2)_42%,rgba(43,122,142,0.08))]" />
          <div className="geometric-bg absolute inset-0 opacity-35" />

          <div className="relative flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--wr-radius-lg)] bg-[var(--wr-accent-primary)] text-sm font-bold text-white shadow-[var(--wr-shadow-md)]">
              WR
            </div>
            <div>
              <p className="text-sm font-semibold">Works Recruiter</p>
              <p className="text-xs text-[var(--wr-text-secondary)]">
                Recruitment workflow management
              </p>
            </div>
          </div>

          <div className="relative my-auto grid max-w-6xl grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)] items-center gap-10 py-12 xl:gap-16">
            <div>
              <p className="mb-4 text-sm font-semibold uppercase text-[var(--wr-accent-primary)]">
                Recruitment operations
              </p>
              <h1 className="max-w-xl text-[42px] font-semibold leading-[1.03] tracking-tight text-[var(--wr-text-primary)] xl:text-[48px]">
                Control every approval, campaign, and interview from one workspace.
              </h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-[var(--wr-text-secondary)]">
                A focused login surface for teams that need auditable hiring requests, clear
                ownership, and reliable candidate movement.
              </p>

              <div className="mt-10 max-w-lg divide-y divide-[var(--wr-border-subtle)] border-y border-[var(--wr-border-subtle)]">
                {[
                  ['23', 'active staffing requests'],
                  ['47.2%', 'screening work completed'],
                  ['6.8d', 'median review cycle'],
                ].map(([value, label]) => (
                  <div key={label} className="grid grid-cols-[112px_1fr] items-baseline gap-6 py-4">
                    <span className="font-mono text-3xl font-semibold tracking-tight text-[var(--wr-text-primary)]">
                      {value}
                    </span>
                    <span className="text-sm text-[var(--wr-text-secondary)]">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[18px] border border-[var(--wr-border-default)] bg-[rgba(254,253,251,0.86)] p-4 shadow-[0_30px_80px_-54px_rgba(28,28,40,0.55)] backdrop-blur">
              <div className="mb-4 flex items-center justify-between border-b border-[var(--wr-border-subtle)] pb-4">
                <div>
                  <p className="text-sm font-semibold">Hiring control board</p>
                  <p className="mt-1 text-xs text-[var(--wr-text-secondary)]">
                    June operating view
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-[var(--wr-radius-full)] border border-[var(--wr-success-border)] bg-[var(--wr-success-bg)] px-3 py-1 text-xs font-semibold text-[var(--wr-success-text)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--wr-success)] animate-pulse" />
                  Synced
                </div>
              </div>

              <div className="grid grid-cols-[116px_1fr] gap-4">
                <div className="space-y-2 border-r border-[var(--wr-border-subtle)] pr-4">
                  {['Requests', 'Campaigns', 'Screening', 'Interviews'].map((item, index) => (
                    <div
                      key={item}
                      className={`rounded-[var(--wr-radius-md)] px-3 py-2 text-xs font-medium ${
                        index === 0
                          ? 'bg-[var(--wr-accent-primary)] text-white'
                          : 'text-[var(--wr-text-secondary)]'
                      }`}
                    >
                      {item}
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      ['Need review', '8'],
                      ['Due today', '5'],
                      ['Blocked', '2'],
                    ].map(([label, value]) => (
                      <div key={label} className="border-l border-[var(--wr-border-subtle)] pl-3">
                        <p className="font-mono text-xl font-semibold leading-none">{value}</p>
                        <p className="mt-1 text-[11px] text-[var(--wr-text-secondary)]">{label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="divide-y divide-[var(--wr-border-subtle)] border-y border-[var(--wr-border-subtle)]">
                    {activityItems.map((item, index) => (
                      <div
                        key={item.team}
                        className="grid grid-cols-[1fr_auto] gap-4 py-3 [animation:fadeIn_500ms_ease_both]"
                        style={{ animationDelay: `${index * 90}ms` }}
                      >
                        <div>
                          <p className="text-xs font-semibold text-[var(--wr-text-primary)]">
                            {item.team}
                          </p>
                          <p className="mt-1 text-xs text-[var(--wr-text-secondary)]">
                            {item.status}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-[var(--wr-accent-primary)]">
                            {item.priority}
                          </p>
                          <p className="mt-1 text-[11px] text-[var(--wr-text-secondary)]">
                            {item.meta}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative mb-4 rounded-[14px] border border-[var(--wr-border-default)] bg-[rgba(254,253,251,0.9)] p-5 shadow-[0_22px_44px_-34px_rgba(28,28,40,0.42)]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Pipeline health</p>
                <p className="text-xs text-[var(--wr-text-secondary)]">
                  Live request movement across teams
                </p>
              </div>
              <span className="rounded-[var(--wr-radius-full)] bg-[var(--wr-success-bg)] px-3 py-1 text-xs font-semibold text-[var(--wr-success-text)]">
                On track
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              {pipelineStages.map((stage) => (
                <div key={stage.label}>
                  <div className="mb-2 flex items-center justify-between gap-4 text-xs">
                    <span className="text-[var(--wr-text-secondary)]">{stage.label}</span>
                    <span className="font-mono font-semibold">{stage.value}</span>
                  </div>
                  <div className="h-2 rounded-[var(--wr-radius-full)] bg-[var(--wr-bg-elevated)]">
                    <div
                      className={`h-full rounded-[var(--wr-radius-full)] ${stage.tone}`}
                      style={{ width: stage.width }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex min-h-[100dvh] items-center justify-center bg-[var(--wr-bg-surface)] px-5 py-8 sm:px-8">
          <div className="w-full max-w-[460px]">
            <div className="mb-8 lg:hidden">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[var(--wr-radius-lg)] bg-[var(--wr-accent-primary)] text-sm font-bold text-white">
                  WR
                </div>
                <div>
                  <p className="text-sm font-semibold">Works Recruiter</p>
                  <p className="text-xs text-[var(--wr-text-secondary)]">
                    Recruitment workflow management
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[18px] border border-[var(--wr-border-default)] bg-white p-6 shadow-[0_26px_70px_-54px_rgba(28,28,40,0.65)] sm:p-8">
              <div className="mb-8 flex items-start justify-between gap-6">
                <div>
                  <p className="mb-2 text-sm font-semibold text-[var(--wr-accent-primary)]">
                    Secure workspace
                  </p>
                  <h2 className="text-3xl font-semibold leading-tight tracking-tight text-[var(--wr-text-primary)]">
                    Sign in
                  </h2>
                  <p className="mt-2 text-sm text-[var(--wr-text-secondary)]">
                    Access approvals, campaigns, and candidate workflows.
                  </p>
                </div>
                <span className="mt-1 rounded-[var(--wr-radius-full)] border border-[var(--wr-border-subtle)] px-3 py-1 text-xs font-semibold text-[var(--wr-text-secondary)]">
                  RMS
                </span>
              </div>

              {error && (
                <div className="mb-5 rounded-[var(--wr-radius-lg)] border border-[var(--wr-error-border)] bg-[var(--wr-error-bg)] px-4 py-3 text-sm font-medium text-[var(--wr-error-text)]">
                  {error}
                </div>
              )}

              <button
                className="mb-5 flex h-12 w-full items-center justify-center gap-3 rounded-[var(--wr-radius-lg)] border border-[var(--wr-border-default)] bg-[#fefdfb] px-4 text-sm font-semibold text-[var(--wr-text-primary)] transition duration-200 ease-out hover:-translate-y-[1px] hover:border-[var(--wr-border-strong)] hover:bg-[var(--wr-bg-elevated)] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={loading || googleLoading}
                type="button"
                onClick={handleGoogleSignIn}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--wr-border-subtle)] bg-white font-semibold text-[#4285f4]">
                  G
                </span>
                {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
              </button>

              <div className="mb-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--wr-text-muted)]">
                <span className="h-px flex-1 bg-[var(--wr-border-subtle)]" />
                <span>or</span>
                <span className="h-px flex-1 bg-[var(--wr-border-subtle)]" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label
                    className="block text-sm font-medium text-[var(--wr-text-primary)]"
                    htmlFor="email"
                  >
                    Email address
                  </label>
                  <input
                    className="h-12 w-full rounded-[var(--wr-radius-lg)] border border-[var(--wr-border-default)] bg-[#fefdfb] px-4 text-sm text-[var(--wr-text-primary)] outline-none transition focus:border-[var(--wr-focus-ring)] focus:bg-white focus:ring-2 focus:ring-[var(--wr-focus-ring)]/20"
                    id="email"
                    placeholder="your.name@company.com"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <p className="text-xs text-[var(--wr-text-muted)]">
                    Use the email assigned to your workspace.
                  </p>
                </div>

                <div className="space-y-2">
                  <label
                    className="block text-sm font-medium text-[var(--wr-text-primary)]"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      className="h-12 w-full rounded-[var(--wr-radius-lg)] border border-[var(--wr-border-default)] bg-[#fefdfb] px-4 pr-12 text-sm text-[var(--wr-text-primary)] outline-none transition focus:border-[var(--wr-focus-ring)] focus:bg-white focus:ring-2 focus:ring-[var(--wr-focus-ring)]/20"
                      id="password"
                      placeholder="Password"
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[var(--wr-radius-md)] text-[var(--wr-text-secondary)] transition hover:bg-[var(--wr-bg-elevated)] hover:text-[var(--wr-text-primary)]"
                      onClick={() => setShowPassword(!showPassword)}
                      type="button"
                    >
                      <EyeIcon hidden={showPassword} />
                    </button>
                  </div>
                  <p className="text-xs text-[var(--wr-text-muted)]">
                    Keep your session private on shared devices.
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <label className="flex items-center gap-2 text-sm text-[var(--wr-text-secondary)]">
                    <input
                      checked={rememberMe}
                      className="h-4 w-4 rounded border-[var(--wr-border-strong)] text-[var(--wr-accent-primary)] focus:ring-[var(--wr-focus-ring)]"
                      type="checkbox"
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    Remember me
                  </label>
                  <Link
                    className="text-sm font-semibold text-[var(--wr-accent-primary)] hover:underline"
                    to="/forgot-password"
                  >
                    Forgot password?
                  </Link>
                </div>

                <button
                  disabled={loading || googleLoading}
                  className="flex h-12 w-full items-center justify-center overflow-hidden rounded-[var(--wr-radius-lg)] bg-[var(--wr-accent-primary)] px-4 text-sm font-semibold text-white shadow-[var(--wr-shadow-sm)] transition duration-200 ease-out hover:-translate-y-[1px] hover:bg-[var(--wr-accent-primary-hover)] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                  type="submit"
                >
                  {loading ? (
                    <span
                      className="flex w-28 items-center justify-center gap-1.5"
                      aria-label="Signing in"
                    >
                      <span className="h-1.5 w-6 rounded-full bg-white/45 animate-pulse" />
                      <span className="h-1.5 w-10 rounded-full bg-white/70 animate-pulse [animation-delay:120ms]" />
                      <span className="h-1.5 w-4 rounded-full bg-white/45 animate-pulse [animation-delay:240ms]" />
                    </span>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </form>


              <div className="mt-8">
                <Link
                  className="flex h-11 w-full items-center justify-center rounded-[var(--wr-radius-lg)] border border-[var(--wr-border-default)] bg-[#fefdfb] px-4 text-sm font-semibold text-[var(--wr-accent-primary)] transition duration-200 ease-out hover:-translate-y-[1px] hover:border-[var(--wr-border-strong)] hover:bg-[var(--wr-bg-elevated)] active:translate-y-0 active:scale-[0.98]"
                  to="/signup"
                >
                  Create an account
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
