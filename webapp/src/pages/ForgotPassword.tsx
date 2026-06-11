import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const trustItems = [
  { label: 'Secure encryption', icon: 'shield' },
  { label: 'Instant delivery', icon: 'bolt' },
];

const resetSteps = [
  ['1', 'Enter workspace email'],
  ['2', 'Receive reset instructions'],
  ['3', 'Create a new password'],
];

const Icon = ({ name, className = 'h-5 w-5' }: { name: string; className?: string }) => {
  const paths: Record<string, React.ReactNode> = {
    arrowLeft: <path d="M19 12H5m6-6-6 6 6 6" />,
    mail: <path d="M4 6h16v12H4V6Zm0 1 8 6 8-6" />,
    lock: <path d="M8 11V8a4 4 0 0 1 8 0v3m-9 0h10v9H7v-9Z" />,
    shield: <path d="M12 3 5 6v5c0 4.5 3 8.4 7 10 4-1.6 7-5.5 7-10V6l-7-3Z" />,
    bolt: <path d="m13 2-8 12h7l-1 8 8-12h-7l1-8Z" />,
    check: <path d="M20 6 9 17l-5-5" />,
    info: <path d="M12 17v-6m0-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  );
};

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Enter the email address assigned to your RMS workspace.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Use a valid work email address.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset instructions.');
      }

      setSent(true);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#f7f5f1] text-[var(--wr-text-primary)]">
      <main className="grid min-h-[100dvh] lg:grid-cols-[minmax(0,1.06fr)_minmax(430px,0.94fr)]">
        <section className="relative hidden overflow-hidden bg-[var(--wr-accent-primary)] px-10 py-8 text-white lg:flex lg:flex-col xl:px-14">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,104,95,0.95),rgba(13,148,136,0.84)_58%,rgba(28,25,23,0.66))]" />
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(30deg,rgba(255,255,255,0.18)_12%,transparent_12.5%,transparent_87%,rgba(255,255,255,0.18)_87.5%,rgba(255,255,255,0.18)),linear-gradient(150deg,rgba(255,255,255,0.18)_12%,transparent_12.5%,transparent_87%,rgba(255,255,255,0.18)_87.5%,rgba(255,255,255,0.18))] [background-size:46px_80px]" />

          <Link className="relative flex items-center gap-3" to="/">
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--wr-radius-lg)] bg-white/12 text-sm font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]">
              RMS
            </div>
            <div>
              <p className="text-sm font-semibold">RMS Enterprise</p>
              <p className="text-xs text-white/70">Secure recruitment operations</p>
            </div>
          </Link>

          <div className="relative my-auto max-w-2xl py-12">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.08em] text-white/70">
              Password recovery
            </p>
            <h1 className="max-w-xl text-[42px] font-semibold leading-[1.04] tracking-tight xl:text-[52px]">
              Reset access without exposing candidate or pipeline data.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-white/78">
              Enter your email address and RMS will send reset instructions through a controlled
              verification flow.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              {trustItems.map((item) => (
                <div
                  className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white/78 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur"
                  key={item.label}
                >
                  <Icon className="h-4 w-4" name={item.icon} />
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          <div className="relative rounded-[16px] border border-white/12 bg-white/10 p-5 shadow-[0_26px_70px_-54px_rgba(0,0,0,0.65)] backdrop-blur">
            <p className="mb-4 text-sm font-semibold">Reset sequence</p>
            <div className="grid grid-cols-3 gap-3">
              {resetSteps.map(([index, label]) => (
                <div className="border-l border-white/18 pl-3" key={label}>
                  <p className="font-mono text-xl font-semibold">{index}</p>
                  <p className="mt-1 text-xs leading-5 text-white/68">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex min-h-[100dvh] flex-col justify-between bg-[var(--wr-bg-surface)] px-5 py-8 sm:px-8 lg:px-16">
          <div className="flex justify-between">
            <Link
              className="group inline-flex items-center gap-2 text-sm font-semibold text-[var(--wr-accent-primary)] transition hover:underline"
              to="/login"
            >
              <Icon className="h-4 w-4 transition group-hover:-translate-x-1" name="arrowLeft" />
              Back to sign in
            </Link>
          </div>

          <div className="mx-auto w-full max-w-[460px]">
            <div className="rounded-[18px] border border-[var(--wr-border-default)] bg-white p-6 shadow-[0_26px_70px_-54px_rgba(28,28,40,0.65)] sm:p-8">
              <div className="mb-8 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--wr-bg-elevated)] text-[var(--wr-accent-primary)]">
                  <Icon className="h-10 w-10" name="lock" />
                </div>
                <h2 className="text-3xl font-semibold leading-tight tracking-tight text-[var(--wr-text-primary)]">
                  Forgot password?
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--wr-text-secondary)]">
                  No worries, we will send reset instructions to your workspace email.
                </p>
              </div>

              {sent ? (
                <div className="rounded-[var(--wr-radius-lg)] border border-[var(--wr-success-border)] bg-[var(--wr-success-bg)] px-4 py-4 text-[var(--wr-success-text)]">
                  <div className="flex gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--wr-success)] text-white">
                      <Icon className="h-3.5 w-3.5" name="check" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">Reset email sent</p>
                      <p className="mt-1 text-sm leading-6">
                        Check {email} for password reset instructions. The link expires after a
                        short security window.
                      </p>
                    </div>
                  </div>
                  <Link
                    className="mt-5 flex h-11 w-full items-center justify-center rounded-[var(--wr-radius-lg)] bg-[var(--wr-accent-primary)] px-4 text-sm font-semibold text-white transition hover:-translate-y-[1px] hover:bg-[var(--wr-accent-primary-hover)] active:translate-y-0 active:scale-[0.98]"
                    to="/login"
                  >
                    Return to sign in
                  </Link>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="mb-5 rounded-[var(--wr-radius-lg)] border border-[var(--wr-error-border)] bg-[var(--wr-error-bg)] px-4 py-3 text-sm font-medium text-[var(--wr-error-text)]">
                      {error}
                    </div>
                  )}

                  <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                      <label
                        className="block text-sm font-medium text-[var(--wr-text-primary)]"
                        htmlFor="email"
                      >
                        Email address
                      </label>
                      <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[var(--wr-text-muted)]">
                          <Icon className="h-5 w-5" name="mail" />
                        </span>
                        <input
                          className="h-12 w-full rounded-[var(--wr-radius-lg)] border border-[var(--wr-border-default)] bg-[#fefdfb] px-4 pl-12 text-sm text-[var(--wr-text-primary)] outline-none transition focus:border-[var(--wr-focus-ring)] focus:bg-white focus:ring-2 focus:ring-[var(--wr-focus-ring)]/20"
                          id="email"
                          placeholder="name@company.com"
                          required
                          type="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                        />
                      </div>
                      <p className="text-xs text-[var(--wr-text-muted)]">
                        Use the email assigned to your RMS account.
                      </p>
                    </div>

                    <button
                      className="flex h-12 w-full items-center justify-center overflow-hidden rounded-[var(--wr-radius-lg)] bg-[var(--wr-accent-primary)] px-4 text-sm font-semibold text-white shadow-[var(--wr-shadow-sm)] transition duration-200 ease-out hover:-translate-y-[1px] hover:bg-[var(--wr-accent-primary-hover)] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                      disabled={loading}
                      type="submit"
                    >
                      {loading ? (
                        <span
                          className="flex w-32 items-center justify-center gap-1.5"
                          aria-label="Sending reset link"
                        >
                          <span className="h-1.5 w-6 rounded-full bg-white/45 animate-pulse" />
                          <span className="h-1.5 w-12 rounded-full bg-white/70 animate-pulse [animation-delay:120ms]" />
                          <span className="h-1.5 w-5 rounded-full bg-white/45 animate-pulse [animation-delay:240ms]" />
                        </span>
                      ) : (
                        'Send reset link'
                      )}
                    </button>
                  </form>

                  <p className="mt-8 text-center text-sm text-[var(--wr-text-secondary)]">
                    Remember your password?{' '}
                    <Link
                      className="font-semibold text-[var(--wr-accent-primary)] hover:underline"
                      to="/login"
                    >
                      Sign in
                    </Link>
                  </p>
                </>
              )}

              <div className="mt-8 rounded-xl border border-[var(--wr-border-default)] bg-[#fefdfb] p-4">
                <div className="flex gap-3">
                  <Icon
                    className="mt-0.5 h-5 w-5 shrink-0 text-[var(--wr-text-secondary)]"
                    name="info"
                  />
                  <p className="text-sm leading-6 text-[var(--wr-text-secondary)]">
                    If you do not receive an email within 5 minutes, check your spam folder or
                    contact your administrator.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-xs font-medium text-[var(--wr-text-muted)]">
            (c) 2026 Recruitment Management Suite. Enterprise Edition.
          </p>
        </section>
      </main>
    </div>
  );
};
