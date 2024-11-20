const { sequelize } = require('../config/database.test');
const User = require('../models/test/user.model');
const Package = require('../models/test/package.model');
const Commission = require('../models/test/commission.model');
const Withdrawal = require('../models/test/withdrawal.model');
const Notification = require('../models/test/notification.model');
const Announcement = require('../models/test/announcement.model');

// Define model associations
User.hasMany(Commission, { foreignKey: 'userId' });
Commission.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Withdrawal, { foreignKey: 'node_id' });
Withdrawal.belongsTo(User, { foreignKey: 'node_id' });

User.hasMany(Notification, { foreignKey: 'userId' });
Notification.belongsTo(User, { foreignKey: 'userId' });

Package.hasMany(Commission, { foreignKey: 'packageId' });
Commission.belongsTo(Package, { foreignKey: 'packageId' });

beforeAll(async () => {
    try {
        // Connect to test database
        await sequelize.authenticate();
        console.log('Connected to test database');
        
        // Sync all models - this will create tables if they don't exist
        await sequelize.sync({ force: true });
        console.log('Database synchronized');
    } catch (error) {
        console.error('Error in beforeAll:', error);
        throw error;
    }
});

beforeEach(async () => {
    try {
        // Disable foreign key checks
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        
        // Clear tables in correct order (children first, then parents)
        await Commission.destroy({ truncate: true, cascade: true });
        await Withdrawal.destroy({ truncate: true, cascade: true });
        await Notification.destroy({ truncate: true, cascade: true });
        await Announcement.destroy({ truncate: true, cascade: true });
        await Package.destroy({ truncate: true, cascade: true });
        await User.destroy({ truncate: true, cascade: true });
        
        // Re-enable foreign key checks
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        
        console.log('All tables cleared');
    } catch (error) {
        console.error('Error in beforeEach:', error);
        throw error;
    }
});

afterAll(async () => {
    try {
        // Close database connection
        await sequelize.close();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Error in afterAll:', error);
        throw error;
    }
});
