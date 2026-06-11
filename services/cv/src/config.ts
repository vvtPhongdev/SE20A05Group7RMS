import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';

dotenvConfig({ path: resolve(__dirname, '../../../.env') });

import { loadConfig, CvEnvSchema } from '@wr/config';

export const config = loadConfig(CvEnvSchema);
