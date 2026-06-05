import React from 'react';
import { useNavigate } from 'react-router-dom';

export const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex justify-center items-center min-h-screen bg-[var(--wr-bg-page)] p-4 box-border">
      <div className="bg-[var(--wr-bg-surface)] border border-[var(--wr-border-default)] rounded-[var(--wr-radius-xl)] shadow-[var(--wr-shadow-lg)] w-full max-w-[460px] py-12 px-10 text-center box-border">
        <div className="text-6xl mb-6">🚫</div>
        <h1 className="text-2xl font-bold text-[var(--wr-error)] mt-0 mb-4">Access Denied</h1>
        <p className="text-base text-[var(--wr-text-secondary)] leading-normal mt-0 mb-8">
          You do not have the necessary permission rules to view this resource. 
          Please contact your administrator if you believe this is an error.
        </p>
        <button
          onClick={() => navigate('/')}
          className="py-3 px-6 rounded-[var(--wr-radius-md)] border-none bg-[var(--wr-accent-primary)] text-[var(--wr-accent-primary-text)] text-base font-semibold cursor-pointer transition-colors duration-200 hover:bg-[var(--wr-accent-primary-hover)] active:bg-[var(--wr-accent-primary-active)]"
        >
          Go to Home Dashboard
        </button>
      </div>
    </div>
  );
};
