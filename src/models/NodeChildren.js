const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class NodeChildren extends Model {
    static associate(models) {
      NodeChildren.belongsTo(models.User, { as: 'node', foreignKey: 'node_id' });
      NodeChildren.belongsTo(models.User, { as: 'child', foreignKey: 'child_node_id' });
      NodeChildren.belongsTo(models.User, { as: 'parent', foreignKey: 'parent_node_id' });
      NodeChildren.belongsTo(models.User, { as: 'sponsor', foreignKey: 'sponsor_node_id' });
      NodeChildren.belongsTo(models.User, { as: 'introducer', foreignKey: 'introducer_node_id' });
    }
  }

  NodeChildren.init({
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
    parent_node_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'node',
        key: 'id'
      }
    },
    parent_node_username: DataTypes.STRING,
    parent_node_position: DataTypes.INTEGER,
    sponsor_node_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'node',
        key: 'id'
      }
    },
    sponsor_node_username: DataTypes.STRING,
    sponsor_node_position: DataTypes.INTEGER,
    introducer_node_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'node',
        key: 'id'
      }
    },
    introducer_node_username: DataTypes.STRING,
    introducer_node_position: DataTypes.INTEGER,
    date_of_joining: DataTypes.DATEONLY,
    timestamp_of_joining: DataTypes.DATE,
    is_a_spill_child: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_a_neglect_swap: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    direction: {
      type: DataTypes.ENUM('L', 'R'),
      allowNull: false
    },
    child_node_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'node',
        key: 'id'
      }
    },
    child_node_position: DataTypes.INTEGER,
    child_node_username: DataTypes.STRING,
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
    modelName: 'NodeChildren',
    tableName: 'node_children',
    timestamps: true,
    createdAt: 'time_inserted',
    updatedAt: 'time_last_modified'
  });

  return NodeChildren;
};
