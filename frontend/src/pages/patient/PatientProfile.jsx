import React, { useState, useEffect } from 'react';
import { User, ShieldCheck, Heart, Phone, Mail, Calendar, MapPin, Globe, Activity, AlertCircle, CheckCircle2, Save, FileText, Sparkles, ExternalLink } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import MinimalistAvatar from '../../components/common/MinimalistAvatar';

export const PatientProfile = () => {
    const { user, refreshProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

    const profile = user?.profile || {};

    const [formData, setFormData] = useState({
        fullName: profile.fullName || '',
        dateOfBirth: profile.dateOfBirth ? String(profile.dateOfBirth).split('T')[0] : '',
        sex: profile.sex || 'male',
        preferredLanguage: profile.preferredLanguage || 'en',
        region: profile.region || '',
        abhaNumber: profile.abhaNumber || '',
        emergencyContact: profile.emergencyContact || '',
        pastMedicalHistory: profile.pastMedicalHistory || '',
        familyMedicalHistory: profile.familyMedicalHistory || '',
        medicalConditions: Array.isArray(profile.medicalConditions) ? profile.medicalConditions.join(', ') : (profile.medicalConditions || ''),
        allergies: Array.isArray(profile.allergies) ? profile.allergies.join(', ') : (profile.allergies || ''),
        currentMedications: Array.isArray(profile.currentMedications) ? profile.currentMedications.join(', ') : (profile.currentMedications || ''),
    });

    useEffect(() => {
        if (user?.profile) {
            const p = user.profile;
            setFormData({
                fullName: p.fullName || '',
                dateOfBirth: p.dateOfBirth ? String(p.dateOfBirth).split('T')[0] : '',
                sex: p.sex || 'male',
                preferredLanguage: p.preferredLanguage || 'en',
                region: p.region || '',
                abhaNumber: p.abhaNumber || '',
                emergencyContact: p.emergencyContact || '',
                pastMedicalHistory: p.pastMedicalHistory || '',
                familyMedicalHistory: p.familyMedicalHistory || '',
                medicalConditions: Array.isArray(p.medicalConditions) ? p.medicalConditions.join(', ') : (p.medicalConditions || ''),
                allergies: Array.isArray(p.allergies) ? p.allergies.join(', ') : (p.allergies || ''),
                currentMedications: Array.isArray(p.currentMedications) ? p.currentMedications.join(', ') : (p.currentMedications || ''),
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setStatusMsg({ type: '', text: '' });

        try {
            const payload = {
                fullName: formData.fullName,
                dateOfBirth: formData.dateOfBirth || null,
                sex: formData.sex,
                preferredLanguage: formData.preferredLanguage,
                region: formData.region,
                abhaNumber: formData.abhaNumber || null,
                emergencyContact: formData.emergencyContact || null,
                pastMedicalHistory: formData.pastMedicalHistory || null,
                familyMedicalHistory: formData.familyMedicalHistory || null,
                medicalConditions: formData.medicalConditions ? formData.medicalConditions.split(',').map((s) => s.trim()).filter(Boolean) : [],
                allergies: formData.allergies ? formData.allergies.split(',').map((s) => s.trim()).filter(Boolean) : [],
                currentMedications: formData.currentMedications ? formData.currentMedications.split(',').map((s) => s.trim()).filter(Boolean) : [],
            };

            await api.patch('/profile/patient', payload);
            await refreshProfile();
            setStatusMsg({ type: 'success', text: 'Profile & Clinical Records updated successfully!' });
        } catch (err) {
            setStatusMsg({
                type: 'error',
                text: err.response?.data?.error || 'Failed to update profile. Please try again.',
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="w-full flex flex-col gap-6 text-left animate-fade-in-up max-w-5xl mx-auto pb-12">
            {/* Header Title Card */}
            <div className="bg-white border border-[#f5e4ec] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
                <div className="flex items-center gap-4">
                    <MinimalistAvatar
                        name={formData.fullName || user?.phone}
                        role="patient"
                        size={64}
                        showStatus={true}
                        status="online"
                    />
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-[#1c1218] font-heading tracking-tight">
                            {formData.fullName || 'Patient Profile'}
                        </h1>
                        <p className="text-xs font-medium text-[#7d6974] mt-1 flex items-center gap-3">
                            <span>Phone: <strong className="text-[#2d2329] font-bold">{user?.phone || 'Not set'}</strong></span>
                            {user?.email && <span>• Email: <strong className="text-[#2d2329] font-bold">{user.email}</strong></span>}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="p-3 bg-[#fdf5f7] border border-[#f5e4ec] rounded-2xl flex items-center gap-2 text-xs font-bold text-[#e13b68]">
                        <ShieldCheck className="w-4 h-4" />
                        <span>ABDM Ayushman Verified</span>
                    </div>
                </div>
            </div>

            {/* Notification Alert */}
            {statusMsg.text && (
                <div
                    className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                        statusMsg.type === 'success'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                >
                    {statusMsg.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    )}
                    <span>{statusMsg.text}</span>
                </div>
            )}

            <form onSubmit={handleSave} className="flex flex-col gap-6">
                {/* 1. Basic Demographic Information */}
                <div className="bg-white border border-[#f5e4ec] rounded-3xl p-6 md:p-8 flex flex-col gap-5 shadow-xs">
                    <div className="flex items-center gap-2 border-b border-[#f5e4ec] pb-3">
                        <User className="w-5 h-5 text-[#e13b68]" />
                        <h2 className="text-lg font-black text-[#2d2329] font-heading">
                            Personal & Demographic Details
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Full Legal Name"
                            id="fullName"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                            placeholder="e.g. Raunak Srivastava"
                        />
                        <Input
                            label="Date of Birth"
                            id="dateOfBirth"
                            name="dateOfBirth"
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1 w-full text-left">
                            <label className="text-xs font-bold text-[#4a3c45] uppercase tracking-wider">Sex</label>
                            <select
                                name="sex"
                                value={formData.sex}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-2xl border border-[#f5e4ec] bg-[#fdf5f7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#e13b68]/20 text-xs font-bold text-[#2d2329]"
                            >
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1 w-full text-left">
                            <label className="text-xs font-bold text-[#4a3c45] uppercase tracking-wider">Preferred Language</label>
                            <select
                                name="preferredLanguage"
                                value={formData.preferredLanguage}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-2xl border border-[#f5e4ec] bg-[#fdf5f7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#e13b68]/20 text-xs font-bold text-[#2d2329]"
                            >
                                <option value="en">English</option>
                                <option value="hi">Hindi (हिन्दी)</option>
                                <option value="bn">Bengali (বাংলা)</option>
                                <option value="ta">Tamil (தமிழ்)</option>
                                <option value="te">Telugu (తెలుగు)</option>
                                <option value="mr">Marathi (मराठी)</option>
                                <option value="gu">Gujarati (ગુજરાતી)</option>
                            </select>
                        </div>

                        <Input
                            label="City / Region"
                            id="region"
                            name="region"
                            value={formData.region}
                            onChange={handleChange}
                            placeholder="e.g. Jamshedpur"
                        />
                    </div>
                </div>

                {/* 2. ABHA & Digital Health ID */}
                <div className="bg-white border border-[#f5e4ec] rounded-3xl p-6 md:p-8 flex flex-col gap-5 shadow-xs">
                    <div className="flex items-center justify-between border-b border-[#f5e4ec] pb-3">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-[#e13b68]" />
                            <h2 className="text-lg font-black text-[#2d2329] font-heading">
                                Ayushman Bharat Digital Health ID (ABHA)
                            </h2>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-[#fdf0f4] text-[#e13b68] border border-[#f8c8d8]">
                            Govt of India ABDM
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <Input
                            label="14-Digit ABHA ID Number"
                            id="abhaNumber"
                            name="abhaNumber"
                            value={formData.abhaNumber}
                            onChange={handleChange}
                            placeholder="e.g. 12-3456-7890-1234"
                        />
                        <div className="p-4 bg-[#fdf5f7] border border-[#f5e4ec] rounded-2xl flex flex-col gap-1">
                            <span className="text-xs font-black text-[#2d2329]">ABDM Ecosystem Integration</span>
                            <p className="text-[11px] font-semibold text-[#7d6974]">
                                Linking your ABHA ID allows doctors to access verifiable lab reports, prescriptions, and immunizations nationwide.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 3. Clinical & Medical History */}
                <div className="bg-white border border-[#f5e4ec] rounded-3xl p-6 md:p-8 flex flex-col gap-5 shadow-xs">
                    <div className="flex items-center gap-2 border-b border-[#f5e4ec] pb-3">
                        <Activity className="w-5 h-5 text-[#e13b68]" />
                        <h2 className="text-lg font-black text-[#2d2329] font-heading">
                            Clinical Health Profile & Medical History
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1 text-left">
                            <label className="text-xs font-bold text-[#4a3c45] uppercase tracking-wider">
                                Known Allergies
                            </label>
                            <input
                                type="text"
                                name="allergies"
                                value={formData.allergies}
                                onChange={handleChange}
                                placeholder="e.g. Penicillin, Peanuts"
                                className="w-full px-4 py-2.5 rounded-2xl border border-[#f5e4ec] bg-[#fdf5f7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#e13b68]/20 text-xs font-semibold text-[#2d2329]"
                            />
                            <span className="text-[10px] text-[#7d6974]">Comma separated</span>
                        </div>

                        <div className="flex flex-col gap-1 text-left">
                            <label className="text-xs font-bold text-[#4a3c45] uppercase tracking-wider">
                                Chronic Conditions
                            </label>
                            <input
                                type="text"
                                name="medicalConditions"
                                value={formData.medicalConditions}
                                onChange={handleChange}
                                placeholder="e.g. Hypertension, Type 2 Diabetes"
                                className="w-full px-4 py-2.5 rounded-2xl border border-[#f5e4ec] bg-[#fdf5f7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#e13b68]/20 text-xs font-semibold text-[#2d2329]"
                            />
                            <span className="text-[10px] text-[#7d6974]">Comma separated</span>
                        </div>

                        <div className="flex flex-col gap-1 text-left">
                            <label className="text-xs font-bold text-[#4a3c45] uppercase tracking-wider">
                                Current Medications
                            </label>
                            <input
                                type="text"
                                name="currentMedications"
                                value={formData.currentMedications}
                                onChange={handleChange}
                                placeholder="e.g. Metformin 500mg, Amlodipine"
                                className="w-full px-4 py-2.5 rounded-2xl border border-[#f5e4ec] bg-[#fdf5f7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#e13b68]/20 text-xs font-semibold text-[#2d2329]"
                            />
                            <span className="text-[10px] text-[#7d6974]">Comma separated</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1 text-left">
                            <label className="text-xs font-bold text-[#4a3c45] uppercase tracking-wider">
                                Past Medical / Surgical History
                            </label>
                            <textarea
                                name="pastMedicalHistory"
                                rows={3}
                                value={formData.pastMedicalHistory}
                                onChange={handleChange}
                                placeholder="Any previous hospitalizations, surgeries, or major illnesses..."
                                className="w-full p-4 rounded-2xl border border-[#f5e4ec] bg-[#fdf5f7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#e13b68]/20 text-xs font-semibold text-[#2d2329] resize-none"
                            />
                        </div>

                        <div className="flex flex-col gap-1 text-left">
                            <label className="text-xs font-bold text-[#4a3c45] uppercase tracking-wider">
                                Emergency Contact Information
                            </label>
                            <textarea
                                name="emergencyContact"
                                rows={3}
                                value={formData.emergencyContact}
                                onChange={handleChange}
                                placeholder="Name, relationship, and emergency phone number..."
                                className="w-full p-4 rounded-2xl border border-[#f5e4ec] bg-[#fdf5f7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#e13b68]/20 text-xs font-semibold text-[#2d2329] resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Save Button Bar */}
                <div className="flex items-center justify-end gap-4 pt-2">
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={saving}
                        className="px-8 py-3 rounded-full text-sm font-black flex items-center gap-2 shadow-sm"
                    >
                        <Save className="w-4 h-4" />
                        <span>{saving ? 'Saving Profile...' : 'Save & Update Profile'}</span>
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default PatientProfile;
