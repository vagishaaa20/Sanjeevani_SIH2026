const IORedis = require('ioredis');

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null, // required by BullMQ
});

connection.on('connect', () => console.log('Redis connected'));
connection.on('error', (err) => console.error('Redis connection error:', err));

module.exports = connection;