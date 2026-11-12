import express from 'express';

export function createApp(config) {
  const app = express();
  app.disable('x-powered-by');
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  // У проєкті немає БД чи інших критичних зовнішніх залежностей.
  app.get('/ready', (_req, res) => res.json({ status: 'ready' }));
  app.get('/api/v1/info', (_req, res) => {
    const { nodeEnv, environment, message, version, revision } = config;
    res.json({ service: 'deployment-api-lab', nodeEnv, environment, message, version, revision });
  });
  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'ROUTE_NOT_FOUND', message: 'Route not found' } });
  });
  return app;
}
