import React, { useState, useEffect } from 'react';
import {
    Building,
    MapPin,
    Clock,
    IndianRupee,
    Plus,
    Pencil,
    Trash2,
    Calendar,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Search,
    X,
    Sparkles
} from 'lucide-react';
import api from '../../services/api';
import clinicService from '../../services/clinicService';
import useAuth from '../../hooks/useAuth';
import Badge from '../../components/common/Badge';

const DAYS_OF_WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export const DoctorPracticeLocations = () => {
    const { user, refreshUser } = useAuth();
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // Available registered clinics on Sanjeevani
    const [registeredClinics, setRegisteredClinics] = useState([]);
    const [clinicSearch, setClinicSearch] = useState('');

    const [form, setForm] = useState({
        clinicName: '',
        address: '',
        city: '',
        consultationFee: '',
        startTime: '09:00',
        endTime: '17:00',
        days: ['MON', 'WED', 'FRI'],
        clinicId: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load doctor profile availability
            const res = await api.get('/profile/me');
            const profile = res.data?.profile || {};
            const existingLocations = profile.availability?.practiceLocations || [];
            
            // If empty, initialize with any registered clinic info if present
            if (existingLocations.length === 0 && (profile.clinicOrHospital || profile.city)) {
                setLocations([
                    {
                        id: 'default_loc',
                        clinicName: profile.clinicOrHospital || 'Primary Consultation Center',
                        address: profile.city ? `${profile.city}, India` : 'Registered Practice Location',
                        city: profile.city || '',
                        consultationFee: profile.consultationFee || 500,
                        startTime: '10:00',
                        endTime: '18:00',
                        days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
                        clinicId: profile.clinicId || ''
                    }
                ]);
            } else {
                setLocations(existingLocations);
            }

            // Load registered clinics
            const clinicRes = await clinicService.getAllClinics().catch(() => ({ clinics: [] }));
            setRegisteredClinics(clinicRes.clinics || []);
        } catch (err) {
            console.error('Failed to load doctor practice locations', err);
            setErrorMsg('Failed to load clinic locations. Please refresh.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAdd = () => {
        setEditingIndex(null);
        setForm({
            clinicName: '',
            address: '',
            city: user?.profile?.city || '',
            consultationFee: user?.profile?.consultationFee || '500',
            startTime: '09:00',
            endTime: '17:00',
            days: ['MON', 'WED', 'FRI'],
            clinicId: ''
        });
        setIsFormOpen(true);
        setErrorMsg('');
        setSuccessMsg('');
    };

    const handleOpenEdit = (index) => {
        setEditingIndex(index);
        const item = locations[index];
        setForm({
            clinicName: item.clinicName || '',
            address: item.address || '',
            city: item.city || '',
            consultationFee: item.consultationFee ? String(item.consultationFee) : '500',
            startTime: item.startTime || '09:00',
            endTime: item.endTime || '17:00',
            days: item.days || ['MON', 'WED', 'FRI'],
            clinicId: item.clinicId || ''
        });
        setIsFormOpen(true);
        setErrorMsg('');
        setSuccessMsg('');
    };

    const handleToggleDay = (day) => {
        setForm((prev) => {
            const exists = prev.days.includes(day);
            const updated = exists ? prev.days.filter((d) => d !== day) : [...prev.days, day];
            return { ...prev, days: updated };
        });
    };

    const handleSelectRegisteredClinic = (e) => {
        const clinicUserId = e.target.value;
        if (!clinicUserId) {
            setForm((prev) => ({ ...prev, clinicId: '' }));
            return;
        }
        const selected = registeredClinics.find((c) => (c.userId || c.id) === clinicUserId);
        if (selected) {
            setForm((prev) => ({
                ...prev,
                clinicId: selected.userId || selected.id,
                clinicName: selected.clinicName || selected.name || '',
                address: selected.address || `${selected.city || ''}, ${selected.state || ''}`,
                city: selected.city || prev.city
            }));
        }
    };

    const handleSaveLocation = async (e) => {
        e.preventDefault();
        if (!form.clinicName.trim() || !form.address.trim()) {
            setErrorMsg('Please enter the clinic/hospital name and address.');
            return;
        }
        if (form.days.length === 0) {
            setErrorMsg('Please select at least one day of consultation.');
            return;
        }

        setSaving(true);
        setErrorMsg('');

        try {
            const newLocation = {
                id: editingIndex !== null ? locations[editingIndex].id || `loc_${Date.now()}` : `loc_${Date.now()}`,
                clinicName: form.clinicName.trim(),
                address: form.address.trim(),
                city: form.city.trim(),
                consultationFee: form.consultationFee ? parseFloat(form.consultationFee) : 500,
                startTime: form.startTime,
                endTime: form.endTime,
                days: form.days,
                clinicId: form.clinicId || null,
                updatedAt: new Date().toISOString()
            };

            let updatedList;
            if (editingIndex !== null) {
                updatedList = [...locations];
                updatedList[editingIndex] = newLocation;
            } else {
                updatedList = [...locations, newLocation];
            }

            // Sync with profile
            const currentProfile = user?.profile || {};
            const updatedAvailability = {
                ...(currentProfile.availability || {}),
                practiceLocations: updatedList
            };

            await api.patch('/doctors/profile', {
                availability: updatedAvailability,
                clinicOrHospital: updatedList[0]?.clinicName || currentProfile.clinicOrHospital,
                consultationFee: updatedList[0]?.consultationFee || currentProfile.consultationFee,
                clinicId: updatedList[0]?.clinicId || currentProfile.clinicId
            });

            setLocations(updatedList);
            setIsFormOpen(false);
            setSuccessMsg(editingIndex !== null ? 'Practice location updated successfully!' : 'New clinic location added successfully!');
            if (refreshUser) refreshUser();
        } catch (err) {
            console.error('Failed to save practice location', err);
            setErrorMsg(err.response?.data?.error || 'Failed to save clinic location. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteLocation = async (index) => {
        if (!window.confirm('Are you sure you want to remove this practice location?')) return;
        setSaving(true);
        try {
            const updatedList = locations.filter((_, i) => i !== index);
            const currentProfile = user?.profile || {};
            const updatedAvailability = {
                ...(currentProfile.availability || {}),
                practiceLocations: updatedList
            };

            await api.patch('/doctors/profile', {
                availability: updatedAvailability,
                clinicOrHospital: updatedList[0]?.clinicName || '',
                consultationFee: updatedList[0]?.consultationFee || null,
                clinicId: updatedList[0]?.clinicId || null
            });

            setLocations(updatedList);
            setSuccessMsg('Practice location removed.');
            if (refreshUser) refreshUser();
        } catch (err) {
            console.error('Failed to delete practice location', err);
            setErrorMsg('Failed to remove location.');
        } finally {
            setSaving(false);
        }
    };

    const filteredClinics = registeredClinics.filter((c) => {
        if (!clinicSearch) return true;
        const q = clinicSearch.toLowerCase();
        return (
            (c.clinicName && c.clinicName.toLowerCase().includes(q)) ||
            (c.city && c.city.toLowerCase().includes(q)) ||
            (c.name && c.name.toLowerCase().includes(q))
        );
    });

    return (
        <div className="w-full flex flex-col gap-6 text-left animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-[#f5e4ec] rounded-3xl p-6 md:p-8 shadow-xs">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#e13b68] bg-[#ffe6ee] px-2.5 py-0.5 rounded-full">
                            Clinic Management
                        </span>
                        <Badge variant="mint" dot>
                            Active & Verified
                        </Badge>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-[#2d2329] font-heading">
                        Manage Practice Locations
                    </h1>
                    <p className="text-xs font-semibold text-[#7d6974] mt-1">
                        Add every clinic you consult at — each one can have its own fee and timing.
                    </p>
                </div>

                {!isFormOpen && (
                    <button
                        onClick={handleOpenAdd}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#e13b68] hover:bg-[#c92a55] text-white text-xs font-bold shadow-xs transition duration-150 self-start md:self-auto"
                    >
                        <Plus className="w-4 h-4" />
                        Add Practice Location
                    </button>
                )}
            </div>

            {/* Notifications */}
            {successMsg && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{successMsg}</span>
                </div>
            )}
            {errorMsg && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}

            {/* Add / Edit Clinic Form Drawer */}
            {isFormOpen && (
                <div className="bg-white border-2 border-[#e13b68]/30 rounded-3xl p-6 md:p-8 shadow-md flex flex-col gap-6 animate-fade-in">
                    <div className="flex items-center justify-between border-b border-[#f5e4ec] pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-[#ffe6ee] text-[#e13b68] flex items-center justify-center">
                                <Building className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-[#2d2329]">
                                    {editingIndex !== null ? 'Edit Practice Location' : 'Add a Clinic / Hospital Location'}
                                </h3>
                                <p className="text-xs text-[#7d6974] font-medium">
                                    Set location address, consultation fee, and consulting hours.
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsFormOpen(false)}
                            className="px-3 py-1.5 rounded-xl border border-[#f5e4ec] text-[#7d6974] hover:bg-[#fffcfd] text-xs font-bold transition"
                        >
                            Close Form
                        </button>
                    </div>

                    {/* Quick Link from Registered Sanjeevani Clinics */}
                    {registeredClinics.length > 0 && (
                        <div className="p-4 rounded-2xl bg-[#fffcfd] border border-[#f5e4ec] flex flex-col gap-2">
                            <label className="text-xs font-bold text-[#4a3c45] uppercase tracking-wider flex items-center gap-2">
                                <Sparkles className="w-3.5 h-3.5 text-[#e13b68]" />
                                Quick Select from Registered Sanjeevani Clinics (Optional)
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <div className="relative">
                                    <Search className="w-3.5 h-3.5 text-[#7d6974] absolute left-3 top-3 pointer-events-none" />
                                    <input
                                        type="text"
                                        placeholder="Filter clinics by name or city..."
                                        value={clinicSearch}
                                        onChange={(e) => setClinicSearch(e.target.value)}
                                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#f5e4ec] bg-white text-xs focus:ring-2 focus:ring-[#e13b68]/30 focus:outline-none"
                                    />
                                </div>
                                <select
                                    value={form.clinicId || ''}
                                    onChange={handleSelectRegisteredClinic}
                                    className="w-full px-3 py-2 rounded-xl border border-[#f5e4ec] bg-white text-xs focus:ring-2 focus:ring-[#e13b68]/30 focus:outline-none font-medium"
                                >
                                    <option value="">— Choose a registered center —</option>
                                    {filteredClinics.map((c) => (
                                        <option key={c.userId || c.id} value={c.userId || c.id}>
                                            {c.clinicName || c.name} ({c.city || 'India'})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSaveLocation} className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-[#4a3c45] uppercase tracking-wider">
                                    Clinic / Hospital Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Sanjeevani Health Center / City Heart Care"
                                    value={form.clinicName}
                                    onChange={(e) => setForm({ ...form, clinicName: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-2xl border border-[#f5e4ec] bg-white text-[#2d2329] focus:ring-2 focus:ring-[#e13b68]/30 focus:border-[#e13b68] text-sm focus:outline-none shadow-2xs"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-[#4a3c45] uppercase tracking-wider">
                                    Address / Locality <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. 12 MG Road, near Metro Station, Delhi"
                                    value={form.address}
                                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-2xl border border-[#f5e4ec] bg-white text-[#2d2329] focus:ring-2 focus:ring-[#e13b68]/30 focus:border-[#e13b68] text-sm focus:outline-none shadow-2xs"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-[#4a3c45] uppercase tracking-wider">
                                    Consultation Fee (₹) <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <IndianRupee className="w-4 h-4 text-[#7d6974] absolute left-3.5 top-3 pointer-events-none" />
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        placeholder="e.g. 600"
                                        value={form.consultationFee}
                                        onChange={(e) => setForm({ ...form, consultationFee: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#f5e4ec] bg-white text-[#2d2329] focus:ring-2 focus:ring-[#e13b68]/30 focus:border-[#e13b68] text-sm focus:outline-none shadow-2xs"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-[#4a3c45] uppercase tracking-wider">
                                    Start Time <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="time"
                                    required
                                    value={form.startTime}
                                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-2xl border border-[#f5e4ec] bg-white text-[#2d2329] focus:ring-2 focus:ring-[#e13b68]/30 focus:border-[#e13b68] text-sm focus:outline-none shadow-2xs"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-[#4a3c45] uppercase tracking-wider">
                                    End Time <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="time"
                                    required
                                    value={form.endTime}
                                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-2xl border border-[#f5e4ec] bg-white text-[#2d2329] focus:ring-2 focus:ring-[#e13b68]/30 focus:border-[#e13b68] text-sm focus:outline-none shadow-2xs"
                                />
                            </div>
                        </div>

                        {/* Consultation Days Selector */}
                        <div className="flex flex-col gap-2 pt-1">
                            <label className="text-xs font-bold text-[#4a3c45] uppercase tracking-wider">
                                Days of Consultation <span className="text-rose-500">*</span>
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {DAYS_OF_WEEK.map((day) => {
                                    const selected = form.days.includes(day);
                                    return (
                                        <button
                                            key={day}
                                            type="button"
                                            onClick={() => handleToggleDay(day)}
                                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                                selected
                                                    ? 'bg-[#e13b68] text-white shadow-xs scale-102'
                                                    : 'bg-white border border-[#f5e4ec] text-[#7d6974] hover:bg-[#ffe6ee] hover:text-[#e13b68]'
                                            }`}
                                        >
                                            {day}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-3 pt-3 border-t border-[#f5e4ec]">
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-2.5 rounded-full bg-[#e13b68] hover:bg-[#c92a55] text-white text-xs font-bold shadow-xs transition duration-150 flex items-center gap-2 disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                {editingIndex !== null ? 'Update Practice Location' : 'Save Clinic Location'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsFormOpen(false)}
                                className="px-5 py-2.5 rounded-full border border-[#f5e4ec] bg-white hover:bg-zinc-50 text-[#7d6974] text-xs font-bold transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Practice Locations Cards List */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-black text-[#2d2329] font-heading flex items-center gap-2">
                        <span>Your Practice Locations</span>
                        <span className="text-xs font-bold text-[#7d6974] bg-[#ffe6ee] px-2.5 py-0.5 rounded-full">
                            {locations.length} {locations.length === 1 ? 'Location' : 'Locations'}
                        </span>
                    </h2>
                </div>

                {loading ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-[#f5e4ec]">
                        <Loader2 className="w-6 h-6 text-[#e13b68] animate-spin" />
                        <span className="text-xs font-bold text-[#7d6974]">Loading practice locations…</span>
                    </div>
                ) : locations.length === 0 ? (
                    <div className="p-10 text-center flex flex-col items-center justify-center gap-4 bg-white rounded-3xl border border-[#f5e4ec]">
                        <div className="w-14 h-14 rounded-3xl bg-[#ffe6ee] text-[#e13b68] flex items-center justify-center">
                            <Building className="w-7 h-7" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-[#2d2329]">No Practice Locations Added Yet</h3>
                            <p className="text-xs text-[#7d6974] font-medium mt-0.5 max-w-md">
                                Add clinics, hospitals, or consulting rooms where patients can visit you in person.
                            </p>
                        </div>
                        <button
                            onClick={handleOpenAdd}
                            className="px-5 py-2.5 rounded-full bg-[#e13b68] hover:bg-[#c92a55] text-white text-xs font-bold shadow-xs transition"
                        >
                            + Add Your First Clinic Location
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {locations.map((loc, idx) => (
                            <div
                                key={loc.id || idx}
                                className="bg-white border border-[#f5e4ec] hover:border-[#f5c6d6] rounded-3xl p-6 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between gap-4"
                            >
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3">
                                            <div className="w-11 h-11 rounded-2xl bg-[#ffe6ee] text-[#e13b68] flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <Building className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-black text-[#2d2329] leading-snug">
                                                    {loc.clinicName}
                                                </h3>
                                                <p className="text-xs text-[#7d6974] font-medium flex items-center gap-1 mt-1">
                                                    <MapPin className="w-3.5 h-3.5 text-[#e13b68] flex-shrink-0" />
                                                    <span>{loc.address}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleOpenEdit(idx)}
                                                className="p-2 rounded-xl text-[#7d6974] hover:text-[#e13b68] hover:bg-[#ffe6ee] transition"
                                                title="Edit location"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteLocation(idx)}
                                                className="p-2 rounded-xl text-[#7d6974] hover:text-rose-600 hover:bg-rose-50 transition"
                                                title="Delete location"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Fee and Timing */}
                                    <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-[#f5e4ec]/80 text-xs">
                                        <div className="flex items-center gap-1 font-bold text-[#2d2329]">
                                            <IndianRupee className="w-3.5 h-3.5 text-[#e13b68]" />
                                            <span>{loc.consultationFee ? `${loc.consultationFee} per visit` : '₹ 500 per visit'}</span>
                                        </div>
                                        <div className="flex items-center gap-1 font-semibold text-[#7d6974]">
                                            <Clock className="w-3.5 h-3.5 text-[#7d6974]" />
                                            <span>{loc.startTime || '09:00'} – {loc.endTime || '17:00'}</span>
                                        </div>
                                    </div>

                                    {/* Days Pills */}
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {(loc.days || ['MON', 'WED', 'FRI']).map((d) => (
                                            <span
                                                key={d}
                                                className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-[#fffcfd] border border-[#f5e4ec] text-[#4a3c45]"
                                            >
                                                {d}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Dashed Add Another Clinic Card (matches user ref Screenshot 2) */}
                        <button
                            onClick={handleOpenAdd}
                            className="border-2 border-dashed border-[#f5c6d6] hover:border-[#e13b68] bg-[#fffcfd] hover:bg-[#ffe6ee]/30 rounded-3xl p-8 flex flex-col items-center justify-center gap-2 text-[#e13b68] transition duration-200 min-h-[160px] group"
                        >
                            <div className="w-10 h-10 rounded-full bg-[#ffe6ee] group-hover:bg-[#e13b68] group-hover:text-white text-[#e13b68] flex items-center justify-center transition-colors">
                                <Plus className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-bold text-[#2d2329] group-hover:text-[#e13b68] transition-colors">
                                + Add another clinic
                            </span>
                            <span className="text-xs text-[#7d6974]">
                                Configure additional practice chambers, hospitals, or OPD timings.
                            </span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DoctorPracticeLocations;
