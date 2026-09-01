const notificationService = {
    sendSMS: async (to, body) => console.log(`[SMS Sent] to: ${to}, body: ${body}`),
    sendWhatsApp: async (to, body) => console.log(`[WhatsApp Sent] to: ${to}, body: ${body}`),
};
module.exports = notificationService;
