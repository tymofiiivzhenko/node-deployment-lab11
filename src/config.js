import { version } from './release.js';

export function readConfig(env = process.env) {
  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer from 1 to 65535');
  }
  const environment = env.APP_ENV || 'development';
  if (!['development', 'staging', 'production'].includes(environment)) {
    throw new Error('APP_ENV must be development, staging or production');
  }
  return {
    port,
    nodeEnv: env.NODE_ENV || 'development',
    environment,
    message: env.APP_MESSAGE || 'Deployment API Lab',
    version,
    revision: env.DEPLOY_REVISION || env.RENDER_GIT_COMMIT || 'local',
  };
}
