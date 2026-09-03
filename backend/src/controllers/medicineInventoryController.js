const { Op, col, fn, where } = require('sequelize');
const { ClinicProfile, MedicineInventory } = require('../models');
const MAX_INTEGER = 2147483647;

function getMedicineStatus(quantity, lowStockThreshold = 10) {
  const qty = Number(quantity) || 0;
  const threshold = Number(lowStockThreshold) || 0;

  if (qty === 0) return 'OUT_OF_STOCK';
  if (qty <= threshold) return 'LOW_STOCK';
  return 'AVAILABLE';
}

function parseNonNegativeInteger(value, fallback) {
  const parsed = Number(value ?? fallback);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= MAX_INTEGER ? parsed : null;
}

function serializeInventoryItem(item) {
  const plain = item && typeof item.toJSON === 'function' ? item.toJSON() : { ...item };
  const status = plain.isAvailable === false && Number(plain.quantity || 0) > 0
    ? 'UNAVAILABLE'
    : plain.isAvailable === false
      ? 'OUT_OF_STOCK'
    : getMedicineStatus(plain.quantity, plain.lowStockThreshold);

  return {
    ...plain,
    status,
    isAvailable: plain.isAvailable === true && Number(plain.quantity || 0) > 0,
  };
}

async function listClinicInventory(req, res) {
  try {
    if (req.user.role !== 'clinic_admin') {
      return res.status(403).json({ error: 'Only clinic admins can view clinic inventory' });
    }

    const items = await MedicineInventory.findAll({
      where: { clinicId: req.user.id },
      order: [['medicineName', 'ASC'], ['lastUpdated', 'DESC']],
    });

    return res.json({ count: items.length, items: items.map(serializeInventoryItem) });
  } catch (error) {
    console.error('[medicineInventoryController.listClinicInventory] error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch clinic inventory' });
  }
}

async function createInventoryItem(req, res) {
  try {
    if (req.user.role !== 'clinic_admin') {
      return res.status(403).json({ error: 'Only clinic admins can add inventory items' });
    }

    const { medicineName, genericName, quantity, unit, lowStockThreshold, isAvailable } = req.body;
    const normalizedName = String(medicineName || '').trim();

    if (!normalizedName) {
      return res.status(400).json({ error: 'medicineName is required' });
    }

    const quantityNum = parseNonNegativeInteger(quantity, 0);
    const thresholdNum = parseNonNegativeInteger(lowStockThreshold, 10);

    if (quantityNum === null) {
      return res.status(400).json({ error: 'quantity must be a non-negative integer' });
    }

    if (thresholdNum === null) {
      return res.status(400).json({ error: 'lowStockThreshold must be a non-negative integer' });
    }

    if (isAvailable !== undefined && typeof isAvailable !== 'boolean') {
      return res.status(400).json({ error: 'isAvailable must be a boolean' });
    }

    const duplicate = await MedicineInventory.findOne({
      where: {
        clinicId: req.user.id,
        [Op.and]: where(fn('LOWER', col('medicineName')), normalizedName.toLowerCase()),
      },
      attributes: ['medicineId'],
    });
    if (duplicate) {
      return res.status(409).json({ error: 'This medicine already exists in the clinic inventory' });
    }

    const item = await MedicineInventory.create({
      clinicId: req.user.id,
      medicineName: normalizedName,
      genericName: genericName ? String(genericName).trim() : null,
      quantity: quantityNum,
      unit: unit ? String(unit).trim() : 'pcs',
      lowStockThreshold: thresholdNum,
      isAvailable: quantityNum > 0 && isAvailable !== false,
      lastUpdated: new Date(),
    });

    return res.status(201).json({ message: 'Medicine added to inventory', item: serializeInventoryItem(item) });
  } catch (error) {
    console.error('[medicineInventoryController.createInventoryItem] error:', error.message);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'This medicine already exists in the clinic inventory' });
    }
    return res.status(500).json({ error: 'Failed to create inventory item' });
  }
}

