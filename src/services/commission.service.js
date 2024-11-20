const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class CommissionService {
    async findAll(userId) {
        return prisma.commission.findMany({
            where: {
                userId
            },
            include: {
                user: true,
                sourceUser: true,
                package: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    async findById(id) {
        return prisma.commission.findUnique({
            where: { id },
            include: {
                user: true,
                sourceUser: true,
                package: true
            }
        });
    }

    async create(commissionData) {
        return prisma.commission.create({
            data: commissionData,
            include: {
                user: true,
                sourceUser: true,
                package: true
            }
        });
    }

    async update(id, commissionData) {
        return prisma.commission.update({
            where: { id },
            data: commissionData,
            include: {
                user: true,
                sourceUser: true,
                package: true
            }
        });
    }

    async processCommission(id) {
        return prisma.commission.update({
            where: { id },
            data: {
                status: 'PROCESSED',
                processedAt: new Date()
            }
        });
    }

    async calculateDirectCommission(packageId, userId, sourceUserId) {
        const package = await prisma.package.findUnique({
            where: { id: packageId }
        });

        if (!package) {
            throw new Error('Package not found');
        }

        const commissionAmount = package.price * (package.directCommissionRate / 100);

        return this.create({
            userId,
            sourceUserId,
            packageId,
            amount: commissionAmount,
            type: 'DIRECT',
            description: `Direct commission from package ${package.name}`,
            status: 'PENDING'
        });
    }

    async calculateMatchingCommission(packageId, userId, sourceUserId) {
        const package = await prisma.package.findUnique({
            where: { id: packageId }
        });

        if (!package) {
            throw new Error('Package not found');
        }

        const commissionAmount = package.price * (package.matchingCommissionRate / 100);

        return this.create({
            userId,
            sourceUserId,
            packageId,
            amount: commissionAmount,
            type: 'MATCHING',
            description: `Matching commission from package ${package.name}`,
            status: 'PENDING'
        });
    }
}

module.exports = new CommissionService();
