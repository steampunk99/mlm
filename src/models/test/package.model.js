const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database.test');

const Package = sequelize.define('Package', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    },
    benefits: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    level: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    max_daily_earnings: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    binary_bonus_percentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 10.00
    },
    referral_bonus_percentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 10.00
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active'
    },
    is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
});

module.exports = Package;
