/**
 * BullMQ Queue Names — kebab-case per architecture convention.
 */
export declare const QUEUE_NAMES: {
    readonly DOCUMENT_PROCESSING: "document-processing";
    readonly EMBEDDING_GENERATION: "embedding-generation";
    readonly EVALUATION: "evaluation";
    readonly PACKET_EXPORT: "packet-export";
};
export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
/**
 * Job Names — domain.action format per architecture convention.
 */
export declare const JOB_NAMES: {
    readonly CV_PARSE: "cv.parse";
    readonly JD_PARSE: "jd.parse";
    readonly EVIDENCE_EXTRACT: "evidence.extract";
    readonly EMBEDDING_GENERATE: "embedding.generate";
    readonly APPLICATION_EVALUATE: "application.evaluate";
    readonly INTERVIEW_FOCUS_GENERATE: "interview-focus.generate";
    readonly PACKET_EXPORT: "packet.export";
};
export type JobName = (typeof JOB_NAMES)[keyof typeof JOB_NAMES];
export { BaseJobPayloadSchema, DocumentParsePayloadSchema, EvaluationPayloadSchema, } from '@wr/contracts';
export type { BaseJobPayload } from '@wr/contracts';
//# sourceMappingURL=index.d.ts.map