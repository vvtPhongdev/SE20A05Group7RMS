const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

require('ts-node').register({
  skipProject: true,
  transpileOnly: true,
  compilerOptions: {
    module: 'CommonJS',
    moduleResolution: 'node',
    esModuleInterop: true,
    target: 'ES2020',
  },
});

require('./seed.ts');
