import { useEffect, useState } from 'react';
import medicineService from '../../services/medicineService';

const EMPTY_FORM = {
    medicineName: '',
    genericName: '',
    quantity: '',
    unit: 'pcs',
    lowStockThreshold: '10',
    isAvailable: true,
};

const getStatusBadge = (status) => {
    const normalized = String(status || '').toUpperCase();
    if (normalized === 'AVAILABLE') {
        return 'bg-emerald-50 text-emerald-700 border-emerald-300';
    }
    if (normalized === 'LOW_STOCK') {
        return 'bg-amber-50 text-amber-700 border-amber-300';
    }
    if (normalized === 'UNAVAILABLE') {
        return 'bg-zinc-100 text-zinc-700 border-zinc-300';
    }
    return 'bg-red-50 text-red-700 border-red-300';
};

const MedicineInventory = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);

    const fetchInventory = async () => {
        try {
            setLoading(true);
            const data = await medicineService.getClinicInventory();
            setItems(data.items || []);
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || 'Could not load inventory');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const loadInventory = async () => {
            await fetchInventory();
        };
        loadInventory();
    }, []);

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError('');

        try {
            const payload = {
                medicineName: form.medicineName.trim(),
                genericName: form.genericName.trim() || null,
                quantity: Number(form.quantity || 0),
                unit: form.unit || 'pcs',
                lowStockThreshold: Number(form.lowStockThreshold || 10),
                isAvailable: form.isAvailable,
            };

            if (!payload.medicineName) {
                setError('Medicine name is required.');
                return;
            }

            if (editingId) {
                await medicineService.updateInventoryItem(editingId, payload);
            } else {
                await medicineService.createInventoryItem(payload);
            }

            resetForm();
            await fetchInventory();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save medicine');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.medicineId);
        setForm({
            medicineName: item.medicineName || '',
            genericName: item.genericName || '',
            quantity: String(item.quantity ?? 0),
            unit: item.unit || 'pcs',
            lowStockThreshold: String(item.lowStockThreshold ?? 10),
            isAvailable: item.isAvailable !== false,
        });
    };

    const handleDelete = async (medicineId) => {
        if (!window.confirm('Remove this medicine from the clinic inventory?')) return;

        try {
            await medicineService.deleteInventoryItem(medicineId);
            await fetchInventory();
        } catch (err) {
            setError(err.response?.data?.error || 'Could not delete medicine');
        }
    };

    return (
        <div className="w-full flex flex-col gap-6 text-left">
            <div className="bg-white border-2 border-ink-black rounded-3xl p-8 flex flex-col md:flex-row md:justify-between md:items-center gap-6 shadow-sm">
                <div>
                    <h2 className="text-3xl font-black text-ink-black">Medicine Inventory</h2>
                    <p className="text-sm font-semibold text-ink-charcoal">Manage clinic medicines and stock levels</p>
                </div>
            </div>

            <div className="bg-white border-2 border-ink-black rounded-2xl p-6 shadow-sm">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">Medicine Name</label>
                        <input
                            name="medicineName"
                            value={form.medicineName}
                            onChange={handleChange}
                            placeholder="Paracetamol 500mg"
                            className="w-full border-2 border-zinc-200 rounded-xl p-2.5 text-sm focus:outline-none focus:border-cerulean"
                        />
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">Generic</label>
                        <input
                            name="genericName"
                            value={form.genericName}
                            onChange={handleChange}
                            placeholder="Optional"
                            className="w-full border-2 border-zinc-200 rounded-xl p-2.5 text-sm focus:outline-none focus:border-cerulean"
                        />
                    </div>
                    <label className="md:col-span-2 flex items-center gap-2 text-sm font-bold text-ink-charcoal cursor-pointer">
                        <input
                            name="isAvailable"
                            type="checkbox"
                            checked={form.isAvailable}
                            onChange={(event) => setForm((prev) => ({ ...prev, isAvailable: event.target.checked }))}
                            className="h-4 w-4 accent-cerulean"
                        />
                        Mark medicine available
                    </label>
                    <div className="md:col-span-1">
                        <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">Stock</label>
                        <input
                            name="quantity"
                            type="number"
                            min="0"
                            value={form.quantity}
                            onChange={handleChange}
                            className="w-full border-2 border-zinc-200 rounded-xl p-2.5 text-sm focus:outline-none focus:border-cerulean"
                        />
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">Unit</label>
                        <input
                            name="unit"
                            value={form.unit}
                            onChange={handleChange}
                            placeholder="pcs"
                            className="w-full border-2 border-zinc-200 rounded-xl p-2.5 text-sm focus:outline-none focus:border-cerulean"
                        />
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">Low stock</label>
                        <input
                            name="lowStockThreshold"
                            type="number"
                            min="0"
                            value={form.lowStockThreshold}
                            onChange={handleChange}
                            className="w-full border-2 border-zinc-200 rounded-xl p-2.5 text-sm focus:outline-none focus:border-cerulean"
                        />
                        <p className="mt-1 text-[11px] text-ink-muted">Flag as low when stock is at or below this number.</p>
                    </div>
                    <div className="col-span-full flex flex-wrap justify-end gap-2 pt-2 border-t border-zinc-200">
                        {editingId && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 rounded-xl border-2 border-ink-black text-ink-black font-bold text-sm hover:bg-cream-surface transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border-2 border-black bg-black text-white font-bold text-sm hover:bg-white hover:text-black transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Saving...' : editingId ? 'Update Medicine' : 'Add Medicine'}
                        </button>
                    </div>
                </form>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-300 rounded-xl p-3 text-sm text-red-600">{error}</div>
            )}

            {loading ? (
                <div className="bg-white border-2 border-ink-black rounded-2xl p-8 text-sm text-ink-charcoal text-center">
                    Loading medicines…
                </div>
            ) : items.length === 0 ? (
                <div className="bg-white border-2 border-ink-black rounded-2xl p-8 text-sm text-ink-charcoal text-center">
                    No medicines stocked yet. Add your first inventory item.
                </div>
            ) : (
                <div className="bg-white border-2 border-ink-black rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-cream-surface">
                                <tr>
                                    <th className="px-4 py-3 font-bold text-ink-black">Medicine</th>
                                    <th className="px-4 py-3 font-bold text-ink-black">Stock</th>
                                    <th className="px-4 py-3 font-bold text-ink-black">Status</th>
                                    <th className="px-4 py-3 font-bold text-ink-black">Last Updated</th>
                                    <th className="px-4 py-3 font-bold text-ink-black">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => (
                                    <tr key={item.medicineId} className="border-t border-zinc-200">
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-ink-black">{item.medicineName}</div>
                                            {item.genericName && <div className="text-xs text-ink-muted">{item.genericName}</div>}
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-ink-charcoal">
                                            {item.quantity} {item.unit || 'pcs'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex border px-2.5 py-1 rounded-full text-xs font-bold ${getStatusBadge(item.status)}`}>
                                                {(item.status || 'AVAILABLE').replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-ink-muted">
                                            {item.lastUpdated ? new Date(item.lastUpdated).toLocaleString() : 'N/A'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleEdit(item)}
                                                    className="px-3 py-1.5 rounded-lg border border-ink-black text-xs font-bold hover:bg-cream-surface transition-all cursor-pointer"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(item.medicineId)}
                                                    className="px-3 py-1.5 rounded-lg border border-red-300 text-red-700 text-xs font-bold hover:bg-red-50 transition-all cursor-pointer"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MedicineInventory;
