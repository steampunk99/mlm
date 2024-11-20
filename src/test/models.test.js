const { sequelize } = require('../config/database.test');
const User = require('../models/test/user.model');
const Package = require('../models/test/package.model');
const Commission = require('../models/test/commission.model');
const Withdrawal = require('../models/test/withdrawal.model');
const Notification = require('../models/test/notification.model');
const Announcement = require('../models/test/announcement.model');

describe('Database Models', () => {
    beforeAll(async () => {
        await sequelize.authenticate();
        await sequelize.sync({ force: true });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    beforeEach(async () => {
        await User.destroy({ truncate: true, cascade: true });
        await Package.destroy({ truncate: true, cascade: true });
        await Commission.destroy({ truncate: true, cascade: true });
        await Withdrawal.destroy({ truncate: true, cascade: true });
        await Notification.destroy({ truncate: true, cascade: true });
        await Announcement.destroy({ truncate: true, cascade: true });
    });

    describe('User Model', () => {
        it('should create a user successfully', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                firstName: 'Test',
                lastName: 'User',
                phone: '1234567890',
                country: 'TestCountry',
                referralCode: 'TEST123'
            };

            const user = await User.create(userData);
            expect(user.id).toBeDefined();
            expect(user.username).toBe(userData.username);
            expect(user.email).toBe(userData.email);
            // Password should be hashed
            expect(user.password).not.toBe(userData.password);
            
            // Test password comparison
            const isPasswordValid = await user.checkPassword('password123');
            expect(isPasswordValid).toBe(true);
        });
    });

    describe('Package Model', () => {
        it('should create a package successfully', async () => {
            const packageData = {
                name: 'Test Package',
                price: 100.00,
                description: 'Test package description',
                benefits: { feature1: 'test1', feature2: 'test2' },
                level: 1,
                max_daily_earnings: 50.00,
                binary_bonus_percentage: 10.00,
                referral_bonus_percentage: 5.00
            };

            const pkg = await Package.create(packageData);
            expect(pkg.id).toBeDefined();
            expect(pkg.name).toBe(packageData.name);
            expect(pkg.price).toBe(packageData.price);
            expect(pkg.benefits).toEqual(packageData.benefits);
        });
    });

    describe('Model Associations', () => {
        it('should create commission with user and package associations', async () => {
            // Create test user
            const user = await User.create({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                firstName: 'Test',
                lastName: 'User',
                phone: '1234567890',
                country: 'TestCountry',
                referralCode: 'TEST123'
            });

            // Create test package
            const pkg = await Package.create({
                name: 'Test Package',
                price: 100.00,
                description: 'Test package description',
                level: 1,
                max_daily_earnings: 50.00
            });

            // Create commission
            const commission = await Commission.create({
                amount: 10.00,
                type: 'REFERRAL',
                status: 'PENDING',
                userId: user.id,
                packageId: pkg.id
            });

            // Test associations
            const commissionWithAssociations = await Commission.findOne({
                where: { id: commission.id },
                include: [User, Package]
            });

            expect(commissionWithAssociations.User.id).toBe(user.id);
            expect(commissionWithAssociations.Package.id).toBe(pkg.id);
        });
    });
});
