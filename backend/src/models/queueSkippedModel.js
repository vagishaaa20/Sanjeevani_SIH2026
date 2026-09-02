const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const QueueSkipped = sequelize.define(
    'QueueSkipped',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        queueId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        doctorId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    },
    {
        tableName: 'queue_skipped',
        timestamps: true,
    }
);

module.exports = QueueSkipped;
