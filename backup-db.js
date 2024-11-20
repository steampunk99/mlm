require('dotenv').config();
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Create backups directory if it doesn't exist
const backupDir = path.join(__dirname, 'backups');
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFile = path.join(backupDir, `backup-${timestamp}.sql`);

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
};

const mysqldump = `mysqldump -h ${dbConfig.host} -u ${dbConfig.user} ${dbConfig.password ? `-p${dbConfig.password}` : ''} ${dbConfig.database} > "${backupFile}"`;

console.log('Creating database backup...');
exec(mysqldump, (error, stdout, stderr) => {
    if (error) {
        console.error(`Error creating backup: ${error}`);
        return;
    }
    console.log(`Database backup created successfully at: ${backupFile}`);
});
