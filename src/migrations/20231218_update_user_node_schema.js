'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create new Users table
    await queryInterface.createTable('Users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false
      },
      country: {
        type: Sequelize.STRING,
        allowNull: false
      },
      role: {
        type: Sequelize.ENUM('USER', 'ADMIN'),
        defaultValue: 'USER'
      },
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      resetPasswordToken: {
        type: Sequelize.STRING,
        allowNull: true
      },
      resetPasswordExpires: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create new Nodes table
    await queryInterface.createTable('Nodes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      position: {
        type: Sequelize.ENUM('LEFT', 'RIGHT'),
        allowNull: false
      },
      level: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      parentNodeId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Nodes',
          key: 'id'
        }
      },
      sponsorNodeId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Nodes',
          key: 'id'
        }
      },
      packageId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Packages',
          key: 'id'
        }
      },
      balance: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0
      },
      earnings: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0
      },
      totalReferrals: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      status: {
        type: Sequelize.ENUM('pending', 'active', 'inactive', 'suspended'),
        defaultValue: 'pending'
      },
      isSpillover: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      activatedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add indexes
    await queryInterface.addIndex('Users', ['email']);
    await queryInterface.addIndex('Users', ['username']);
    await queryInterface.addIndex('Nodes', ['userId']);
    await queryInterface.addIndex('Nodes', ['parentNodeId']);
    await queryInterface.addIndex('Nodes', ['sponsorNodeId']);
    await queryInterface.addIndex('Nodes', ['packageId']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes first
    await queryInterface.removeIndex('Nodes', ['packageId']);
    await queryInterface.removeIndex('Nodes', ['sponsorNodeId']);
    await queryInterface.removeIndex('Nodes', ['parentNodeId']);
    await queryInterface.removeIndex('Nodes', ['userId']);
    await queryInterface.removeIndex('Users', ['username']);
    await queryInterface.removeIndex('Users', ['email']);

    // Drop tables
    await queryInterface.dropTable('Nodes');
    await queryInterface.dropTable('Users');
  }
};
