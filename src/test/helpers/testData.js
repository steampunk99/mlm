const faker = require('@faker-js/faker').faker;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../../config/config');

const generateUser = async (overrides = {}) => {
    const defaultUser = {
        username: faker.internet.userName(),
        email: faker.internet.email(),
        password: await bcrypt.hash('password123', 10),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        phone: faker.phone.number(),
        country: faker.location.country(),
        active: true,
        role: 'USER',
        referralCode: faker.string.alphanumeric(8),
        referredBy: null,
        level: 1,
        earnings: 0,
        totalReferrals: 0,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    return { ...defaultUser, ...overrides };
};

const generatePackage = (overrides = {}) => {
    const defaultPackage = {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        price: parseFloat(faker.commerce.price()),
        level: faker.random.number({ min: 1, max: 5 }),
        benefits: JSON.stringify({
            directBonus: faker.random.number({ min: 5, max: 15 }),
            matchingBonus: faker.random.number({ min: 5, max: 10 }),
            dailyLimit: faker.random.number({ min: 100, max: 1000 })
        }),
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    return { ...defaultPackage, ...overrides };
};

const generateCommission = (overrides = {}) => {
    const defaultCommission = {
        userId: null,
        amount: parseFloat(faker.finance.amount()),
        type: faker.random.arrayElement(['DIRECT', 'MATCHING', 'LEVEL']),
        description: faker.lorem.sentence(),
        status: 'PENDING',
        processedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    return { ...defaultCommission, ...overrides };
};

const generateWithdrawal = (overrides = {}) => {
    const defaultWithdrawal = {
        userId: null,
        amount: parseFloat(faker.finance.amount()),
        method: faker.random.arrayElement(['BANK', 'CRYPTO', 'MOBILE_MONEY']),
        status: 'PENDING',
        paymentDetails: JSON.stringify({
            accountName: faker.name.findName(),
            accountNumber: faker.finance.account(),
            bankName: faker.company.companyName()
        }),
        processedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    return { ...defaultWithdrawal, ...overrides };
};

const generateToken = (userId, role = 'USER') => {
    return jwt.sign(
        { id: userId, role },
        config.jwtSecret,
        { expiresIn: '1d' }
    );
};

const generateBinaryTree = async (depth = 3) => {
    const users = [];
    const root = await generateUser({ sponsorId: null });
    users.push(root);

    if (depth > 1) {
        // Create left subtree
        const leftChild = await generateUser({ sponsorId: root.id, position: 'LEFT' });
        users.push(leftChild);
        root.leftChild = leftChild.id;

        // Create right subtree
        const rightChild = await generateUser({ sponsorId: root.id, position: 'RIGHT' });
        users.push(rightChild);
        root.rightChild = rightChild.id;

        // Recursively create children for left and right nodes
        if (depth > 2) {
            const leftSubtree = await generateBinaryTree(depth - 1);
            const rightSubtree = await generateBinaryTree(depth - 1);
            users.push(...leftSubtree, ...rightSubtree);
        }
    }

    return users;
};

module.exports = {
    generateUser,
    generatePackage,
    generateCommission,
    generateWithdrawal,
    generateToken,
    generateBinaryTree
};
