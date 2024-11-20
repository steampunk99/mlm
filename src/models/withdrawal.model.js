const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

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
            model: 'nodes',
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
    transaction_hash: {
        type: DataTypes.STRING,
        allowNull: true
    },
    admin_note: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    rejection_reason: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    processed_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    completed_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    cancelled_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'withdrawals',
    timestamps: true,
    paranoid: true,
    hooks: {
        beforeCreate: async (withdrawal) => {
            // Set appropriate payment fields to null based on withdrawal method
            if (withdrawal.withdrawal_method === 'bank_transfer') {
                withdrawal.mobile_number = null;
                withdrawal.mobile_network = null;
                withdrawal.crypto_address = null;
                withdrawal.crypto_network = null;
            } else if (withdrawal.withdrawal_method === 'mobile_money') {
                withdrawal.bank_name = null;
                withdrawal.account_number = null;
                withdrawal.account_name = null;
                withdrawal.crypto_address = null;
                withdrawal.crypto_network = null;
            } else if (withdrawal.withdrawal_method === 'crypto') {
                withdrawal.bank_name = null;
                withdrawal.account_number = null;
                withdrawal.account_name = null;
                withdrawal.mobile_number = null;
                withdrawal.mobile_network = null;
            }
        }
    }
});

module.exports = Withdrawal;
