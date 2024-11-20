const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class NodePackage extends Model {
    static associate(models) {
      NodePackage.belongsTo(models.User, { foreignKey: 'node_id' });
      NodePackage.belongsTo(models.Package, { foreignKey: 'package_id' });
    }
  }

  NodePackage.init({
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
    package_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'package',
        key: 'id'
      }
    },
    package_name: DataTypes.STRING,
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    is_paid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    node_payment_id: {
      type: DataTypes.INTEGER,
      defaultValue: 0
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
    modelName: 'NodePackage',
    tableName: 'node_package',
    timestamps: true,
    createdAt: 'time_inserted',
    updatedAt: 'time_last_modified'
  });

  return NodePackage;
};
