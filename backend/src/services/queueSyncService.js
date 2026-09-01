const queueSyncService = {
    calculateETA: (queueId) => 15,
    broadcastUpdate: (queueId, state) => console.log(`[Queue broadcast] ${queueId}: ${state}`),
};
module.exports = queueSyncService;
