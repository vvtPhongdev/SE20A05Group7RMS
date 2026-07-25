#!/usr/bin/env node

import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import newman from 'newman';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const postmanDirectory = path.join(repositoryRoot, 'Test(SWT)', 'Postman');
const collectionPath = path.join(postmanDirectory, 'RMS_Group5_65TC.postman_collection.json');
const environmentPath = path.join(postmanDirectory, 'RMS_Local.postman_environment.json');
const reportsDirectory = path.join(postmanDirectory, 'reports');
const summaryPath = path.join(reportsDirectory, 'latest-summary.json');
const junitPath = path.join(reportsDirectory, 'latest-junit.xml');

const API_FOLDER_PREFIXES = ['00 -', '01 -', '02 -', '03 -', '05 -'];
const ALL_FOLDER_PREFIXES = [...API_FOLDER_PREFIXES, '04 -'];

const ENVIRONMENT_OVERRIDES = {
  RMS_GATEWAY_BASE: 'gatewayBase',
  RMS_API_BASE: 'apiBase',
  RMS_WEBAPP_BASE: 'webappBase',
  RMS_ADMIN_EMAIL: 'adminEmail',
  RMS_ADMIN_PASSWORD: 'adminPassword',
  RMS_CANDIDATE_A_EMAIL: 'candidateAEmail',
  RMS_CANDIDATE_A_PASSWORD: 'candidateAPassword',
  RMS_CANDIDATE_B_EMAIL: 'candidateBEmail',
  RMS_CANDIDATE_B_PASSWORD: 'candidateBPassword',
};

function printUsage() {
  console.log(`Usage: npm run test:api:postman -- [options]

Options:
  --include-manual      Include folder 04 (FE manual companions; skipped by default)
  --skip-health-check   Run Newman without checking the Gateway first
  --help                Show this help

Optional process environment overrides:
  RMS_GATEWAY_BASE, RMS_API_BASE, RMS_WEBAPP_BASE
  RMS_ADMIN_EMAIL, RMS_ADMIN_PASSWORD
  RMS_CANDIDATE_A_EMAIL, RMS_CANDIDATE_A_PASSWORD
  RMS_CANDIDATE_B_EMAIL, RMS_CANDIDATE_B_PASSWORD`);
}

function parseArguments(argv) {
  const supported = new Set(['--include-manual', '--skip-health-check', '--help']);
  const unknown = argv.filter((argument) => !supported.has(argument));

  if (unknown.length > 0) {
    throw new Error(`Unknown option(s): ${unknown.join(', ')}`);
  }

  return {
    help: argv.includes('--help'),
    includeManual: argv.includes('--include-manual'),
    skipHealthCheck: argv.includes('--skip-health-check'),
  };
}

function environmentValue(environment, key) {
  return environment.values.find((entry) => entry.key === key)?.value;
}

function setEnvironmentValue(environment, key, value) {
  const entry = environment.values.find((candidate) => candidate.key === key);

  if (entry) {
    entry.value = value;
    entry.enabled = true;
    return;
  }

  environment.values.push({ key, value, enabled: true });
}

function applyProcessEnvironmentOverrides(environment) {
  for (const [processKey, postmanKey] of Object.entries(ENVIRONMENT_OVERRIDES)) {
    const value = process.env[processKey];
    if (value !== undefined && value !== '') {
      setEnvironmentValue(environment, postmanKey, value);
    }
  }
}

function selectFolders(collection, includeManual) {
  const prefixes = includeManual ? ALL_FOLDER_PREFIXES : API_FOLDER_PREFIXES;
  const selectedItems = collection.item.filter((item) =>
    prefixes.some((prefix) => item.name.startsWith(prefix)),
  );

  if (selectedItems.length !== prefixes.length) {
    const selectedNames = new Set(selectedItems.map((item) => item.name.slice(0, 4)));
    const missing = prefixes.filter((prefix) => !selectedNames.has(prefix));
    throw new Error(`Missing expected collection folder(s): ${missing.join(', ')}`);
  }

  collection.item = selectedItems;
  return selectedItems.map((item) => item.name);
}

