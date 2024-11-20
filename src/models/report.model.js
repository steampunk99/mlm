const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Report = sequelize.define('Report', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    reportType: {
        type: DataTypes.ENUM('EARNINGS', 'NETWORK', 'PACKAGE', 'WITHDRAWAL', 'COMMISSION'),
        allowNull: false
    },
    startDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    endDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    metrics: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {}
    },
    totalAmount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0
    },
    status: {
        type: DataTypes.ENUM('PENDING', 'GENERATED', 'ERROR'),
        defaultValue: 'PENDING'
    },
    generatedAt: {
        type: DataTypes.DATE
    },
    metadata: {
        type: DataTypes.JSON,
        defaultValue: {}
    }
}, {
    timestamps: true,
    indexes: [
        {
            fields: ['userId']
        },
        {
            fields: ['reportType']
        },
        {
            fields: ['startDate', 'endDate']
        }
    ]
});

// Associations will be set up in index.js
module.exports = Report;
