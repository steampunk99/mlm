const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Announcement = sequelize.define('Announcement', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM(
            'GENERAL',
            'MAINTENANCE',
            'UPDATE',
            'PROMOTION',
            'EMERGENCY'
        ),
        defaultValue: 'GENERAL'
    },
    priority: {
        type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH'),
        defaultValue: 'LOW'
    },
    startDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    endDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    targetAudience: {
        type: DataTypes.ENUM('ALL', 'ACTIVE', 'INACTIVE', 'ADMIN'),
        defaultValue: 'ALL'
    },
    attachments: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    }
}, {
    timestamps: true,
    indexes: [
        {
            fields: ['type']
        },
        {
            fields: ['priority']
        },
        {
            fields: ['startDate']
        },
        {
            fields: ['isActive']
        }
    ]
});

module.exports = Announcement;