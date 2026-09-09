import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import healthWorkerService from '../../services/healthWorkerService';

const HealthWorkerPatientDetails = () => {
    const { patientId } = useParams();
    const [data, setData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        healthWorkerService.getPatient(patientId).then(setData).catch((err) => setError(err.response?.data?.error || 'Could not load patient'));
    }, [patientId]);

    const patient = data?.patient;
    return <div className="w-full flex flex-col gap-6 text-left">
        <Link to="/health-worker/patients" className="font-bold underline">← Back to My Patients</Link>
        {error && <div className="p-3 rounded-xl border border-red-300 bg-red-50 text-red-700 font-semibold">{error}</div>}
        {patient && <>
            <div className="bg-white border-2 border-ink-black rounded-3xl p-8 shadow-sm"><h2 className="text-3xl font-black">{patient.name}</h2><p className="text-sm font-semibold mt-1">{patient.region || 'Location unavailable'} · {patient.phone || 'No phone number'}</p><p className={`mt-4 font-black ${patient.risk === 'HIGH' ? 'text-red-700' : 'text-emerald-700'}`}>Risk: {patient.risk}</p></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[['Conditions', patient.medicalConditions], ['Allergies', patient.allergies], ['Current medicines', patient.currentMedications]].map(([label, values]) => <section key={label} className="bg-white border-2 border-ink-black rounded-2xl p-5"><h3 className="font-black">{label}</h3><p className="text-sm mt-2">{values?.length ? values.join(', ') : 'None recorded'}</p></section>)}</div>
            <div className="bg-white border-2 border-ink-black rounded-2xl p-5"><h3 className="font-black">Latest triage</h3><p className="text-sm mt-2">{patient.latestTriage ? `${patient.latestTriage.category} · reported ${new Date(patient.latestTriage.reportedAt).toLocaleDateString()}` : 'No triage report recorded.'}</p></div>
        </>}
    </div>;
};

export default HealthWorkerPatientDetails;