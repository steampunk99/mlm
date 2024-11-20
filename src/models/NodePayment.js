const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class NodePayment extends Model {
    static associate(models) {
      NodePayment.belongsTo(models.User, { foreignKey: 'node_id' });
    }
  }

  NodePayment.init({
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
    total_amount_paid: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    service_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    bill_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    transaction_id: DataTypes.STRING,
    transaction_status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed'),
      defaultValue: 'pending'
    },
    transaction_failed_reason: DataTypes.TEXT,
    payment_phone_number: DataTypes.STRING,
    email: DataTypes.STRING,
    payment_date: DataTypes.DATEONLY,
    payment_timestamp: DataTypes.DATE,
    payment_type: {
      type: DataTypes.STRING,
      defaultValue: 'mobile money'
    },
    remarks: DataTypes.TEXT,
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
    modelName: 'NodePayment',
    tableName: 'node_payment',
    timestamps: true,
    createdAt: 'time_inserted',
    updatedAt: 'time_last_modified'
  });

  return NodePayment;
};
