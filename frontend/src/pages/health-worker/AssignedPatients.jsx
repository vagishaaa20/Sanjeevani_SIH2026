import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import healthWorkerService from '../../services/healthWorkerService';
import highRiskService from '../../services/highRiskService';

const AssignedPatients = () => {
    const [patients, setPatients] = useState([]);
    const [error, setError] = useState('');

    const loadPatients = () => {
        healthWorkerService.getPatients().then((data) => setPatients(data.patients || [])).catch((err) => setError(err.response?.data?.error || 'Could not load patients'));
    };

    useEffect(() => {
        loadPatients();
    }, []);

    const markHighRisk = async (patientId) => {
        const reason = window.prompt("Enter reason for marking as High Risk:");
        if (!reason) return;
        try {
            await highRiskService.createManualHighRisk(patientId, reason);
            alert('Patient marked as High Risk successfully.');
            loadPatients();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to mark as High Risk');
        }
    };

    return (
        <div className="w-full flex flex-col gap-6 text-left">
            <div><h2 className="text-3xl font-black text-ink-black">My Patients</h2><p className="text-sm font-semibold text-ink-charcoal">All registered patients are shown.</p></div>
            {error && <div className="p-3 rounded-xl border border-red-300 bg-red-50 text-red-700 font-semibold">{error}</div>}
            <div className="bg-white border-2 border-ink-black rounded-2xl overflow-x-auto shadow-sm">
                <table className="min-w-full text-sm"><thead className="bg-cream-surface"><tr>{['Patient', 'Region', 'Risk', 'Contact', 'Details'].map((heading) => <th key={heading} className="px-4 py-3 text-left font-black">{heading}</th>)}</tr></thead>
                    <tbody>{patients.map((patient) => <tr key={patient.patientId} className="border-t border-zinc-200"><td className="px-4 py-3 font-bold">{patient.name}</td><td className="px-4 py-3">{patient.region || 'N/A'}</td><td className="px-4 py-3"><span className={patient.risk === 'HIGH' ? 'font-black text-red-700' : 'font-bold text-emerald-700'}>{patient.risk}</span></td><td className="px-4 py-3">{patient.phone ? <a className="text-blue-700 underline" href={`tel:${patient.phone}`}>Call</a> : 'N/A'}</td><td className="px-4 py-3 flex gap-3 items-center"><Link className="font-bold underline" to={`/health-worker/patients/${patient.patientId}`}>View</Link> {patient.risk !== 'HIGH' && <button onClick={() => markHighRisk(patient.patientId)} className="text-red-700 underline font-bold text-xs">Mark High Risk</button>}</td></tr>)}</tbody>
                </table>
                {!patients.length && <div className="p-8 text-center text-ink-muted">No assigned patients yet.</div>}
            </div>
        </div>
    );
};

export default AssignedPatients;