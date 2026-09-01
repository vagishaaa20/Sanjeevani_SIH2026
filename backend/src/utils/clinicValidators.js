function validateClinicInputs(body) {
    const errors = [];
    if (!body.clinicName || body.clinicName.trim().length === 0) {
        errors.push('Clinic name is required');
    }
    if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
        errors.push('A valid email address is required');
    }
    if (!body.password || body.password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    if (!body.licenseNumber || body.licenseNumber.trim().length === 0) {
        errors.push('Health facility license number is required');
    }
    if (!body.city || body.city.trim().length === 0) {
        errors.push('City is required');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

module.exports = {
    validateClinicInputs,
};
