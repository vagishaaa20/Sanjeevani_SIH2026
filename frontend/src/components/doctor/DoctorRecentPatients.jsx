import React from 'react';
import { motion } from 'framer-motion';
import { UserCheck, ShieldAlert, FileText, ChevronRight, Activity } from 'lucide-react';

export default function DoctorRecentPatients({ patients = [] }) {
    const defaultPatients = [
        {
            id: 101,
            name: 'Ramesh Patel',
            age: 54,
            gender: 'Male',
            lastVisit: '2 hours ago',
            diagnosis: 'Acute Gastroenteritis',
            riskLevel: 'Moderate',
            status: 'Prescription Issued',
        },
        {
            id: 102,
            name: 'Ananya Roy',
            age: 34,
            gender: 'Female',
            lastVisit: 'Yesterday',
            diagnosis: 'Migraine Exacerbation',
            riskLevel: 'Low',
            status: 'Lab Tests Ordered',
        },
        {
            id: 103,
            name: 'Harish Chandra',
            age: 67,
            gender: 'Male',
            lastVisit: '2 days ago',
            diagnosis: 'Chronic Bronchitis',
            riskLevel: 'High',
            status: 'Follow-up Required',
        },
    ];

    const list = patients.length > 0 ? patients : defaultPatients;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#f5e4ec] rounded-3xl p-6 shadow-xs flex flex-col gap-4"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 flex items-center justify-center">
                        <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-[#2d2329] uppercase tracking-wider font-heading">
                            Recent Patients
                        </h3>
                        <p className="text-[11px] font-semibold text-[#7d6974]">Recently consulted clinical records</p>
                    </div>
                </div>
                <button className="text-xs font-bold text-[#e13b68] hover:underline flex items-center gap-1 cursor-pointer">
                    <span>View All</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="flex flex-col gap-3 mt-1">
                {list.map((patient) => (
                    <motion.div
                        key={patient.id}
                        whileHover={{ x: 2 }}
                        className="p-4 rounded-2xl border border-[#f5e4ec] bg-stone-50/30 hover:bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm flex-shrink-0">
                                {patient.name.charAt(0)}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-bold text-[#2d2329] text-sm">{patient.name}</h4>
                                    <span className="text-[11px] font-semibold text-[#7d6974]">
                                        ({patient.age}y · {patient.gender})
                                    </span>
                                </div>
                                <p className="text-xs font-medium text-[#7d6974] mt-0.5 flex items-center gap-2">
                                    <span className="font-semibold text-[#2d2329]">{patient.diagnosis}</span>
                                    <span>·</span>
                                    <span>{patient.lastVisit}</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#f5e4ec]">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                patient.riskLevel === 'High' 
                                    ? 'bg-rose-100 text-[#e13b68]' 
                                    : patient.riskLevel === 'Moderate'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-800'
                            }`}>
                                {patient.riskLevel} Risk
                            </span>
                            <button className="px-3 py-1.5 rounded-xl border border-[#f5e4ec] bg-white hover:bg-rose-50 text-[#e13b68] text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer">
                                <FileText className="w-3.5 h-3.5" />
                                <span>Record</span>
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
