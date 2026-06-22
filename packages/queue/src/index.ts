/**
 * BullMQ Queue Names — kebab-case per architecture convention.
 */
export const QUEUE_NAMES = {
  CV_PARSE: 'cv-parse',
  EMBEDDING_GENERATE: 'embedding-generate',
  EMAIL_SEND: 'email-send',
  TASK_REMINDER: 'task-reminder',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

/**
 * Job Names — kebab-case per architecture convention.
 */
export const JOB_NAMES = {
  PARSE_CV: 'parse-cv',
  GENERATE_EMBEDDING: 'generate-embedding',
  SEND_EMAIL: 'send-email',
  SEND_TASK_REMINDER: 'send-task-reminder',
  SCAN_TASK_REMINDERS: 'scan-task-reminders',
} as const;

export type JobName = (typeof JOB_NAMES)[keyof typeof JOB_NAMES];

// Re-export payload schemas and types from contracts
export {
  CvParseJobPayloadSchema,
  EmbeddingGenerateJobPayloadSchema,
  EmailSendJobPayloadSchema,
  TaskReminderJobPayloadSchema,
} from '@wr/contracts';

export type {
  CvParseJobPayload,
  EmbeddingGenerateJobPayload,
  EmailSendJobPayload,
  TaskReminderJobPayload,
} from '@wr/contracts';
