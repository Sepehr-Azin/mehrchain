#!/usr/bin/env node
// Owner-run, bounded, read-only probes. Never loads .env or prints URLs/credentials/bodies.
const { performance } = require('node:perf_hooks');

function options(args) {
  const result = {};
  for (let i = 0; i < args.length; i += 2) {
    if (!['--target', '--phase', '--network', '--samples'].includes(args[i]) || !args[i + 1]) {
      throw new Error(
        'Use --target direct|proxy|google|database --phase idle|warm --network LABEL --samples 1..10',
      );
    }
    result[args[i].slice(2)] = args[i + 1];
  }
  if (
    !['direct', 'proxy', 'google', 'database'].includes(result.target) ||
    !['idle', 'warm'].includes(result.phase) ||
    !/^[a-zA-Z0-9_-]{1,40}$/.test(result.network || '')
  ) {
    throw new Error(
      'Provide a target, phase and anonymous network label (letters/digits/underscore/hyphen).',
    );
  }
  result.samples = Number(result.samples || 1);
  if (
    !Number.isInteger(result.samples) ||
    result.samples < 1 ||
    result.samples > 10 ||
    (result.phase === 'idle' && result.samples !== 1)
  ) {
    throw new Error('Samples must be 1..10; idle requires exactly one sample.');
  }
  return result;
}

const ms = (started) => Math.round((performance.now() - started) * 10) / 10;
async function httpProbe(target) {
  const urls = {
    direct: 'https://mehrchain-api.onrender.com/api/version',
    proxy: 'https://mehrchain.pages.dev/api/version',
    google: 'https://accounts.google.com/gsi/client',
  };
  const url = new URL(urls[target]);
  url.searchParams.set('ngsw-bypass', 'true');
  const started = performance.now();
  let headersMs;
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(90000),
      redirect: 'error',
      headers: { 'Cache-Control': 'no-cache' },
    });
    headersMs = ms(started);
    // Bodies stay in memory and never enter the report. Drain for a full response time.
    const body = await response.text();
    const totalMs = ms(started);
    if (target === 'google') {
      return { ok: response.ok, status: response.status, headersMs, totalMs };
    }
    let version;
    try {
      version = JSON.parse(body);
    } catch {
      /* Loading/error pages are not API success. */
    }
    const contractMatches = version?.authContract === 'account-timezone-v1';
    const revision = /^[a-f0-9]{7,40}$/i.test(version?.revision || '') ? version.revision : null;
    return {
      ok: response.ok && contractMatches && !!revision,
      status: response.status,
      headersMs,
      totalMs,
      contractMatches,
      revision,
    };
  } catch (error) {
    return {
      ok: false,
      headersMs,
      totalMs: ms(started),
      failure: error?.name === 'TimeoutError' ? 'timeout' : 'connection-or-redirect',
    };
  }
}

async function databaseProbes(config, report) {
  const connectionString = process.env.T08_DATABASE_URL;
  if (!connectionString)
    throw new Error('Database target requires T08_DATABASE_URL in the process environment.');
  const { Client } = require('pg');
  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 90000,
    query_timeout: 90000,
    statement_timeout: 90000,
    application_name: 'mehrchain-t08-readonly',
  });
  // Do not allow a later idle socket error to print connection details.
  client.on('error', () => {});
  const started = performance.now();
  try {
    await client.connect();
    report.connectionMs = ms(started);
    for (let i = 0; i < config.samples; i++) {
      const queryStarted = performance.now();
      await client.query('SELECT 1');
      report.samples.push({ sample: i + 1, ok: true, queryMs: ms(queryStarted) });
    }
  } catch {
    report.samples.push({
      ok: false,
      failure: 'database-connection-or-query',
      totalMs: ms(started),
    });
  } finally {
    await client.end().catch(() => {});
  }
}

async function main() {
  const config = options(process.argv.slice(2));
  const report = {
    recordedAt: new Date().toISOString(),
    ...config,
    requestedSamples: config.samples,
    phaseIsOperatorLabel: true,
    samples: [],
  };
  if (config.target === 'database') await databaseProbes(config, report);
  else {
    for (let i = 0; i < config.samples; i++) {
      report.samples.push({ sample: i + 1, ...(await httpProbe(config.target)) });
    }
  }
  console.log(JSON.stringify(report, null, 2));
  if (report.samples.some((sample) => !sample.ok)) process.exitCode = 1;
}

main().catch((error) => {
  // Configuration messages are ours; dependency/driver errors can contain secrets.
  console.error(
    error?.message?.startsWith('Use ') ||
      error?.message?.startsWith('Provide ') ||
      error?.message?.startsWith('Samples ') ||
      error?.message?.startsWith('Database target ')
      ? error.message
      : 'Probe could not start. Check local dependencies/configuration.',
  );
  process.exitCode = 1;
});
