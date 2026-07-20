import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest } from '../../../lib/api';
import {
  CandidateCard,
  CandidateDashboardPage,
  CandidateInlineAlert,
  CandidateLoadingState,
  CandidatePageHeader,
} from '../components';

type OfferStatus = 'SENT' | 'ACCEPTED' | 'DECLINED';

type Offer = {
  id: string;
  positionTitle: string;
  departmentName: string;
  compensation: string;
  startDate: string;
  status: OfferStatus;
  sentAt?: string | null;
  respondedAt?: string | null;
};

const offerStatusClass: Record<OfferStatus, string> = {
  SENT: 'bg-teal-command/10 text-teal-command',
  ACCEPTED: 'bg-approved/10 text-approved',
  DECLINED: 'bg-red-50 text-red-700',
};

const offerStatusLabel: Record<OfferStatus, string> = {
  SENT: 'Awaiting your response',
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
};

const formatOfferDate = (value: string) =>
  new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  });

export const CandidateOffers: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void apiRequest<Offer[]>('/offers/me', token)
      .then(setOffers)
      .catch((loadError) =>
        setError(loadError instanceof Error ? loadError.message : 'Unable to load offers'),
      )
      .finally(() => setLoading(false));
  }, [token]);

  const pendingCount = useMemo(
    () => offers.filter((offer) => offer.status === 'SENT').length,
    [offers],
  );

  return (
    <CandidateDashboardPage className="mx-auto max-w-5xl space-y-6">
      <CandidatePageHeader
        title="My Offers"
        description="Review every offer sent to you and respond to offers awaiting your decision."
      />

      {loading ? <CandidateLoadingState label="Loading offers..." /> : null}
      {error ? <CandidateInlineAlert>{error}</CandidateInlineAlert> : null}

      {!loading && !error ? (
        <section className="rounded-lg border border-teal-command/20 bg-teal-command/5 p-4 text-sm text-slate-ink">
          <span className="font-bold text-teal-command">{pendingCount}</span> offer
          {pendingCount === 1 ? '' : 's'} awaiting your response.
        </section>
      ) : null}

      {!loading && !error && offers.length === 0 ? (
        <CandidateCard className="p-8 text-center">
          <p className="font-semibold text-deep-charcoal">No offers yet</p>
          <p className="mt-1 text-sm text-slate-ink">
            Offers sent by the recruitment team will appear here.
          </p>
        </CandidateCard>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        {offers.map((offer) => (
          <CandidateCard className="flex flex-col gap-5 p-5" key={offer.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-bold text-deep-charcoal">{offer.positionTitle}</p>
                <p className="mt-1 text-sm text-slate-ink">{offer.departmentName}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-bold ${offerStatusClass[offer.status]}`}
              >
                {offerStatusLabel[offer.status]}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-ink">Compensation</p>
                <p className="mt-1 font-semibold text-deep-charcoal">{offer.compensation}</p>
              </div>
              <div>
                <p className="text-xs text-slate-ink">Start date</p>
                <p className="mt-1 font-semibold text-deep-charcoal">
                  {formatOfferDate(offer.startDate)}
                </p>
              </div>
            </div>
            <button
              className="mt-auto rounded-lg bg-teal-command px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary"
              onClick={() => navigate(`/candidate/offer/${offer.id}`)}
              type="button"
            >
              {offer.status === 'SENT' ? 'Review offer' : 'View offer'}
            </button>
          </CandidateCard>
        ))}
      </section>
    </CandidateDashboardPage>
  );
};
