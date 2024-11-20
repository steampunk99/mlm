const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class NodeWithdrawal extends Model {
    static associate(models) {
      NodeWithdrawal.belongsTo(models.User, { foreignKey: 'node_id' });
    }
  }

  NodeWithdrawal.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    node_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'node',
        key: 'id'
      }
    },
    node_position: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    node_username: {
      type: DataTypes.STRING,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    },
    reason: DataTypes.TEXT,
    payment_phone_number: DataTypes.STRING,
    payment_type: {
      type: DataTypes.STRING,
      defaultValue: 'mobile money'
    },
    withdrawal_date: DataTypes.DATEONLY,
    withdrawal_timestamp: DataTypes.DATE,
    guid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'NodeWithdrawal',
    tableName: 'node_withdrawal',
    timestamps: true,
    createdAt: 'time_inserted',
    updatedAt: 'time_last_modified'
  });

  return NodeWithdrawal;
};
