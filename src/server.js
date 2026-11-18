const app = require('./app');
const config = require('./config');
const { getClient } = require('./services/queueService');

// connect to Redis at startup (not on the first request)
getClient();

app.listen(config.port, () => {
  console.log(`MediBook API running on http://localhost:${config.port}`);
});
