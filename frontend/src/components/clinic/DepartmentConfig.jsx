import React, { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import useClinic from '../../hooks/useClinic';
import Button from '../common/Button';

export const DepartmentConfig = ({ currentDepartments, onUpdateSuccess }) => {
    const { updateClinic, loading: updating } = useClinic();
    const { refreshProfile } = useAuth();
    const [selectedDepts, setSelectedDepts] = useState(currentDepartments || []);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const availableDepts = ['OPD', 'Diagnostics', 'Lab', 'Pharmacy', 'Emergency', 'Cardiology', 'Pediatrics', 'Dentistry'];

    const toggleDept = (dept) => {
        setSelectedDepts((prev) =>
            prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
        );
    };

    const handleSave = async () => {
        setMessage('');
        setError('');
        try {
            await updateClinic({ departments: selectedDepts });
            // Update global context profile
            await refreshProfile();
            setMessage('Departments configured successfully!');
            if (onUpdateSuccess) {
                onUpdateSuccess();
            }
        } catch (err) {
            setError(err.message || 'Failed to update departments');
        }
    };

    return (
        <div className="bg-white border-2 border-ink-black rounded-2xl p-6 flex flex-col gap-4 text-left shadow-sm">
            <div>
                <h3 className="text-lg font-bold text-ink-black">OPD Room & Services Configuration</h3>
                <p className="text-xs text-ink-muted mt-0.5">Toggle operational departments that are currently active in your medical registry</p>
            </div>

            {message && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm font-semibold rounded-xl">
                    {message}
                </div>
            )}
            {error && (
                <div className="p-3 bg-red-50 border border-red-300 text-red-800 text-sm font-semibold rounded-xl">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {availableDepts.map((d) => {
                    const active = selectedDepts.includes(d);
                    return (
                        <button
                            key={d}
                            onClick={() => toggleDept(d)}
                            className={`p-4 rounded-xl border border-ink-black font-semibold text-sm transition-all focus:outline-none cursor-pointer flex flex-col items-center justify-center gap-2 select-none ${active
                                    ? 'bg-pastel-pink-soft text-ink-black ring-2 ring-pastel-pink-action'
                                    : 'bg-cream-bg text-ink-muted hover:bg-cream-surface'
                                }`}
                        >
                            <span>{active ? '🟢' : '⚪'}</span>
                            <span>{d}</span>
                        </button>
                    );
                })}
            </div>

            <div className="pt-2 border-t border-cream-surface flex justify-end">
                <Button onClick={handleSave} variant="primary" disabled={updating}>
                    {updating ? 'Saving...' : 'Save Configuration'}
                </Button>
            </div>
        </div>
    );
};

export default DepartmentConfig;
