require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Node } = require('../src/models');

async function createAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await Node.findOne({
      where: { username: 'admin' }
    });

    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await Node.create({
      username: 'admin',
      password: hashedPassword,
      email: 'admin@zillionaire.com',
      position: 1,
      positional_level: 1,
      direction: 'L',
      status: 'active',
      is_admin: true,
      time_inserted: new Date(),
      time_last_modified: new Date()
    });

    console.log('Admin user created successfully');
    console.log('Username: admin');
    console.log('Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin();
