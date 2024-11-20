const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Generate a unique username from full name
 * @param {string} fullName 
 * @returns {Promise<string>}
 */
async function generateUsername(fullName) {
  // Remove special characters and spaces, convert to lowercase
  let baseUsername = fullName
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 15);

  let username = baseUsername;
  let counter = 1;

  // Keep trying until we find a unique username
  while (true) {
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });
    
    if (!existingUser) {
      return username;
    }
    username = `${baseUsername}${counter}`;
    counter++;
  }
}

module.exports = {
  generateUsername
};
