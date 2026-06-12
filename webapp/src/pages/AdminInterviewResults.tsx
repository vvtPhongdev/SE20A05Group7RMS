import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';

type DecisionStatus =
  | 'Awaiting Decision'
  | 'Approved'
  | 'Rejected'
  | 'Request Info'
  | 'Decision Made';

interface PanelistFeedback {
  name: string;
  role: string;
  status: 'PASS' | 'FAIL' | 'PENDING';
  ratings?: {
    tech: number;
    comm: number;
    fit: number;
  };
  comment: string;
}

interface CandidateResult {
  id: string;
  candidateId: string;
  name: string;
  role: string;
  department: string;
  interviewDate: string;
  requestId: string;
  status: DecisionStatus;
  photoUrl: string;
  passCount: number;
  failCount: number;
  pendingCount: number;
  feedbacks: PanelistFeedback[];
  scores: {
    tech: number;
    comm: number;
    fit: number;
  };
  recommendation: 'Hire' | 'Reject' | 'More Info';
  assessmentSummary: string;
}

/*
 * Mock interview results retained for UI reference only.
const initialCandidates: CandidateResult[] = [
  {
    id: 'c1',
    candidateId: 'c1',
    name: 'Nguyen Van A',
    role: 'Senior Backend Developer',
    department: 'IT Department',
    interviewDate: 'May 28, 2026',
    requestId: '#RR-042',
    status: 'Awaiting Decision',
    photoUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBC8L-4Ejb-mG_TsVkES7LKKEAtcXSmyoxeL5-5uQ7wyjMwhLWYYPVu_fxOpo3pRnlUhK13VrsASCrs71WdUopnDQiQK8Ur6NQ2TLZTq3lCvWcU6gnQEhvjPAwk0aDiX-QtTCL6VzrH2OhlZAVq0GJfYDQYz5dZLhBmmzmgvCKoRDFpe0YpgxVxLFrNUpn_VyQzsqDMlhdlWEAWYtUPBEpc00ic_tf2pBYQUO1rW7gxWa9TtmgMFKUxfz9COCXbxxLobLutxhcTaxI',
    passCount: 2,
    failCount: 1,
    pendingCount: 0,
    scores: { tech: 7.6, comm: 7.0, fit: 8.0 },
    recommendation: 'Hire',
    assessmentSummary:
      'Candidate demonstrates top-tier backend proficiency and aligns with core values. Minority failure on cloud specifics is addressable via onboarding. Overall sentiment from panel is high-conviction.',
    feedbacks: [
      {
        name: 'Sarah Miller',
        role: 'Technical Recruiter',
        status: 'PASS',
        ratings: { tech: 8, comm: 7, fit: 9 },
        comment: 'Strong technical fundamentals, very good cultural alignment.',
      },
      {
        name: 'David Park',
        role: 'Hiring Manager',
        status: 'PASS',
        ratings: { tech: 9, comm: 8, fit: 8 },
        comment: 'Excellent problem solver, depth in backend architecture is impressive.',
      },
      {
        name: 'Elena Rodriguez',
        role: 'Senior Developer',
        status: 'FAIL',
        ratings: { tech: 6, comm: 6, fit: 7 },
        comment: 'Felt some gaps in cloud infrastructure knowledge, but strong overall developer.',
      },
    ],
  },
  {
    id: 'c2',
    candidateId: 'c2',
    name: 'Tran Thi B',
    role: 'Marketing Lead',
    department: 'Marketing Department',
    interviewDate: 'May 27, 2026',
    requestId: '#RR-039',
    status: 'Awaiting Decision',
    photoUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBuXLKq_TwnRe7fkio29zX9u4qKBVj3ob2hkRC30mR9ekFlh8ZFcyVW-D32BZoyl753H35x2GdMbMum6cE1NxFNQ0vscAs5GyiU_lN8hgJdj08BQHcveN9net_AZhq6OPFCnbdHeeYNmmk_srla8KuCQkiR_dssvKpHFQqCqgRmg1uOOz4FrwxQqQIAWfh_5kZ0OkS0WRSI7_TlDUBXPCHXYLfud_G9jmLhHueW_yd8bkVOc1DFSh5XgGt6nCJsro5uBm0FGx65tgU',
    passCount: 3,
    failCount: 0,
    pendingCount: 0,
    scores: { tech: 8.5, comm: 9.0, fit: 9.0 },
    recommendation: 'Hire',
    assessmentSummary:
      'Outstanding candidate with high marks in leadership and communication. A solid addition to the marketing leadership team.',
    feedbacks: [
      {
        name: 'Sarah Miller',
        role: 'Technical Recruiter',
        status: 'PASS',
        ratings: { tech: 8, comm: 9, fit: 9 },
        comment: 'Superb communication skills, clear vision for marketing strategy.',
      },
      {
        name: 'David Park',
        role: 'Hiring Manager',
        status: 'PASS',
        ratings: { tech: 9, comm: 9, fit: 9 },
        comment: 'Excellent leadership profile. Confident in driving growth campaigns.',
      },
    ],
  },
  {
    id: 'c3',
    candidateId: 'c3',
    name: 'Le Van C',
    role: 'UX Designer',
    department: 'Design Department',
    interviewDate: 'May 26, 2026',
    requestId: '#RR-035',
    status: 'Decision Made',
    photoUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBC8L-4Ejb-mG_TsVkES7LKKEAtcXSmyoxeL5-5uQ7wyjMwhLWYYPVu_fxOpo3pRnlUhK13VrsASCrs71WdUopnDQiQK8Ur6NQ2TLZTq3lCvWcU6gnQEhvjPAwk0aDiX-QtTCL6VzrH2OhlZAVq0GJfYDQYz5dZLhBmmzmgvCKoRDFpe0YpgxVxLFrNUpn_VyQzsqDMlhdlWEAWYtUPBEpc00ic_tf2pBYQUO1rW7gxWa9TtmgMFKUxfz9COCXbxxLobLutxhcTaxI',
    passCount: 1,
    failCount: 2,
    pendingCount: 0,
    scores: { tech: 6.0, comm: 6.3, fit: 7.3 },
    recommendation: 'Reject',
    assessmentSummary:
      'Candidate does not meet the technical seniority threshold for this opening. Panel recommends rejecting or considering for a mid-level role in the future.',
    feedbacks: [
      {
        name: 'Elena Rodriguez',
        role: 'Senior Developer',
        status: 'FAIL',
        ratings: { tech: 5, comm: 6, fit: 7 },
        comment: 'Gaps in product thinking and design execution details.',
      },
      {
        name: 'Sarah Miller',
        role: 'Technical Recruiter',
        status: 'PASS',
        ratings: { tech: 7, comm: 7, fit: 8 },
        comment: 'Friendly candidate with nice visual style, but lacks senior experience.',
      },
      {
        name: 'David Park',
        role: 'Hiring Manager',
        status: 'FAIL',
        ratings: { tech: 6, comm: 6, fit: 7 },
        comment: 'Portfolio lacks depth in research synthesis.',
      },
    ],
  },
  {
    id: 'c4',
    candidateId: 'c4',
    name: 'Michael Chang',
    role: 'DevOps Engineer',
    department: 'IT Department',
    interviewDate: 'May 25, 2026',
    requestId: '#RR-040',
    status: 'Awaiting Decision',
    photoUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBC8L-4Ejb-mG_TsVkES7LKKEAtcXSmyoxeL5-5uQ7wyjMwhLWYYPVu_fxOpo3pRnlUhK13VrsASCrs71WdUopnDQiQK8Ur6NQ2TLZTq3lCvWcU6gnQEhvjPAwk0aDiX-QtTCL6VzrH2OhlZAVq0GJfYDQYz5dZLhBmmzmgvCKoRDFpe0YpgxVxLFrNUpn_VyQzsqDMlhdlWEAWYtUPBEpc00ic_tf2pBYQUO1rW7gxWa9TtmgMFKUxfz9COCXbxxLobLutxhcTaxI',
    passCount: 2,
    failCount: 0,
    pendingCount: 1,
    scores: { tech: 8.0, comm: 7.5, fit: 8.0 },
    recommendation: 'Hire',
    assessmentSummary:
      'Strong DevOps fundamentals. Recommend hire pending the final reference checks.',
    feedbacks: [
      {
        name: 'Elena Rodriguez',
        role: 'Senior Developer',
        status: 'PASS',
        ratings: { tech: 8, comm: 7, fit: 8 },
        comment: 'Solid containerization and CI/CD script writing skills.',
      },
      {
        name: 'Marcus Johnson',
        role: 'Hiring Manager',
        status: 'PASS',
        ratings: { tech: 8, comm: 8, fit: 8 },
        comment: 'Pragmatic developer, ready to optimize deployment latency.',
      },
      {
        name: 'Sarah Miller',
        role: 'Technical Recruiter',
        status: 'PENDING',
        comment: 'Interview scheduled for reference verification.',
      },
    ],
  },
  {
    id: 'c5',
    candidateId: 'c5',
    name: 'Sophia Williams',
    role: 'Product Manager',
    department: 'IT Department',
    interviewDate: 'May 25, 2026',
    requestId: '#RR-041',
    status: 'Awaiting Decision',
    photoUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBuXLKq_TwnRe7fkio29zX9u4qKBVj3ob2hkRC30mR9ekFlh8ZFcyVW-D32BZoyl753H35x2GdMbMum6cE1NxFNQ0vscAs5GyiU_lN8hgJdj08BQHcveN9net_AZhq6OPFCnbdHeeYNmmk_srla8KuCQkiR_dssvKpHFQqCqgRmg1uOOz4FrwxQqQIAWfh_5kZ0OkS0WRSI7_TlDUBXPCHXYLfud_G9jmLhHueW_yd8bkVOc1DFSh5XgGt6nCJsro5uBm0FGx65tgU',
    passCount: 2,
    failCount: 0,
    pendingCount: 0,
    scores: { tech: 8.5, comm: 9.0, fit: 8.5 },
    recommendation: 'Hire',
    assessmentSummary:
      'Exceptional candidate. Strong user empathy and execution focus. High-conviction PASS from the interview panel.',
    feedbacks: [
      {
        name: 'Sarah Miller',
        role: 'Technical Recruiter',
        status: 'PASS',
        ratings: { tech: 8, comm: 9, fit: 9 },
        comment: 'High alignment with user centric product frameworks.',
      },
      {
        name: 'David Park',
        role: 'Hiring Manager',
        status: 'PASS',
        ratings: { tech: 9, comm: 9, fit: 8 },
        comment: 'Great roadmap strategic vision and backlog grooming clarity.',
      },
    ],
  },
  {
    id: 'c6',
    candidateId: 'c6',
    name: 'James Peterson',
    role: 'QA Automation',
    department: 'IT Department',
    interviewDate: 'May 24, 2026',
    requestId: '#RR-037',
    status: 'Awaiting Decision',
    photoUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBC8L-4Ejb-mG_TsVkES7LKKEAtcXSmyoxeL5-5uQ7wyjMwhLWYYPVu_fxOpo3pRnlUhK13VrsASCrs71WdUopnDQiQK8Ur6NQ2TLZTq3lCvWcU6gnQEhvjPAwk0aDiX-QtTCL6VzrH2OhlZAVq0GJfYDQYz5dZLhBmmzmgvCKoRDFpe0YpgxVxLFrNUpn_VyQzsqDMlhdlWEAWYtUPBEpc00ic_tf2pBYQUO1rW7gxWa9TtmgMFKUxfz9COCXbxxLobLutxhcTaxI',
    passCount: 0,
    failCount: 1,
    pendingCount: 2,
    scores: { tech: 5.0, comm: 6.0, fit: 6.0 },
    recommendation: 'Reject',
    assessmentSummary:
      'QA automation scripting skills do not meet the minimum proficiency requirement. Limited experience in script execution.',
    feedbacks: [
      {
        name: 'Elena Rodriguez',
        role: 'Senior Developer',
        status: 'FAIL',
        ratings: { tech: 5, comm: 6, fit: 6 },
        comment: 'Limited scripting experience in Playwright or Cypress.',
      },
      {
        name: 'Sarah Miller',
        role: 'Technical Recruiter',
        status: 'PENDING',
        comment: 'Scheduled final follow up panel.',
      },
      {
        name: 'David Park',
        role: 'Hiring Manager',
        status: 'PENDING',
        comment: 'Reviewing homework assignment submission.',
      },
    ],
  },
];
*/