function normalizeUploadPaths(collection) {
  const fixtures = {
    'cv-demo.pdf': path.join(repositoryRoot, 'cv-demo.pdf'),
    'invalid.exe': path.join(postmanDirectory, 'data', 'invalid.exe'),
  };

  const visit = (items) => {
    for (const item of items ?? []) {
      if (item.item) {
        visit(item.item);
      }

      const formdata = item.request?.body?.formdata;
      for (const field of formdata ?? []) {
        if (field.type !== 'file' || !field.src) continue;

        const fixturePath = fixtures[path.basename(field.src)];
        if (fixturePath) field.src = fixturePath;
      }
    }
  };

  visit(collection.item);
  return Object.values(fixtures);
}

async function assertFixtureFiles(fixturePaths) {
  await Promise.all(
    fixturePaths.map(async (fixturePath) => {
      try {
        await access(fixturePath);
      } catch {
        throw new Error(`Required upload fixture does not exist: ${fixturePath}`);
      }
    }),
  );
}

async function assertGatewayIsReady(apiBase) {
  const healthUrl = `${apiBase.replace(/\/$/, '')}/health`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7_000);

  try {
    const response = await fetch(healthUrl, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    console.log(`Gateway health check passed: ${healthUrl}`);
  } catch (error) {
    throw new Error(
      `Gateway is not ready at ${healthUrl}. Start the RMS services before running API tests. ${error.message}`,
    );
  } finally {
    clearTimeout(timeout);
  }
}

function runNewman(collection, environment) {
  return new Promise((resolve, reject) => {
    newman.run(
      {
        collection,
        environment,
        iterationCount: 1,
        reporters: ['cli', 'junit'],
        reporter: {
          junit: { export: junitPath },
        },
        workingDir: repositoryRoot,
        timeoutRequest: 15_000,
        timeoutScript: 30_000,
      },
      (error, summary) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(summary);
      },
    );
  });
}

function serializeStats(stats) {
  return Object.fromEntries(
    Object.entries(stats).map(([name, value]) => [
      name,
      {
        total: value.total ?? 0,
        pending: value.pending ?? 0,
        failed: value.failed ?? 0,
      },
    ]),
  );
}

function serializeFailure(failure) {
  return {
    parent: failure.parent?.name ?? null,
    source: failure.source?.name ?? null,
    error: failure.error?.name ?? 'Error',
    message: failure.error?.message ?? String(failure.error ?? 'Unknown failure'),
    test: failure.error?.test ?? null,
  };
}

async function writeSummary(summary, folders) {
  const report = {
    generatedAt: new Date().toISOString(),
    collection: summary.collection?.name ?? 'RMS Group 5 API tests',
    folders,
    timings: {
      started: summary.run.timings.started,
      completed: summary.run.timings.completed,
      responseAverage: summary.run.timings.responseAverage,
    },
    stats: serializeStats(summary.run.stats),
    failures: summary.run.failures.map(serializeFailure),
  };

  await writeFile(summaryPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return report;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    printUsage();
    return;
  }

  const [collectionText, environmentText] = await Promise.all([
    readFile(collectionPath, 'utf8'),
    readFile(environmentPath, 'utf8'),
  ]);
  const collection = JSON.parse(collectionText);
  const environment = JSON.parse(environmentText);

  applyProcessEnvironmentOverrides(environment);
  const folders = selectFolders(collection, options.includeManual);
  const fixturePaths = normalizeUploadPaths(collection);
  await assertFixtureFiles(fixturePaths);
  await mkdir(reportsDirectory, { recursive: true });

  const apiBase = environmentValue(environment, 'apiBase');
  if (!apiBase) throw new Error('Postman environment variable apiBase is empty.');
  if (!options.skipHealthCheck) await assertGatewayIsReady(apiBase);

  console.log(`Running folders in order:\n- ${folders.join('\n- ')}`);
  const summary = await runNewman(collection, environment);
  const report = await writeSummary(summary, folders);

  console.log(`\nRedacted JSON summary: ${summaryPath}`);
  console.log(`JUnit report: ${junitPath}`);

  if (report.failures.length > 0) {
    console.error(`API test run completed with ${report.failures.length} failure(s).`);
    process.exitCode = 1;
  } else {
    console.log('API test run passed without failures.');
  }
}

main().catch((error) => {
  console.error(`API test runner failed: ${error.message}`);
  process.exitCode = 1;
});
