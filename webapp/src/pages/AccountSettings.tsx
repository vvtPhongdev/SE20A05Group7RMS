import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Phone,
  Save,
  Send,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { UserRole } from '@wr/contracts';
import { useAuth, type User } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import { getErrorMessage } from '../lib/errors';
import { supabase } from '../lib/supabase';

type AccountProfile = User & {
  isActive?: boolean;
};

const roleLabels: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'System Admin',
  [UserRole.DEPARTMENT_HEAD]: 'Department Head',
  [UserRole.HR_LEADER]: 'HR',
  [UserRole.CANDIDATE]: 'Candidate',
};

const inputClassName =
  'h-11 w-full rounded-[var(--wr-radius-lg)] border border-[var(--wr-border-default)] bg-[var(--wr-bg-surface)] px-3.5 text-sm text-[var(--wr-text-primary)] outline-none transition placeholder:text-[var(--wr-text-muted)] focus:border-[var(--wr-focus-ring)] focus:ring-2 focus:ring-[var(--wr-focus-ring)]/20 disabled:cursor-not-allowed disabled:bg-[var(--wr-bg-elevated)] disabled:text-[var(--wr-text-muted)]';

export const AccountSettings: React.FC = () => {
  const { user, token, updateCurrentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const resetEmail = searchParams.get('email') || '';
  const resetToken = searchParams.get('token') || '';

  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  const [resetOpen, setResetOpen] = useState(Boolean(resetToken));
  const [resetRequested, setResetRequested] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      if (!token) return;

      setLoadingProfile(true);
      setProfileError(null);
      try {
        const currentProfile = await apiRequest<AccountProfile>('/me/profile', token);
        if (!active) return;

        setProfile(currentProfile);
        setDisplayName(currentProfile.displayName);
        setEmail(currentProfile.email);
        setPhone(currentProfile.phone || '');
      } catch (error) {
        if (active) {
          setProfileError(getErrorMessage(error, 'Unable to load your account settings.'));
        }
      } finally {
        if (active) setLoadingProfile(false);
      }
    };

    void loadProfile();
    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    if (resetToken) setResetOpen(true);
  }, [resetToken]);

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || !profile || !user) return;

    const normalizedDisplayName = displayName.trim();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedDisplayName) {
      setProfileError('Display name is required.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setProfileError('Enter a valid email address.');
      return;
    }

    setSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const supabaseSession = sessionData.session;
      const sessionMatchesProfile =
        supabaseSession?.user.email?.toLowerCase() === profile.email.toLowerCase();
      const supabaseAccessToken = sessionMatchesProfile
        ? supabaseSession?.access_token
        : undefined;

      const updatedProfile = await apiRequest<AccountProfile>('/me/profile', token, {
        method: 'PATCH',
        body: JSON.stringify({
          displayName: normalizedDisplayName,
          email: normalizedEmail,
          phone: phone.trim() || null,
          ...(supabaseAccessToken ? { supabaseAccessToken } : {}),
        }),
      });

      if (supabaseAccessToken && normalizedEmail !== profile.email.toLowerCase()) {
        await supabase.auth.refreshSession().catch(() => undefined);
      }

      setProfile(updatedProfile);
      setDisplayName(updatedProfile.displayName);
      setEmail(updatedProfile.email);
      setPhone(updatedProfile.phone || '');
      updateCurrentUser({ ...user, ...updatedProfile });
      setProfileSuccess('Account information saved successfully.');
    } catch (error) {
      setProfileError(getErrorMessage(error, 'Unable to save your account information.'));
    } finally {
      setSavingProfile(false);
    }
  };

  const requestPasswordReset = async () => {
    if (!profile) return;

    setPasswordBusy(true);
    setPasswordError(null);
    try {
      await apiRequest<{ success: boolean }>('/auth/forgot-password', token, {
        method: 'POST',
        body: JSON.stringify({
          email: profile.email,
          redirectPath: '/account-settings',
        }),
      });
      setResetOpen(true);
      setResetRequested(true);
    } catch (error) {
      setPasswordError(getErrorMessage(error, 'Unable to send the password reset email.'));
    } finally {
      setPasswordBusy(false);
    }
  };

  const closePasswordReset = () => {
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete('email');
    nextSearchParams.delete('token');
    setSearchParams(nextSearchParams, { replace: true });
    setResetOpen(false);
    setResetRequested(false);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
  };

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!profile || !resetToken) return;

    if (resetEmail.toLowerCase() !== profile.email.toLowerCase()) {
      setPasswordError('This password reset link does not belong to the signed-in account.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setPasswordBusy(true);
    setPasswordError(null);
    try {
      await apiRequest<{ success: boolean }>('/auth/reset-password', null, {
        method: 'POST',
        body: JSON.stringify({
          email: profile.email,
          code: resetToken,
          newPassword,
        }),
      });
      await logout();
      navigate('/login?passwordReset=success', { replace: true });
    } catch (error) {
      setPasswordError(getErrorMessage(error, 'Unable to reset your password.'));
      setPasswordBusy(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="flex min-h-[420px] items-center justify-center text-[var(--wr-text-secondary)]">
        <LoaderCircle className="mr-2 size-5 animate-spin" />
        Loading account settings...
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--wr-accent-primary)]">
            Personal workspace
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--wr-text-primary)]">
            Account settings
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--wr-text-secondary)]">
            Manage your contact details, sign-in email, and account password.
          </p>
        </div>
        {profile && (
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--wr-success-border)] bg-[var(--wr-success-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--wr-success-text)]">
            <ShieldCheck className="size-4" />
            {profile.isActive === false ? 'Account inactive' : 'Account active'}
          </div>
        )}
      </div>

      {profileError && (
        <div className="flex gap-3 rounded-[var(--wr-radius-lg)] border border-[var(--wr-error-border)] bg-[var(--wr-error-bg)] px-4 py-3 text-sm text-[var(--wr-error-text)]">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {profileError}
        </div>
      )}
      {profileSuccess && (
        <div className="flex gap-3 rounded-[var(--wr-radius-lg)] border border-[var(--wr-success-border)] bg-[var(--wr-success-bg)] px-4 py-3 text-sm text-[var(--wr-success-text)]">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          {profileSuccess}
        </div>
      )}

      {profile && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.8fr)]">
          <section className="rounded-[18px] border border-[var(--wr-border-default)] bg-[var(--wr-bg-surface)] p-5 shadow-[var(--wr-shadow-sm)] sm:p-6">
            <div className="mb-6 flex items-start gap-3 border-b border-[var(--wr-border-subtle)] pb-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--wr-bg-elevated)] text-[var(--wr-accent-primary)]">
                <UserRound className="size-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-[var(--wr-text-primary)]">
                  Profile information
                </h2>
                <p className="mt-1 text-sm text-[var(--wr-text-secondary)]">
                  These details identify you throughout RMS.
                </p>
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleSaveProfile}>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-[var(--wr-text-primary)]">
                  <span className="flex items-center gap-2">
                    <UserRound className="size-4 text-[var(--wr-text-muted)]" />
                    Display name
                  </span>
                  <input
                    autoComplete="name"
                    className={inputClassName}
                    maxLength={255}
                    onChange={(event) => setDisplayName(event.target.value)}
                    required
                    value={displayName}
                  />
                </label>

                <label className="space-y-2 text-sm font-medium text-[var(--wr-text-primary)]">
                  <span className="flex items-center gap-2">
                    <Mail className="size-4 text-[var(--wr-text-muted)]" />
                    Email
                  </span>
                  <input
                    autoComplete="email"
                    className={inputClassName}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    type="email"
                    value={email}
                  />
                </label>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-[var(--wr-text-primary)]">
                  <span className="flex items-center gap-2">
                    <Phone className="size-4 text-[var(--wr-text-muted)]" />
                    Phone
                  </span>
                  <input
                    autoComplete="tel"
                    className={inputClassName}
                    maxLength={20}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="Add a phone number"
                    type="tel"
                    value={phone}
                  />
                </label>

                <label className="space-y-2 text-sm font-medium text-[var(--wr-text-primary)]">
                  <span className="flex items-center gap-2">
                    <Building2 className="size-4 text-[var(--wr-text-muted)]" />
                    Department
                  </span>
                  <input
                    className={inputClassName}
                    disabled
                    value={profile.department?.name || 'Not assigned'}
                  />
                </label>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-[var(--wr-border-subtle)] pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-[var(--wr-text-muted)]">
                  Role: <span className="font-semibold">{roleLabels[profile.role]}</span>
                </p>
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--wr-radius-lg)] bg-[var(--wr-accent-primary)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--wr-accent-primary-hover)] disabled:cursor-not-allowed disabled:opacity-65"
                  disabled={savingProfile}
                  type="submit"
                >
                  {savingProfile ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  {savingProfile ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </section>

          <section className="h-fit rounded-[18px] border border-[var(--wr-border-default)] bg-[var(--wr-bg-surface)] p-5 shadow-[var(--wr-shadow-sm)] sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--wr-bg-elevated)] text-[var(--wr-accent-primary)]">
                <KeyRound className="size-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-[var(--wr-text-primary)]">Password</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--wr-text-secondary)]">
                  A secure email link verifies every password change.
                </p>
              </div>
            </div>

            {passwordError && (
              <div className="mt-5 flex gap-2 rounded-[var(--wr-radius-lg)] border border-[var(--wr-error-border)] bg-[var(--wr-error-bg)] px-3 py-3 text-sm text-[var(--wr-error-text)]">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                {passwordError}
              </div>
            )}

            {!resetOpen && (
              <button
                className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[var(--wr-radius-lg)] border border-[var(--wr-border-default)] bg-[var(--wr-bg-surface)] px-4 text-sm font-semibold text-[var(--wr-text-primary)] transition hover:border-[var(--wr-accent-primary)] hover:text-[var(--wr-accent-primary)] disabled:cursor-not-allowed disabled:opacity-65"
                disabled={passwordBusy}
                onClick={() => void requestPasswordReset()}
                type="button"
              >
                {passwordBusy ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <KeyRound className="size-4" />
                )}
                Reset password
              </button>
            )}

            {resetOpen && !resetToken && (
              <div className="mt-6 space-y-4">
                <div className="rounded-[var(--wr-radius-lg)] border border-[var(--wr-success-border)] bg-[var(--wr-success-bg)] px-4 py-3 text-sm leading-6 text-[var(--wr-success-text)]">
                  {resetRequested
                    ? `A reset link was sent to ${profile.email}. Open it within 15 minutes.`
                    : 'Request a secure password reset link for this account.'}
                </div>
                <div className="flex gap-2">
                  <button
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-[var(--wr-radius-lg)] bg-[var(--wr-accent-primary)] px-3 text-sm font-semibold text-white disabled:opacity-65"
                    disabled={passwordBusy}
                    onClick={() => void requestPasswordReset()}
                    type="button"
                  >
                    {passwordBusy ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <Send className="size-4" />
                    )}
                    Send again
                  </button>
                  <button
                    className="h-10 rounded-[var(--wr-radius-lg)] border border-[var(--wr-border-default)] px-3 text-sm font-semibold text-[var(--wr-text-secondary)]"
                    onClick={closePasswordReset}
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {resetOpen &&
              resetToken &&
              resetEmail.toLowerCase() !== profile.email.toLowerCase() && (
                <div className="mt-6 rounded-[var(--wr-radius-lg)] border border-[var(--wr-error-border)] bg-[var(--wr-error-bg)] px-3 py-3 text-sm text-[var(--wr-error-text)]">
                  <div className="flex gap-2">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    This password reset link does not belong to the signed-in account.
                  </div>
                  <button
                    className="mt-3 text-xs font-semibold underline"
                    onClick={closePasswordReset}
                    type="button"
                  >
                    Dismiss link
                  </button>
                </div>
              )}

            {resetOpen &&
              resetToken &&
              resetEmail.toLowerCase() === profile.email.toLowerCase() && (
              <form className="mt-6 space-y-4" onSubmit={handleResetPassword}>
                <div className="flex gap-2 rounded-[var(--wr-radius-lg)] border border-[var(--wr-border-default)] bg-[var(--wr-bg-elevated)] px-3 py-3 text-xs leading-5 text-[var(--wr-text-secondary)]">
                  <LockKeyhole className="mt-0.5 size-4 shrink-0 text-[var(--wr-accent-primary)]" />
                  Reset link opened for {resetEmail || profile.email}.
                </div>
                <label className="block space-y-2 text-sm font-medium text-[var(--wr-text-primary)]">
                  New password
                  <input
                    autoComplete="new-password"
                    className={inputClassName}
                    minLength={8}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="At least 8 characters"
                    required
                    type="password"
                    value={newPassword}
                  />
                </label>
                <label className="block space-y-2 text-sm font-medium text-[var(--wr-text-primary)]">
                  Confirm password
                  <input
                    autoComplete="new-password"
                    className={inputClassName}
                    minLength={8}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    type="password"
                    value={confirmPassword}
                  />
                </label>
                <button
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[var(--wr-radius-lg)] bg-[var(--wr-accent-primary)] px-4 text-sm font-semibold text-white disabled:opacity-65"
                  disabled={passwordBusy}
                  type="submit"
                >
                  {passwordBusy ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <KeyRound className="size-4" />
                  )}
                  {passwordBusy ? 'Resetting...' : 'Set new password'}
                </button>
                <button
                  className="h-10 w-full text-sm font-semibold text-[var(--wr-text-secondary)] hover:text-[var(--wr-text-primary)]"
                  onClick={closePasswordReset}
                  type="button"
                >
                  Cancel
                </button>
              </form>
              )}
          </section>
        </div>
      )}
    </div>
  );
};
