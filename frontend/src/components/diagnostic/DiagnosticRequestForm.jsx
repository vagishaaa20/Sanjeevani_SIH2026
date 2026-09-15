import React, { useState, useEffect, useContext } from 'react';
import Button from '../common/Button';
import Input from '../common/Input';
import diagnosticService from '../../services/diagnosticService';
import clinicService from '../../services/clinicService';
import { NotificationContext } from '../../context/NotificationContext';

const DiagnosticRequestForm = ({ onSuccess, prefilledPatientId = '', availablePatients = null }) => {
    const { addNotification } = useContext(NotificationContext);
    const [loading, setLoading] = useState(false);
    const [clinics, setClinics] = useState([]);
    
    const [formData, setFormData] = useState({
        patientId: prefilledPatientId,
        clinicId: '',
        testName: '',
        priority: 'NORMAL',
        notes: ''
    });

    useEffect(() => {
        clinicService.getAllClinics()
            .then(data => setClinics(data.clinics || []))
            .catch(err => console.error('Failed to load clinics:', err));
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await diagnosticService.createRequest(formData);
            addNotification('Diagnostic request created successfully', 'success');
            if (onSuccess) onSuccess();
        } catch (err) {
            const msg = err.response?.data?.error || err.message || 'Failed to create request';
            addNotification(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-white p-6 rounded-2xl border border-[#f5e4ec] shadow-xs">
            <h3 className="text-lg font-black text-ink-black border-b border-[#f5e4ec] pb-2">New Diagnostic Request</h3>
            
            {availablePatients ? (
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-ink-charcoal uppercase tracking-wider">Patient</label>
                    <select
                        name="patientId"
                        value={formData.patientId}
                        onChange={handleChange}
                        required
                        disabled={!!prefilledPatientId}
                        className="w-full px-4 py-2.5 rounded-xl border border-ink-black bg-white focus:ring-2 focus:ring-rose-mauve text-sm"
                    >
                        <option value="">-- Select a Patient --</option>
                        {availablePatients.map((p) => {
                            const pId = p.patientId || p.userId || p.id;
                            const pName = p.fullName || p.name || 'Unknown';
                            const pPhone = p.phone ? `(${p.phone})` : '';
                            return (
                                <option key={pId} value={pId}>
                                    {pName} {pPhone}
                                </option>
                            );
                        })}
                    </select>
                </div>
            ) : (
                <Input
                    label="Patient ID"
                    name="patientId"
                    value={formData.patientId}
                    onChange={handleChange}
                    required
                    disabled={!!prefilledPatientId}
                    placeholder="Enter Patient UUID"
                />
            )}

            <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-ink-charcoal uppercase tracking-wider">Target Clinic / Lab</label>
                <select
                    name="clinicId"
                    value={formData.clinicId}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-ink-black bg-white focus:ring-2 focus:ring-rose-mauve text-sm"
                >
                    <option value="">-- Select a Clinic --</option>
                    {clinics.map((c) => (
                        <option key={c.userId} value={c.userId}>
                            {c.clinicName} {c.city ? `(${c.city})` : ''}
                        </option>
                    ))}
                </select>
            </div>
            
            <Input
                label="Test Name"
                name="testName"
                value={formData.testName}
                onChange={handleChange}
                required
                placeholder="e.g., Complete Blood Count, X-Ray"
            />
            
            <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-ink-charcoal uppercase tracking-wider">Priority</label>
                <select 
                    name="priority" 
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-ink-black bg-white focus:ring-2 focus:ring-rose-mauve text-sm"
                >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                </select>
            </div>
            
            <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-ink-charcoal uppercase tracking-wider">Clinical Notes</label>
                <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-ink-black bg-white focus:ring-2 focus:ring-rose-mauve text-sm"
                    placeholder="Any specific instructions..."
                ></textarea>
            </div>
            
            <Button type="submit" variant="primary" disabled={loading} className="mt-2">
                {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
        </form>
    );
};

export default DiagnosticRequestForm;
