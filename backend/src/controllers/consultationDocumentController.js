const { ConsultationDocument, Consultation } = require('../models');

// If you have a file upload middleware (like multer configured to AWS S3 or disk),
// normally it would run before this controller and attach req.file. 
// For this implementation, we will simulate a direct URL upload or assume 
// the client sends a base64/url string in req.body for simplicity.
// Ensure you adapt this if you have a real robust S3 uploader in place.

exports.uploadDocument = async (req, res) => {
    try {
        const { id: consultationId } = req.params;
        const { fileUrl, documentType } = req.body;
        const patientId = req.user.id;

        const consultation = await Consultation.findByPk(consultationId);
        if (!consultation || consultation.patientId !== patientId) {
            return res.status(404).json({ error: 'Consultation not found or unauthorized' });
        }

        if (!fileUrl) {
            return res.status(400).json({ error: 'fileUrl is required' });
        }

        const doc = await ConsultationDocument.create({
            consultationId,
            patientId,
            fileUrl,
            documentType: documentType || 'other',
        });

        return res.status(201).json({ success: true, document: doc });
    } catch (error) {
        console.error('[uploadDocument] Error:', error);
        return res.status(500).json({ error: 'Failed to upload document' });
    }
};

exports.getDocuments = async (req, res) => {
    try {
        const { id: consultationId } = req.params;
        const userId = req.user.id;

        const consultation = await Consultation.findByPk(consultationId);
        if (!consultation) {
            return res.status(404).json({ error: 'Consultation not found' });
        }

        // Both assigned doctor and patient can view
        if (consultation.patientId !== userId && consultation.doctorId !== userId) {
            // Note: If admins can view, we would handle admin roles here. For now strict.
            return res.status(403).json({ error: 'Unauthorized to view these documents' });
        }

        const documents = await ConsultationDocument.findAll({
            where: { consultationId },
            order: [['uploadedAt', 'DESC']],
        });

        return res.json({ documents });
    } catch (error) {
        console.error('[getDocuments] Error:', error);
        return res.status(500).json({ error: 'Failed to fetch documents' });
    }
};
