'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('node', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      position: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      positional_level: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      positional_height: {
        type: Sequelize.FLOAT,
        defaultValue: 0
      },
      direction: {
        type: Sequelize.ENUM('L', 'R'),
        allowNull: false
      },
      is_a_right_node: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_a_left_node: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      parent_node_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'node',
          key: 'id'
        }
      },
      parent_node_username: Sequelize.STRING,
      parent_node_position: Sequelize.INTEGER,
      sponsor_node_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'node',
          key: 'id'
        }
      },
      sponsor_node_username: Sequelize.STRING,
      sponsor_node_position: Sequelize.INTEGER,
      introducer_node_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'node',
          key: 'id'
        }
      },
      introducer_node_username: Sequelize.STRING,
      introducer_node_position: Sequelize.INTEGER,
      is_a_neglect_swap: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_a_spill: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'verifying', 'active', 'suspended'),
        defaultValue: 'pending'
      },
      package_id: {
        type: Sequelize.INTEGER
      },
      package_name: Sequelize.STRING,
      current_balance: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      username: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      op: Sequelize.STRING,
      phone_number: {
        type: Sequelize.STRING,
        unique: true
      },
      email: {
        type: Sequelize.STRING,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      secret_question: Sequelize.STRING,
      secret_answer: Sequelize.STRING,
      photo: Sequelize.STRING,
      node_type: {
        type: Sequelize.STRING,
        defaultValue: 'DR'
      },
      code: Sequelize.STRING,
      package_price: Sequelize.DECIMAL(10, 2),
      node_package_id: Sequelize.INTEGER,
      guid: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      is_admin: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      is_deleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      time_inserted: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      time_last_modified: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes
    await queryInterface.addIndex('node', ['username']);
    await queryInterface.addIndex('node', ['email']);
    await queryInterface.addIndex('node', ['phone_number']);
    await queryInterface.addIndex('node', ['parent_node_id']);
    await queryInterface.addIndex('node', ['sponsor_node_id']);
    await queryInterface.addIndex('node', ['introducer_node_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('node');
  }
};
