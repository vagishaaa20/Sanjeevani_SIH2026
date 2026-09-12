const { DiagnosticRequest, User, Consultation, HealthWorkerReferral, HealthWorkerAssignment, HealthWorkerFollowup } = require('../models');

exports.createRequest = async (req, res) => {
    try {
        const { patientId, clinicId, testName, priority, notes } = req.body;
        const requesterId = req.user.id;
        
        if (!patientId || !testName) {
            return res.status(400).json({ error: 'patientId and testName are required.' });
        }
        
        // Verify relationship
        const role = req.user.role;
        let isAuthorized = false;
        
        if (role === 'doctor') {
            const hasConsultation = await Consultation.count({ where: { doctorId: requesterId, patientId } });
            const hasReferral = await HealthWorkerReferral.count({ where: { toDoctorId: requesterId, patientId } });
            if (hasConsultation > 0 || hasReferral > 0) isAuthorized = true;
        } else if (role === 'health_worker') {
            const hasAssignment = await HealthWorkerAssignment.count({ where: { healthWorkerId: requesterId, patientId } });
            const hasFollowup = await HealthWorkerFollowup.count({ where: { healthWorkerId: requesterId, patientId } });
            if (hasAssignment > 0 || hasFollowup > 0) isAuthorized = true;
        }
        
        if (!isAuthorized) {
            return res.status(403).json({ error: 'You are not authorized to create requests for this patient.' });
        }
        
        const diagnosticRequest = await DiagnosticRequest.create({
            patientId,
            requesterId,
            clinicId,
            testName,
            priority: priority || 'NORMAL',
            notes,
            status: 'REQUESTED'
        });
        
        return res.status(201).json(diagnosticRequest);
    } catch (error) {
        console.error('Error creating diagnostic request:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getRequests = async (req, res) => {
    try {
        const { role, id } = req.user;
        let whereClause = {};

        if (role === 'patient') {
            whereClause.patientId = id;
        } else if (role === 'doctor' || role === 'health_worker') {
            if (req.query.patientId) {
                // Verify relationship for arbitrary query
                let isAuthorized = false;
                if (role === 'doctor') {
                    const hasConsultation = await Consultation.count({ where: { doctorId: id, patientId: req.query.patientId } });
                    const hasReferral = await HealthWorkerReferral.count({ where: { toDoctorId: id, patientId: req.query.patientId } });
                    if (hasConsultation > 0 || hasReferral > 0) isAuthorized = true;
                } else if (role === 'health_worker') {
                    const hasAssignment = await HealthWorkerAssignment.count({ where: { healthWorkerId: id, patientId: req.query.patientId } });
                    const hasFollowup = await HealthWorkerFollowup.count({ where: { healthWorkerId: id, patientId: req.query.patientId } });
                    if (hasAssignment > 0 || hasFollowup > 0) isAuthorized = true;
                }
                
                if (!isAuthorized) {
                    return res.status(403).json({ error: 'You are not authorized to view this patient\'s requests.' });
                }
                
                whereClause.patientId = req.query.patientId;
            } else {
                whereClause.requesterId = id;
            }
        } else if (role === 'clinic_admin') {
            whereClause.clinicId = id;
        } else {
            return res.status(403).json({ error: 'Unauthorized role' });
        }

        const requests = await DiagnosticRequest.findAll({
            where: whereClause,
            include: [
                { model: User, as: 'patient', attributes: ['id', 'email', 'phone', 'role'] },
                { model: User, as: 'requester', attributes: ['id', 'email', 'phone', 'role'] },
                { model: User, as: 'clinic', attributes: ['id', 'email', 'phone', 'role'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        
        return res.json(requests);
    } catch (error) {
        console.error('Error fetching diagnostic requests:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, scheduledDate } = req.body;
        
        const diagnosticRequest = await DiagnosticRequest.findByPk(id);
        if (!diagnosticRequest) return res.status(404).json({ error: 'Request not found' });
        
        if (req.user.role === 'clinic_admin') {
            if (diagnosticRequest.clinicId !== req.user.id) {
                return res.status(403).json({ error: 'Unauthorized to update this request' });
            }
        }
        
        const validTransitions = {
            'REQUESTED': ['SCHEDULED', 'CANCELLED'],
            'SCHEDULED': ['IN_PROGRESS', 'CANCELLED'],
            'IN_PROGRESS': ['COMPLETED'],
            'COMPLETED': []
        };
        
        if (status) {
            if (status !== diagnosticRequest.status && !validTransitions[diagnosticRequest.status].includes(status)) {
                return res.status(400).json({ error: `Invalid status transition from ${diagnosticRequest.status} to ${status}` });
            }
            diagnosticRequest.status = status;
        }
        
        if (scheduledDate) {
            diagnosticRequest.scheduledDate = scheduledDate;
        }
        
        await diagnosticRequest.save();
        return res.json(diagnosticRequest);
    } catch (error) {
        console.error('Error updating status:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.uploadResult = async (req, res) => {
    try {
        const { id } = req.params;
        const diagnosticRequest = await DiagnosticRequest.findByPk(id);
        if (!diagnosticRequest) return res.status(404).json({ error: 'Request not found' });
        
        if (req.user.role === 'clinic_admin' && diagnosticRequest.clinicId !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized to upload result for this request' });
        }
        
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        if (diagnosticRequest.status !== 'IN_PROGRESS' && diagnosticRequest.status !== 'SCHEDULED') {
            return res.status(400).json({ error: 'Results can only be uploaded for tests that are SCHEDULED or IN_PROGRESS.' });
        }
        
        const fileUrl = `/uploads/documents/${req.file.filename}`;
        diagnosticRequest.resultDocumentUrl = fileUrl;
        
        if (diagnosticRequest.status !== 'COMPLETED') {
            diagnosticRequest.status = 'COMPLETED';
        }
        
        await diagnosticRequest.save();
        
        return res.json({ message: 'Result uploaded successfully', diagnosticRequest });
    } catch (error) {
        console.error('Error uploading result:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
