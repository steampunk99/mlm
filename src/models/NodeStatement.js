const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class NodeStatement extends Model {
    static associate(models) {
      NodeStatement.belongsTo(models.User, { foreignKey: 'node_id' });
    }
  }

  NodeStatement.init({
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
    is_debit: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_credit: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    reason: DataTypes.TEXT,
    table_name: DataTypes.STRING,
    table_id: DataTypes.INTEGER,
    event_date: DataTypes.DATEONLY,
    event_timestamp: DataTypes.DATE,
    is_effective: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
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
    modelName: 'NodeStatement',
    tableName: 'node_statement',
    timestamps: true,
    createdAt: 'time_inserted',
    updatedAt: 'time_last_modified'
  });

  return NodeStatement;
};
