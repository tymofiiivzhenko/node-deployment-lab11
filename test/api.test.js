import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from '../src/app.js';
import { readConfig } from '../src/config.js';
import { version } from '../src/release.js';

test('configuration validates port and environment', () => {
  for (const PORT of ['abc', '0', '65536', '3.5', '']) {
    assert.throws(() => readConfig({ PORT }), /PORT/);
  }
  assert.throws(() => readConfig({ APP_ENV: 'unknown' }), /APP_ENV/);
  const config = readConfig({ PORT: '4100', NODE_ENV: 'production', APP_ENV: 'staging' });
  assert.equal(config.port, 4100);
  assert.equal(config.nodeEnv, 'production');
  assert.equal(config.environment, 'staging');
});
test('revision uses explicit configuration before platform metadata', () => {
  assert.equal(readConfig({ DEPLOY_REVISION: 'manual', RENDER_GIT_COMMIT: 'render' }).revision, 'manual');
  assert.equal(readConfig({ RENDER_GIT_COMMIT: 'render' }).revision, 'render');
  assert.equal(readConfig({}).revision, 'local');
});
test('API reports health, readiness, its configuration and a safe 404', async (t) => {
  const config = readConfig({ NODE_ENV: 'production', APP_ENV: 'staging', APP_MESSAGE: 'Test lab', DEPLOY_REVISION: 'commit-under-test' });
  const server = createApp(config).listen(0, '127.0.0.1');
  t.after(() => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const [path, status] of [['/health', 'ok'], ['/ready', 'ready']]) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status });
  }
  const info = await fetch(base + '/api/v1/info');
  assert.equal(info.status, 200);
  assert.deepEqual(await info.json(), {
    service: 'deployment-api-lab', nodeEnv: 'production', environment: 'staging',
    message: 'Test lab', version, revision: 'commit-under-test',
  });
  const unknown = await fetch(base + '/unknown');
  assert.equal(unknown.status, 404);
  assert.deepEqual(await unknown.json(), { error: { code: 'ROUTE_NOT_FOUND', message: 'Route not found' } });
});
