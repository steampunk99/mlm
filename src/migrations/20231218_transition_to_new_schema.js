'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // 1. Create new Users table
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
      }, { transaction });

      // 2. Create new Nodes table
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
      }, { transaction });

      // 3. Migrate data from old node table to new tables
      const oldNodes = await queryInterface.sequelize.query(
        'SELECT * FROM node',
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction }
      );

      for (const oldNode of oldNodes) {
        // Create User record
        const [user] = await queryInterface.sequelize.query(
          `INSERT INTO Users (
            username, email, password, firstName, lastName, 
            phone, country, role, active, createdAt, updatedAt
          ) VALUES (
            ?, ?, ?, ?, ?, 
            ?, 'Unknown', ?, true, NOW(), NOW()
          )`,
          {
            replacements: [
              oldNode.username,
              oldNode.email || `${oldNode.username}@placeholder.com`,
              oldNode.password,
              oldNode.username.split('_')[0] || 'Unknown',
              oldNode.username.split('_')[1] || 'Unknown',
              oldNode.phone_number || '0000000000',
              oldNode.is_admin ? 'ADMIN' : 'USER'
            ],
            type: queryInterface.sequelize.QueryTypes.INSERT,
            transaction
          }
        );

        // Create Node record
        await queryInterface.sequelize.query(
          `INSERT INTO Nodes (
            userId, position, level, parentNodeId, sponsorNodeId,
            packageId, balance, status, isSpillover, createdAt, updatedAt
          ) VALUES (
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, NOW(), NOW()
          )`,
          {
            replacements: [
              user[0], // newly created user id
              oldNode.direction === 'L' ? 'LEFT' : 'RIGHT',
              oldNode.positional_level,
              oldNode.parent_node_id,
              oldNode.sponsor_node_id,
              oldNode.package_id,
              oldNode.current_balance,
              oldNode.status,
              oldNode.is_a_spill
            ],
            type: queryInterface.sequelize.QueryTypes.INSERT,
            transaction
          }
        );
      }

      // 4. Drop old node table
      await queryInterface.dropTable('node', { transaction });

      await transaction.commit();

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Recreate old node table
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
        direction: {
          type: Sequelize.ENUM('L', 'R'),
          allowNull: false
        },
        parent_node_id: {
          type: Sequelize.INTEGER,
          references: {
            model: 'node',
            key: 'id'
          }
        },
        sponsor_node_id: {
          type: Sequelize.INTEGER,
          references: {
            model: 'node',
            key: 'id'
          }
        },
        status: {
          type: Sequelize.ENUM('pending', 'verifying', 'active', 'suspended'),
          defaultValue: 'pending'
        },
        username: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true
        },
        password: {
          type: Sequelize.STRING,
          allowNull: false
        },
        email: {
          type: Sequelize.STRING,
          unique: true
        },
        phone_number: {
          type: Sequelize.STRING,
          unique: true
        },
        is_admin: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        package_id: Sequelize.INTEGER,
        current_balance: {
          type: Sequelize.DECIMAL(10, 2),
          defaultValue: 0
        }
      }, { transaction });

      // Migrate data back
      const users = await queryInterface.sequelize.query(
        'SELECT u.*, n.* FROM Users u JOIN Nodes n ON u.id = n.userId',
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction }
      );

      for (const user of users) {
        await queryInterface.sequelize.query(
          `INSERT INTO node (
            username, email, password, phone_number, is_admin,
            position, positional_level, direction, parent_node_id,
            sponsor_node_id, status, package_id, current_balance
          ) VALUES (
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?
          )`,
          {
            replacements: [
              user.username,
              user.email,
              user.password,
              user.phone,
              user.role === 'ADMIN',
              user.position === 'LEFT' ? 1 : 2,
              user.level,
              user.position === 'LEFT' ? 'L' : 'R',
              user.parentNodeId,
              user.sponsorNodeId,
              user.status,
              user.packageId,
              user.balance
            ],
            type: queryInterface.sequelize.QueryTypes.INSERT,
            transaction
          }
        );
      }

      // Drop new tables
      await queryInterface.dropTable('Nodes', { transaction });
      await queryInterface.dropTable('Users', { transaction });

      await transaction.commit();

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
