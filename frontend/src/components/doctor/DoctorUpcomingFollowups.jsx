import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Video, User, CheckCircle2, ChevronRight } from 'lucide-react';

export default function DoctorUpcomingFollowups({ followups = [] }) {
    const defaultFollowups = [
        {
            id: 1,
            patientName: 'Sunita Sharma',
            patientAge: 48,
            gender: 'Female',
            time: '10:30 AM',
            date: 'Today',
            condition: 'Hypertension Review',
            type: 'Teleconsultation',
            status: 'Scheduled',
            risk: 'Moderate',
        },
        {
            id: 2,
            patientName: 'Rajesh Kumar',
            patientAge: 62,
            gender: 'Male',
            time: '11:45 AM',
            date: 'Today',
            condition: 'Diabetes Type 2 Follow-up',
            type: 'In-Person',
            status: 'Confirmed',
            risk: 'High',
        },
        {
            id: 3,
            patientName: 'Priya Verma',
            patientAge: 29,
            gender: 'Female',
            time: '02:15 PM',
            date: 'Today',
            condition: 'Post-op Recovery Check',
            type: 'Teleconsultation',
            status: 'Scheduled',
            risk: 'Low',
        },
    ];

    const list = followups.length > 0 ? followups : defaultFollowups;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#f5e4ec] rounded-3xl p-6 shadow-xs flex flex-col gap-4"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-2xl border border-purple-100 flex items-center justify-center">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-[#2d2329] uppercase tracking-wider font-heading">
                            Upcoming Follow-ups
                        </h3>
                        <p className="text-[11px] font-semibold text-[#7d6974]">Scheduled patient appointments</p>
                    </div>
                </div>
                <span className="text-xs font-bold text-[#e13b68] bg-[#ffeff3] px-3 py-1 rounded-full border border-[#f8d4e2]">
                    {list.length} Today
                </span>
            </div>

            <div className="flex flex-col gap-3 mt-1">
                {list.map((item) => (
                    <motion.div
                        key={item.id}
                        whileHover={{ x: 2 }}
                        className="p-4 rounded-2xl border border-[#f5e4ec] bg-stone-50/40 hover:bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-rose-100 text-[#e13b68] flex items-center justify-center font-black text-sm flex-shrink-0">
                                {item.patientName.charAt(0)}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-bold text-[#2d2329] text-sm">{item.patientName}</h4>
                                    <span className="text-[11px] font-semibold text-[#7d6974]">
                                        ({item.patientAge}y · {item.gender})
                                    </span>
                                    {item.risk === 'High' && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-[#e13b68] flex items-center gap-1">
                                            <motion.span 
                                                animate={{ scale: [1, 1.3, 1] }} 
                                                transition={{ repeat: Infinity, duration: 1.5 }}
                                                className="w-1.5 h-1.5 rounded-full bg-[#e13b68]"
                                            />
                                            High Risk
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs font-medium text-[#7d6974] mt-0.5 flex items-center gap-2">
                                    <span>{item.condition}</span>
                                    <span>·</span>
                                    <span className="text-purple-700 font-bold">{item.type}</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#f5e4ec]">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-[#2d2329] bg-white px-3 py-1.5 rounded-xl border border-[#f5e4ec]">
                                <Clock className="w-3.5 h-3.5 text-[#e13b68]" />
                                <span>{item.time}</span>
                            </div>
                            <button className="px-3.5 py-1.5 rounded-xl bg-[#e13b68] hover:bg-[#c92a55] text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer">
                                <span>Start</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
