const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class WithdrawalService {
    async findAll(userId) {
        return prisma.withdrawal.findMany({
            where: {
                userId
            },
            include: {
                user: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    async findById(id) {
        return prisma.withdrawal.findUnique({
            where: { id },
            include: {
                user: true
            }
        });
    }

    async create(withdrawalData) {
        return prisma.withdrawal.create({
            data: withdrawalData,
            include: {
                user: true
            }
        });
    }

    async update(id, withdrawalData) {
        return prisma.withdrawal.update({
            where: { id },
            data: withdrawalData,
            include: {
                user: true
            }
        });
    }

    async approve(id) {
        return prisma.withdrawal.update({
            where: { id },
            data: {
                status: 'APPROVED',
                processedAt: new Date()
            }
        });
    }

    async reject(id, reason) {
        return prisma.withdrawal.update({
            where: { id },
            data: {
                status: 'REJECTED',
                processedAt: new Date(),
                remarks: reason
            }
        });
    }

    async getUserPendingWithdrawals(userId) {
        return prisma.withdrawal.findMany({
            where: {
                userId,
                status: 'PENDING'
            }
        });
    }

    async getTotalWithdrawnAmount(userId) {
        const result = await prisma.withdrawal.aggregate({
            where: {
                userId,
                status: 'APPROVED'
            },
            _sum: {
                amount: true
            }
        });
        return result._sum.amount || 0;
    }
}

module.exports = new WithdrawalService();
