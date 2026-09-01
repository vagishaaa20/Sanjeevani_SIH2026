const bundlingService = {
    bundleAppointmentDiagnostics: async (appointmentId, labOrders) => {
        console.log(`Bundled lab diagnostics: ${labOrders} with appointment: ${appointmentId}`);
        return { bundled: true };
    },
};
module.exports = bundlingService;
