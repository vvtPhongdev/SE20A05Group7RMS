import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest } from '../../../lib/api';
import {
  CandidateCard,
  CandidateDashboardPage,
  CandidateInlineAlert,
  CandidateLoadingState,
} from '../components';

type Offer = {
  id: string;
  positionTitle: string;
  departmentName: string;
  compensation: string;
  startDate: string;
  content: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'DECLINED';
  response?: 'ACCEPT' | 'DECLINE' | null;
  responseNote?: string | null;
  respondedAt?: string | null;
};

export const CandidateOfferDetails: React.FC = () => {
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const offerId = searchParams.get('id');
  const [offer, setOffer] = useState<Offer | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!offerId) {
      setError('Offer id is missing');
      setLoading(false);
      return;
    }
    void apiRequest<Offer>(`/offers/${offerId}`, token)
      .then(setOffer)
      .catch((loadError) =>
        setError(loadError instanceof Error ? loadError.message : 'Unable to load offer'),
      )
      .finally(() => setLoading(false));
  }, [offerId, token]);

  const respond = async (response: 'ACCEPT' | 'DECLINE') => {
    if (!offer) return;
    setSubmitting(true);
    setError('');
    try {
      const updated = await apiRequest<Offer>(`/offers/${offer.id}/respond`, token, {
        method: 'POST',
        body: JSON.stringify({ response, note: note.trim() || undefined }),
      });
      setOffer(updated);
    } catch (responseError) {
      setError(responseError instanceof Error ? responseError.message : 'Unable to respond');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CandidateDashboardPage className="mx-auto max-w-4xl space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-command">
          Candidate offer
        </p>
        <h1 className="mt-2 text-3xl font-bold text-deep-charcoal">Offer details</h1>
      </header>
      {loading ? <CandidateLoadingState label="Loading offer..." /> : null}
      {error ? <CandidateInlineAlert>{error}</CandidateInlineAlert> : null}
      {offer ? (
        <CandidateCard className="space-y-6 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-slate-ink">Position</p>
              <p className="font-semibold">{offer.positionTitle}</p>
            </div>
            <div>
              <p className="text-xs text-slate-ink">Department</p>
              <p className="font-semibold">{offer.departmentName}</p>
            </div>
            <div>
              <p className="text-xs text-slate-ink">Compensation</p>
              <p className="font-semibold">{offer.compensation}</p>
            </div>
            <div>
              <p className="text-xs text-slate-ink">Start date</p>
              <p className="font-semibold">{new Date(offer.startDate).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="whitespace-pre-wrap rounded-lg bg-surface-container-low p-4 text-sm leading-6">
            {offer.content}
          </div>
          {offer.status === 'SENT' ? (
            <div className="space-y-3 border-t border-border-warm pt-5">
              <textarea
                className="min-h-24 w-full rounded-lg border border-border-warm p-3 text-sm"
                maxLength={2000}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Optional note to the recruitment team"
                value={note}
              />
              <div className="flex gap-3">
                <button
                  className="rounded-lg bg-teal-command px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                  disabled={submitting}
                  onClick={() => void respond('ACCEPT')}
                  type="button"
                >
                  Accept offer
                </button>
                <button
                  className="rounded-lg border border-red-300 px-5 py-2.5 text-sm font-semibold text-red-700 disabled:opacity-60"
                  disabled={submitting}
                  onClick={() => void respond('DECLINE')}
                  type="button"
                >
                  Decline
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-surface-container-low p-4 text-sm font-semibold">
              Response: {offer.status}
              {offer.respondedAt ? ` on ${new Date(offer.respondedAt).toLocaleString()}` : ''}
              {offer.responseNote ? <p className="mt-2 font-normal">{offer.responseNote}</p> : null}
            </div>
          )}
        </CandidateCard>
      ) : null}
    </CandidateDashboardPage>
  );
};
