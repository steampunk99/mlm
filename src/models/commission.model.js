const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Commission = sequelize.define('Commission', {
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
    amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('DIRECT', 'MATCHING', 'LEVEL'),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('PENDING', 'PROCESSED', 'FAILED'),
        defaultValue: 'PENDING'
    },
    sourceUserId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    packageId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Packages',
            key: 'id'
        }
    },
    processedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    timestamps: true,
    indexes: [
        {
            fields: ['userId']
        },
        {
            fields: ['type']
        },
        {
            fields: ['status']
        },
        {
            fields: ['createdAt']
        }
    ]
});

module.exports = Commission;
