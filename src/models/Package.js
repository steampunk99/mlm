const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Package extends Model {
    static associate(models) {
      Package.hasMany(models.User, { foreignKey: 'package_id' });
      Package.hasMany(models.NodePackage, { foreignKey: 'package_id' });
    }
  }

  Package.init({
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
    description: DataTypes.TEXT,
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
    modelName: 'Package',
    tableName: 'package',
    timestamps: true,
    createdAt: 'time_inserted',
    updatedAt: 'time_last_modified'
  });

  return Package;
};
