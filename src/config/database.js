require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const env = process.env.NODE_ENV || 'development';

const prisma = new PrismaClient({
    log: env === 'development' ? [
        {
            emit: 'event',
            level: 'query',
        },
        {
            emit: 'event',
            level: 'error',
        },
        {
            emit: 'event',
            level: 'info',
        },
        {
            emit: 'event',
            level: 'warn',
        },
    ] : [],
});

if (env === 'development') {
    prisma.$on('query', (e) => {
        console.log('Query: ' + e.query);
        console.log('Duration: ' + e.duration + 'ms');
    });

    prisma.$on('error', (e) => {
        console.error('Prisma Error:', e.message);
    });

    prisma.$on('info', (e) => {
        console.info('Prisma Info:', e.message);
    });

    prisma.$on('warn', (e) => {
        console.warn('Prisma Warning:', e.message);
    });
}

const checkConnection = async () => {
    try {
        await prisma.$connect();
        console.log('Database connection established successfully');
        return true;
    } catch (error) {
        console.error('Database connection failed:', error);
        return false;
    }
};

const disconnect = async () => {
    try {
        await prisma.$disconnect();
        console.log('Database connection closed successfully');
    } catch (error) {
        console.error('Error closing database connection:', error);
        process.exit(1);
    }
};

process.on('SIGINT', async () => {
    await disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await disconnect();
    process.exit(0);
});

module.exports = {
    prisma,
    checkConnection,
    disconnect
};
