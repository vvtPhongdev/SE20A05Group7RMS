import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from workspace root .env file
dotenvConfig({ path: resolve(__dirname, '../../../.env') });

import { loadConfig, GatewayEnvSchema } from '@wr/config';

export const config = loadConfig(GatewayEnvSchema);

// Allow NODE_ENV to be dynamically overwritten in unit tests
Object.defineProperty(config, 'NODE_ENV', {
  get() {
    return process.env.NODE_ENV || 'development';
  },
  configurable: true,
  enumerable: true,
});
