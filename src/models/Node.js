const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Node extends Model {
    static associate(models) {
      // User association
      Node.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });

      // Binary tree structure
      Node.belongsTo(Node, {
        foreignKey: 'placementId',
        as: 'parent'
      });

      Node.hasMany(Node, {
        foreignKey: 'placementId',
        as: 'children'
      });

      // MLM relationships
      Node.belongsTo(Node, {
        foreignKey: 'sponsorId',
        as: 'sponsor'
      });

      Node.hasMany(Node, {
        foreignKey: 'sponsorId',
        as: 'sponsored'
      });
    }
  }

  Node.init({
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
    position: {
      type: DataTypes.ENUM('LEFT', 'RIGHT'),
      allowNull: false
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    placementId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Nodes',
        key: 'id'
      }
    },
    sponsorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Nodes',
        key: 'id'
      }
    },
    balance: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    earnings: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    totalReferrals: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'inactive', 'suspended'),
      defaultValue: 'pending'
    },
    isSpillover: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    activatedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Node',
    tableName: 'Nodes',
    timestamps: true
  });

  return Node;
};
