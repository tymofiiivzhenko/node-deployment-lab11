import { createApp } from './app.js';
import { readConfig } from './config.js';

const config = readConfig();
const server = createApp(config).listen(config.port, '0.0.0.0', () => {
  // Виводимо лише відомі безпечні параметри, без усього process.env.
  console.log(JSON.stringify({
    event: 'started', port: config.port, nodeEnv: config.nodeEnv,
    environment: config.environment, version: config.version, revision: config.revision,
  }));
});
server.on('error', (error) => {
  console.error(JSON.stringify({ event: 'listen_failed', code: error.code }));
  process.exitCode = 1;
});
let stopping = false;
function shutdown(signal) {
  if (stopping) return;
  stopping = true;
  console.log(JSON.stringify({ event: 'stopping', signal }));
  server.close((error) => process.exit(error ? 1 : 0));
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
