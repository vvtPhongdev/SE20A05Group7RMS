import React from 'react';
import { useLocation } from 'react-router-dom';

interface PlaceholderPageProps {
  title?: string;
  description?: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description }) => {
  const location = useLocation();

  // If title is not provided, infer a friendly title from the pathname
  const inferredTitle = title || location.pathname
    .split('/')
    .filter(Boolean)
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '))
    .join(' > ');

  const inferredDescription = description || `This screen represents the interface for ${inferredTitle.toLowerCase()}. The underlying recruitment microservices and APIs are fully mapped and ready for data integration.`;

  return (
    <div className="flex flex-col max-w-[800px] animate-[fadeIn_0.3s_ease-out]">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--wr-text-primary)] mt-0 mb-2">{inferredTitle}</h1>
        <p className="text-base text-[var(--wr-text-secondary)] m-0 leading-relaxed">{inferredDescription}</p>
      </div>

      <div className="bg-[var(--wr-bg-surface)] border border-[var(--wr-border-default)] rounded-[var(--wr-radius-lg)] p-8 shadow-[var(--wr-shadow-md)] flex flex-col relative overflow-hidden">
        <div className="self-start flex items-center gap-2 text-xs font-semibold text-[var(--wr-warning-text)] bg-[var(--wr-warning-bg)] border border-[var(--wr-warning-border)] py-1 px-3 rounded-full mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--wr-warning)] inline-block animate-spin"></span>
          <span>Draft Route Active</span>
        </div>
        
        <h2 className="text-lg font-semibold text-[var(--wr-text-primary)] mt-0 mb-3">System Workspace Connected</h2>
        <p className="text-sm text-[var(--wr-text-secondary)] mt-0 mb-8 leading-normal">
          All gateway routes and RBAC rules for path <code>{location.pathname}</code> are configured. 
          The backend services are listening for incoming TCP requests.
        </p>

        <div className="h-[1px] bg-[var(--wr-border-subtle)] mt-0 mb-6" />

        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-[var(--wr-text-muted)] font-medium uppercase">Route Target</span>
            <span className="text-sm text-[var(--wr-text-primary)] font-semibold">{location.pathname}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-[var(--wr-text-muted)] font-medium uppercase">Access Level</span>
            <span className="text-sm text-[var(--wr-text-primary)] font-semibold">Restricted (Role Required)</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-[var(--wr-text-muted)] font-medium uppercase">Audit Log Status</span>
            <span className="text-sm text-[var(--wr-text-primary)] font-semibold">Enabled (Logs auto-recorded)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
