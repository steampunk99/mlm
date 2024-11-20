const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database.test');

const Notification = sequelize.define('Notification', {
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
    type: {
        type: DataTypes.ENUM(
            'COMMISSION',
            'WITHDRAWAL',
            'NETWORK',
            'PACKAGE',
            'SYSTEM',
            'ACHIEVEMENT'
        ),
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    data: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    priority: {
        type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH'),
        defaultValue: 'LOW'
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    readAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    actionUrl: {
        type: DataTypes.STRING,
        allowNull: true
    }
});

module.exports = Notification;