type FilterType = 'All Pending Decisions' | 'All Decisions' | 'Decision Made';

interface InterviewResultApi {
  id: string;
  candidate: string;
  candidateId: string;
  role: string;
  department: string;
  interviewDate: string;
  requestId: string;
  decisionStatus: DecisionStatus;
  feedbacks: PanelistFeedback[];
  passCount: number;
  failCount: number;
  pendingCount: number;
  scores: CandidateResult['scores'];
  finalRecommendation: string;
  summaryNotes: string;
}

const emptyCandidate: CandidateResult = {
  id: '',
  candidateId: '',
  name: 'No interview selected',
  role: '',
  department: '',
  interviewDate: '',
  requestId: '',
  status: 'Awaiting Decision',
  photoUrl: '',
  passCount: 0,
  failCount: 0,
  pendingCount: 0,
  feedbacks: [],
  scores: { tech: 0, comm: 0, fit: 0 },
  recommendation: 'More Info',
  assessmentSummary: 'No completed interview results are available.',
};

export const AdminInterviewResults: React.FC = () => {
  const { token } = useAuth();
  const [candidates, setCandidates] = useState<CandidateResult[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [filterType, setFilterType] = useState<FilterType>('All Pending Decisions');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadResults = async () => {
      setLoading(true);
      setApiError('');
      try {
        const response = await apiRequest<InterviewResultApi[]>('/interviews/completed', token);
        if (cancelled) return;
        const mapped = response.map((result) => ({
          id: result.id,
          name: result.candidate,
          role: result.role,
          department: result.department,
          interviewDate: new Date(result.interviewDate).toLocaleDateString(),
          requestId: result.requestId,
          status: result.decisionStatus,
          photoUrl: '',
          passCount: result.passCount,
          failCount: result.failCount,
          pendingCount: result.pendingCount,
          feedbacks: result.feedbacks,
          scores: result.scores,
          recommendation: result.finalRecommendation.toLowerCase().includes('hire')
            ? ('Hire' as const)
            : result.finalRecommendation.toLowerCase().includes('reject')
              ? ('Reject' as const)
              : ('More Info' as const),
          assessmentSummary:
            result.summaryNotes || 'The interview panel has not provided an overall summary.',
          candidateId: result.candidateId,
        }));
        setCandidates(mapped);
        setSelectedId((current) =>
          mapped.some((candidate) => candidate.id === current) ? current : mapped[0]?.id || '',
        );
      } catch (error) {
        if (!cancelled) {
          setApiError(error instanceof Error ? error.message : 'Unable to load interview results');
          setCandidates([]);
          setSelectedId('');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadResults();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Active candidate object
  const activeCandidate = useMemo(() => {
    return candidates.find((c) => c.id === selectedId) || candidates[0] || emptyCandidate;
  }, [candidates, selectedId]);

  // Filter queue items
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      if (filterType === 'All Pending Decisions') {
        return c.status === 'Awaiting Decision';
      }
      if (filterType === 'Decision Made') {
        return (
          c.status === 'Decision Made' ||
          c.status === 'Approved' ||
          c.status === 'Rejected' ||
          c.status === 'Request Info'
        );
      }
      return true; // 'All Decisions'
    });
  }, [candidates, filterType]);

  const pendingCount = useMemo(() => {
    return candidates.filter((c) => c.status === 'Awaiting Decision').length;
  }, [candidates]);

  // Make decision action
  const handleDecision = async (id: string, action: 'Approved' | 'Rejected' | 'Request Info') => {
    const candidate = candidates.find((item) => item.id === id);
    if (!candidate) return;
    const notes = window.prompt(
      action === 'Request Info'
        ? 'Describe the additional information required:'
        : 'Enter decision notes:',
    );
    if (!notes?.trim()) return;

    setSubmitting(true);
    setApiError('');
    try {
      if (action === 'Request Info') {
        await apiRequest(`/hiring-decisions/${candidate.requestId}/request-info`, token, {
          method: 'POST',
          body: JSON.stringify({
            candidateId: candidate.candidateId,
            notes: notes.trim(),
          }),
        });
      } else {
        await apiRequest(`/hiring-decisions/${candidate.requestId}`, token, {
          method: 'POST',
          body: JSON.stringify({
            decision: action === 'Approved' ? 'HIRE' : 'REJECT',
            notes: notes.trim(),
          }),
        });
      }
      setCandidates((prev) =>
        prev.map((item) =>
          action === 'Request Info'
            ? item.id === id
              ? { ...item, status: 'Request Info' }
              : item
            : item.requestId === candidate.requestId
              ? { ...item, status: action }
              : item,
        ),
      );
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Unable to save the hiring decision');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] overflow-hidden select-none bg-workflow-ivory gap-6">
      {/* Header Section */}
      <div className="flex justify-between items-end bg-workflow-ivory shrink-0 border-b border-border-warm/30 pb-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-deep-charcoal font-bold">
            Interview Results Review
          </h2>
          <p className="font-body-md text-slate-ink mt-1">
            Review panel feedback and make hiring decisions
          </p>
        </div>

        {/* Filter Selector Button */}
        <div className="relative">
          <button
            className="bg-clean-surface border border-border-warm px-4 py-2 rounded-lg flex items-center gap-2 text-label-md shadow-sm hover:bg-parchment-lift transition-colors font-semibold text-sm outline-none"
            onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">filter_list</span>
            <span>
              {filterType === 'All Pending Decisions'
                ? `All Pending Decisions (${pendingCount})`
                : filterType === 'Decision Made'
                  ? `Decision Made (${candidates.length - pendingCount})`
                  : `All Decisions (${candidates.length})`}
            </span>
            <span className="material-symbols-outlined text-[18px]">expand_more</span>
          </button>
          {isFilterDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-clean-surface border border-border-warm rounded-lg shadow-lg z-50 py-1 font-semibold text-sm">
              {(['All Pending Decisions', 'Decision Made', 'All Decisions'] as const).map((opt) => (
                <button
                  key={opt}
                  className="w-full text-left px-4 py-2 hover:bg-surface-container-high transition-colors outline-none font-semibold text-sm"
                  type="button"
                  onClick={() => {
                    setFilterType(opt);
                    setIsFilterDropdownOpen(false);
                  }}
                >
                  {opt === 'All Pending Decisions'
                    ? `All Pending Decisions (${pendingCount})`
                    : opt === 'Decision Made'
                      ? `Decision Made (${candidates.length - pendingCount})`
                      : `All Decisions (${candidates.length})`}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {apiError && (
        <div className="rounded-lg border border-rejected/30 bg-error-container px-4 py-3 text-sm text-rejected">
          {apiError}
        </div>
      )}

      {/* Split Pane Layout */}
      <div className="flex flex-grow overflow-hidden gap-6 min-h-0 select-none pb-2">
        {/* LEFT PANE: Candidate Queue (40% width) */}
        <section className="w-[40%] flex flex-col overflow-hidden min-w-[280px]">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h3 className="font-label-md text-label-md uppercase tracking-wider text-slate-ink opacity-70 font-semibold text-xs">
              Interview Results Queue
            </h3>
            <span className="text-label-sm font-data-mono text-slate-ink font-semibold text-xs">
              {filteredCandidates.length} ITEMS
            </span>
          </div>

          {/* Scrollable list */}
          <div className="flex-grow overflow-y-auto custom-scrollbar space-y-3 pr-2 pb-6">
            {filteredCandidates.map((candidate) => {
              const isSelected = candidate.id === selectedId;
              const isAwaiting = candidate.status === 'Awaiting Decision';
              return (
                <div
                  key={candidate.id}
                  className={`bg-clean-surface p-4 border border-border-warm shadow-sm cursor-pointer hover:border-teal-command transition-all group rounded-lg ${
                    isSelected ? 'border-l-4 border-l-teal-command' : ''
                  }`}
                  onClick={() => setSelectedId(candidate.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-headline-md text-headline-md text-deep-charcoal group-hover:text-teal-command font-semibold text-lg leading-tight transition-colors">
                        {candidate.name}
                      </h4>
                      <p className="text-body-sm text-slate-ink font-medium mt-0.5">
                        {candidate.role}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-tighter ${
                        isAwaiting
                          ? 'bg-secondary-fixed text-revision'
                          : 'bg-teal-command/10 text-teal-command border border-teal-command/20'
                      }`}
                    >
                      {candidate.status === 'Awaiting Decision'
                        ? 'Awaiting Decision'
                        : candidate.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-end mt-4">
                    <div className="flex gap-2">
                      {candidate.passCount > 0 && (
                        <span className="bg-[#e8f5ef] text-approved text-[10px] font-bold px-2 py-0.5 rounded border border-approved/20">
                          {candidate.passCount} PASS
                        </span>
                      )}
                      {candidate.failCount > 0 && (
                        <span className="bg-[#fde8e8] text-rejected text-[10px] font-bold px-2 py-0.5 rounded border border-rejected/20">
                          {candidate.failCount} FAIL
                        </span>
                      )}
                      {candidate.pendingCount > 0 && (
                        <span className="bg-pending/10 text-pending text-[10px] font-bold px-2 py-0.5 rounded border border-pending/20">
                          {candidate.pendingCount} PENDING
                        </span>
                      )}
                    </div>
                    <p className="font-data-mono text-label-sm text-slate-ink opacity-65 font-semibold text-xs">
                      {candidate.interviewDate.toUpperCase()}
                    </p>
                  </div>
                </div>
              );
            })}

            {filteredCandidates.length === 0 && (
              <div className="text-center py-12 bg-clean-surface border border-border-warm rounded-lg text-slate-ink font-medium">
                {loading ? 'Loading interview results...' : 'No interview results found.'}
              </div>
            )}
          </div>
        </section>

        {/* RIGHT PANE: Details panel (60% width) */}
        <section className="w-[60%] flex flex-col overflow-hidden min-w-[360px]">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h3 className="font-label-md text-label-md uppercase tracking-wider text-slate-ink opacity-70 font-semibold text-xs">
              Interview Detail
            </h3>
            <button
              className="text-teal-command hover:underline text-label-sm flex items-center gap-1 font-semibold text-xs"
              onClick={() => alert(`Showing full profile for ${activeCandidate.name}...`)}
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              <span>View Full Profile</span>
            </button>
          </div>

          {/* Detail container card */}
          <div className="flex-grow bg-clean-surface border border-border-warm shadow-md overflow-hidden flex flex-col relative rounded-lg h-full">
            <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-6 pb-28">
              {/* Candidate Profile Details */}
              <div className="border-b border-border-warm pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {activeCandidate.photoUrl ? (
                    <img
                      alt={`${activeCandidate.name} Portrait`}
                      className="w-16 h-16 rounded-lg border-2 border-parchment-lift object-cover shadow-sm"
                      src={activeCandidate.photoUrl}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg border-2 border-parchment-lift bg-teal-command text-white flex items-center justify-center font-bold text-xl shadow-sm">
                      {activeCandidate.name
                        .split(' ')
                        .map((part) => part[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h2 className="font-headline-xl text-headline-xl text-deep-charcoal font-semibold">
                      {activeCandidate.name}
                    </h2>
                    <p className="text-body-lg text-slate-ink font-medium">
                      {activeCandidate.role}
                    </p>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-parchment-lift text-deep-charcoal text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-border-warm">
                    <span className="material-symbols-outlined text-[16px]">corporate_fare</span>
                    {activeCandidate.department}
                  </span>
                  <span className="px-3 py-1 bg-parchment-lift text-deep-charcoal text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-border-warm">
                    <span className="material-symbols-outlined text-[16px]">event</span>
                    Interviewed: {activeCandidate.interviewDate}
                  </span>
                  <span className="px-3 py-1 bg-parchment-lift text-slate-ink font-data-mono text-xs font-semibold rounded-lg border border-border-warm">
                    {activeCandidate.requestId}
                  </span>
                </div>
              </div>

              {/* Panelist Feedback */}
              <div className="space-y-4">
                <h4 className="font-label-md text-label-md text-slate-ink uppercase tracking-wider font-semibold text-xs">
                  Panel Feedback (3 Members)
                </h4>

                {activeCandidate.feedbacks.map((fb, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-[1fr_2fr] gap-6 p-4 border border-border-warm bg-workflow-ivory/40 rounded-lg shadow-sm"
                  >
                    <div>
                      <p className="font-bold text-deep-charcoal text-sm">{fb.name}</p>
                      <p className="text-label-sm text-slate-ink text-xs mt-0.5 font-medium">
                        {fb.role}
                      </p>
                      <div
                        className={`mt-4 inline-flex items-center gap-1.5 px-2.5 py-0.5 border rounded font-bold text-[10px] uppercase tracking-wider ${
                          fb.status === 'PASS'
                            ? 'bg-approved/10 text-approved border-approved/20'
                            : fb.status === 'FAIL'
                              ? 'bg-rejected/10 text-rejected border-rejected/20'
                              : 'bg-pending/10 text-pending border-pending/20'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            fb.status === 'PASS'
                              ? 'bg-approved'
                              : fb.status === 'FAIL'
                                ? 'bg-rejected'
                                : 'bg-pending'
                          }`}
                        />
                        {fb.status}
                      </div>
                    </div>
                    <div>
                      {fb.ratings && (
                        <div className="flex gap-4 mb-3 text-xs font-semibold text-slate-ink">
                          <span>
                            Tech: <b className="text-teal-command">{fb.ratings.tech}/10</b>
                          </span>
                          <span>
                            Comm: <b className="text-teal-command">{fb.ratings.comm}/10</b>
                          </span>
                          <span>
                            Fit: <b className="text-teal-command">{fb.ratings.fit}/10</b>
                          </span>
                        </div>
                      )}
                      <p className="text-body-sm text-slate-ink italic text-sm font-medium leading-relaxed">
                        "{fb.comment}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Overall Assessment */}
              <div className="space-y-6">
                <h4 className="font-label-md text-label-md text-slate-ink uppercase tracking-wider font-semibold text-xs">
                  Overall Assessment
                </h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-ink mb-1.5">
                      <span>Technical Proficiency</span>
                      <span className="font-bold">{activeCandidate.scores.tech} / 10</span>
                    </div>
                    <div className="w-full h-2 bg-parchment-lift rounded-full overflow-hidden border border-border-warm">
                      <div
                        className="h-full bg-teal-command"
                        style={{ width: `${activeCandidate.scores.tech * 10}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-ink mb-1.5">
                      <span>Communication & Collaboration</span>
                      <span className="font-bold">{activeCandidate.scores.comm} / 10</span>
                    </div>
                    <div className="w-full h-2 bg-parchment-lift rounded-full overflow-hidden border border-border-warm">
                      <div
                        className="h-full bg-teal-command"
                        style={{ width: `${activeCandidate.scores.comm * 10}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-ink mb-1.5">
                      <span>Team Fit</span>
                      <span className="font-bold">{activeCandidate.scores.fit} / 10</span>
                    </div>
                    <div className="w-full h-2 bg-parchment-lift rounded-full overflow-hidden border border-border-warm">
                      <div
                        className="h-full bg-teal-command"
                        style={{ width: `${activeCandidate.scores.fit * 10}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Recommendation details */}
                <div className="p-4 bg-teal-command/5 border border-teal-command/20 rounded-lg shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-teal-command text-[24px]">
                      recommend
                    </span>
                    <span className="font-headline-md text-headline-md text-teal-command font-bold">
                      Recommendation: {activeCandidate.recommendation}
                    </span>
                  </div>
                  <p className="text-sm text-slate-ink font-semibold leading-relaxed">
                    {activeCandidate.assessmentSummary}
                  </p>
                </div>
              </div>
            </div>

            {/* Sticky Action Panel */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-clean-surface border-t border-border-warm flex justify-between items-center shadow-lg z-10">
              <div className="flex gap-3">
                <button
                  className="px-6 py-2.5 border border-rejected hover:bg-[#fde8e8] text-rejected rounded-lg font-bold text-sm transition-all"
                  type="button"
                  disabled={submitting || !activeCandidate.id}
                  onClick={() => void handleDecision(activeCandidate.id, 'Rejected')}
                >
                  Reject
                </button>
                <button
                  className="px-6 py-2.5 border border-teal-command hover:bg-teal-command/5 text-teal-command rounded-lg font-bold text-sm transition-all"
                  type="button"
                  disabled={submitting || !activeCandidate.id}
                  onClick={() => void handleDecision(activeCandidate.id, 'Request Info')}
                >
                  Request More Info
                </button>
              </div>
              <button
                className="px-8 py-2.5 bg-teal-command hover:bg-[#09776d] text-white rounded-lg font-bold text-sm transition-all shadow-md flex items-center gap-2 active:scale-[0.98]"
                type="button"
                disabled={submitting || !activeCandidate.id}
                onClick={() => void handleDecision(activeCandidate.id, 'Approved')}
              >
                Approve Hire → Send Offer
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
