const mysql = require('mysql2/promise');
require('dotenv').config();

async function createTestDatabase() {
    try {
        // Create connection without database name
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '',
        });

        const testDbName = 'zilla_test';

        // Create database if it doesn't exist
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${testDbName}`);
        console.log(`Database ${testDbName} created successfully`);

        await connection.end();
    } catch (error) {
        console.error('Error creating test database:', error);
        process.exit(1);
    }
}

createTestDatabase();
