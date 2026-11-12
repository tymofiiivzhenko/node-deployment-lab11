import assert from 'node:assert/strict';

const [baseArg, expectedVersion, expectedEnvironment, expectedRevision] = process.argv.slice(2);
if (!baseArg || !expectedVersion || !expectedEnvironment) {
  console.error('Usage: node scripts/check-api.mjs BASE_URL VERSION ENVIRONMENT [REVISION]');
  process.exit(1);
}
let base;
try {
  base = new URL(baseArg);
  assert.ok(['http:', 'https:'].includes(base.protocol));
  assert.equal(base.pathname, '/');
  assert.equal(base.search, '');
  assert.equal(base.hash, '');
  assert.equal(base.username + base.password, '');
} catch {
  console.error('BASE_URL must be an HTTP(S) service address without a path, query or credentials');
  process.exit(1);
}
try {
  for (const [path, expectedStatus] of [['/health', 200], ['/ready', 200], ['/api/v1/info', 200], ['/unknown', 404]]) {
    const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(120_000) });
    assert.equal(response.status, expectedStatus, `${path}: unexpected HTTP status`);
    assert.match(response.headers.get('content-type') || '', /application\/json/);
    const body = await response.json();
    if (path === '/health') assert.deepEqual(body, { status: 'ok' });
    if (path === '/ready') assert.deepEqual(body, { status: 'ready' });
    if (path === '/api/v1/info') {
      assert.equal(body.service, 'deployment-api-lab');
      assert.equal(body.nodeEnv, 'production');
      assert.equal(body.environment, expectedEnvironment);
      assert.equal(body.version, expectedVersion);
      assert.ok(typeof body.message === 'string' && body.message.length > 0);
      assert.ok(typeof body.revision === 'string' && body.revision.length > 0);
      if (expectedRevision) assert.equal(body.revision, expectedRevision);
    }
    if (path === '/unknown') assert.deepEqual(body, { error: { code: 'ROUTE_NOT_FOUND', message: 'Route not found' } });
    console.log(JSON.stringify({ path, status: response.status, body }));
  }
  console.log('API checks passed');
} catch (error) {
  console.error(`API check failed: ${error.message}`);
  process.exitCode = 1;
}
