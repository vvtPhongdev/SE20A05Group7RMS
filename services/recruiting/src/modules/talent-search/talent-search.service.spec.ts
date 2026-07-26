import {
  calculateFeedbackAdjustments,
  FEEDBACK_SEMANTIC_CAP,
  TalentSearchService,
} from './talent-search.service';

describe('talent search feedback propagation', () => {
  it('propagates positive feedback only to highly similar CVs and keeps it bounded', () => {
    const scores = new Map([['source', 0.2]]);
    const adjustments = calculateFeedbackAdjustments(
      ['source', 'similar', 'distant'],
      scores,
      [
        { candidateId: 'similar', sourceCandidateId: 'source', similarity: 0.97 },
        { candidateId: 'distant', sourceCandidateId: 'source', similarity: 0.7 },
      ],
    );

    expect(adjustments.get('source')).toEqual({ direct: 0.2, semantic: 0, total: 0.2 });
    expect(adjustments.get('similar')?.semantic).toBeGreaterThan(0);
    expect(adjustments.get('similar')?.semantic).toBeLessThanOrEqual(FEEDBACK_SEMANTIC_CAP);
    expect(adjustments.get('distant')).toEqual({ direct: 0, semantic: 0, total: 0 });
  });

  it('limits negative propagation much more than the direct reject signal', () => {
    const adjustments = calculateFeedbackAdjustments(
      ['rejected', 'similar'],
      new Map([['rejected', -0.2]]),
      [{ candidateId: 'similar', sourceCandidateId: 'rejected', similarity: 1 }],
    );

    expect(adjustments.get('rejected')?.total).toBe(-0.2);
    expect(adjustments.get('similar')?.semantic).toBeCloseTo(-0.01, 8);
    expect(Math.abs(adjustments.get('similar')?.semantic ?? 0)).toBeLessThan(0.02);
  });

  it('never lets semantic evidence exceed the configured cap', () => {
    const adjustments = calculateFeedbackAdjustments(
      ['a', 'b', 'target'],
      new Map([
        ['a', 0.2],
        ['b', 0.2],
      ]),
      [
        { candidateId: 'target', sourceCandidateId: 'a', similarity: 1 },
        { candidateId: 'target', sourceCandidateId: 'b', similarity: 1 },
      ],
    );

    expect(adjustments.get('target')?.semantic).toBe(FEEDBACK_SEMANTIC_CAP);
    expect(adjustments.get('target')?.total).toBe(FEEDBACK_SEMANTIC_CAP);
  });

  it('calculates ranking metrics from impressions and later positive decisions', async () => {
    const prisma = {
      talentSearchFeedback: {
        findMany: jest.fn().mockResolvedValue([
          { searchRunId: 'run-1', candidateId: 'a', action: 'IMPRESSION', rank: 1 },
          { searchRunId: 'run-1', candidateId: 'b', action: 'IMPRESSION', rank: 2 },
          { searchRunId: 'run-1', candidateId: 'c', action: 'IMPRESSION', rank: 3 },
          { searchRunId: 'run-1', candidateId: 'b', action: 'SHORTLIST', rank: null },
        ]),
      },
    };
    const service = new TalentSearchService(prisma as any);

    await expect(service.evaluateRanking({ requestId: 'request-1' })).resolves.toEqual({
      evaluatedRuns: 1,
      precisionAt5: 0.3333,
      precisionAt10: 0.3333,
      meanReciprocalRank: 0.5,
    });
  });
});
