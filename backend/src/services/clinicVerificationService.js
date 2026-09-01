const clinicVerificationService = {
    verifyLicense: async (licenseNumber) => {
        // Mock license registry: licenses starting with "INVALID" or "999" are invalid
        if (licenseNumber.startsWith('INVALID') || licenseNumber.startsWith('999')) {
            return { valid: false, reason: 'License not found in national health registry' };
        }
        return { valid: true, organizationName: 'Verified Care Center' };
    },
};
module.exports = clinicVerificationService;
