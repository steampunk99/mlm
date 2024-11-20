const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

class UserService {
    async findById(id) {
        return prisma.user.findUnique({
            where: { id },
            include: {
                node: true,
                notifications: true,
                withdrawals: true,
                reports: true,
                commissions: true
            }
        });
    }

    async findByEmail(email) {
        return prisma.user.findUnique({
            where: { email }
        });
    }

    async findByUsername(username) {
        return prisma.user.findUnique({
            where: { username }
        });
    }

    async create(userData) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        return prisma.user.create({
            data: {
                ...userData,
                password: hashedPassword
            }
        });
    }

    async update(id, userData) {
        if (userData.password) {
            userData.password = await bcrypt.hash(userData.password, 10);
        }
        return prisma.user.update({
            where: { id },
            data: userData
        });
    }

    async delete(id) {
        return prisma.user.delete({
            where: { id }
        });
    }

    async checkPassword(user, password) {
        return bcrypt.compare(password, user.password);
    }
}

module.exports = new UserService();
