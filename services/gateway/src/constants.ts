/**
 * Service transport ports — centralized constants for TCP microservice addresses.
 */
export const SERVICE_PORTS = {
  GATEWAY: parseInt(process.env.GATEWAY_PORT || '3001', 10),
  IDENTITY: parseInt(process.env.IDENTITY_PORT || '3010', 10),
  RECRUITING: parseInt(process.env.RECRUITING_PORT || '3011', 10),
  PROFILES: parseInt(process.env.PROFILES_PORT || '3012', 10),
  REVIEW: parseInt(process.env.REVIEW_PORT || '3013', 10),
} as const;

/**
 * Injection tokens for ClientProxy instances.
 */
export const SERVICE_TOKENS = {
  IDENTITY: 'IDENTITY_SERVICE',
  RECRUITING: 'RECRUITING_SERVICE',
  PROFILES: 'PROFILES_SERVICE',
  REVIEW: 'REVIEW_SERVICE',
} as const;
