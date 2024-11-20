const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database.test');

const Withdrawal = sequelize.define('Withdrawal', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    node_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    withdrawal_method: {
        type: DataTypes.ENUM('bank_transfer', 'mobile_money', 'crypto'),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'processing', 'completed', 'rejected', 'cancelled'),
        defaultValue: 'pending'
    },
    bank_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    account_number: {
        type: DataTypes.STRING,
        allowNull: true
    },
    account_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    mobile_number: {
        type: DataTypes.STRING,
        allowNull: true
    },
    mobile_network: {
        type: DataTypes.STRING,
        allowNull: true
    },
    crypto_address: {
        type: DataTypes.STRING,
        allowNull: true
    },
    crypto_network: {
        type: DataTypes.STRING,
        allowNull: true
    },
    transaction_id: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    processed_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    remarks: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    timestamps: true,
    tableName: 'withdrawals'
});

module.exports = Withdrawal;
