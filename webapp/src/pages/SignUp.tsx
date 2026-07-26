import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoleHomePath } from '../lib/auth';
import { getErrorMessage, getErrorMetadata } from '../lib/errors';

const onboardingSignals = [
  ['3.4d', 'median approval setup'],
  ['18', 'workflow controls'],
  ['47.2%', 'screening work automated'],
];

const CheckIcon = () => (
  <svg
    aria-hidden="true"
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

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

export const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isGoogleSignup, setIsGoogleSignup] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [invitationSummary, setInvitationSummary] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
  }>({});

  // States and refs for registration OTP verification flow
  const {
    loginWithToken,
    signInWithGoogle,
    completeSupabaseLogin,
    registerWithSupabaseSession,
    getSupabaseProfile,
  } = useAuth();
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(''));
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(272);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const authMode = searchParams.get('auth');

  useEffect(() => {
    const inviteCode = searchParams.get('inviteCode');
    if (inviteCode) setOrganization(inviteCode);
  }, [searchParams]);

  useEffect(() => {
    const code = organization.trim();
    if (!code) {
      setInvitationSummary(null);
      return;
    }
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch('/api/v1/organization-invitations/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });
        if (!response.ok) throw new Error((await response.json()).message || 'Invalid invitation code');
        const invitation = await response.json();
        setInvitationSummary(`${invitation.organizationName} · ${invitation.role.replace(/_/g, ' ')}`);
      } catch (err) {
        setInvitationSummary(null);
        setError(getErrorMessage(err, 'Invitation code is invalid or expired. You can clear it to register as a Candidate.'));
      }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [organization]);

  const maskedEmail = useMemo(() => {
    const [localPart, domain] = email.split('@');
    if (!domain) return email;
    if (localPart.length <= 3) return `${localPart[0]}***@${domain}`;
    return `${localPart.substring(0, 3)}***@${domain}`;
  }, [email]);

  useEffect(() => {
    if (submitted && !otpVerified) {
      window.setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 50);
    }
  }, [submitted, otpVerified]);

  useEffect(() => {
    if (!submitted || otpSecondsLeft <= 0 || otpVerified) return;

    const timer = window.setInterval(() => {
      setOtpSecondsLeft((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [submitted, otpSecondsLeft, otpVerified]);

  useEffect(() => {
    if (authMode !== 'google') return;

    const prepareGoogleSignup = async () => {
      setError(null);
      setGoogleLoading(true);

      try {
        const profile = await getSupabaseProfile();
        if (profile) {
          setEmail(profile.email);
          setFullName((current) => current || profile.displayName);
          setIsGoogleSignup(true);
        }

        const loggedUser = await completeSupabaseLogin();
        navigate(getRoleHomePath(loggedUser.role), { replace: true });
      } catch (err: unknown) {
        const authError = getErrorMetadata(err);
        if (authError.status !== 404 && authError.code !== 'RMS_ACCOUNT_NOT_REGISTERED') {
          setError(getErrorMessage(err, 'Google sign-up could not be completed.'));
        }
      } finally {
        setGoogleLoading(false);
      }
    };

    void prepareGoogleSignup();
  }, [authMode, navigate]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    setOtpError(null);
    setOtpDigits((current) => {
      const next = [...current];
      next[index] = digit;
      return next;
    });

    if (digit && index < 5) {
      window.setTimeout(() => otpInputRefs.current[index + 1]?.focus(), 0);
    }
  };

  const handleOtpKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === 'Backspace' && !otpDigits[index] && index > 0) {
      event.preventDefault();
      otpInputRefs.current[index - 1]?.focus();
      otpInputRefs.current[index - 1]?.select();
    }
  };

  const handleOtpPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pastedDigits = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6)
      .split('');
    if (!pastedDigits.length) return;

    setOtpError(null);
    setOtpDigits(Array.from({ length: 6 }, (_, index) => pastedDigits[index] ?? ''));
    window.setTimeout(() => otpInputRefs.current[Math.min(pastedDigits.length, 6) - 1]?.focus(), 0);
  };

  const handleOtpResend = async () => {
    if (otpSecondsLeft > 0) return;
    setOtpDigits(Array(6).fill(''));
    setOtpError(null);

    try {
      const response = await fetch('/api/v1/auth/resend-register-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to resend code');
      }

      setOtpSecondsLeft(272);
      window.setTimeout(() => otpInputRefs.current[0]?.focus(), 0);
    } catch (err: unknown) {
      setOtpError(getErrorMessage(err, 'Failed to resend code. Please try again.'));
    }
  };

  const handleOtpVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    setOtpError(null);

    const otpValue = otpDigits.join('');
    if (otpValue.length !== 6 || !otpDigits.every(Boolean)) {
      setOtpError('Enter the 6-digit verification code from your email.');
      return;
    }

    if (otpSecondsLeft === 0) {
      setOtpError('This code has expired. Request a new code to continue.');
      return;
    }

    setOtpLoading(true);

    try {
      const response = await fetch('/api/v1/auth/verify-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code: otpValue,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Verification failed');
      }

      const data = await response.json();
      setOtpVerified(true);
      localStorage.removeItem('registered_email');

      if (data.accessToken && data.user) {
        loginWithToken(data.accessToken, data.user, data.refreshToken);
      }
    } catch (err: unknown) {
      setOtpError(getErrorMessage(err, 'Invalid or expired code. Please try again.'));
    } finally {
      setOtpLoading(false);
    }
  };

  const passwordScore = useMemo(() => {
    return [
      password.length >= 8,
      /[A-Z]/.test(password),
      /\d/.test(password),
      /[^A-Za-z0-9]/.test(password),
    ].filter(Boolean).length;
  }, [password]);

  const handleGoogleSignUp = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      const inviteCode = organization.trim();
      await signInWithGoogle(`/signup?auth=google${inviteCode ? `&inviteCode=${encodeURIComponent(inviteCode)}` : ''}`);
    } catch (err: unknown) {
      setGoogleLoading(false);
      setError(getErrorMessage(err, 'Could not start Google sign-up.'));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const nextFieldErrors: { fullName?: string; email?: string; password?: string } = {};
    const normalizedFullName = fullName.trim();
    const normalizedEmail = email.trim();

    if (!normalizedFullName) {
      nextFieldErrors.fullName = 'Full name is required.';
    } else if (normalizedFullName.length < 2) {
      nextFieldErrors.fullName = 'Full name must contain at least 2 characters.';
    }
    if (!normalizedEmail) {
      nextFieldErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextFieldErrors.email = 'Enter a valid email address.';
    }
    if (!isGoogleSignup && !password) {
      nextFieldErrors.password = 'Password is required.';
    } else if (!isGoogleSignup && passwordScore < 3) {
      nextFieldErrors.password =
        'Use 8+ characters and include at least two of: uppercase, number, or symbol.';
    }

    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) return;

    if (!acceptedTerms) {
      setError('Accept the workspace terms before creating the account.');
      return;
    }

    setLoading(true);

    try {
      if (isGoogleSignup) {
        const loggedUser = await registerWithSupabaseSession({
          displayName: normalizedFullName,
          invitationCode: organization.trim() || undefined,
        });
        setEmail(loggedUser.email);
        setOtpSecondsLeft(272);
        setSubmitted(true);
        return;
      }

      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          displayName: normalizedFullName,
          password,
          invitationCode: organization.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      localStorage.setItem('registered_email', email);
      setSubmitted(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'An error occurred during signup.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#f7f5f1] text-[var(--wr-text-primary)]">
      <main className="grid min-h-[100dvh] lg:grid-cols-[minmax(0,0.96fr)_minmax(460px,1.04fr)]">
        <section className="relative hidden overflow-hidden border-r border-[var(--wr-border-default)] bg-[#f7f5f1] px-10 py-8 lg:flex lg:flex-col xl:px-14">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.84),rgba(245,242,237,0.3)_48%,rgba(13,148,136,0.1))]" />
          <div className="geometric-bg absolute inset-0 opacity-30" />

          <Link className="relative flex items-center gap-3" to="/">
            <object
              aria-label="RMS Recruiter"
              className="pointer-events-none h-10 w-36 shrink-0 object-contain"
              data="/logo-offical.svg"
              tabIndex={-1}
              type="image/svg+xml"
            >
              RMS Recruiter
            </object>
            <div>
              <p className="text-sm font-semibold">Recruitment Management System</p>
              <p className="text-xs text-[var(--wr-text-secondary)]">
                Controlled hiring operations
              </p>
            </div>
          </Link>

          <div className="relative my-auto max-w-2xl py-12">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.08em] text-[var(--wr-accent-primary)]">
              Workspace access
            </p>
            <h1 className="max-w-xl text-[42px] font-semibold leading-[1.04] tracking-tight text-[var(--wr-text-primary)] xl:text-[50px]">
              Start with the role, permissions, and hiring path already aligned.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-[var(--wr-text-secondary)]">
              Create an RMS profile for candidates, HR managers, and department heads without mixing
              permissions or approval ownership.
            </p>

            <div className="mt-10 grid max-w-xl grid-cols-3 gap-4">
              {onboardingSignals.map(([value, label], index) => (
                <div
                  className="rounded-[14px] border border-[var(--wr-border-default)] bg-[rgba(254,253,251,0.78)] p-4 shadow-[0_20px_50px_-42px_rgba(28,28,40,0.5)] backdrop-blur"
                  key={label}
                  style={{ animation: `fadeIn 500ms ease ${index * 90}ms both` }}
                >
                  <p className="font-mono text-2xl font-semibold tracking-tight">{value}</p>
                  <p className="mt-2 text-xs leading-5 text-[var(--wr-text-secondary)]">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative rounded-[16px] border border-[var(--wr-border-default)] bg-[rgba(254,253,251,0.88)] p-5 shadow-[0_26px_70px_-54px_rgba(28,28,40,0.58)] backdrop-blur">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Onboarding route</p>
                <p className="mt-1 text-xs text-[var(--wr-text-secondary)]">
                  Request, verify, assign permissions
                </p>
              </div>
              <span className="rounded-[var(--wr-radius-full)] bg-[var(--wr-success-bg)] px-3 py-1 text-xs font-semibold text-[var(--wr-success-text)]">
                Ready
              </span>
            </div>
            <div className="space-y-3">
              {['Account profile captured', 'Organization mapped', 'Admin review queued'].map(
                (item) => (
                  <div
                    className="flex items-center gap-3 border-t border-[var(--wr-border-subtle)] pt-3 first:border-t-0 first:pt-0"
                    key={item}
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--wr-accent-primary)] text-white">
                      <CheckIcon />
                    </span>
                    <span className="text-sm font-medium">{item}</span>
                  </div>
                ),
              )}
            </div>
          </div>
        </section>

        <section className="flex min-h-[100dvh] items-center justify-center bg-[var(--wr-bg-surface)] px-5 py-8 sm:px-8">
          <div className="w-full max-w-[560px]">
            <div className="mb-8 flex items-center justify-between gap-4">
              <Link className="flex items-center gap-3 lg:hidden" to="/">
                <object
                  aria-label="RMS Recruiter"
                  className="pointer-events-none h-10 w-36 shrink-0 object-contain"
                  data="/logo-offical.svg"
                  tabIndex={-1}
                  type="image/svg+xml"
                >
                  RMS Recruiter
                </object>
                <div>
                  <p className="text-sm font-semibold">RMS</p>
                  <p className="text-xs text-[var(--wr-text-secondary)]">Recruitment workspace</p>
                </div>
              </Link>
              <Link
                className="ml-auto text-sm font-semibold text-[var(--wr-accent-primary)] hover:underline"
                to="/login"
              >
                Sign in
              </Link>
            </div>

            <div className="rounded-[18px] border border-[var(--wr-border-default)] bg-white p-6 shadow-[0_26px_70px_-54px_rgba(28,28,40,0.65)] sm:p-8">
              {submitted ? (
                otpVerified ? (
                  <div className="py-8 text-center">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--wr-success-bg)] text-[var(--wr-success-text)] shadow-sm">
                      <CheckIcon />
                    </div>
                    <h2 className="text-3xl font-semibold leading-tight tracking-tight text-[var(--wr-text-primary)]">
                      Email verified
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-[var(--wr-text-secondary)]">
                      Your email address has been confirmed and your account is now active.
                    </p>
                    <button
                      className="mt-8 flex h-12 w-full items-center justify-center rounded-[var(--wr-radius-lg)] bg-[var(--wr-accent-primary)] px-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-[var(--wr-accent-primary-hover)] active:translate-y-0 active:scale-[0.98]"
                      onClick={() => navigate('/dashboard')}
                      type="button"
                    >
                      Go to Dashboard
                    </button>
                  </div>
                ) : (
                  <div className="py-4">
                    <div className="mb-6">
                      <p className="mb-2 text-sm font-semibold text-[var(--wr-accent-primary)]">
                        Security verification
                      </p>
                      <h2 className="text-3xl font-semibold leading-tight tracking-tight text-[var(--wr-text-primary)]">
                        Verify your email
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-[var(--wr-text-secondary)]">
                        We sent a 6-digit code to{' '}
                        <span className="font-semibold text-[var(--wr-accent-primary)]">
                          {maskedEmail}
                        </span>
                      </p>
                    </div>

                    {otpError && (
                      <div className="mb-5 rounded-[var(--wr-radius-lg)] border border-[var(--wr-error-border)] bg-[var(--wr-error-bg)] px-4 py-3 text-sm font-medium text-[var(--wr-error-text)]">
                        {otpError}
                      </div>
                    )}

                    <form onSubmit={handleOtpVerify} className="space-y-6">
                      <div className="grid grid-cols-6 gap-2 sm:gap-3">
                        {otpDigits.map((digit, index) => (
                          <input
                            key={index}
                            aria-label={`Digit ${index + 1}`}
                            className={`h-14 min-w-0 rounded-[var(--wr-radius-lg)] border bg-white text-center font-mono text-[24px] font-semibold text-[var(--wr-text-primary)] shadow-sm outline-none transition focus:border-[var(--wr-focus-ring)] focus:ring-2 focus:ring-[var(--wr-focus-ring)]/20 ${
                              digit
                                ? 'border-[var(--wr-accent-primary)] bg-[var(--wr-accent-soft)]'
                                : 'border-[var(--wr-border-default)]'
                            }`}
                            inputMode="numeric"
                            maxLength={1}
                            ref={(el) => {
                              otpInputRefs.current[index] = el;
                            }}
                            type="text"
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(e, index)}
                            onPaste={handleOtpPaste}
                          />
                        ))}
                      </div>

                      <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center gap-2 text-[var(--wr-text-secondary)] text-sm">
                          <svg
                            aria-hidden="true"
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 6v6l4 2" />
                          </svg>
                          <span>
                            Code expires in{' '}
                            <span
                              className={`font-semibold ${otpSecondsLeft === 0 ? 'text-[var(--wr-error-text)]' : 'text-[var(--wr-text-primary)]'}`}
                            >
                              {formatTime(otpSecondsLeft)}
                            </span>
                          </span>
                        </div>
                        <button
                          className={`text-sm transition ${
                            otpSecondsLeft === 0
                              ? 'font-semibold text-[var(--wr-accent-primary)] hover:underline'
                              : 'cursor-not-allowed text-[var(--wr-text-muted)]'
                          }`}
                          disabled={otpSecondsLeft !== 0}
                          onClick={handleOtpResend}
                          type="button"
                        >
                          Did not receive a code?{' '}
                          <span className="font-semibold text-[var(--wr-accent-primary)]">
                            Resend code
                          </span>
                        </button>
                      </div>

                      <button
                        className="flex h-12 w-full items-center justify-center rounded-[var(--wr-radius-lg)] bg-[var(--wr-accent-primary)] px-4 text-sm font-semibold text-white shadow-[var(--wr-shadow-sm)] transition duration-200 ease-out hover:-translate-y-[1px] hover:bg-[var(--wr-accent-primary-hover)] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                        disabled={otpDigits.some((d) => !d) || otpLoading}
                        type="submit"
                      >
                        {otpLoading ? (
                          <span
                            className="flex w-28 items-center justify-center gap-1.5"
                            aria-label="Verifying"
                          >
                            <span className="h-1.5 w-6 rounded-full bg-white/45 animate-pulse" />
                            <span className="h-1.5 w-10 rounded-full bg-white/70 animate-pulse [animation-delay:120ms]" />
                            <span className="h-1.5 w-4 rounded-full bg-white/45 animate-pulse [animation-delay:240ms]" />
                          </span>
                        ) : (
                          'Verify email'
                        )}
                      </button>
                    </form>

                    <div className="mt-8 flex w-full flex-col items-center gap-3 border-t border-[var(--wr-border-subtle)] pt-6">
                      <button
                        className="flex items-center gap-1 text-sm font-medium text-[var(--wr-accent-primary)] hover:underline"
                        onClick={() => {
                          setSubmitted(false);
                          setOtpDigits(Array(6).fill(''));
                          setOtpError(null);
                        }}
                      >
                        <svg
                          aria-hidden="true"
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path d="M19 12H5M11 6l-6 6 6 6" />
                        </svg>
                        Wrong email? Go back
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <>
                  <div className="mb-8">
                    <p className="mb-2 text-sm font-semibold text-[var(--wr-accent-primary)]">
                      Create workspace access
                    </p>
                    <h2 className="text-3xl font-semibold leading-tight tracking-tight text-[var(--wr-text-primary)]">
                      Sign up
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--wr-text-secondary)]">
                      Request an RMS account with the role your recruitment workflow needs.
                    </p>
                  </div>

                  {error && (
                    <div className="mb-5 rounded-[var(--wr-radius-lg)] border border-[var(--wr-error-border)] bg-[var(--wr-error-bg)] px-4 py-3 text-sm font-medium text-[var(--wr-error-text)]">
                      {error}
                    </div>
                  )}

                  <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium" htmlFor="fullName">
                          Full name
                        </label>
                        <input
                          aria-describedby={
                            fieldErrors.fullName ? 'signup-full-name-error' : undefined
                          }
                          aria-invalid={!!fieldErrors.fullName}
                          className={`h-12 w-full rounded-[var(--wr-radius-lg)] border bg-[#fefdfb] px-4 text-sm outline-none transition focus:bg-white focus:ring-2 ${fieldErrors.fullName ? 'border-[var(--wr-error-border)] focus:border-[var(--wr-error-border)] focus:ring-[var(--wr-error-border)]/20' : 'border-[var(--wr-border-default)] focus:border-[var(--wr-focus-ring)] focus:ring-[var(--wr-focus-ring)]/20'}`}
                          id="fullName"
                          placeholder="Mina Truong"
                          value={fullName}
                          onChange={(event) => {
                            setFullName(event.target.value);
                            setFieldErrors((current) => ({ ...current, fullName: undefined }));
                          }}
                        />
                        {fieldErrors.fullName ? (
                          <p
                            id="signup-full-name-error"
                            role="alert"
                            className="text-xs font-medium text-[var(--wr-error-text)]"
                          >
                            {fieldErrors.fullName}
                          </p>
                        ) : (
                          <p className="text-xs text-[var(--wr-text-muted)]">
                            Use your legal or workplace display name.
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium" htmlFor="organization">
                          Invitation / organization code
                        </label>
                        <input
                          className="h-12 w-full rounded-[var(--wr-radius-lg)] border border-[var(--wr-border-default)] bg-[#fefdfb] px-4 text-sm outline-none transition focus:border-[var(--wr-focus-ring)] focus:bg-white focus:ring-2 focus:ring-[var(--wr-focus-ring)]/20"
                          id="organization"
                          placeholder="Paste your invitation code (optional)"
                          value={organization}
                          onChange={(event) => setOrganization(event.target.value)}
                        />
                        <p className="text-xs text-[var(--wr-text-muted)]">
                          Leave blank to create a Candidate account. An invitation assigns your organization and role.
                        </p>
                        {invitationSummary ? <p className="text-xs font-semibold text-approved">Invitation found: {invitationSummary}</p> : null}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium" htmlFor="email">
                        Work email
                      </label>
                      <input
                        aria-describedby={fieldErrors.email ? 'signup-email-error' : undefined}
                        aria-invalid={!!fieldErrors.email}
                        className={`h-12 w-full rounded-[var(--wr-radius-lg)] border bg-[#fefdfb] px-4 text-sm outline-none transition focus:bg-white focus:ring-2 ${fieldErrors.email ? 'border-[var(--wr-error-border)] focus:border-[var(--wr-error-border)] focus:ring-[var(--wr-error-border)]/20' : 'border-[var(--wr-border-default)] focus:border-[var(--wr-focus-ring)] focus:ring-[var(--wr-focus-ring)]/20'}`}
                        id="email"
                        placeholder="your.name@company.com"
                        type="email"
                        value={email}
                        readOnly={isGoogleSignup}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          setFieldErrors((current) => ({ ...current, email: undefined }));
                        }}
                      />
                      {fieldErrors.email ? (
                        <p
                          id="signup-email-error"
                          role="alert"
                          className="text-xs font-medium text-[var(--wr-error-text)]"
                        >
                          {fieldErrors.email}
                        </p>
                      ) : (
                        <p className="text-xs text-[var(--wr-text-muted)]">
                          Invitations and review updates are sent here.
                        </p>
                      )}
                    </div>


                    {!isGoogleSignup && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium" htmlFor="password">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            aria-describedby={
                              fieldErrors.password ? 'signup-password-error' : undefined
                            }
                            aria-invalid={!!fieldErrors.password}
                            className={`h-12 w-full rounded-[var(--wr-radius-lg)] border bg-[#fefdfb] px-4 pr-12 text-sm outline-none transition focus:bg-white focus:ring-2 ${fieldErrors.password ? 'border-[var(--wr-error-border)] focus:border-[var(--wr-error-border)] focus:ring-[var(--wr-error-border)]/20' : 'border-[var(--wr-border-default)] focus:border-[var(--wr-focus-ring)] focus:ring-[var(--wr-focus-ring)]/20'}`}
                            id="password"
                            placeholder="Create a password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(event) => {
                              setPassword(event.target.value);
                              setFieldErrors((current) => ({ ...current, password: undefined }));
                            }}
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
                        <div className="grid grid-cols-4 gap-2" aria-hidden="true">
                          {[0, 1, 2, 3].map((step) => (
                            <span
                              className={`h-1.5 rounded-full ${step < passwordScore ? 'bg-[var(--wr-accent-primary)]' : 'bg-[var(--wr-bg-elevated)]'}`}
                              key={step}
                            />
                          ))}
                        </div>
                        {fieldErrors.password ? (
                          <p
                            id="signup-password-error"
                            role="alert"
                            className="text-xs font-medium text-[var(--wr-error-text)]"
                          >
                            {fieldErrors.password}
                          </p>
                        ) : (
                          <p className="text-xs text-[var(--wr-text-muted)]">
                            Use 8+ characters with mixed character types.
                          </p>
                        )}
                      </div>
                    )}

                    <label className="flex items-start gap-3 text-sm text-[var(--wr-text-secondary)]">
                      <input
                        checked={acceptedTerms}
                        className="mt-0.5 h-4 w-4 rounded border-[var(--wr-border-strong)] text-[var(--wr-accent-primary)] focus:ring-[var(--wr-focus-ring)]"
                        type="checkbox"
                        onChange={(event) => setAcceptedTerms(event.target.checked)}
                      />
                      <span>
                        I agree to RMS workspace access terms and understand that an administrator
                        may review this request.
                      </span>
                    </label>

                    <button
                      className="flex h-12 w-full items-center justify-center rounded-[var(--wr-radius-lg)] bg-[var(--wr-accent-primary)] px-4 text-sm font-semibold text-white shadow-[var(--wr-shadow-sm)] transition duration-200 ease-out hover:-translate-y-[1px] hover:bg-[var(--wr-accent-primary-hover)] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                      disabled={loading || googleLoading}
                      type="submit"
                    >
                      {loading ? (
                        <span
                          className="flex w-32 items-center justify-center gap-1.5"
                          aria-label="Creating account"
                        >
                          <span className="h-1.5 w-6 rounded-full bg-white/45 animate-pulse" />
                          <span className="h-1.5 w-12 rounded-full bg-white/70 animate-pulse [animation-delay:120ms]" />
                          <span className="h-1.5 w-5 rounded-full bg-white/45 animate-pulse [animation-delay:240ms]" />
                        </span>
                      ) : isGoogleSignup ? (
                        'Create RMS account'
                      ) : (
                        'Create account'
                      )}
                    </button>
                  </form>

                  {!isGoogleSignup && (
                    <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--wr-text-muted)]">
                      <span className="h-px flex-1 bg-[var(--wr-border-subtle)]" />
                      <span>or</span>
                      <span className="h-px flex-1 bg-[var(--wr-border-subtle)]" />
                    </div>
                  )}

                  <button
                    className={`${isGoogleSignup ? 'mt-5' : ''} flex h-12 w-full items-center justify-center gap-3 rounded-[var(--wr-radius-lg)] border border-[var(--wr-border-default)] bg-[#fefdfb] px-4 text-sm font-semibold text-[var(--wr-text-primary)] transition duration-200 ease-out hover:-translate-y-[1px] hover:border-[var(--wr-border-strong)] hover:bg-[var(--wr-bg-elevated)] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70`}
                    disabled={loading || googleLoading}
                    type="button"
                    onClick={handleGoogleSignUp}
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--wr-border-subtle)] bg-white font-semibold text-[#4285f4]">
                      G
                    </span>
                    {googleLoading
                      ? 'Connecting to Google...'
                      : isGoogleSignup
                        ? 'Google account connected'
                        : 'Continue with Google'}
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
