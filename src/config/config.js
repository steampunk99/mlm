require('dotenv').config();

const config = {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    
    // Database Configuration
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'zillionaire'
    },
    test: {
        db: {
            host: process.env.TEST_DB_HOST || 'localhost',
            port: process.env.TEST_DB_PORT || 3306,
            user: process.env.TEST_DB_USER || 'root',
            password: process.env.TEST_DB_PASSWORD || 'password',
            database: process.env.TEST_DB_NAME || 'zillionaire_test'
        }
    },

    // JWT Configuration
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    },

    // Email Configuration
    email: {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        from: process.env.EMAIL_FROM
    },

    // Payment Gateway Configuration
    payment: {
        merchantId: process.env.PAYMENT_MERCHANT_ID,
        publicKey: process.env.PAYMENT_PUBLIC_KEY,
        privateKey: process.env.PAYMENT_PRIVATE_KEY,
        sandbox: process.env.PAYMENT_SANDBOX === 'true'
    },

    // Commission Configuration
    commission: {
        directReferral: parseFloat(process.env.COMMISSION_DIRECT_REFERRAL) || 0.1,
        levelCommission: parseFloat(process.env.COMMISSION_LEVEL) || 0.05,
        maxLevel: parseInt(process.env.COMMISSION_MAX_LEVEL) || 5
    },

    // System Configuration
    system: {
        minWithdrawal: parseFloat(process.env.MIN_WITHDRAWAL) || 50,
        maxWithdrawal: parseFloat(process.env.MAX_WITHDRAWAL) || 10000,
        withdrawalFee: parseFloat(process.env.WITHDRAWAL_FEE) || 0.02,
        maintenanceMode: process.env.MAINTENANCE_MODE === 'true'
    },

    // Rate Limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX) || 100 // limit each IP to 100 requests per windowMs
    },

    // Cors Configuration
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization']
    },

    // Upload Configuration
    upload: {
        maxSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
        storageType: process.env.UPLOAD_STORAGE_TYPE || 'local' // 'local' or 's3'
    }
};

module.exports = config;
