const sequelize = require('../src/config/db');
const redisClient = require('../src/config/redis');
const { inboundQueue, outboundQueue, medicationReminderQueue } = require('../src/config/queues');

module.exports = async () => {
    // 1. Gracefully close BullMQ queues
    try {
        if (inboundQueue) await inboundQueue.close();
        if (outboundQueue) await outboundQueue.close();
        if (medicationReminderQueue) await medicationReminderQueue.close();
    } catch (e) {
        console.warn('Queue close error:', e.message);
    }

    // 2. Gracefully close Redis connection
    try {
        if (redisClient && redisClient.status !== 'end') {
            await redisClient.quit();
        }
    } catch (e) {
        console.warn('Redis close error:', e.message);
    }

    // 3. Gracefully close Database connection
    try {
        if (sequelize) {
            await sequelize.close();
        }
    } catch (e) {
        console.warn('DB close error:', e.message);
    }
};
