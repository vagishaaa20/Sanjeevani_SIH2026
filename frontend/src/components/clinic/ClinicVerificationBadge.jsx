import React from 'react';
import Badge from '../common/Badge';

export const ClinicVerificationBadge = ({ status }) => {
    if (status === 'VERIFIED') {
        return <Badge variant="success">✓ Verified Registry</Badge>;
    }
    if (status === 'REJECTED') {
        return <Badge variant="danger">✗ Verification Rejected</Badge>;
    }
    return <Badge variant="warning">⏳ Pending Verification</Badge>;
};

export default ClinicVerificationBadge;
