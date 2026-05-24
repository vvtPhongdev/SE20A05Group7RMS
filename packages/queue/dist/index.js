/**
 * BullMQ Queue Names — kebab-case per architecture convention.
 */
export const QUEUE_NAMES = {
    DOCUMENT_PROCESSING: 'document-processing',
    EMBEDDING_GENERATION: 'embedding-generation',
    EVALUATION: 'evaluation',
    PACKET_EXPORT: 'packet-export',
};
/**
 * Job Names — domain.action format per architecture convention.
 */
export const JOB_NAMES = {
    CV_PARSE: 'cv.parse',
    JD_PARSE: 'jd.parse',
    EVIDENCE_EXTRACT: 'evidence.extract',
    EMBEDDING_GENERATE: 'embedding.generate',
    APPLICATION_EVALUATE: 'application.evaluate',
    INTERVIEW_FOCUS_GENERATE: 'interview-focus.generate',
    PACKET_EXPORT: 'packet.export',
};
// Re-export payload schemas from contracts
export { BaseJobPayloadSchema, DocumentParsePayloadSchema, EvaluationPayloadSchema, } from '@wr/contracts';
//# sourceMappingURL=index.js.map