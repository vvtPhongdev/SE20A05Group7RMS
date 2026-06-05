import React, { useState } from 'react';

export const CandidateDashboard: React.FC = () => {
  const [cvFile, setCvFile] = useState<string | null>(null);

  const handleUploadFake = (e: React.FormEvent) => {
    e.preventDefault();
    setCvFile('resume_john_doe_senior_backend.pdf');
  };

  return (
    <div className="flex flex-col">
      <h1 className="text-[var(--wr-text-2xl)] font-[var(--wr-font-bold)] text-[var(--wr-text-primary)] mt-0 mb-2">
        Candidate Portal
      </h1>
      <p className="text-[var(--wr-text-base)] text-[var(--wr-text-secondary)] mt-0 mb-8">
        Manage your application documents, view profiles, and respond to interview invites.
      </p>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-8">
        {/* Profile Card & Upload */}
        <div className="flex flex-col gap-4">
          <h2 className="text-[var(--wr-text-lg)] font-[var(--wr-font-semibold)] text-[var(--wr-text-primary)] mt-0 mb-1 border-b border-[var(--wr-border-subtle)] pb-2">
            Document Center
          </h2>
          <div className="bg-[var(--wr-bg-surface)] border border-[var(--wr-border-default)] rounded-[var(--wr-radius-lg)] p-6 shadow-[var(--wr-shadow-sm)] flex flex-col gap-5">
            <div className="flex justify-between items-center">
              <span className="font-[var(--wr-font-semibold)] text-[var(--wr-text-sm)] text-[var(--wr-text-primary)]">
                Current Resume Doc
              </span>
              {cvFile ? (
                <span className="text-[10px] font-[var(--wr-font-bold)] py-0.5 px-2 rounded-full text-[var(--wr-success-text)] bg-[var(--wr-success-bg)] border border-[var(--wr-success-border)]">
                  UPLOADED
                </span>
              ) : (
                <span className="text-[10px] font-[var(--wr-font-bold)] py-0.5 px-2 rounded-full text-[var(--wr-error-text)] bg-[var(--wr-error-bg)] border border-[var(--wr-error-border)]">
                  MISSING
                </span>
              )}
            </div>

            {cvFile ? (
              <div className="flex items-center gap-3 bg-[var(--wr-bg-elevated)] py-3 px-4 rounded-[var(--wr-radius-md)]">
                <span className="text-2xl">📄</span>
                <div className="flex flex-col">
                  <div className="text-[var(--wr-text-sm)] font-[var(--wr-font-semibold)] text-[var(--wr-text-primary)]">
                    {cvFile}
                  </div>
                  <div className="text-[var(--wr-text-xs)] text-[var(--wr-text-muted)]">PDF Format (142 KB)</div>
                </div>
              </div>
            ) : (
              <p className="text-[var(--wr-text-sm)] text-[var(--wr-text-secondary)] leading-[var(--wr-leading-normal)] m-0">
                You have not uploaded any CV files yet. Please upload one to be considered for active campaigns.
              </p>
            )}

            <form onSubmit={handleUploadFake} className="w-full">
              <button
                type="submit"
                className="w-full p-2.5 bg-white border border-[var(--wr-border-strong)] rounded-[var(--wr-radius-md)] text-[var(--wr-text-primary)] font-[var(--wr-font-semibold)] text-[var(--wr-text-sm)] cursor-pointer transition-all hover:bg-[var(--wr-bg-elevated)]"
              >
                {cvFile ? 'Re-upload CV Document' : 'Upload CV Document (PDF/DOCX)'}
              </button>
            </form>
          </div>

          <h2 className="text-[var(--wr-text-lg)] font-[var(--wr-font-semibold)] text-[var(--wr-text-primary)] mt-0 mb-1 border-b border-[var(--wr-border-subtle)] pb-2">
            Application Status
          </h2>
          <div className="bg-[var(--wr-bg-surface)] border border-[var(--wr-border-default)] rounded-[var(--wr-radius-lg)] p-6 shadow-[var(--wr-shadow-sm)] flex flex-col gap-5">
            <div className="flex justify-between text-[var(--wr-text-sm)]">
              <div className="text-[var(--wr-text-secondary)]">Profile Data:</div>
              <div className="font-[var(--wr-font-semibold)] text-[var(--wr-text-primary)]">Completed (90%)</div>
            </div>
            <div className="flex justify-between text-[var(--wr-text-sm)]">
              <div className="text-[var(--wr-text-secondary)]">Active Screenings:</div>
              <div className="font-[var(--wr-font-semibold)] text-[var(--wr-text-primary)]">1 Review Campaign</div>
            </div>
            <div className="flex justify-between text-[var(--wr-text-sm)]">
              <div className="text-[var(--wr-text-secondary)]">Evaluation Outcome:</div>
              <div className="font-[var(--wr-font-semibold)] text-[var(--wr-text-primary)]">
                Pending overall plan approval
              </div>
            </div>
          </div>
        </div>

        {/* Interviews & Invites */}
        <div className="flex flex-col gap-4">
          <h2 className="text-[var(--wr-text-lg)] font-[var(--wr-font-semibold)] text-[var(--wr-text-primary)] mt-0 mb-1 border-b border-[var(--wr-border-subtle)] pb-2">
            My Scheduled Interviews
          </h2>
          <div className="bg-[var(--wr-bg-surface)] border border-[var(--wr-border-default)] rounded-[var(--wr-radius-lg)] p-6 shadow-[var(--wr-shadow-sm)] flex flex-col gap-5">
            <div className="border-b border-[var(--wr-border-subtle)] pb-5 flex flex-col gap-2">
              <div className="flex justify-between items-start gap-3">
                <span className="text-[var(--wr-text-sm)] font-[var(--wr-font-semibold)] text-[var(--wr-text-primary)] leading-[var(--wr-leading-tight)]">
                  Technical Interview — Golang API Development
                </span>
                <span className="text-[10px] font-[var(--wr-font-bold)] py-0.5 px-2 rounded-full text-[var(--wr-accent-primary-text)] bg-[var(--wr-accent-primary)] border-none whitespace-nowrap">
                  SCHEDULED
                </span>
              </div>
              <div className="flex gap-4 text-[var(--wr-text-xs)] text-[var(--wr-text-secondary)]">
                <span>📅 05 June 2026 at 10:00 AM</span>
                <span>⏱ 45 minutes</span>
              </div>
              <div className="text-[var(--wr-text-xs)] text-[var(--wr-text-secondary)]">
                <span>📍 Online Meet: </span>
                <a
                  href="https://meet.google.com/abc-defg-hij"
                  className="text-[var(--wr-accent-primary)] no-underline font-[var(--wr-font-medium)] hover:underline"
                >
                  meet.google.com/abc-defg-hij
                </a>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-start gap-3">
                <span className="text-[var(--wr-text-sm)] font-[var(--wr-font-semibold)] text-[var(--wr-text-primary)] leading-[var(--wr-leading-tight)]">
                  Recruiter Screen & Culture Fit
                </span>
                <span className="text-[10px] font-[var(--wr-font-bold)] py-0.5 px-2 rounded-full text-[var(--wr-neutral-text)] bg-[var(--wr-neutral-bg)] border border-[var(--wr-neutral-border)] whitespace-nowrap">
                  COMPLETED
                </span>
              </div>
              <div className="flex gap-4 text-[var(--wr-text-xs)] text-[var(--wr-text-secondary)]">
                <span>📅 28 May 2026 at 02:00 PM</span>
                <span>⏱ 30 minutes</span>
              </div>
              <div className="text-[var(--wr-text-xs)] text-[var(--wr-text-secondary)]">
                <span>📍 Online Call: </span>
                <span className="text-[var(--wr-text-muted)]">Google Meet session ended</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
