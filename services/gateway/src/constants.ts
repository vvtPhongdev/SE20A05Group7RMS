import { config } from './config';

/**
 * Service transport ports — centralized constants for TCP microservice addresses.
 */
export const SERVICE_PORTS = {
  GATEWAY: config.GATEWAY_PORT,
  IDENTITY: config.IDENTITY_PORT,
  RECRUITING: config.RECRUITING_PORT,
  PROFILES: config.PROFILES_PORT,
  NOTIFICATION: config.NOTIFICATION_PORT,
  CV: config.CV_PORT,
  INTERVIEW: config.INTERVIEW_PORT,
} as const;

/**
 * Injection tokens for ClientProxy instances.
 */
export const SERVICE_TOKENS = {
  IDENTITY: 'IDENTITY_SERVICE',
  RECRUITING: 'RECRUITING_SERVICE',
  PROFILES: 'PROFILES_SERVICE',
  NOTIFICATION: 'NOTIFICATION_SERVICE',
  CV: 'CV_SERVICE',
  INTERVIEW: 'INTERVIEW_SERVICE',
} as const;