async function updateInventoryItem(req, res) {
  try {
    if (req.user.role !== 'clinic_admin') {
      return res.status(403).json({ error: 'Only clinic admins can update inventory items' });
    }

    const { medicineId } = req.params;
    const item = await MedicineInventory.findOne({ where: { medicineId, clinicId: req.user.id } });

    if (!item) {
      return res.status(404).json({ error: 'Medicine inventory item not found for this clinic' });
    }

    const allowedFields = ['medicineName', 'genericName', 'quantity', 'unit', 'lowStockThreshold', 'isAvailable'];
    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    if (updates.medicineName !== undefined) {
      const name = String(updates.medicineName).trim();
      if (!name) return res.status(400).json({ error: 'medicineName cannot be empty' });
      updates.medicineName = name;
    }

    if (updates.quantity !== undefined) {
      const quantityNum = parseNonNegativeInteger(updates.quantity);
      if (quantityNum === null) {
        return res.status(400).json({ error: 'quantity must be a non-negative integer' });
      }
      updates.quantity = quantityNum;
    }

    if (updates.lowStockThreshold !== undefined) {
      const thresholdNum = parseNonNegativeInteger(updates.lowStockThreshold);
      if (thresholdNum === null) {
        return res.status(400).json({ error: 'lowStockThreshold must be a non-negative integer' });
      }
      updates.lowStockThreshold = thresholdNum;
    }

    if (updates.isAvailable !== undefined) {
      if (typeof updates.isAvailable === 'boolean') {
        // Already normalized.
      } else if (updates.isAvailable === 'true' || updates.isAvailable === '1') {
        updates.isAvailable = true;
      } else if (updates.isAvailable === 'false' || updates.isAvailable === '0') {
        updates.isAvailable = false;
      } else {
        return res.status(400).json({ error: 'isAvailable must be a boolean' });
      }
    }

    if (updates.quantity !== undefined && updates.quantity === 0) {
      updates.isAvailable = false;
    }

    if (updates.medicineName !== undefined) {
      const duplicate = await MedicineInventory.findOne({
        where: {
          clinicId: req.user.id,
          [Op.and]: where(fn('LOWER', col('medicineName')), updates.medicineName.toLowerCase()),
          medicineId: { [Op.ne]: medicineId },
        },
        attributes: ['medicineId'],
      });
      if (duplicate) {
        return res.status(409).json({ error: 'This medicine already exists in the clinic inventory' });
      }
    }

    updates.lastUpdated = new Date();

    await item.update(updates);
    return res.json({ message: 'Inventory updated', item: serializeInventoryItem(item) });
  } catch (error) {
    console.error('[medicineInventoryController.updateInventoryItem] error:', error.message);
    return res.status(500).json({ error: 'Failed to update inventory item' });
  }
}

async function deleteInventoryItem(req, res) {
  try {
    if (req.user.role !== 'clinic_admin') {
      return res.status(403).json({ error: 'Only clinic admins can delete inventory items' });
    }

    const { medicineId } = req.params;
    const item = await MedicineInventory.findOne({ where: { medicineId, clinicId: req.user.id } });

    if (!item) {
      return res.status(404).json({ error: 'Medicine inventory item not found for this clinic' });
    }

    await item.destroy();
    return res.json({ message: 'Medicine removed from inventory', medicineId });
  } catch (error) {
    console.error('[medicineInventoryController.deleteInventoryItem] error:', error.message);
    return res.status(500).json({ error: 'Failed to delete inventory item' });
  }
}

async function searchMedicineAvailability(req, res) {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ error: 'Only patients can search medicine availability' });
    }

    const query = String(req.query.query || '').trim();
    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }

    const lat = req.query.lat !== undefined ? Number(req.query.lat) : null;
    const lng = req.query.lng !== undefined ? Number(req.query.lng) : null;

    const items = await MedicineInventory.findAll({
      where: {
        [Op.or]: [
          { medicineName: { [Op.iLike]: `%${query}%` } },
          { genericName: { [Op.iLike]: `%${query}%` } },
        ],
      },
      include: [{
        model: ClinicProfile,
        as: 'clinic',
        attributes: ['userId', 'clinicName', 'city', 'address', 'latitude', 'longitude', 'verificationStatus'],
      }],
      order: [['medicineName', 'ASC'], ['quantity', 'DESC']],
    });

    const results = items
      .filter((item) => item.clinic && item.clinic.verificationStatus === 'VERIFIED')
      .map((item) => {
        const clinic = item.clinic;
        let distanceKm = null;

        if (Number.isFinite(lat) && Number.isFinite(lng) && clinic.latitude && clinic.longitude) {
          const toRad = (value) => (value * Math.PI) / 180;
          const dLat = toRad(Number(clinic.latitude) - lat);
          const dLng = toRad(Number(clinic.longitude) - lng);
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat)) * Math.cos(toRad(Number(clinic.latitude))) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          distanceKm = 6371 * c;
        }

        const status = item.isAvailable === false && Number(item.quantity || 0) > 0
          ? 'UNAVAILABLE'
          : item.isAvailable === false
            ? 'OUT_OF_STOCK'
          : getMedicineStatus(item.quantity, item.lowStockThreshold);

        return {
          medicineId: item.medicineId,
          medicineName: item.medicineName,
          genericName: item.genericName,
          status,
          isAvailable: item.isAvailable === true && item.quantity > 0,
          clinic: {
            clinicId: clinic.userId,
            clinicName: clinic.clinicName,
            city: clinic.city,
            address: clinic.address,
            distanceKm: distanceKm !== null ? Number(distanceKm.toFixed(1)) : null,
          },
        };
      })
      .sort((a, b) => {
        if (a.clinic.distanceKm !== null && b.clinic.distanceKm !== null) {
          return a.clinic.distanceKm - b.clinic.distanceKm;
        }
        if (a.clinic.distanceKm !== null) return -1;
        if (b.clinic.distanceKm !== null) return 1;
        return a.medicineName.localeCompare(b.medicineName);
      });

    return res.json({ query, count: results.length, results });
  } catch (error) {
    console.error('[medicineInventoryController.searchMedicineAvailability] error:', error.message);
    return res.status(500).json({ error: 'Failed to search medicine availability' });
  }
}

module.exports = {
  listClinicInventory,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  searchMedicineAvailability,
  getMedicineStatus,
};
