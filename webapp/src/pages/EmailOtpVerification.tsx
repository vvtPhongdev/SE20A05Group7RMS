import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const OTP_LENGTH = 6;
const INITIAL_SECONDS = 272;

const Icon = ({ name, className = 'h-5 w-5' }: { name: string; className?: string }) => {
  const paths: Record<string, React.ReactNode> = {
    hub: <path d="M12 3v6m0 6v6M5.6 7.2l5.2 3m2.4 1.4 5.2 3M18.4 7.2l-5.2 3m-2.4 1.4-5.2 3M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />,
    clock: <path d="M12 8v5l3 2m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
    lock: <path d="M8 11V8a4 4 0 0 1 8 0v3m-9 0h10v9H7v-9Z" />,
    arrowLeft: <path d="M19 12H5m6-6-6 6 6 6" />,
    check: <path d="M20 6 9 17l-5-5" />,
    help: <path d="M9.2 9a3 3 0 1 1 5.3 1.9c-1.4.9-2.5 1.7-2.5 3.1m0 3h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
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

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const EmailOtpVerification: React.FC = () => {
  const navigate = useNavigate();
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [secondsLeft, setSecondsLeft] = useState(INITIAL_SECONDS);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const otpValue = digits.join('');
  const isComplete = otpValue.length === OTP_LENGTH && digits.every(Boolean);
  const canResend = secondsLeft === 0;

  const maskedEmail = useMemo(() => {
    return 'tran.ngoc.mai@gmail.com';
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0 || verified) return;

    const timer = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [secondsLeft, verified]);

  const focusInput = (index: number) => {
    inputRefs.current[index]?.focus();
    inputRefs.current[index]?.select();
  };

  const setDigitAt = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    setError(null);
    setDigits((current) => {
      const next = [...current];
      next[index] = digit;
      return next;
    });

    if (digit && index < OTP_LENGTH - 1) {
      window.setTimeout(() => focusInput(index + 1), 0);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pastedDigits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
    if (!pastedDigits.length) return;

    setError(null);
    setDigits(Array.from({ length: OTP_LENGTH }, (_, index) => pastedDigits[index] ?? ''));
    window.setTimeout(() => focusInput(Math.min(pastedDigits.length, OTP_LENGTH) - 1), 0);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      event.preventDefault();
      focusInput(index - 1);
    }
  };

  const handleResend = () => {
    if (!canResend) return;
    setDigits(Array(OTP_LENGTH).fill(''));
    setError(null);
    setSecondsLeft(INITIAL_SECONDS);
    window.setTimeout(() => focusInput(0), 0);
  };

  const handleVerify = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!isComplete) {
      setError('Enter the 6-digit verification code from your email.');
      return;
    }

    if (secondsLeft === 0) {
      setError('This code has expired. Request a new code to continue.');
      return;
    }

    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      setVerified(true);
    }, 700);
  };

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-workflow-ivory px-5 py-8 text-deep-charcoal sm:px-8">
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-40">
        <div className="absolute right-[-8%] top-[-14%] h-[420px] w-[420px] rounded-full bg-teal-command/10 blur-[110px]" />
        <div className="absolute bottom-[-14%] left-[-8%] h-[420px] w-[420px] rounded-full bg-slate-ink/10 blur-[110px]" />
        <div className="absolute inset-0 [background-image:radial-gradient(#D6CEC4_0.5px,transparent_0.5px)] [background-size:32px_32px]" />
      </div>

      <main className="w-full max-w-[480px] overflow-hidden rounded-2xl border border-border-warm bg-clean-surface shadow-[0_8px_30px_rgba(28,25,23,0.05)]">
        <div className="h-1 w-full bg-parchment-lift">
          <div className={`h-full bg-teal-command transition-all duration-700 ${verified ? 'w-full' : isComplete ? 'w-5/6' : 'w-2/3'}`} />
        </div>

        <div className="flex flex-col items-center px-6 pb-10 pt-10 sm:px-10 sm:pt-12">
          <Link className="mb-8 flex items-center gap-2" to="/">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-command text-white shadow-sm">
              <Icon name="hub" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-teal-command">RMS</span>
          </Link>

          {verified ? (
            <div className="w-full text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--wr-success-bg)] text-[var(--wr-success-text)]">
                <Icon className="h-8 w-8" name="check" />
              </div>
              <h1 className="mb-3 text-2xl font-bold tracking-tight text-deep-charcoal">Email verified</h1>
              <p className="mx-auto max-w-sm text-sm leading-6 text-slate-ink">
                Your email address has been confirmed. Continue to sign in or return to your account setup flow.
              </p>
              <button
                className="mt-8 flex h-12 w-full items-center justify-center rounded-xl bg-teal-command px-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-[#00685f] active:translate-y-0 active:scale-[0.98]"
                onClick={() => navigate('/login')}
                type="button"
              >
                Continue to sign in
              </button>
            </div>
          ) : (
            <>
              <div className="mb-9 text-center">
                <h1 className="mb-3 text-2xl font-bold tracking-tight text-deep-charcoal">Verify your email</h1>
                <p className="text-base leading-7 text-slate-ink">
                  We sent a 6-digit code to <span className="font-semibold text-teal-command">{maskedEmail}</span>
                </p>
              </div>

              {error && (
                <div className="mb-5 w-full rounded-[var(--wr-radius-lg)] border border-[var(--wr-error-border)] bg-[var(--wr-error-bg)] px-4 py-3 text-sm font-medium text-[var(--wr-error-text)]">
                  {error}
                </div>
              )}

              <form className="w-full" onSubmit={handleVerify}>
                <fieldset className="mb-6">
                  <legend className="sr-only">Verification code</legend>
                  <div className="grid grid-cols-6 gap-2 sm:gap-3">
                    {digits.map((digit, index) => (
                      <input
                        aria-label={`Digit ${index + 1}`}
                        autoComplete={index === 0 ? 'one-time-code' : 'off'}
                        className={`h-14 min-w-0 rounded-lg border-2 bg-clean-surface text-center font-mono text-[26px] font-medium text-deep-charcoal shadow-sm outline-none transition focus:border-teal-command focus:ring-4 focus:ring-teal-command/10 ${
                          digit ? 'border-deep-charcoal bg-workflow-ivory' : 'border-border-warm'
                        }`}
                        inputMode="numeric"
                        key={index}
                        maxLength={1}
                        ref={(element) => {
                          inputRefs.current[index] = element;
                        }}
                        type="text"
                        value={digit}
                        onChange={(event) => setDigitAt(index, event.target.value)}
                        onKeyDown={(event) => handleKeyDown(event, index)}
                        onPaste={handlePaste}
                      />
                    ))}
                  </div>
                </fieldset>

                <div className="mb-8 flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2 text-slate-ink">
                    <Icon className="h-4 w-4" name="clock" />
                    <span className="font-mono text-sm">
                      Code expires in{' '}
                      <span className={`font-semibold ${secondsLeft === 0 ? 'text-[var(--wr-error)]' : 'text-deep-charcoal'}`}>
                        {formatTime(secondsLeft)}
                      </span>
                    </span>
                  </div>
                  <button
                    className={`text-sm transition ${
                      canResend
                        ? 'font-semibold text-teal-command hover:underline active:scale-[0.98]'
                        : 'cursor-not-allowed text-slate-ink/50'
                    }`}
                    disabled={!canResend}
                    type="button"
                    onClick={handleResend}
                  >
                    Did not receive a code? <span className="font-semibold text-teal-command">Resend code</span>
                  </button>
                </div>

                <button
                  className="flex h-12 w-full items-center justify-center rounded-xl bg-teal-command px-4 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-[1px] hover:bg-[#00685f] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
                  disabled={!isComplete || loading}
                  type="submit"
                >
                  {loading ? (
                    <span className="flex w-28 items-center justify-center gap-1.5" aria-label="Verifying email">
                      <span className="h-1.5 w-6 rounded-full bg-white/45 animate-pulse" />
                      <span className="h-1.5 w-10 rounded-full bg-white/70 animate-pulse [animation-delay:120ms]" />
                      <span className="h-1.5 w-4 rounded-full bg-white/45 animate-pulse [animation-delay:240ms]" />
                    </span>
                  ) : (
                    'Verify email'
                  )}
                </button>
              </form>

              <div className="mt-8 flex w-full flex-col items-center gap-4 border-t border-border-warm pt-8">
                <Link className="flex items-center gap-1 text-sm font-medium text-teal-command hover:underline" to="/signup">
                  <Icon className="h-4 w-4" name="arrowLeft" />
                  Wrong email? Go back
                </Link>
                <p className="flex items-center gap-1.5 text-xs text-slate-ink">
                  <Icon className="h-4 w-4" name="help" />
                  Having trouble?{' '}
                  <a className="font-semibold text-teal-command hover:underline" href="mailto:support@rms.local">
                    Contact support
                  </a>
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 border-t border-border-warm bg-parchment-lift px-6 py-4">
          <Icon className="h-4 w-4 text-slate-ink" name="lock" />
          <span className="text-xs font-medium text-slate-ink">This code is valid for 10 minutes</span>
        </div>
      </main>
    </div>
  );
};
