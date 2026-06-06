import IORedis from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function run() {
  const redisUrl = process.env.REDIS_URL;
  console.log(`Connecting to Redis: ${redisUrl ? 'using REDIS_URL' : 'using defaults'}`);

  let redis: IORedis;
  if (redisUrl && redisUrl !== 'localhost') {
    redis = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
    });
  } else {
    redis = new IORedis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      maxRetriesPerRequest: null,
    });
  }

  try {
    console.log('Sending PING to Redis...');
    const reply = await redis.ping();
    console.log(`Redis reply: ${reply}`);
    
    console.log('Setting key test_key...');
    await redis.set('test_key', 'test_val', 'EX', 10);
    const val = await redis.get('test_key');
    console.log(`Redis retrieved value: ${val}`);
  } catch (err: any) {
    console.error('Redis error:', err);
  } finally {
    await redis.quit();
  }
}

run();
