import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from workspace root .env file
dotenvConfig({ path: resolve(__dirname, '../../../.env') });

import { loadConfig, NotificationEnvSchema } from '@wr/config';

export const config = loadConfig(NotificationEnvSchema);
