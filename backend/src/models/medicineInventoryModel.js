const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const MedicineInventory = sequelize.define(
    'MedicineInventory',
    {
        medicineId: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },
        clinicId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'clinic_profiles',
                key: 'userId',
            },
            comment: 'Clinic admin userId owning this medicine stock',
        },
        medicineName: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        genericName: {
            type: DataTypes.STRING(200),
            allowNull: true,
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: {
                min: 0,
            },
        },
        unit: {
            type: DataTypes.STRING(50),
            allowNull: true,
            defaultValue: 'pcs',
        },
        lowStockThreshold: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 10,
            validate: {
                min: 0,
            },
        },
        isAvailable: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        lastUpdated: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        tableName: 'medicine_inventory',
        timestamps: true,
        indexes: [
            { fields: ['clinicId'] },
        ],
        hooks: {
            beforeValidate: (item) => {
                if (item.quantity !== undefined && item.quantity !== null) {
                    item.quantity = Number(item.quantity);
                }
                if (item.lowStockThreshold !== undefined && item.lowStockThreshold !== null) {
                    item.lowStockThreshold = Number(item.lowStockThreshold);
                }
            },
            beforeSave: (item) => {
                const qty = Number(item.quantity || 0);
                if (qty === 0) item.isAvailable = false;
                item.lastUpdated = new Date();
            },
        },
    }
);

module.exports = MedicineInventory;
