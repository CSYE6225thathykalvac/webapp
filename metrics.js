const StatsD = require('hot-shots');
const logger = require('./logger');

const statsd = new StatsD({
  host: 'localhost',
  port: 8125,
  prefix: 'webapp.',
  errorHandler: (error) => {
    logger.error('StatsD error:', error);
  }
});

module.exports = statsd;