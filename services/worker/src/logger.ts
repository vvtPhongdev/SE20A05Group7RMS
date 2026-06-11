import { PinoLogger } from '@wr/logger';
import { config } from './config';

export const logger = new PinoLogger('worker', config.LOG_LEVEL);
