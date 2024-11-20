const sequelize = require('../src/config/database.test');
const { User, Node } = require('../src/models');

async function setupTestDatabase() {
  try {
    // Connect to the database
    await sequelize.authenticate();
    console.log('Connected to test database');

    // Drop existing tables in reverse order to handle foreign key constraints
    await sequelize.query('DROP TABLE IF EXISTS `Nodes`;');
    await sequelize.query('DROP TABLE IF EXISTS `Users`;');

    // Create tables in correct order
    await User.sync();
    console.log('User table created successfully');

    await Node.sync();
    console.log('Node table created successfully');

    // Add any test data here if needed
    
    console.log('Test database setup completed successfully');
  } catch (error) {
    console.error('Error setting up test database:', error);
    process.exit(1);
  }
}

setupTestDatabase();
